// Main application coordinator
class MentalHealthApp {
    constructor() {
        this.supabase = window.supabase;
        this.authManager = window.authManager;
        this.moodTracker = window.moodTracker;
        this.aiSuggestions = window.aiSuggestions;
        this.init();
    }

    init() {
        this.setupSupabaseAuthListener();
        this.setupNavigation();
        this.setupMoodTrackerNavigation();
        this.createDatabaseTables();
    }

    setupSupabaseAuthListener() {
        // Listen for auth state changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.authManager.currentUser = session.user;
                this.moodTracker.setCurrentUser(session.user);
                this.aiSuggestions.setCurrentUser(session.user);
                this.authManager.showDashboard();
            } else if (event === 'SIGNED_OUT') {
                this.authManager.currentUser = null;
                this.moodTracker.setCurrentUser(null);
                this.aiSuggestions.setCurrentUser(null);
                this.authManager.showAuth();
            }
        });
    }

    setupNavigation() {
        // Handle navigation between different sections
        const moodTrackerBtn = document.getElementById('mood-tracker-btn');
        const sections = ['mood-tracker-section', 'ai-suggestions-section'];

        if (moodTrackerBtn) {
            moodTrackerBtn.addEventListener('click', () => {
                sections.forEach(sectionId => {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        if (sectionId === 'mood-tracker-section') {
                            section.classList.remove('hidden');
                        } else {
                            section.classList.add('hidden');
                        }
                    }
                });
            });
        }
    }

    setupMoodTrackerNavigation() {
        // Auto-scroll to mood tracker when user logs in
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const dashboard = mutation.target;
                    if (dashboard.id === 'dashboard' && !dashboard.classList.contains('hidden')) {
                        // Dashboard is now visible, scroll to mood tracker
                        setTimeout(() => {
                            const moodSection = document.getElementById('mood-tracker-section');
                            if (moodSection) {
                                moodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 500);
                    }
                }
            });
        });

        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            observer.observe(dashboard, { attributes: true });
        }
    }

    async createDatabaseTables() {
        // This function will create the necessary database tables
        // Note: In a real Supabase setup, you'd run these SQL commands in the Supabase dashboard

        const createTablesSQL = `
            -- Create mood_entries table
            CREATE TABLE IF NOT EXISTS mood_entries (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
                mood_text TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                date DATE DEFAULT CURRENT_DATE,
                UNIQUE(user_id, date) -- One entry per user per day
            );

            -- Create user_profiles table for additional user data
            CREATE TABLE IF NOT EXISTS user_profiles (
                id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
                email TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Enable Row Level Security
            ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
            ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

            -- Create policies for mood_entries
            CREATE POLICY "Users can view their own mood entries" ON mood_entries
                FOR SELECT USING (auth.uid() = user_id);

            CREATE POLICY "Users can insert their own mood entries" ON mood_entries
                FOR INSERT WITH CHECK (auth.uid() = user_id);

            CREATE POLICY "Users can update their own mood entries" ON mood_entries
                FOR UPDATE USING (auth.uid() = user_id);

            CREATE POLICY "Users can delete their own mood entries" ON mood_entries
                FOR DELETE USING (auth.uid() = user_id);

            -- Create policies for user_profiles
            CREATE POLICY "Users can view their own profile" ON user_profiles
                FOR SELECT USING (auth.uid() = id);

            CREATE POLICY "Users can insert their own profile" ON user_profiles
                FOR INSERT WITH CHECK (auth.uid() = id);

            CREATE POLICY "Users can update their own profile" ON user_profiles
                FOR UPDATE USING (auth.uid() = id);

            -- Create function to handle new user registration
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO public.user_profiles (id, email)
                VALUES (NEW.id, NEW.email);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;

            -- Create trigger for new user registration
            CREATE OR REPLACE TRIGGER on_auth_user_created
                AFTER INSERT ON auth.users
                FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        `;

        console.log('Database setup SQL (run this in Supabase dashboard):');
        console.log(createTablesSQL);
    }

    // Utility functions
    showToast(message, icon = '✅') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (toast && toastMessage && toastIcon) {
            toastMessage.textContent = message;
            toastIcon.textContent = icon;

            toast.classList.remove('hidden');
            toast.classList.remove('translate-x-full');

            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    toast.classList.add('hidden');
                }, 300);
            }, 3000);
        }
    }

    // Privacy and safety features
    setupPrivacyFeatures() {
        // Data export functionality
        const exportData = () => {
            if (!this.authManager.currentUser) return;

            // Export user data as JSON
            const userData = {
                exportDate: new Date().toISOString(),
                userId: this.authManager.currentUser.id,
                moodEntries: [] // Would be populated from database
            };

            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `mental-health-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
            this.showToast('Your data has been exported successfully!', '📁');
        };

        // Data deletion functionality
        const deleteAllData = async () => {
            if (!this.authManager.currentUser) return;

            if (confirm('Are you sure you want to delete all your mood data? This action cannot be undone.')) {
                try {
                    const { error } = await this.supabase
                        .from('mood_entries')
                        .delete()
                        .eq('user_id', this.authManager.currentUser.id);

                    if (error) throw error;

                    this.showToast('All your data has been deleted successfully.', '🗑️');
                    this.moodTracker.loadUserMoods(); // Refresh the display

                } catch (error) {
                    console.error('Error deleting data:', error);
                    this.showToast('Failed to delete data. Please try again.', '❌');
                }
            }
        };

        // Add privacy controls to the UI (would be added to settings page)
        console.log('Privacy features available:');
        console.log('- Data export: exportData()');
        console.log('- Data deletion: deleteAllData()');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is properly configured
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase not configured. Please set up your Supabase project.');
        document.getElementById('auth-container').innerHTML = `
            <div class="text-center p-8">
                <h2 class="text-xl font-semibold text-gray-800 mb-4">Configuration Required</h2>
                <p class="text-gray-600 mb-4">Please configure your Supabase project to continue.</p>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p class="text-sm text-yellow-800">
                        Update the Supabase configuration in the HTML file with your project URL and API key.
                    </p>
                </div>
            </div>
        `;
        return;
    }

    window.mentalHealthApp = new MentalHealthApp();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MentalHealthApp };
}

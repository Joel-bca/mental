// Setup script for Mental Health Tracker
// Run this in your browser console or as a separate script

const SETUP_CONFIG = {
    // Replace these with your actual Supabase credentials
    supabase: {
        url: 'https://your-project-id.supabase.co',
        anonKey: 'your-anon-key-here'
    },

    // Database setup SQL - run this in Supabase SQL editor
    databaseSetup: `
        -- Create mood_entries table
        CREATE TABLE IF NOT EXISTS mood_entries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
            mood_text TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            date DATE DEFAULT CURRENT_DATE,
            UNIQUE(user_id, date)
        );

        -- Create user_profiles table
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
    `
};

// Function to update HTML file with Supabase config
function updateSupabaseConfig() {
    const htmlContent = `
    <!-- Supabase Config -->
    <script type="module">
        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

        // Supabase configuration - REPLACE WITH YOUR ACTUAL VALUES
        const supabaseUrl = '${SETUP_CONFIG.supabase.url}'
        const supabaseKey = '${SETUP_CONFIG.supabase.anonKey}'

        // Initialize Supabase client
        window.supabase = createClient(supabaseUrl, supabaseKey)

        // Check if Supabase is properly configured
        if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
            console.warn('⚠️  Supabase not configured! Please update the configuration above with your actual project credentials.');
        }
    </script>`;

    console.log('📋 Copy this configuration to your index.html file:');
    console.log(htmlContent);
}

// Function to display setup instructions
function showSetupInstructions() {
    console.log('🚀 Mental Health Tracker Setup Instructions');
    console.log('=' .repeat(50));

    console.log('\n1. 📧 Set up Supabase Account:');
    console.log('   - Go to https://supabase.com');
    console.log('   - Create a new project');
    console.log('   - Wait for the database to be set up');

    console.log('\n2. 🔧 Configure Authentication:');
    console.log('   - Go to Authentication > Settings');
    console.log('   - Configure your site URL: http://localhost:3000');
    console.log('   - Add redirect URLs if needed');

    console.log('\n3. 🗄️  Set up Database:');
    console.log('   - Go to SQL Editor');
    console.log('   - Run the SQL commands from SETUP_CONFIG.databaseSetup');
    console.log('   - This creates tables and security policies');

    console.log('\n4. 🔑 Get API Keys:');
    console.log('   - Go to Settings > API');
    console.log('   - Copy your Project URL');
    console.log('   - Copy your anon/public key');

    console.log('\n5. ⚙️  Update Configuration:');
    console.log('   - Update the supabase.url and supabase.anonKey in SETUP_CONFIG');
    console.log('   - Run updateSupabaseConfig() to get the HTML code');
    console.log('   - Replace the Supabase config section in index.html');

    console.log('\n6. 🧪 Test the Application:');
    console.log('   - Open index.html in your browser');
    console.log('   - Try signing up with an email');
    console.log('   - Check if you receive a confirmation email');

    console.log('\n7. 📱 Deploy (Optional):');
    console.log('   - Update netlify.toml with your build settings');
    console.log('   - Deploy to Netlify or Railway');
}

// Function to test Supabase connection
async function testSupabaseConnection() {
    if (!window.supabase) {
        console.error('❌ Supabase not initialized');
        return;
    }

    try {
        const { data, error } = await window.supabase.auth.getSession();
        if (error) throw error;

        console.log('✅ Supabase connection successful!');
        console.log('Session data:', data);

    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
    }
}

// Function to create a test mood entry
async function testMoodEntry() {
    if (!window.supabase) {
        console.error('❌ Supabase not initialized');
        return;
    }

    try {
        // First, try to sign up a test user
        const testEmail = 'test@example.com';
        const testPassword = 'testpassword123';

        const { data, error } = await window.supabase.auth.signUp({
            email: testEmail,
            password: testPassword
        });

        if (error) throw error;

        console.log('✅ Test user created:', data.user?.email);

        // Try to create a mood entry
        const { data: moodData, error: moodError } = await window.supabase
            .from('mood_entries')
            .insert([{
                user_id: data.user?.id,
                mood_rating: 4,
                mood_text: 'Test mood entry',
                date: new Date().toISOString().split('T')[0]
            }]);

        if (moodError) throw moodError;

        console.log('✅ Test mood entry created successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Export functions for global use
window.setupMentalHealthApp = {
    updateSupabaseConfig,
    showSetupInstructions,
    testSupabaseConnection,
    testMoodEntry,
    SETUP_CONFIG
};

// Show instructions when script loads
console.log('🔧 Mental Health Tracker Setup Helper Loaded!');
console.log('Run showSetupInstructions() to see setup steps.');

// Supabase Configuration Template
// Replace these values with your actual Supabase project credentials

const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_PROJECT_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
    serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY' // For server-side operations
};

// Database Schema Setup
const DATABASE_SCHEMA = {
    mood_entries: `
        CREATE TABLE IF NOT EXISTS mood_entries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
            mood_text TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            date DATE DEFAULT CURRENT_DATE,
            UNIQUE(user_id, date)
        );
    `,

    user_profiles: `
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `,

    policies: `
        -- Enable RLS
        ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

        -- Mood entries policies
        CREATE POLICY "Users can view their own mood entries" ON mood_entries
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own mood entries" ON mood_entries
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own mood entries" ON mood_entries
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own mood entries" ON mood_entries
            FOR DELETE USING (auth.uid() = user_id);

        -- User profiles policies
        CREATE POLICY "Users can view their own profile" ON user_profiles
            FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can insert their own profile" ON user_profiles
            FOR INSERT WITH CHECK (auth.uid() = id);

        CREATE POLICY "Users can update their own profile" ON user_profiles
            FOR UPDATE USING (auth.uid() = id);
    `,

    functions: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.user_profiles (id, email)
            VALUES (NEW.id, NEW.email);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        CREATE OR REPLACE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `
};

// AI Configuration (Optional - for enhanced features)
const AI_CONFIG = {
    anthropic: {
        apiKey: 'YOUR_ANTHROPIC_API_KEY',
        model: 'claude-3-haiku-20240307' // Free tier model
    },

    openai: {
        apiKey: 'YOUR_OPENAI_API_KEY',
        model: 'gpt-3.5-turbo' // Cost-effective option
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        DATABASE_SCHEMA,
        AI_CONFIG
    };
}

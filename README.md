# 🌟 Reflect & Grow - Mental Health Tracker

A comprehensive mental health tracking application designed for children and youth, featuring mood tracking, voice-to-text input, AI-powered insights, and secure authentication.

## 🎯 Features

- **🔐 Secure Authentication** - Email/password signup with email verification
- **😊 Daily Mood Tracking** - 5-point mood scale with text and voice input
- **🎤 Voice-to-Text** - Speech recognition for easy mood entry
- **🤖 AI Suggestions** - Personalized insights based on 30-day mood data
- **📊 Progress Analytics** - Track mood trends and weekly averages
- **🔒 Privacy-First** - Data encryption and user-controlled privacy settings
- **📱 Responsive Design** - Works on all devices with beautiful UI

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (for development server)
- Supabase account (free tier available)

### 2. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for database setup (2-3 minutes)

#### Configure Authentication
1. Go to **Authentication > Settings**
2. Set Site URL: `http://localhost:3000`
3. Add redirect URLs if needed for production

#### Set Up Database
1. Go to **SQL Editor**
2. Copy and run this SQL:

```sql
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
```

#### Get API Keys
1. Go to **Settings > API**
2. Copy your **Project URL** (e.g., `https://your-project-id.supabase.co`)
3. Copy your **anon/public key**

### 3. Configure Application

#### Update index.html
Find this section in `index.html` and replace with your actual values:

```javascript
// Supabase configuration - REPLACE WITH YOUR ACTUAL VALUES
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseKey = 'your-anon-key-here'
```

### 4. Run Development Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

## 📧 Email Verification Setup

### Gmail Configuration (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create credentials (OAuth 2.0)
5. Configure authorized redirect URIs

### Supabase Email Configuration
1. Go to **Authentication > Email Templates**
2. Customize email templates for:
   - Confirm signup
   - Magic link
   - Change email
   - Recover password

## 🎨 Customization

### Theme Colors
The app uses a custom color palette defined in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    blue: '#87CEEB',
    light: '#7DD3FC'
  },
  secondary: {
    light: '#E0F2FE',
    lighter: '#F0F9FF'
  }
}
```

### AI Integration
To enable AI suggestions, configure your preferred AI service in `src/js/ai-suggestions.js`:

```javascript
// Example configuration
const AI_CONFIG = {
  provider: 'anthropic', // or 'openai'
  apiKey: 'your-api-key',
  model: 'claude-3-haiku-20240307'
};
```

## 🔒 Privacy & Security

### Data Protection
- All mood data is encrypted in transit and at rest
- Users can export or delete their data at any time
- Row Level Security ensures users only see their own data

### Child Safety Features
- Email verification required for all accounts
- No personal information collection beyond email
- All data processing happens client-side where possible

## 🚀 Deployment

### Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### Railway
1. Connect your repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration with email verification
- [ ] Login/logout functionality
- [ ] Mood entry creation (text and voice)
- [ ] Mood data persistence
- [ ] Statistics calculation
- [ ] Responsive design on mobile
- [ ] Voice recognition in supported browsers

### Automated Testing
```bash
# Run tests (when implemented)
npm test
```

## 📊 Database Schema

### mood_entries
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users
- `mood_rating` (INTEGER) - 1-5 scale
- `mood_text` (TEXT) - Optional mood description
- `created_at` (TIMESTAMP) - Auto-generated
- `date` (DATE) - Entry date

### user_profiles
- `id` (UUID) - References auth.users
- `email` (TEXT) - User email
- `created_at` (TIMESTAMP) - Account creation date
- `updated_at` (TIMESTAMP) - Last update

## 🆘 Troubleshooting

### Common Issues

**CSS not loading**
- Run `npm run build` to compile Tailwind CSS
- Check browser console for errors

**Supabase connection failed**
- Verify your API keys are correct
- Check if your Supabase project is active
- Ensure CORS settings allow your domain

**Email verification not working**
- Check spam folder
- Verify email templates in Supabase
- Test with a real email address

**Voice recognition not working**
- Check browser compatibility (Chrome recommended)
- Ensure microphone permissions are granted
- Try refreshing the page

### Getting Help
1. Check the browser console for error messages
2. Verify all setup steps were completed
3. Test with the setup script: `showSetupInstructions()`
4. Check Supabase dashboard for any issues

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🙏 Acknowledgments

- Supabase for the amazing backend platform
- Tailwind CSS for the beautiful styling
- Speech Recognition API for voice features
- All contributors and testers

---

**Made with ❤️ for mental health awareness and child safety**
#   m e n t a l  
 #   m e n t a l  
 
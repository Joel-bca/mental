#!/bin/bash

# Reflect & Grow - Deployment Script
echo "🚀 Starting deployment process for Reflect & Grow..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Dependencies check passed"

# Install npm packages
echo "📦 Installing npm packages..."
npm install

# Build CSS
echo "🎨 Building Tailwind CSS..."
npx tailwindcss -i ./src/css/input.css -o ./dist/css/output.css --minify

if [ $? -eq 0 ]; then
    echo "✅ CSS build completed successfully"
else
    echo "❌ CSS build failed"
    exit 1
fi

# Check if Supabase config is set up
if grep -q "YOUR_SUPABASE_URL" index.html; then
    echo "⚠️  Warning: Supabase configuration not updated"
    echo "   Please update the Supabase URL and API key in index.html"
fi

# Check if AI API key is set up
if grep -q "YOUR_ANTHROPIC_API_KEY" src/js/ai-suggestions.js; then
    echo "⚠️  Warning: AI API key not configured"
    echo "   Please add your Anthropic API key for AI features"
fi

echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update Supabase configuration in index.html"
echo "2. Set up your Supabase database (see README.md)"
echo "3. Add AI API key (optional)"
echo "4. Deploy to Netlify or Railway"
echo ""
echo "🌐 To test locally:"
echo "   npm run dev"
echo ""
echo "📖 For detailed instructions, see README.md"

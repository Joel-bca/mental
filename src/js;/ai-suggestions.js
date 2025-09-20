// AI suggestions functionality using free AI models
class AISuggestions {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.aiModel = 'claude'; // Using Anthropic Claude (free tier available)
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // This will be called when user data is available
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            this.generateSuggestions();
        }
    }

    async generateSuggestions() {
        if (!this.currentUser) return;

        try {
            // Get 30 days of mood data
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: moodData, error } = await this.supabase
                .from('mood_entries')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!moodData || moodData.length < 7) {
                this.showInsufficientDataMessage(moodData?.length || 0);
                return;
            }

            this.showLoading();

            // Analyze mood patterns
            const analysis = this.analyzeMoodData(moodData);

            // Generate AI suggestions
            const suggestions = await this.getAISuggestions(analysis);

            this.displaySuggestions(suggestions, analysis);

        } catch (error) {
            console.error('Error generating suggestions:', error);
            this.showErrorMessage();
        } finally {
            this.hideLoading();
        }
    }

    analyzeMoodData(moodData) {
        const ratings = moodData.map(entry => entry.mood_rating).filter(r => r !== null);
        const texts = moodData.map(entry => entry.mood_text).filter(text => text && text.trim());

        // Calculate statistics
        const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        const recent = ratings.slice(-7); // Last 7 days
        const recentAverage = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;

        // Mood trend analysis
        const trend = this.calculateTrend(ratings);

        // Common themes in text entries
        const themes = this.extractThemes(texts);

        return {
            totalEntries: moodData.length,
            averageMood: Math.round(average * 10) / 10,
            recentAverage: Math.round(recentAverage * 10) / 10,
            trend: trend,
            themes: themes,
            improvement: recentAverage > average ? 'improving' : recentAverage < average ? 'declining' : 'stable'
        };
    }

    calculateTrend(ratings) {
        if (ratings.length < 7) return 'insufficient_data';

        const firstHalf = ratings.slice(0, Math.floor(ratings.length / 2));
        const secondHalf = ratings.slice(Math.floor(ratings.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const difference = secondAvg - firstAvg;

        if (difference > 0.5) return 'improving';
        if (difference < -0.5) return 'declining';
        return 'stable';
    }

    extractThemes(texts) {
        const themes = {
            positive: ['happy', 'great', 'good', 'excited', 'proud', 'grateful', 'love', 'wonderful'],
            negative: ['sad', 'bad', 'terrible', 'angry', 'frustrated', 'anxious', 'worried', 'tired'],
            social: ['friends', 'family', 'school', 'work', 'relationship', 'social', 'people'],
            health: ['sleep', 'exercise', 'eat', 'health', 'tired', 'energy', 'sick'],
            academic: ['school', 'study', 'homework', 'test', 'grade', 'learn', 'class']
        };

        const foundThemes = { positive: 0, negative: 0, social: 0, health: 0, academic: 0 };

        texts.forEach(text => {
            const lowerText = text.toLowerCase();
            Object.keys(themes).forEach(theme => {
                themes[theme].forEach(keyword => {
                    if (lowerText.includes(keyword)) {
                        foundThemes[theme]++;
                    }
                });
            });
        });

        return foundThemes;
    }

    async getAISuggestions(analysis) {
        const prompt = this.buildPrompt(analysis);

        try {
            // Using Anthropic Claude (free tier available)
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'YOUR_ANTHROPIC_API_KEY', // Replace with actual key
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307', // Free tier model
                    max_tokens: 500,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('AI API request failed');
            }

            const data = await response.json();
            return data.content[0].text;

        } catch (error) {
            console.error('AI API error:', error);
            // Fallback to rule-based suggestions
            return this.getFallbackSuggestions(analysis);
        }
    }

    buildPrompt(analysis) {
        return `You are a caring mental health assistant for children and youth. Based on this mood tracking data analysis:

**Mood Statistics:**
- Total entries: ${analysis.totalEntries}
- Overall average mood: ${analysis.averageMood}/5
- Recent average (last 7 days): ${analysis.recentAverage}/5
- Trend: ${analysis.trend}
- Mood status: ${analysis.improvement}

**Common themes in entries:**
- Positive themes: ${analysis.themes.positive} mentions
- Negative themes: ${analysis.themes.negative} mentions
- Social themes: ${analysis.themes.social} mentions
- Health themes: ${analysis.themes.health} mentions
- Academic themes: ${analysis.themes.academic} mentions

Please provide 3-4 personalized, encouraging suggestions to help improve or maintain their mental health. Keep suggestions age-appropriate, positive, and actionable. Focus on small, achievable steps. If their mood is already good, suggest ways to maintain it and build resilience.

Format your response as a bulleted list of suggestions, each starting with an encouraging emoji.`;
    }

    getFallbackSuggestions(analysis) {
        const suggestions = [];

        // Base suggestions on mood trend and themes
        if (analysis.trend === 'declining' || analysis.averageMood < 3) {
            suggestions.push("🌅 Try starting your day with a 5-minute mindfulness exercise - just sit quietly and focus on your breathing");
            suggestions.push("📝 Consider talking to a trusted adult about how you're feeling - they might have helpful perspectives");
            suggestions.push("🎯 Set one small, achievable goal for today that will make you feel accomplished");
        } else if (analysis.trend === 'improving' || analysis.averageMood >= 4) {
            suggestions.push("🎉 Great job maintaining your positive mood! Keep celebrating small wins throughout your day");
            suggestions.push("🤝 Share your positive energy by doing something kind for someone else today");
            suggestions.push("📚 Build on your good mood by learning a new skill or hobby you're interested in");
        } else {
            suggestions.push("😊 Your mood is stable - that's a great foundation! Try mixing up your routine with something new");
            suggestions.push("🏃‍♂️ Physical activity can boost your mood - try a short walk or your favorite sport");
            suggestions.push("🎨 Express yourself creatively through drawing, music, or writing about your thoughts");
        }

        // Add theme-specific suggestions
        if (analysis.themes.social > analysis.themes.negative) {
            suggestions.push("👥 Your social connections seem positive - plan to spend quality time with friends or family");
        }

        if (analysis.themes.health > 0) {
            suggestions.push("💪 Focus on good sleep and healthy eating - these have a big impact on how you feel");
        }

        return suggestions.slice(0, 4).map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n');
    }

    displaySuggestions(suggestions, analysis) {
        const container = document.getElementById('ai-content');

        const suggestionsHTML = `
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-100">
                    <h3 class="font-semibold text-gray-800 mb-3">📊 Your Mood Analysis</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Overall Average:</span>
                            <span class="font-medium text-gray-800 ml-2">${analysis.averageMood}/5</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Recent Trend:</span>
                            <span class="font-medium text-gray-800 ml-2">${this.getTrendEmoji(analysis.trend)}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Total Entries:</span>
                            <span class="font-medium text-gray-800 ml-2">${analysis.totalEntries}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Status:</span>
                            <span class="font-medium text-gray-800 ml-2">${this.getStatusText(analysis.improvement)}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-6 border border-sky-100">
                    <h3 class="font-semibold text-gray-800 mb-3">💡 Personalized Suggestions</h3>
                    <div class="prose prose-sm max-w-none">
                        <div class="whitespace-pre-line text-gray-700">${suggestions}</div>
                    </div>
                </div>

                <div class="text-center">
                    <p class="text-sm text-gray-500">
                        💙 Remember: You're doing great just by tracking your mood! Small steps lead to big changes.
                    </p>
                </div>
            </div>
        `;

        container.innerHTML = suggestionsHTML;
    }

    showInsufficientDataMessage(entryCount) {
        const container = document.getElementById('ai-content');

        const message = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">📈</div>
                <h3 class="font-semibold text-gray-800 mb-2">Keep Tracking to Get AI Insights!</h3>
                <p class="text-gray-600 mb-4">
                    You have ${entryCount} mood ${entryCount === 1 ? 'entry' : 'entries'} so far.
                    Track your mood for at least 7 days to receive personalized AI suggestions.
                </p>
                <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p class="text-sm text-blue-800">
                        <strong>Pro tip:</strong> The more consistently you track, the better suggestions you'll receive!
                    </p>
                </div>
            </div>
        `;

        container.innerHTML = message;
    }

    showErrorMessage() {
        const container = document.getElementById('ai-content');

        const message = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">🤖</div>
                <h3 class="font-semibold text-gray-800 mb-2">AI Suggestions Temporarily Unavailable</h3>
                <p class="text-gray-600 mb-4">
                    We're having trouble connecting to our AI service right now.
                    Don't worry - your mood tracking is still working perfectly!
                </p>
                <p class="text-sm text-gray-500">
                    Try refreshing the page or check back later for personalized suggestions.
                </p>
            </div>
        `;

        container.innerHTML = message;
    }

    getTrendEmoji(trend) {
        const emojis = {
            'improving': '📈',
            'declining': '📉',
            'stable': '➡️',
            'insufficient_data': '📊'
        };
        return emojis[trend] || '📊';
    }

    getStatusText(improvement) {
        const texts = {
            'improving': 'Getting Better! 🎉',
            'declining': 'Needs Attention 💙',
            'stable': 'Steady Progress ✨'
        };
        return texts[improvement] || 'Good Progress 🌟';
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
}

// Initialize AI suggestions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiSuggestions = new AISuggestions();
});

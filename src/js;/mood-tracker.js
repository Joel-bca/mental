// Mood tracking functionality with voice-to-text
class MoodTracker {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.selectedMood = null;
        this.isRecording = false;
        this.recognition = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeVoiceRecognition();
        this.loadUserMoods();
    }

    setupEventListeners() {
        // Mood selection buttons
        const moodButtons = document.querySelectorAll('.mood-btn');
        moodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMood(e));
        });

        // Voice recording
        const voiceRecordBtn = document.getElementById('voice-record');
        const voiceStopBtn = document.getElementById('voice-stop');

        if (voiceRecordBtn) {
            voiceRecordBtn.addEventListener('click', () => this.startVoiceRecording());
        }

        if (voiceStopBtn) {
            voiceStopBtn.addEventListener('click', () => this.stopVoiceRecording());
        }

        // Submit mood
        const submitBtn = document.getElementById('submit-mood');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitMood());
        }

        // Text input changes
        const moodText = document.getElementById('mood-text');
        if (moodText) {
            moodText.addEventListener('input', () => this.updateSubmitButton());
        }
    }

    initializeVoiceRecognition() {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.updateVoiceUI('Recording...', '🔴', true);
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.addVoiceTextToInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showToast('Voice recognition failed. Please try again.', '❌');
                this.resetVoiceUI();
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                this.resetVoiceUI();
            };
        } else {
            // Hide voice features if not supported
            const voiceElements = document.querySelectorAll('[id*="voice"]');
            voiceElements.forEach(el => el.classList.add('hidden'));
        }
    }

    selectMood(e) {
        const button = e.currentTarget;
        const moodValue = button.dataset.mood;

        // Remove selected class from all buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selected class to clicked button
        button.classList.add('selected');
        this.selectedMood = parseInt(moodValue);

        this.updateSubmitButton();
    }

    startVoiceRecording() {
        if (!this.recognition) {
            this.showToast('Voice recognition is not supported in your browser.', '❌');
            return;
        }

        if (this.isRecording) {
            this.stopVoiceRecording();
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.showToast('Could not start voice recognition. Please try again.', '❌');
        }
    }

    stopVoiceRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
    }

    addVoiceTextToInput(transcript) {
        const textInput = document.getElementById('mood-text');
        const currentText = textInput.value;
        const newText = currentText ? `${currentText} ${transcript}` : transcript;

        textInput.value = newText;
        this.updateSubmitButton();
    }

    updateVoiceUI(statusText, icon, isRecording) {
        const voiceText = document.getElementById('voice-text');
        const voiceIcon = document.getElementById('voice-icon');
        const voiceRecordBtn = document.getElementById('voice-record');
        const voiceStopBtn = document.getElementById('voice-stop');

        if (voiceText) voiceText.textContent = statusText;
        if (voiceIcon) voiceIcon.textContent = icon;

        if (isRecording) {
            voiceRecordBtn.classList.add('hidden');
            voiceStopBtn.classList.remove('hidden');
        } else {
            voiceRecordBtn.classList.remove('hidden');
            voiceStopBtn.classList.add('hidden');
        }
    }

    resetVoiceUI() {
        this.updateVoiceUI('Start Recording', '🎤', false);
    }

    updateSubmitButton() {
        const submitBtn = document.getElementById('submit-mood');
        const hasMood = this.selectedMood !== null;
        const hasText = document.getElementById('mood-text').value.trim().length > 0;

        if (hasMood || hasText) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    async submitMood() {
        if (!this.currentUser) {
            this.showToast('Please log in to track your mood.', '❌');
            return;
        }

        const textInput = document.getElementById('mood-text').value.trim();

        // Require at least mood selection or text
        if (!this.selectedMood && !textInput) {
            this.showToast('Please select a mood or write something about your day.', '❌');
            return;
        }

        this.showLoading();

        const moodData = {
            user_id: this.currentUser.id,
            mood_rating: this.selectedMood,
            mood_text: textInput,
            created_at: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        };

        try {
            const { data, error } = await this.supabase
                .from('mood_entries')
                .insert([moodData]);

            if (error) throw error;

            this.showToast('Mood saved successfully!', '✅');
            this.resetForm();
            this.loadUserMoods();
            this.updateStats();

        } catch (error) {
            console.error('Error saving mood:', error);
            this.showToast('Failed to save mood. Please try again.', '❌');
        } finally {
            this.hideLoading();
        }
    }

    resetForm() {
        // Reset mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedMood = null;

        // Reset text input
        document.getElementById('mood-text').value = '';

        // Reset voice UI
        this.resetVoiceUI();

        // Update submit button
        this.updateSubmitButton();
    }

    async loadUserMoods() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('mood_entries')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            this.displayRecentMoods(data || []);

        } catch (error) {
            console.error('Error loading moods:', error);
        }
    }

    displayRecentMoods(moods) {
        const container = document.getElementById('recent-moods');

        if (!moods || moods.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No mood entries yet. Start tracking to see your history here!</p>';
            return;
        }

        const moodsHTML = moods.map(mood => {
            const date = new Date(mood.created_at).toLocaleDateString();
            const moodEmoji = this.getMoodEmoji(mood.mood_rating);
            const moodText = mood.mood_text ? `<p class="text-gray-600 text-sm mt-1">${mood.mood_text}</p>` : '';

            return `
                <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div class="text-2xl">${moodEmoji}</div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <p class="font-medium text-gray-800">Mood: ${mood.mood_rating}/5</p>
                            <p class="text-sm text-gray-500">${date}</p>
                        </div>
                        ${moodText}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = moodsHTML;
    }

    getMoodEmoji(rating) {
        const emojis = {
            1: '😢',
            2: '😐',
            3: '🙂',
            4: '😊',
            5: '😄'
        };
        return emojis[rating] || '😐';
    }

    async updateStats() {
        if (!this.currentUser) return;

        try {
            // Get total entries
            const { count: totalCount } = await this.supabase
                .from('mood_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', this.currentUser.id);

            // Get this week's entries
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { data: weekData } = await this.supabase
                .from('mood_entries')
                .select('mood_rating')
                .eq('user_id', this.currentUser.id)
                .gte('created_at', weekAgo.toISOString());

            // Calculate weekly average
            let weeklyAvg = 'N/A';
            if (weekData && weekData.length > 0) {
                const sum = weekData.reduce((acc, entry) => acc + (entry.mood_rating || 0), 0);
                weeklyAvg = (sum / weekData.length).toFixed(1);
            }

            // Update UI
            const daysTracked = document.getElementById('days-tracked');
            const weeklyAvgElement = document.getElementById('weekly-avg');

            if (daysTracked) daysTracked.textContent = totalCount || 0;
            if (weeklyAvgElement) weeklyAvgElement.textContent = weeklyAvg;

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            this.loadUserMoods();
            this.updateStats();
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showToast(message, icon) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

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

// Initialize mood tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.moodTracker = new MoodTracker();
});

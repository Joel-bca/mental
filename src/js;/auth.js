// Authentication functionality using Supabase
class AuthManager {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signup-form-element');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Toggle between login and signup
        const showSignupBtn = document.getElementById('show-signup');
        const showLoginBtn = document.getElementById('show-login');

        if (showSignupBtn) {
            showSignupBtn.addEventListener('click', () => this.toggleAuthMode('signup'));
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => this.toggleAuthMode('login'));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.showLoading();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.showToast('Successfully signed in!', '✅');
            this.showDashboard();

        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please check your credentials.', '❌');
        } finally {
            this.hideLoading();
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        this.showLoading();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showToast('Passwords do not match!', '❌');
            this.hideLoading();
            return;
        }

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters long!', '❌');
            this.hideLoading();
            return;
        }

        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;

            this.showToast('Account created! Please check your email for verification.', '✅');
            this.toggleAuthMode('login');

        } catch (error) {
            console.error('Signup error:', error);
            this.showToast('Signup failed. Please try again.', '❌');
        } finally {
            this.hideLoading();
        }
    }

    async handleLogout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.showAuth();
            this.showToast('Successfully signed out!', '✅');

        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Logout failed. Please try again.', '❌');
        }
    }

    async checkAuthState() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();

            if (user) {
                this.currentUser = user;
                this.showDashboard();
            } else {
                this.showAuth();
            }
        } catch (error) {
            console.error('Auth state check error:', error);
            this.showAuth();
        }
    }

    toggleAuthMode(mode) {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (mode === 'signup') {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        } else {
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('navbar').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('navbar').classList.remove('hidden');

        // Update user info
        const userEmail = document.getElementById('user-email');
        if (userEmail && this.currentUser) {
            userEmail.textContent = this.currentUser.email;
        }

        // Set current date
        const currentDate = document.getElementById('current-date');
        if (currentDate) {
            currentDate.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
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

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

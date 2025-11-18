// auth.js - Authentication functionality for MannieTech AI

class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('mannietech_users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('mannietech_current_user')) || null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeFormAnimations();
    }

    setupEventListeners() {
        const loginBtn = document.querySelector('.loginBtn');
        const signupBtn = document.querySelector('.signupBtn');
        const form = document.querySelector('.login-signup-form');

        // Login button click
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Signup button click
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Form submit (for Enter key)
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    initializeFormAnimations() {
        const inputs = document.querySelectorAll('.input-details');
        
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.parentElement.classList.remove('focused');
                }
            });
        });
    }

    async handleLogin() {
        const username = document.querySelector('input[type="text"]').value.trim();
        const password = document.querySelector('input[type="password"]').value.trim();
        const loginBtn = document.querySelector('.loginBtn');

        // Validation
        if (!username || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Show loading state
        this.setButtonLoading(loginBtn, true);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const user = this.authenticateUser(username, password);
            
            if (user) {
                this.currentUser = user;
                localStorage.setItem('mannietech_current_user', JSON.stringify(user));
                
                this.showNotification('Login successful! Welcome back!', 'success');
                
                // Redirect after successful login
                setTimeout(() => {
                    window.location.href = 'mannieTechAI-chat.html';
                }, 1000);
            } else {
                this.showNotification('Invalid username or password', 'error');
            }
        } catch (error) {
            this.showNotification('Login failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(loginBtn, false);
        }
    }

    async handleSignup() {
        const username = document.querySelector('input[type="text"]').value.trim();
        const email = document.querySelector('input[type="email"]').value.trim();
        const password = document.querySelector('input[type="password"]').value.trim();
        const signupBtn = document.querySelector('.signupBtn');

        // Validation
        if (!username || !email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        this.setButtonLoading(signupBtn, true);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (this.userExists(username, email)) {
                this.showNotification('Username or email already exists', 'error');
                return;
            }

            const newUser = this.createUser(username, email, password);
            this.users.push(newUser);
            this.currentUser = newUser;
            
            localStorage.setItem('mannietech_users', JSON.stringify(this.users));
            localStorage.setItem('mannietech_current_user', JSON.stringify(newUser));
            
            this.showNotification('Account created successfully! Welcome to MannieTech AI!', 'success');
            
            // Redirect after successful signup
            setTimeout(() => {
                window.location.href = 'mannieTechAI-chat.html';
            }, 1000);
            
        } catch (error) {
            this.showNotification('Signup failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(signupBtn, false);
        }
    }

    authenticateUser(username, password) {
        return this.users.find(user => 
            (user.username === username || user.email === username) && 
            user.password === password
        );
    }

    userExists(username, email) {
        return this.users.some(user => 
            user.username === username || user.email === email
        );
    }

    createUser(username, email, password) {
        return {
            id: 'user_' + Date.now(),
            username: username,
            email: email,
            password: password,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setButtonLoading(button, isLoading) {
        const btnContent = button.querySelector('.btn-content');
        const btnText = button.querySelector('.btn-text');
        
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            btnText.textContent = button.classList.contains('loginBtn') ? 'Logging in...' : 'Creating account...';
            button.style.opacity = '0.8';
            button.style.pointerEvents = 'none';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            btnText.textContent = button.classList.contains('loginBtn') ? 'Login' : 'Sign Up';
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.auth-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">×</button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#auth-notification-styles')) {
            this.addNotificationStyles();
        }

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);

        // Close button event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.hideNotification(notification);
        });

        // Click outside to close
        notification.addEventListener('click', (e) => {
            if (e.target === notification) {
                clearTimeout(autoRemove);
                this.hideNotification(notification);
            }
        });
    }

    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };
        return icons[type] || icons.info;
    }

    addNotificationStyles() {
        const styles = `
            <style id="auth-notification-styles">
                .auth-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(26, 26, 46, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px 20px;
                    color: white;
                    z-index: 10000;
                    max-width: 400px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    transform: translateX(400px);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                }

                .auth-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }

                .auth-notification-success {
                    border-left: 4px solid #4CAF50;
                }

                .auth-notification-error {
                    border-left: 4px solid #ff4757;
                }

                .auth-notification-info {
                    border-left: 4px solid #6c63ff;
                }

                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .notification-icon {
                    font-size: 18px;
                    font-weight: bold;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }

                .auth-notification-success .notification-icon {
                    background: rgba(76, 175, 80, 0.2);
                    color: #4CAF50;
                }

                .auth-notification-error .notification-icon {
                    background: rgba(255, 71, 87, 0.2);
                    color: #ff4757;
                }

                .auth-notification-info .notification-icon {
                    background: rgba(108, 99, 255, 0.2);
                    color: #6c63ff;
                }

                .notification-message {
                    font-size: 14px;
                    line-height: 1.4;
                    flex: 1;
                }

                .notification-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .notification-close:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                }

                @media (max-width: 768px) {T
                    .auth-notification {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                        transform: translateY(-100px);
                    }
                    
                    .auth-notification.show {
                        transform: translateY(0);
                    }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AuthManager();
});
// Options page script - handles login/logout and settings
const API_BASE = 'https://nexa-yp12.onrender.com/api';
// const API_BASE = 'http://localhost:4000/api'; // Uncomment for local dev

const statusEl = document.getElementById('status');
const loginForm = document.getElementById('login-form');
const userInfo = document.getElementById('user-info');
const userEmailEl = document.getElementById('user-email');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const enableBubble = document.getElementById('enable-bubble');
const resetPositionBtn = document.getElementById('reset-position');

// Show status message
function showStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
    
    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 5000);
}

// Check if user is logged in
async function checkAuth() {
    try {
        const result = await chrome.storage.local.get(['nexa_token', 'nexa_user']);
        const token = result.nexa_token;
        const user = result.nexa_user;
        
        if (token && user) {
            // Verify token is still valid
            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    displayUserInfo(userData);
                    return true;
                } else {
                    // Token invalid, clear it
                    await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
                    showLoginForm();
                    return false;
                }
            } catch (error) {
                console.error('Auth check error:', error);
                // Keep user info if network error
                if (user) {
                    displayUserInfo(user);
                    return true;
                }
                return false;
            }
        } else {
            showLoginForm();
            return false;
        }
    } catch (error) {
        console.error('Check auth error:', error);
        showLoginForm();
        return false;
    }
}

// Display user info
function displayUserInfo(user) {
    userEmailEl.textContent = user.email || user.username || 'User';
    userInfo.classList.remove('hidden');
    loginForm.classList.add('hidden');
}

// Show login form
function showLoginForm() {
    userInfo.classList.add('hidden');
    loginForm.classList.remove('hidden');
}

// Handle login
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showStatus('Please enter both email and password', 'error');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            // Save token and user info
            await chrome.storage.local.set({
                nexa_token: data.token,
                nexa_user: data.user || { email }
            });
            
            showStatus('Login successful!', 'success');
            displayUserInfo(data.user || { email });
            emailInput.value = '';
            passwordInput.value = '';
        } else {
            showStatus(data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showStatus('Network error. Please try again.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

// Handle logout
logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
    showStatus('Logged out successfully', 'success');
    showLoginForm();
});

// Handle Enter key in password field
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// Load bubble enable state
chrome.storage.local.get(['nexa.bubble.enabled'], (result) => {
    enableBubble.checked = result['nexa.bubble.enabled'] !== false;
});

// Save bubble enable state
enableBubble.addEventListener('change', (e) => {
    chrome.storage.local.set({ 'nexa.bubble.enabled': e.target.checked });
    showStatus('Bubble setting saved', 'success');
});

// Reset bubble position
resetPositionBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove(['nexa.bubble.pos']);
    showStatus('Bubble position reset. Reload pages to see changes.', 'success');
});

// Initialize
checkAuth();


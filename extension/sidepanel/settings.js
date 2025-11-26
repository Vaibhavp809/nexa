// Settings Side Panel Script
const API_BASE = 'https://nexa-yp12.onrender.com/api';
const BACKEND_BASE = 'https://nexa-yp12.onrender.com';
const LOGIN_URL = 'https://nexa-nu-three.vercel.app/';
// const API_BASE = 'http://localhost:4000/api'; // Uncomment for local dev
// const BACKEND_BASE = 'http://localhost:4000'; // Uncomment for local dev

// DOM Elements
const loginForm = document.getElementById('login-form');
const settingsContent = document.getElementById('settings-content');
const bubbleEnabled = document.getElementById('bubble-enabled');
const languageSelect = document.getElementById('language-select');
const iconGrid = document.getElementById('icon-grid');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginError = document.getElementById('login-error');
const saveLanguageBtn = document.getElementById('save-language-btn');

let currentLanguage = 'en';
let currentUser = null;
let isUpdating = false;
let languageChanged = false;

// Initialize
checkAuth();

// Check authentication
async function checkAuth() {
    try {
        const result = await chrome.storage.local.get(['nexa_token', 'nexa_user', 'nexa.preferredLanguage']);
        const token = result.nexa_token;
        const user = result.nexa_user;
        const savedLanguage = result['nexa.preferredLanguage'] || 'en';
        
        currentLanguage = savedLanguage;
        languageSelect.value = savedLanguage;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        // Verify token and fetch user profile
        try {
            const response = await fetch(`${API_BASE}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user || user;
                
                // Update language from backend profile
                if (currentUser.preferredLanguage && currentUser.preferredLanguage !== currentLanguage) {
                    currentLanguage = currentUser.preferredLanguage;
                    languageSelect.value = currentLanguage;
                    await chrome.storage.local.set({ 'nexa.preferredLanguage': currentLanguage });
                }
                
                showSettingsContent();
                await loadSettings();
                await translatePage();
            } else {
                // Token invalid
                await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
                showLoginForm();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // If network error, still show settings if we have user data
            if (user) {
                currentUser = user;
                showSettingsContent();
                await loadSettings();
                await translatePage();
            } else {
                showLoginForm();
            }
        }
    } catch (error) {
        console.error('Check auth error:', error);
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    loginForm.classList.remove('hidden');
    settingsContent.classList.add('hidden');
}

// Show settings content
function showSettingsContent() {
    loginForm.classList.add('hidden');
    settingsContent.classList.remove('hidden');
    
    if (currentUser) {
        userEmail.textContent = currentUser.email || currentUser.username || 'User';
    }
}

// Load settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get([
            'nexa.bubble.enabled',
            'nexa.bubble.icon',
            'nexa.preferredLanguage'
        ]);
        
        // Load bubble enabled state
        const isEnabled = result['nexa.bubble.enabled'] !== false; // Default to true
        bubbleEnabled.checked = isEnabled;
        
        // Load bubble icon
        const bubbleIcon = result['nexa.bubble.icon'] || 'bot';
        updateIconSelection(bubbleIcon);
        
        // Load language (already loaded in checkAuth)
        const lang = result['nexa.preferredLanguage'] || 'en';
        currentLanguage = lang;
        languageSelect.value = lang;
        
        // Initialize save button state
        saveLanguageBtn.disabled = true;
        saveLanguageBtn.style.opacity = '0.5';
        languageChanged = false;
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Update icon selection UI
function updateIconSelection(selectedIcon) {
    const iconOptions = iconGrid.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        const icon = option.getAttribute('data-icon');
        if (icon === selectedIcon) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Translate page elements
async function translatePage() {
    const elements = document.querySelectorAll('[data-translate]');
    
    for (const element of elements) {
        const key = element.getAttribute('data-translate');
        if (key) {
            try {
                // Use local translations for fast UI updates
                const translated = getTranslation(currentLanguage, key);
                element.textContent = translated;
            } catch (error) {
                console.error('Translation error for key:', key, error);
            }
        }
    }
}

// Sync language preference with backend
async function syncLanguageToBackend(language) {
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            console.log('No token, skipping backend sync');
            return;
        }
        
        // Update backend profile
        const response = await fetch(`${BACKEND_BASE}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                preferredLanguage: language
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                currentUser = data.user;
                await chrome.storage.local.set({ nexa_user: data.user });
            }
            console.log('Language preference synced to backend');
        } else {
            console.warn('Failed to sync language to backend:', response.status);
        }
    } catch (error) {
        console.error('Error syncing language to backend:', error);
        // Don't block UI if backend sync fails
    }
}

// Event Listeners

// Bubble enabled toggle
bubbleEnabled.addEventListener('change', async (e) => {
    if (isUpdating) return;
    
    isUpdating = true;
    const enabled = e.target.checked;
    
    await chrome.storage.local.set({ 'nexa.bubble.enabled': enabled });
    
    // Notify content script about bubble state change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'bubble_enabled_changed',
                enabled: enabled
            }).catch(() => {
                // Content script might not be ready
            });
        }
    });
    
    isUpdating = false;
});

// Language selection - mark as changed
languageSelect.addEventListener('change', (e) => {
    languageChanged = true;
    saveLanguageBtn.disabled = false;
    saveLanguageBtn.style.opacity = '1';
});

// Save language button
saveLanguageBtn.addEventListener('click', async () => {
    if (isUpdating || !languageChanged) return;
    
    isUpdating = true;
    saveLanguageBtn.disabled = true;
    saveLanguageBtn.textContent = 'Saving...';
    
    const newLanguage = languageSelect.value;
    
    try {
        // Save to storage
        await chrome.storage.local.set({ 'nexa.preferredLanguage': newLanguage });
        currentLanguage = newLanguage;
        
        // Sync with backend
        await syncLanguageToBackend(newLanguage);
        
        // Translate page
        await translatePage();
        
        // Broadcast language change to other side panels
        chrome.runtime.sendMessage({
            type: 'language_changed',
            language: newLanguage
        }).catch(() => {
            // Ignore errors
        });
        
        // Show success
        saveLanguageBtn.textContent = 'Saved!';
        saveLanguageBtn.style.background = 'linear-gradient(to right, #22c55e, #16a34a)';
        languageChanged = false;
        
        // Reset button after 2 seconds
        setTimeout(() => {
            saveLanguageBtn.textContent = 'Save Language';
            saveLanguageBtn.style.background = 'linear-gradient(to right, #00b3ff, #9b5cff)';
            saveLanguageBtn.disabled = true;
            saveLanguageBtn.style.opacity = '0.5';
        }, 2000);
        
    } catch (error) {
        console.error('Error saving language:', error);
        saveLanguageBtn.textContent = 'Error - Try Again';
        setTimeout(() => {
            saveLanguageBtn.textContent = 'Save Language';
            saveLanguageBtn.disabled = false;
        }, 2000);
    } finally {
        isUpdating = false;
    }
});

// Icon selection
iconGrid.addEventListener('click', async (e) => {
    const iconOption = e.target.closest('.icon-option');
    if (!iconOption) return;
    
    const icon = iconOption.getAttribute('data-icon');
    if (!icon) return;
    
    // Update UI
    updateIconSelection(icon);
    
    // Save to storage
    await chrome.storage.local.set({ 'nexa.bubble.icon': icon });
    
    // Notify content script about icon change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'bubble_icon_changed',
                icon: icon
            }).catch(() => {
                // Content script might not be ready
            });
        }
    });
});

// Logout
logoutBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        // Clear storage
        await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
        
        // Show login form
        showLoginForm();
        
        // Clear user info
        currentUser = null;
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
    }
});

// Login form handlers
loginSubmitBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Logging in...';
    hideError();
    
    try {
        const response = await fetch(`${BACKEND_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Store token and user data
        await chrome.storage.local.set({
            nexa_token: data.token,
            nexa_user: data.user || { email }
        });
        
        currentUser = data.user || { email };
        
        // Fetch user profile to get preferred language
        if (data.user && data.user.preferredLanguage) {
            currentLanguage = data.user.preferredLanguage;
            languageSelect.value = currentLanguage;
            await chrome.storage.local.set({ 'nexa.preferredLanguage': currentLanguage });
        }
        
        // Show settings content
        showSettingsContent();
        await loadSettings();
        await translatePage();
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Login';
    }
});

// Allow Enter key to submit login form
loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginSubmitBtn.click();
    }
});

loginEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginPassword.focus();
    }
});

// Helper functions
function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function hideError() {
    loginError.classList.add('hidden');
}

// Listen for language changes from other panels
chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === 'language_changed') {
        currentLanguage = message.language;
        languageSelect.value = message.language;
        clearTranslationCache();
        translatePage();
    }
});


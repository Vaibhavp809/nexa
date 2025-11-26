// Side panel chat script
const API_BASE = 'https://nexa-yp12.onrender.com/api';
const LOGIN_URL = 'https://nexa-nu-three.vercel.app/';
// const API_BASE = 'http://localhost:4000/api'; // Uncomment for local dev

let currentMode = 'chat';
let history = [];

const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const loginForm = document.getElementById('login-form');
const chatContent = document.getElementById('chat-content');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginError = document.getElementById('login-error');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const headerContent = document.getElementById('header-content');

// Initialize
checkAuth();

// Mode selection
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        inputEl.placeholder = currentMode === 'summarize' 
            ? 'Paste text to summarize...'
            : 'Type your message...';
    });
});

// Check authentication
async function checkAuth() {
    try {
        const result = await chrome.storage.local.get(['nexa_token', 'nexa_user']);
        const token = result.nexa_token;
        const user = result.nexa_user;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        // Verify token is still valid
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                showChatContent(userData.user || user || {});
                loadHistory();
            } else {
                // Token invalid
                await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
                showLoginForm();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // If network error, still show chat if we have user data
            if (user) {
                showChatContent(user);
                loadHistory();
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
    chatContent.classList.add('hidden');
    headerContent.style.display = 'none';
    userInfo.classList.add('hidden');
}

// Show chat content
function showChatContent(user) {
    loginForm.classList.add('hidden');
    chatContent.classList.remove('hidden');
    headerContent.style.display = 'block';
    if (user && user.email) {
        userEmail.textContent = user.email;
        userInfo.classList.remove('hidden');
        headerContent.style.display = 'none';
    } else {
        userInfo.classList.add('hidden');
        headerContent.style.display = 'block';
    }
    inputEl.disabled = false;
    sendBtn.disabled = !inputEl.value.trim();
}

// Handle login
loginSubmitBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Logging in...';
    loginError.classList.add('hidden');
    
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
            // Save token and verify it's saved
            await chrome.storage.local.set({
                nexa_token: data.token,
                nexa_user: data.user || { email }
            });
            
            // Verify token was saved
            const verify = await chrome.storage.local.get(['nexa_token']);
            console.log('Token saved successfully:', !!verify.nexa_token);
            
            // Also notify service worker
            try {
                chrome.runtime.sendMessage({
                    type: 'set_token',
                    token: data.token,
                    user: data.user || { email }
                }, (response) => {
                    console.log('Token set in service worker:', response);
                });
            } catch (e) {
                console.warn('Could not notify service worker:', e);
            }
            
            // Wait a bit and verify token is accessible
            setTimeout(async () => {
                const check = await chrome.storage.local.get(['nexa_token']);
                console.log('Token verification after save:', {
                    exists: !!check.nexa_token,
                    length: check.nexa_token ? check.nexa_token.length : 0
                });
            }, 500);
            
            showChatContent(data.user || { email });
            loginEmail.value = '';
            loginPassword.value = '';
        } else {
            showError(data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
    } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Login';
    }
});

// Handle logout
logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove(['nexa_token', 'nexa_user', 'nexa.chat.history']);
    history = [];
    showLoginForm();
});

// Show error message
function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

// Handle Enter key in password field
loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginSubmitBtn.click();
    }
});

// Load chat history
async function loadHistory() {
    const result = await chrome.storage.local.get(['nexa.chat.history']);
    if (result['nexa.chat.history']) {
        history = result['nexa.chat.history'];
        renderMessages();
    }
}

// Save chat history
async function saveHistory() {
    await chrome.storage.local.set({ 'nexa.chat.history': history });
}

// Render messages
function renderMessages() {
    if (history.length === 0) {
        messagesEl.innerHTML = `
            <div class="empty-state">
                <p>Start a conversation or paste text to summarize</p>
            </div>
        `;
        return;
    }
    
    messagesEl.innerHTML = history.map(item => {
        const isUser = item.role === 'user';
        return `
            <div class="message ${isUser ? 'user' : 'ai'}">
                ${escapeHtml(item.content)}
            </div>
        `;
    }).join('');
    
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// Send message
async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    
    const result = await chrome.storage.local.get(['nexa_token']);
    if (!result.nexa_token) {
        showAuthPrompt();
        return;
    }
    
    // Clear empty state
    messagesEl.innerHTML = '';
    
    // Add user message
    const userMessage = { role: 'user', content: text, mode: currentMode };
    history.push(userMessage);
    renderMessages();
    inputEl.value = '';
    sendBtn.disabled = true;
    
    // Show loading
    const loadingMsg = { role: 'ai', content: '...', loading: true };
    history.push(loadingMsg);
    renderMessages();
    
    try {
        // Prepare prompt based on mode
        const prompt = currentMode === 'summarize'
            ? `Summarize the following text in a clear and concise format. Provide key points and main ideas:\n\n${text}`
            : text;
        
        // Make API call via service worker
        const response = await chrome.runtime.sendMessage({
            type: 'fetch_groq',
            prompt: prompt
        });
        
        // Remove loading message
        history.pop();
        
        if (response.ok && response.data) {
            let content = response.data.data || response.data.message || response.data;
            if (typeof content !== 'string') {
                content = JSON.stringify(content);
            }
            
            history.push({ role: 'ai', content, mode: currentMode });
        } else if (response.needsAuth) {
            history.pop(); // Remove loading
            history.push({ role: 'ai', content: 'Please log in to use this feature. Open extension settings to login.' });
        } else {
            history.pop(); // Remove loading
            history.push({ role: 'ai', content: response.error || 'Failed to get response. Please try again.' });
        }
        
        // Keep only last 50 messages
        if (history.length > 50) {
            history = history.slice(-50);
        }
        
        renderMessages();
        saveHistory();
    } catch (error) {
        console.error('Send message error:', error);
        history.pop(); // Remove loading
        history.push({ role: 'ai', content: 'An error occurred. Please try again.' });
        renderMessages();
    } finally {
        sendBtn.disabled = false;
    }
}

// Send button click
sendBtn.addEventListener('click', sendMessage);

// Enter key to send (Shift+Enter for new line)
inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    sendBtn.disabled = !inputEl.value.trim();
});


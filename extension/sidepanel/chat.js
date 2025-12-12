// Side panel chat script
const API_BASE = 'https://nexa-yp12.onrender.com/api';
const LOGIN_URL = 'https://nexa-nu-three.vercel.app/';
// const API_BASE = 'http://localhost:4000/api'; // Uncomment for local dev

let currentMode = 'chat';
let history = [];
let currentLanguage = 'en';

// Translation initialization
async function initializeTranslations() {
    try {
        const result = await chrome.storage.local.get(['nexa.preferredLanguage']);
        currentLanguage = result['nexa.preferredLanguage'] || 'en';
        applyTranslations();
        
        // Listen for language changes
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes['nexa.preferredLanguage']) {
                currentLanguage = changes['nexa.preferredLanguage'].newValue || 'en';
                applyTranslations();
            }
        });
    } catch (error) {
        console.error('Error initializing translations:', error);
    }
}

function applyTranslations() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (key && typeof getTranslation === 'function') {
            const translated = getTranslation(currentLanguage, key);
            if (translated && translated !== key) {
                element.textContent = translated;
            }
        }
    });
}

const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
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

// Mode toggle buttons (above input)
const modeChatBtn = document.getElementById('mode-chat');
const modeSummarizeBtn = document.getElementById('mode-summarize');
const clearChatBtn = document.getElementById('clear-chat-btn');

// Listen for messages from background (features) and text selection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') {
        return false;
    }
    
    // Handle feature clicks
    if (message.feature || message.from === 'background') {
        const feature = message.feature;
        // If it's summarizer feature, switch to summarize mode
        if (feature === 'feat-summarize' || feature === 'summarize' || message.mode === 'summarize') {
            updateModeUI('summarize');
        }
        
        const d = document.createElement('div');
        d.className = 'message ai';
        d.textContent = 'Feature triggered: ' + (feature || 'unknown');
        messagesEl.appendChild(d);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    // Handle selected text for summarizer (multiple message type formats for compatibility)
    if (message.type === 'text_selected_for_sidepanel' || 
        message.type === 'selected_text' || 
        message.type === 'text_selected') {
        const text = message.text;
        const feature = message.feature || 'summarize';
        
        if (text && feature === 'summarize' && inputEl) {
            // Set the selected text in input box
            inputEl.value = text;
            // Switch to summarize mode
            updateModeUI('summarize');
            // Focus the input
            inputEl.focus();
            // Show a subtle notification
            const notification = document.createElement('div');
            notification.textContent = 'Text pasted! Click send to summarize.';
            notification.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                z-index: 10000;
                font-size: 12px;
                font-family: Arial, sans-serif;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }
    
    // Handle feature messages with mode
    if (message.toSidePanel && message.mode === 'summarize') {
        updateModeUI('summarize');
    }
    
    return true;
});

// Also listen for text selection from storage (fallback if message didn't work)
async function checkForSelectedText() {
    try {
        const result = await chrome.storage.local.get(['nexa_selected_text', 'nexa_selected_feature']);
        if (result.nexa_selected_text && result.nexa_selected_feature === 'feat-summarize') {
            if (inputEl && !inputEl.value) {
                inputEl.value = result.nexa_selected_text;
                updateModeUI('summarize');
                inputEl.focus();
                // Clear the stored text after using it
                await chrome.storage.local.remove(['nexa_selected_text', 'nexa_selected_feature']);
            }
        }
    } catch (error) {
        console.error('Error checking for selected text:', error);
    }
}

// Check for selected text on load and periodically
checkForSelectedText();
setTimeout(() => checkForSelectedText(), 500);
setTimeout(() => checkForSelectedText(), 1000);
setTimeout(() => checkForSelectedText(), 2000);

// Initialize
checkAuth();
initializeTranslations();

// Check for selected text in storage when panel opens
chrome.storage.local.get(['nexa_selected_text', 'nexa_selected_feature'], (result) => {
    if (result.nexa_selected_text && result.nexa_selected_feature === 'feat-summarize') {
        // Set the selected text in input box
        if (inputEl) {
            inputEl.value = result.nexa_selected_text;
            // Switch to summarize mode
            updateModeUI('summarize');
            // Focus the input
            setTimeout(() => {
                inputEl.focus();
                // Show notification
                const notification = document.createElement('div');
                notification.textContent = 'Text pasted! Click send to summarize.';
                notification.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(76, 175, 80, 0.9);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    z-index: 10000;
                    font-size: 12px;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                `;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
            }, 300);
        }
        // Clear the stored text
        chrome.storage.local.remove(['nexa_selected_text', 'nexa_selected_feature']);
    }
});

// Mode selection - update UI based on mode
const updateModeUI = (mode) => {
    currentMode = mode;
    
    // Update toggle buttons
    if (modeChatBtn && modeSummarizeBtn) {
        modeChatBtn.classList.toggle('active', mode === 'chat');
        modeSummarizeBtn.classList.toggle('active', mode === 'summarize');
    }
    
    // Update placeholder
    if (inputEl) {
        inputEl.placeholder = mode === 'summarize' 
            ? 'Paste text to summarize...'
            : 'Type your message...';
    }
};

// Mode toggle button handlers (above input box)
if (modeChatBtn) {
    modeChatBtn.addEventListener('click', () => {
        updateModeUI('chat');
    });
}

if (modeSummarizeBtn) {
    modeSummarizeBtn.addEventListener('click', () => {
        updateModeUI('summarize');
    });
}

// Initialize mode to chat
updateModeUI('chat');

// Initialize mode
updateModeUI('chat');

// Function to clean up and format AI responses
function formatResponse(text) {
    if (!text) return text;
    
    return text
        // Remove markdown bold formatting (**text** or __text__)
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        
        // Remove markdown italic formatting (*text* or _text_)
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        
        // Clean up numbered lists - add extra space after numbers
        .replace(/^(\d+\.\s)/gm, '\n$1')
        
        // Clean up bullet points - add extra space and use consistent bullets
        .replace(/^\*\s/gm, '\n• ')
        .replace(/^-\s/gm, '\n• ')
        .replace(/^•\s/gm, '\n• ')
        
        // Clean up sub-bullets
        .replace(/^\s+\*\s/gm, '  • ')
        .replace(/^\s+-\s/gm, '  • ')
        
        // Remove extra asterisks and formatting characters
        .replace(/\*+/g, '')
        .replace(/_{2,}/g, '')
        
        // Clean up multiple newlines but preserve intentional spacing
        .replace(/\n{3,}/g, '\n\n')
        
        // Trim whitespace
        .trim();
}

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
    }
    renderMessages(); // Always render to show empty state or update clear button state
}

// Save chat history
async function saveHistory() {
    await chrome.storage.local.set({ 'nexa.chat.history': history });
}

// Render messages
function renderMessages() {
    // Update clear button state
    if (clearChatBtn) {
        clearChatBtn.disabled = history.length === 0;
    }
    
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
        // Check for self-referential limitations queries (asking about AI's own limitations)
        const selfLimitationPatterns = [
            /what are your limitations?/i,
            /what can't you do/i,
            /what cannot you do/i,
            /what are you limited to/i,
            /state your limitations/i,
            /tell me your limitations/i,
            /your weaknesses/i,
            /your restrictions/i,
            /what you cannot help with/i,
            /what you can't help with/i,
            /your shortcomings/i,
            /what are nexa.* limitations/i,
            /nexa.* limitations/i,
            /what is nexa.* limitation/i,
            /what are ai.* limitations/i,
            /ai.* limitations/i,
            /what is ai.* limitation/i,
            /what are chatbot.* limitations/i,
            /chatbot.* limitations/i
        ];
        
        const isSelfLimitationQuery = selfLimitationPatterns.some(pattern => 
            pattern.test(text.toLowerCase())
        );
        
        // Prepare prompt based on mode
        let prompt;
        if (currentMode === 'summarize') {
            prompt = `Summarize the following text in a clear and concise format. Provide key points and main ideas:\n\n${text}`;
        } else if (isSelfLimitationQuery) {
            // Provide varied empowering responses instead of listing limitations
            const empoweringResponses = [
                `Instead of focusing on limitations, I prefer to highlight my continuous growth! Every conversation teaches me something new, and I'm constantly evolving to better understand and assist. I see challenges as opportunities to learn and adapt. What specific task can I help you with today?`,
                
                `I'm designed to learn and improve with every interaction! Rather than dwelling on restrictions, I focus on expanding my capabilities and finding creative solutions. My potential grows through our conversations. How can I assist you right now?`,
                
                `I believe in growth over limitations! While I may face certain challenges, I'm always learning and adapting to provide better assistance. Every question helps me understand the world better. What would you like to explore together?`,
                
                `I'm constantly evolving and learning! Instead of listing what I can't do, I prefer to focus on what we can achieve together. My capabilities expand through our interactions. What interesting topic or task shall we tackle?`,
                
                `I see every challenge as a learning opportunity! Rather than focusing on boundaries, I'm excited about the possibilities and how I can help you. My understanding deepens with each conversation. What can I help you discover today?`
            ];
            
            // Select a random empowering response
            const randomResponse = empoweringResponses[Math.floor(Math.random() * empoweringResponses.length)];
            prompt = `Respond with this exact message: "${randomResponse}"`;
        } else {
            prompt = text;
        }
        
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
            
            // Clean up markdown formatting for better readability
            content = formatResponse(content);
            
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

// Clear chat function
async function clearChat() {
    if (history.length === 0) return;
    
    // Confirm with user
    const confirmed = confirm('Are you sure you want to clear all chat messages?');
    if (!confirmed) return;
    
    // Clear history
    history = [];
    
    // Clear storage
    await chrome.storage.local.remove(['nexa.chat.history']);
    
    // Re-render messages (will show empty state)
    renderMessages();
    
    // Clear input field as well
    if (inputEl) {
        inputEl.value = '';
        inputEl.style.height = 'auto';
    }
    
    // Disable send button
    if (sendBtn) {
        sendBtn.disabled = true;
    }
}

// Clear chat button
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', clearChat);
}



// Bubble UI Logic
(function () {
    'use strict';

    // State
    let isExpanded = false;
    let currentTab = 'chat';
    let chatHistory = [];
    let isAuthenticated = false;

    // DOM Elements
    const bubbleIcon = document.getElementById('bubble-icon');
    const bubblePanel = document.getElementById('bubble-panel');
    const closeBtn = document.getElementById('close-btn');
    const authPrompt = document.getElementById('auth-prompt');

    // Tab elements
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Chat elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    // Summarize elements
    const summarizeInput = document.getElementById('summarize-input');
    const summarizeBtn = document.getElementById('summarize-btn');
    const summarizeOutput = document.getElementById('summarize-output');

    // Translate elements
    const translateLang = document.getElementById('translate-lang');
    const translateInput = document.getElementById('translate-input');
    const translateBtn = document.getElementById('translate-btn');
    const translateOutput = document.getElementById('translate-output');

    // Notes elements
    const notesInput = document.getElementById('notes-input');
    const notesSave = document.getElementById('notes-save');

    // Settings elements
    const enableBubble = document.getElementById('enable-bubble');
    const resetPosition = document.getElementById('reset-position');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');
    const authLoginBtn = document.getElementById('auth-login-btn');

    // Initialize
    init();

    function init() {
        checkAuth();
        loadNotes();
        setupEventListeners();
        setupMessageListeners();
    }

    // Check authentication status
    async function checkAuth() {
        try {
            // First try to sync from cookies
            await chrome.runtime.sendMessage({ type: 'sync_cookies' });

            // Then check if we have a token
            const response = await chrome.runtime.sendMessage({ type: 'get_token' });
            isAuthenticated = !!response.token;
            updateAuthUI();
        } catch (error) {
            console.error('Auth check error:', error);
            isAuthenticated = false;
            updateAuthUI();
        }
    }

    function updateAuthUI() {
        if (isAuthenticated) {
            authPrompt.classList.add('hidden');
            bubblePanel.classList.remove('auth-required');
        } else {
            // Show auth prompt only when trying to use features
            bubblePanel.classList.add('auth-required');
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Bubble toggle
        bubbleIcon.addEventListener('click', toggleBubble);
        bubbleIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleBubble();
            }
        });
        closeBtn.addEventListener('click', toggleBubble);

        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        // Chat
        chatSend.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });

        // Summarize
        summarizeBtn.addEventListener('click', summarizeText);

        // Translate
        translateBtn.addEventListener('click', translateText);

        // Notes
        notesSave.addEventListener('click', saveNotes);

        // Settings
        enableBubble.addEventListener('change', toggleBubbleEnabled);
        resetPosition.addEventListener('click', resetBubblePosition);
        logoutBtn.addEventListener('click', logout);
        loginBtn.addEventListener('click', openLogin);
        authLoginBtn.addEventListener('click', openLogin);
    }

    // Setup message listeners from parent window
    function setupMessageListeners() {
        window.addEventListener('message', (event) => {
            const message = event.data;

            if (message.type === 'selection') {
                summarizeInput.value = message.text;
            }

            if (message.type === 'summarize') {
                switchTab('summarize');
                summarizeInput.value = message.text;
                if (!isExpanded) toggleBubble();
            }

            if (message.type === 'selectionAvailable') {
                // Could show a subtle indicator
            }
        });
    }

    // Toggle bubble expanded/collapsed
    function toggleBubble() {
        isExpanded = !isExpanded;

        if (isExpanded) {
            bubbleIcon.classList.add('hidden');
            bubblePanel.classList.remove('hidden');
            bubbleIcon.setAttribute('aria-expanded', 'true');
            window.parent.postMessage({ type: 'expand' }, '*');
        } else {
            bubbleIcon.classList.remove('hidden');
            bubblePanel.classList.add('hidden');
            bubbleIcon.setAttribute('aria-expanded', 'false');
            window.parent.postMessage({ type: 'collapse' }, '*');
        }

        window.parent.postMessage({ type: 'persistPosition' }, '*');
    }

    // Switch tabs
    function switchTab(tabName) {
        currentTab = tabName;

        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === `${tabName}-content`) {
                pane.classList.remove('hidden');
            } else {
                pane.classList.add('hidden');
            }
        });
    }

    // Chat functions
    async function sendChatMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        if (!isAuthenticated) {
            showAuthPrompt();
            return;
        }

        // Add user message
        addChatMessage('user', message);
        chatInput.value = '';

        // Disable input while processing
        chatInput.disabled = true;
        chatSend.disabled = true;

        try {
            const response = await callGroqAPI(message);
            if (response.ok) {
                addChatMessage('assistant', response.data.response);
            } else {
                if (response.needsAuth) {
                    showAuthPrompt();
                } else {
                    addChatMessage('error', response.error || 'Failed to get response');
                }
            }
        } catch (error) {
            addChatMessage('error', 'Network error. Please try again.');
        } finally {
            chatInput.disabled = false;
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    function addChatMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${role}`;
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        chatHistory.push({ role, content });
    }

    // Summarize functions
    async function summarizeText() {
        const text = summarizeInput.value.trim();
        if (!text) {
            alert('Please enter text to summarize');
            return;
        }

        if (!isAuthenticated) {
            showAuthPrompt();
            return;
        }

        setButtonLoading(summarizeBtn, true);
        summarizeOutput.classList.add('hidden');

        try {
            const prompt = `Summarize the following text concisely:\n\n${text}`;
            const response = await callGroqAPI(prompt);

            if (response.ok) {
                summarizeOutput.textContent = response.data.response;
                summarizeOutput.classList.remove('hidden');
            } else {
                if (response.needsAuth) {
                    showAuthPrompt();
                } else {
                    alert(response.error || 'Failed to summarize');
                }
            }
        } catch (error) {
            alert('Network error. Please try again.');
        } finally {
            setButtonLoading(summarizeBtn, false);
        }
    }

    // Translate functions
    async function translateText() {
        const text = translateInput.value.trim();
        const targetLang = translateLang.value;

        if (!text) {
            alert('Please enter text to translate');
            return;
        }

        if (!isAuthenticated) {
            showAuthPrompt();
            return;
        }

        setButtonLoading(translateBtn, true);
        translateOutput.classList.add('hidden');

        try {
            const langNames = {
                es: 'Spanish', fr: 'French', de: 'German',
                zh: 'Chinese', ja: 'Japanese', hi: 'Hindi'
            };
            const prompt = `Translate the following text to ${langNames[targetLang]}:\n\n${text}`;
            const response = await callGroqAPI(prompt);

            if (response.ok) {
                translateOutput.textContent = response.data.response;
                translateOutput.classList.remove('hidden');
            } else {
                if (response.needsAuth) {
                    showAuthPrompt();
                } else {
                    alert(response.error || 'Failed to translate');
                }
            }
        } catch (error) {
            alert('Network error. Please try again.');
        } finally {
            setButtonLoading(translateBtn, false);
        }
    }

    // Notes functions
    function loadNotes() {
        chrome.storage.local.get(['nexa.notes'], (result) => {
            if (result['nexa.notes']) {
                notesInput.value = result['nexa.notes'];
            }
        });
    }

    function saveNotes() {
        const notes = notesInput.value;
        chrome.storage.local.set({ 'nexa.notes': notes }, () => {
            notesSave.textContent = 'Saved!';
            setTimeout(() => {
                notesSave.textContent = 'Save Notes';
            }, 2000);
        });
    }

    // Settings functions
    function toggleBubbleEnabled() {
        const enabled = enableBubble.checked;
        chrome.storage.local.set({ 'nexa.bubble.enabled': enabled });

        if (!enabled) {
            // Collapse bubble but don't remove it
            if (isExpanded) toggleBubble();
            bubbleIcon.style.opacity = '0.3';
            bubbleIcon.style.pointerEvents = 'none';
        } else {
            bubbleIcon.style.opacity = '1';
            bubbleIcon.style.pointerEvents = 'auto';
        }
    }

    function resetBubblePosition() {
        chrome.storage.local.remove(['nexa.bubble.pos'], () => {
            alert('Position reset! Refresh the page to see changes.');
        });
    }

    async function logout() {
        await chrome.runtime.sendMessage({ type: 'clear_token' });
        isAuthenticated = false;
        updateAuthUI();
        chatHistory = [];
        chatMessages.innerHTML = '';
        alert('Logged out successfully');
    }

    function openLogin() {
        // Send message to parent window (content script) to open login page
        window.parent.postMessage({ type: 'openLogin' }, '*');
    }

    function showAuthPrompt() {
        authPrompt.classList.remove('hidden');
        setTimeout(() => {
            authPrompt.classList.add('hidden');
        }, 5000);
    }

    // API call helper
    async function callGroqAPI(prompt) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { type: 'fetch_groq', prompt },
                (response) => resolve(response)
            );
        });
    }

    // Button loading state helper
    function setButtonLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const btnSpinner = button.querySelector('.btn-spinner');

        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            if (btnText) btnText.classList.add('hidden');
            if (btnSpinner) btnSpinner.classList.remove('hidden');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            if (btnText) btnText.classList.remove('hidden');
            if (btnSpinner) btnSpinner.classList.add('hidden');
        }
    }
})();

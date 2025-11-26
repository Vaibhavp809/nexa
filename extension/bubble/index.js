// Bubble UI Logic
(function () {
    'use strict';

    // Helper to check if extension context is valid
    function hasExtensionAccess() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    }

    // Helper to send messages to extension via content script
    function sendToExtension(message, callback) {
        if (hasExtensionAccess()) {
            try {
                chrome.runtime.sendMessage(message, callback || (() => {}));
            } catch (e) {
                // Fallback to postMessage
                window.parent.postMessage({
                    type: 'extensionMessage',
                    payload: message
                }, '*');
            }
        } else {
            // Use postMessage to content script
            window.parent.postMessage({
                type: 'extensionMessage',
                payload: message
            }, '*');
            
            // Listen for response
            if (callback) {
                const listener = (e) => {
                    // Check if this is a response for our message
                    if (e.data.type === 'extensionResponse') {
                        // Match by ID or accept if no ID specified (backward compatibility)
                        if (e.data.id === messageId || (!e.data.id && !messageId)) {
                            window.removeEventListener('message', listener);
                            console.log('Bubble received extension response:', e.data);
                            if (e.data.error) {
                                callback({ ok: false, error: e.data.error });
                            } else {
                                callback(e.data.response || e.data || { ok: false, error: 'No response data' });
                            }
                        }
                    }
                };
                window.addEventListener('message', listener);
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    callback({ ok: false, error: 'Request timeout' });
                }, 30000);
            }
        }
    }

    // Helper for storage operations
    function storageGet(keys, callback) {
        if (hasExtensionAccess()) {
            chrome.storage.local.get(keys, callback);
        } else {
            window.parent.postMessage({
                type: 'storageGet',
                keys: keys
            }, '*');
            
            if (callback) {
                const listener = (e) => {
                    if (e.data.type === 'storageResult' && e.data.data) {
                        window.removeEventListener('message', listener);
                        callback(e.data.data);
                    }
                };
                window.addEventListener('message', listener);
            }
        }
    }

    function storageSet(data, callback) {
        if (hasExtensionAccess()) {
            chrome.storage.local.set(data, callback || (() => {}));
        } else {
            window.parent.postMessage({
                type: 'storageSet',
                data: data
            }, '*');
            
            if (callback) {
                const listener = (e) => {
                    if (e.data.type === 'storageResult' && e.data.success) {
                        window.removeEventListener('message', listener);
                        callback();
                    }
                };
                window.addEventListener('message', listener);
            }
        }
    }

    function storageRemove(keys, callback) {
        if (hasExtensionAccess()) {
            chrome.storage.local.remove(keys, callback || (() => {}));
        } else {
            window.parent.postMessage({
                type: 'storageRemove',
                keys: keys
            }, '*');
            
            if (callback) {
                const listener = (e) => {
                    if (e.data.type === 'storageResult' && e.data.success) {
                        window.removeEventListener('message', listener);
                        callback();
                    }
                };
                window.addEventListener('message', listener);
            }
        }
    }

    // State
    let isExpanded = false;
    let currentTab = 'chat';
    let chatHistory = [];

    // DOM Elements
    const bubbleIcon = document.getElementById('bubble-icon');
    const featurePanel = document.getElementById('feature-panel');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const featureMenu = document.getElementById('feature-menu');
    const panelContent = document.getElementById('panel-content');

    // Old elements (may not exist - check before using)
    const bubblePanel = document.getElementById('bubble-panel');
    const closeBtn = document.getElementById('close-btn');
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const summarizeInput = document.getElementById('summarize-input');
    const summarizeBtn = document.getElementById('summarize-btn');
    const summarizeOutput = document.getElementById('summarize-output');
    const translateLang = document.getElementById('translate-lang');
    const translateInput = document.getElementById('translate-input');
    const translateBtn = document.getElementById('translate-btn');
    const translateOutput = document.getElementById('translate-output');
    const notesInput = document.getElementById('notes-input');
    const notesSave = document.getElementById('notes-save');
    const enableBubble = document.getElementById('enable-bubble');
    const resetPosition = document.getElementById('reset-position');
    const loginBtn = document.getElementById('login-btn');

    // Initialize
    if (bubbleIcon) {
        init();
    } else {
        console.error('Bubble icon not found!');
    }

    function init() {
        loadNotes();
        setupEventListeners();
        setupMessageListeners();
    }

    // Setup event listeners
    function setupEventListeners() {
        if (!bubbleIcon) {
            console.error('Bubble icon not found');
            return;
        }

        // Bubble toggle - handle clicks
        bubbleIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Bubble icon clicked!');
            toggleBubble();
        });
        bubbleIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleBubble();
            }
        });
        
        // Close button (if exists)
        if (closeBtn) {
            closeBtn.addEventListener('click', toggleBubble);
        }
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', toggleBubble);
        }

        // Tab switching (if tabs exist)
        if (tabs.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.dataset.tab;
                    // If chat tab is clicked, open side panel instead
                    if (tabId === 'chat') {
                        sendToExtension({ type: 'open_side_panel' });
                        // Optionally close the bubble
                        if (isExpanded) toggleBubble();
                    } else {
                        switchTab(tabId);
                    }
                });
            });
        }

        // Chat - redirect to side panel (if elements exist)
        if (chatSend) {
            chatSend.addEventListener('click', () => {
                sendToExtension({ type: 'open_side_panel' });
                if (isExpanded) toggleBubble();
            });
        }
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendToExtension({ type: 'open_side_panel' });
                    if (isExpanded) toggleBubble();
                }
            });
        }

        // Summarize (if button exists)
        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', summarizeText);
        }

        // Translate (if button exists)
        if (translateBtn) {
            translateBtn.addEventListener('click', translateText);
        }

        // Notes (if button exists)
        if (notesSave) {
            notesSave.addEventListener('click', saveNotes);
        }

        // Settings (if elements exist)
        if (enableBubble) {
            enableBubble.addEventListener('change', toggleBubbleEnabled);
        }
        if (resetPosition) {
            resetPosition.addEventListener('click', resetBubblePosition);
        }
        if (loginBtn) {
            loginBtn.addEventListener('click', openLogin);
        }
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
            
            // Handle extension responses
            if (message.type === 'extensionResponse') {
                // Responses are handled by the promises in sendToExtension
                // This is for any global response handling if needed
            }
            
            // Handle storage results
            if (message.type === 'storageResult') {
                // Storage results are handled by the callbacks in storage functions
            }
        });
    }

    // Toggle bubble expanded/collapsed - for now just show/hide menu
    function toggleBubble() {
        if (!bubbleIcon) {
            console.error('Bubble icon not found in toggleBubble');
            return;
        }
        
        console.log('toggleBubble called, isExpanded:', isExpanded);
        
        // For now, expand to show a simple panel or menu
        // This will be replaced with semicircle menu logic later
        if (featurePanel) {
            isExpanded = !isExpanded;
            if (isExpanded) {
                console.log('Expanding bubble panel');
                bubbleIcon.classList.add('hidden');
                featurePanel.classList.remove('hidden');
                if (bubbleIcon) bubbleIcon.setAttribute('aria-expanded', 'true');
                window.parent.postMessage({ type: 'expand' }, '*');
                
                // For now, show a simple message in the panel
                if (panelContent) {
                    panelContent.innerHTML = `
                        <div style="padding: 20px; text-align: center;">
                            <h3 style="margin-bottom: 10px;">Nexa Features</h3>
                            <p style="color: #888; margin-bottom: 20px;">Menu coming soon!</p>
                            <button onclick="window.parent.postMessage({type: 'open_side_panel'}, '*')" 
                                    style="padding: 10px 20px; background: #00b3ff; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                Open Chat
                            </button>
                        </div>
                    `;
                }
            } else {
                console.log('Collapsing bubble panel');
                bubbleIcon.classList.remove('hidden');
                featurePanel.classList.add('hidden');
                if (featureMenu) featureMenu.classList.add('hidden');
                if (bubbleIcon) bubbleIcon.setAttribute('aria-expanded', 'false');
                window.parent.postMessage({ type: 'collapse' }, '*');
            }
        } else {
            console.warn('Feature panel not found');
        }

        window.parent.postMessage({ type: 'persistPosition' }, '*');
    }

    // Switch tabs
    function switchTab(tabName) {
        currentTab = tabName;

        if (tabs.length > 0) {
            tabs.forEach(tab => {
                if (tab.dataset.tab === tabName) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }

        if (tabPanes.length > 0) {
            tabPanes.forEach(pane => {
                if (pane.id === `${tabName}-content`) {
                    pane.classList.remove('hidden');
                } else {
                    pane.classList.add('hidden');
                }
            });
        }
    }

    // Chat functions - Removed, now handled by side panel
    async function sendChatMessage() {
        // Chat is now handled in side panel, this just opens it
        sendToExtension({ type: 'open_side_panel' });
        if (isExpanded) toggleBubble();
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
        if (!summarizeInput) {
            alert('Summarize input not available');
            return;
        }
        const text = summarizeInput.value.trim();
        if (!text) {
            alert('Please enter text to summarize');
            return;
        }

        if (summarizeBtn) setButtonLoading(summarizeBtn, true);
        if (summarizeOutput) summarizeOutput.classList.add('hidden');

        try {
            const prompt = `Summarize the following text concisely:\n\n${text}`;
            const response = await callGroqAPI(prompt);

            if (response && response.ok) {
                // Extract text from response - could be response.data.data or response.data
                let summaryText = '';
                if (response.data) {
                    summaryText = response.data.data || response.data.message || response.data.response || JSON.stringify(response.data);
                    if (typeof summaryText !== 'string') {
                        summaryText = JSON.stringify(summaryText);
                    }
                }
                summarizeOutput.textContent = summaryText || 'No summary generated';
                summarizeOutput.classList.remove('hidden');
            } else {
                if (response.needsAuth) {
                    alert('Please log in to use this feature. Open the side panel to login.');
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
        if (!translateInput || !translateLang) {
            alert('Translate inputs not available');
            return;
        }
        const text = translateInput.value.trim();
        const targetLang = translateLang.value;

        if (!text) {
            alert('Please enter text to translate');
            return;
        }

        if (translateBtn) setButtonLoading(translateBtn, true);
        if (translateOutput) translateOutput.classList.add('hidden');

        try {
            const langNames = {
                es: 'Spanish', fr: 'French', de: 'German',
                zh: 'Chinese', ja: 'Japanese', hi: 'Hindi'
            };
            const prompt = `Translate the following text to ${langNames[targetLang]}:\n\n${text}`;
            const response = await callGroqAPI(prompt);

            if (response && response.ok) {
                // Extract text from response
                let translatedText = '';
                if (response.data) {
                    translatedText = response.data.data || response.data.message || response.data.response || JSON.stringify(response.data);
                    if (typeof translatedText !== 'string') {
                        translatedText = JSON.stringify(translatedText);
                    }
                }
                translateOutput.textContent = translatedText || 'No translation generated';
                translateOutput.classList.remove('hidden');
            } else {
                if (response.needsAuth) {
                    alert('Please log in to use this feature. Open the side panel to login.');
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
        if (!notesInput) return;
        storageGet(['nexa.notes'], (result) => {
            if (result && result['nexa.notes'] && notesInput) {
                notesInput.value = result['nexa.notes'];
            }
        });
    }

    function saveNotes() {
        if (!notesInput || !notesSave) return;
        const notes = notesInput.value;
        storageSet({ 'nexa.notes': notes }, () => {
            if (notesSave) {
                notesSave.textContent = 'Saved!';
                setTimeout(() => {
                    if (notesSave) notesSave.textContent = 'Save Notes';
                }, 2000);
            }
        });
    }

    // Settings functions
    function toggleBubbleEnabled() {
        const enabled = enableBubble.checked;
        storageSet({ 'nexa.bubble.enabled': enabled });

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
        storageRemove(['nexa.bubble.pos'], () => {
            alert('Position reset! Refresh the page to see changes.');
        });
    }

    async function logout() {
        sendToExtension({ type: 'clear_token' }, () => {
            alert('Logged out successfully. Please refresh the page.');
        });
    }

    function openLogin() {
        // Open login in side panel
        sendToExtension({ type: 'open_side_panel' });
    }

    // API call helper
    async function callGroqAPI(prompt) {
        return new Promise((resolve) => {
            sendToExtension({ type: 'fetch_groq', prompt }, (response) => {
                console.log('Bubble received API response:', response);
                if (!response) {
                    resolve({ ok: false, error: 'No response from extension' });
                    return;
                }
                resolve(response);
            });
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

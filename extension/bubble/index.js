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
    let showMenu = false;
    let activeFeature = null;
    let currentTab = 'chat';
    let chatHistory = [];
    
    // Feature definitions
    const FEATURES = [
        { id: 'summarize', label: 'Summarize', color: '#a855f7' },
        { id: 'translate', label: 'Translate', color: '#ec4899' },
        { id: 'quicknotes', label: 'Quick Notes', color: '#22c55e' },
        { id: 'voicenotes', label: 'Voice Notes', color: '#3b82f6' },
        { id: 'voicesearch', label: 'Voice Search', color: '#06b6d4' },
        { id: 'tasks', label: 'Tasks', color: '#f97316' },
        { id: 'settings', label: 'Settings', color: '#eab308' }
    ];

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
            // Only handle click if it wasn't part of a drag
            // The parent container will prevent clicks during drag
            console.log('Bubble icon clicked!');
            
            // Small delay to check if this was actually a drag
            setTimeout(() => {
                toggleBubble();
            }, 10);
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
            closePanelBtn.addEventListener('click', () => {
                closeFeature();
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (showMenu && featureMenu && !featureMenu.contains(e.target) && bubbleIcon && !bubbleIcon.contains(e.target)) {
                hideFeatureMenu();
                showMenu = false;
                if (bubbleIcon) bubbleIcon.setAttribute('aria-expanded', 'false');
            }
        });

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

    // Toggle bubble - show semicircle menu
    function toggleBubble() {
        if (!bubbleIcon) {
            console.error('Bubble icon not found in toggleBubble');
            return;
        }
        
        // Don't toggle if a feature panel is open
        if (activeFeature) {
            closeFeature();
            return;
        }
        
        // Toggle menu visibility
        showMenu = !showMenu;
        console.log('Toggle menu, showMenu:', showMenu);
        
        if (showMenu) {
            showFeatureMenu();
            if (bubbleIcon) bubbleIcon.setAttribute('aria-expanded', 'true');
        } else {
            hideFeatureMenu();
            if (bubbleIcon) bubbleIcon.setAttribute('aria-expanded', 'false');
        }
        
        window.parent.postMessage({ type: 'persistPosition' }, '*');
    }
    
    // Show semicircle menu with feature icons
    function showFeatureMenu() {
        if (!featureMenu) {
            console.error('Feature menu element not found');
            return;
        }
        
        // Get bubble position from parent
        window.parent.postMessage({ type: 'getBubblePosition' }, '*');
        
        // Wait for position, then render menu
        setTimeout(() => {
            renderFeatureMenu();
            featureMenu.classList.remove('hidden');
        }, 50);
    }
    
    // Render feature menu icons in semicircle
    function renderFeatureMenu() {
        if (!featureMenu) return;
        
        const bubbleSize = 64;
        const iconSize = 48;
        const radius = 90;
        
        // Get bubble position (center of iframe/viewport since iframe fills container)
        const bubbleCenterX = bubbleSize / 2;
        const bubbleCenterY = bubbleSize / 2;
        
        // Get screen center relative to iframe (approximate)
        const screenCenterX = window.innerWidth / 2;
        
        // Detect screen position
        const isOnRightSide = bubbleCenterX > screenCenterX;
        const isOnLeftSide = bubbleCenterX < screenCenterX - 200;
        
        // Calculate menu angles
        let menuStartAngle, menuSpan;
        if (isOnRightSide) {
            // Right side: show on left
            menuStartAngle = (3 * Math.PI) / 4; // 135°
            menuSpan = Math.PI * 0.75; // 135 degrees
        } else if (isOnLeftSide) {
            // Left side: show on right
            menuStartAngle = -Math.PI / 4; // -45°
            menuSpan = Math.PI * 0.75; // 135 degrees
        } else {
            // Center: show on top
            menuStartAngle = -Math.PI / 2; // -90° (up)
            menuSpan = Math.PI; // 180 degrees
        }
        
        // Clear previous menu
        featureMenu.innerHTML = '';
        
        // Create feature icons
        FEATURES.forEach((feature, index) => {
            const angle = menuStartAngle + (menuSpan / (FEATURES.length - 1)) * index;
            // Calculate icon position relative to bubble center
            let iconX = bubbleCenterX + Math.cos(angle) * radius - iconSize / 2;
            let iconY = bubbleCenterY + Math.sin(angle) * radius - iconSize / 2;
            
            // Keep icons within viewport bounds
            iconX = Math.max(5, Math.min(iconX, window.innerWidth - iconSize - 5));
            iconY = Math.max(5, Math.min(iconY, window.innerHeight - iconSize - 5));
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'feature-menu-icon';
            iconDiv.setAttribute('data-feature', feature.id);
            iconDiv.style.cssText = `
                position: absolute;
                left: ${iconX}px;
                top: ${iconY}px;
                width: ${iconSize}px;
                height: ${iconSize}px;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                z-index: 2147483648;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            `;
            
            // Use first letter as icon for now
            iconDiv.innerHTML = `<span style="color: ${feature.color}; font-weight: bold; font-size: 20px;">${feature.label.charAt(0)}</span>`;
            
            iconDiv.title = feature.label;
            iconDiv.setAttribute('aria-label', feature.label);
            
            iconDiv.addEventListener('mouseenter', () => {
                iconDiv.style.transform = 'scale(1.1)';
                iconDiv.style.borderColor = feature.color;
                iconDiv.style.boxShadow = `0 6px 30px ${feature.color}40`;
            });
            
            iconDiv.addEventListener('mouseleave', () => {
                iconDiv.style.transform = 'scale(1)';
                iconDiv.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                iconDiv.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
            });
            
            iconDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                openFeature(feature.id);
            });
            
            // Animate in
            iconDiv.style.opacity = '0';
            iconDiv.style.transform = 'scale(0)';
            setTimeout(() => {
                iconDiv.style.transition = 'all 0.3s ease';
                iconDiv.style.opacity = '1';
                iconDiv.style.transform = 'scale(1)';
            }, index * 50);
            
            featureMenu.appendChild(iconDiv);
        });
        
        console.log('Feature menu rendered with', FEATURES.length, 'features');
    }
    
    // Hide feature menu
    function hideFeatureMenu() {
        if (featureMenu) {
            featureMenu.classList.add('hidden');
            featureMenu.innerHTML = '';
        }
    }
    
    // Open a feature panel
    function openFeature(featureId) {
        activeFeature = featureId;
        showMenu = false;
        hideFeatureMenu();
        
        console.log('Opening feature:', featureId);
        
        if (featurePanel && panelContent) {
            // Show panel and expand container
            bubbleIcon.classList.add('hidden');
            featurePanel.classList.remove('hidden');
            window.parent.postMessage({ type: 'expand' }, '*');
            
            // Load feature content
            loadFeatureContent(featureId);
        }
    }
    
    // Close feature panel
    function closeFeature() {
        activeFeature = null;
        if (featurePanel) {
            featurePanel.classList.add('hidden');
        }
        if (bubbleIcon) {
            bubbleIcon.classList.remove('hidden');
        }
        window.parent.postMessage({ type: 'collapse' }, '*');
    }
    
    // Load content for a feature
    function loadFeatureContent(featureId) {
        if (!panelContent) return;
        
        // Update panel title
        const feature = FEATURES.find(f => f.id === featureId);
        const panelTitleText = document.getElementById('panel-title-text');
        if (panelTitleText && feature) {
            panelTitleText.textContent = feature.label;
        }
        
        // Load feature-specific content
        switch(featureId) {
            case 'summarize':
                panelContent.innerHTML = `
                    <div style="padding: 20px; color: white;">
                        <h3 style="margin-bottom: 15px; color: #a855f7;">Summarize</h3>
                        <textarea id="summarize-input" placeholder="Paste text to summarize..." 
                                  style="width: 100%; min-height: 100px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; margin-bottom: 10px;"></textarea>
                        <button id="summarize-btn" style="padding: 10px 20px; background: #a855f7; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">Summarize</button>
                        <div id="summarize-output" style="margin-top: 15px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; display: none;"></div>
                    </div>
                `;
                // Re-attach event listener
                setTimeout(() => {
                    const btn = document.getElementById('summarize-btn');
                    const input = document.getElementById('summarize-input');
                    const output = document.getElementById('summarize-output');
                    if (btn && input && output) {
                        btn.addEventListener('click', async () => {
                            const text = input.value.trim();
                            if (!text) return;
                            btn.disabled = true;
                            btn.textContent = 'Summarizing...';
                            try {
                                const response = await callGroqAPI(`Summarize the following text concisely:\n\n${text}`);
                                if (response && response.ok) {
                                    let summaryText = '';
                                    if (response.data) {
                                        summaryText = response.data.data || response.data.message || JSON.stringify(response.data);
                                    }
                                    output.textContent = summaryText || 'No summary generated';
                                    output.style.display = 'block';
                                }
                            } catch (e) {
                                output.textContent = 'Error: ' + e.message;
                                output.style.display = 'block';
                            } finally {
                                btn.disabled = false;
                                btn.textContent = 'Summarize';
                            }
                        });
                    }
                }, 100);
                break;
            case 'translate':
                panelContent.innerHTML = `
                    <div style="padding: 20px; color: white;">
                        <h3 style="margin-bottom: 15px; color: #ec4899;">Translate</h3>
                        
                        <!-- Language Selection -->
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 12px; color: #9ca3af; margin-bottom: 5px;">From</label>
                                <select id="bubble-source-lang" style="width: 100%; padding: 8px; background: #111827; border: 1px solid #4b5563; border-radius: 6px; color: white; font-size: 13px;">
                                    <option value="en" style="background: #111827; color: white;">English</option>
                                    <option value="hi" style="background: #111827; color: white;">Hindi</option>
                                    <option value="mr" style="background: #111827; color: white;">Marathi</option>
                                    <option value="kn" style="background: #111827; color: white;">Kannada</option>
                                </select>
                            </div>
                            <div style="padding-top: 20px; font-size: 16px;">→</div>
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 12px; color: #9ca3af; margin-bottom: 5px;">To</label>
                                <select id="bubble-target-lang" style="width: 100%; padding: 8px; background: #111827; border: 1px solid #4b5563; border-radius: 6px; color: white; font-size: 13px;">
                                    <option value="hi" style="background: #111827; color: white;">Hindi</option>
                                    <option value="en" style="background: #111827; color: white;">English</option>
                                    <option value="mr" style="background: #111827; color: white;">Marathi</option>
                                    <option value="kn" style="background: #111827; color: white;">Kannada</option>
                                </select>
                            </div>
                        </div>
                        
                        <textarea id="bubble-translate-input" placeholder="Enter text to translate..." 
                                  style="width: 100%; min-height: 80px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; margin-bottom: 10px; font-size: 14px;"></textarea>
                        <button id="bubble-translate-btn" style="padding: 10px 20px; background: #ec4899; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-bottom: 10px;">Translate</button>
                        <div id="bubble-translate-output" style="margin-top: 10px; padding: 15px; background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 8px; display: none; min-height: 60px;"></div>
                        
                        <div style="margin-top: 10px; text-align: center;">
                            <button onclick="window.parent.postMessage({type: 'open_side_panel'}, '*')" 
                                    style="padding: 8px 16px; background: rgba(255,255,255,0.1); color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; cursor: pointer; font-size: 12px;">
                                Open Full Translate
                            </button>
                        </div>
                    </div>
                `;
                // Re-attach event listeners
                setTimeout(() => {
                    const btn = document.getElementById('bubble-translate-btn');
                    const input = document.getElementById('bubble-translate-input');
                    const output = document.getElementById('bubble-translate-output');
                    const sourceLang = document.getElementById('bubble-source-lang');
                    const targetLang = document.getElementById('bubble-target-lang');
                    
                    if (btn && input && output && sourceLang && targetLang) {
                        btn.addEventListener('click', async () => {
                            const text = input.value.trim();
                            if (!text) return;
                            
                            btn.disabled = true;
                            btn.textContent = 'Translating...';
                            output.style.display = 'block';
                            output.textContent = 'Translating...';
                            
                            try {
                                const langNames = {
                                    'en': 'English', 'hi': 'Hindi', 'mr': 'Marathi', 'kn': 'Kannada'
                                };
                                const prompt = `Translate the following text from ${langNames[sourceLang.value]} to ${langNames[targetLang.value]}. Only return the translated text, no explanations:\n\n${text}`;
                                const response = await callGroqAPI(prompt);
                                
                                if (response && response.ok) {
                                    let translatedText = '';
                                    if (response.data) {
                                        translatedText = response.data.data || response.data.message || JSON.stringify(response.data);
                                    }
                                    output.textContent = translatedText || 'No translation generated';
                                } else {
                                    output.textContent = response?.error || 'Translation failed. Please try again.';
                                }
                            } catch (e) {
                                output.textContent = 'Error: ' + e.message;
                            } finally {
                                btn.disabled = false;
                                btn.textContent = 'Translate';
                            }
                        });
                    }
                }, 100);
                break;
            case 'settings':
                panelContent.innerHTML = `
                    <div style="padding: 20px; color: white;">
                        <h3 style="margin-bottom: 15px; color: #eab308;">Settings</h3>
                        <button onclick="window.parent.postMessage({type: 'open_side_panel'}, '*')" 
                                style="padding: 10px 20px; background: #eab308; color: black; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-bottom: 10px;">
                            Open Login
                        </button>
                    </div>
                `;
                break;
            default:
                panelContent.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: white;">
                        <h3 style="color: ${feature?.color || '#00b3ff'}; margin-bottom: 10px;">${feature?.label || 'Feature'}</h3>
                        <p style="color: #888;">Coming soon!</p>
                    </div>
                `;
        }
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

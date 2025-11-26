// Content script - injects bubble into web pages
(function () {
    'use strict';

    // Don't inject on extension pages or already injected
    if (window.location.protocol === 'chrome-extension:' || 
        window.location.protocol === 'moz-extension:' ||
        window.location.protocol === 'edge-extension:' ||
        window.nexaBubbleInjected) {
        return;
    }
    window.nexaBubbleInjected = true;
    
    console.log('Nexa content script loaded on:', window.location.href);

    let bubbleContainer = null;
    let bubbleIframe = null;
    let currentSelection = '';

    // Create bubble container and iframe
    function createBubble() {
        // Check if already exists
        if (bubbleContainer && document.body.contains(bubbleContainer)) {
            return;
        }
        
        try {
            // Create container
            bubbleContainer = document.createElement('div');
            bubbleContainer.id = 'nexa-bubble-root';
            bubbleContainer.style.cssText = `
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                z-index: 2147483647 !important;
                width: 64px !important;
                height: 64px !important;
                transition: width 0.3s, height 0.3s;
                cursor: grab !important;
                pointer-events: auto !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;

            // Create iframe
            bubbleIframe = document.createElement('iframe');
            const bubbleUrl = chrome.runtime.getURL('bubble/index.html');
            bubbleIframe.src = bubbleUrl;
            bubbleIframe.style.cssText = `
                width: 100% !important;
                height: 100% !important;
                border: none !important;
                border-radius: 50% !important;
                transition: border-radius 0.3s;
                background: transparent !important;
                display: block !important;
                pointer-events: auto !important;
            `;
            bubbleIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups');
            bubbleIframe.setAttribute('allow', 'microphone');

            bubbleContainer.appendChild(bubbleIframe);
            
            if (document.body) {
                document.body.appendChild(bubbleContainer);
                console.log('Nexa bubble created successfully at', bubbleUrl);
                console.log('Bubble container:', bubbleContainer);
                console.log('Bubble container style:', window.getComputedStyle(bubbleContainer));
                
                // Force visibility with !important
                bubbleContainer.style.setProperty('display', 'block', 'important');
                bubbleContainer.style.setProperty('visibility', 'visible', 'important');
                bubbleContainer.style.setProperty('opacity', '1', 'important');
                bubbleContainer.style.setProperty('z-index', '2147483647', 'important');
                
                // Verify it's visible
                setTimeout(() => {
                    const rect = bubbleContainer.getBoundingClientRect();
                    console.log('Bubble position:', rect);
                    console.log('Bubble visible?', rect.width > 0 && rect.height > 0);
                }, 500);

                // Load saved position - ensure it's within viewport
                chrome.storage.local.get(['nexa.bubble.pos'], (result) => {
                    const bubbleSize = 64;
                    const margin = 20;
                    
                    if (result['nexa.bubble.pos'] && bubbleContainer) {
                        const pos = result['nexa.bubble.pos'];
                        
                        // Get position values
                        let x = pos.x !== undefined ? pos.x : null;
                        let y = pos.y !== undefined ? pos.y : null;
                        
                        // Calculate max bounds
                        const maxX = window.innerWidth - bubbleSize - margin;
                        const maxY = window.innerHeight - bubbleSize - margin;
                        
                        // If position exists and is valid, clamp it to viewport
                        // Check for negative values or values outside viewport
                        if (x !== null && y !== null && x >= 0 && y >= 0 && 
                            x < window.innerWidth && y < window.innerHeight) {
                            // Clamp to viewport bounds
                            x = Math.max(margin, Math.min(x, maxX));
                            y = Math.max(margin, Math.min(y, maxY));
                            bubbleContainer.style.left = x + 'px';
                            bubbleContainer.style.top = y + 'px';
                            bubbleContainer.style.right = 'auto';
                            bubbleContainer.style.bottom = 'auto';
                            console.log('Bubble positioned at saved location (clamped):', { x, y });
                        } else {
                            // Invalid position (negative or out of bounds), use default
                            console.warn('Saved position invalid (x:', x, 'y:', y, '), resetting to default');
                            bubbleContainer.style.right = margin + 'px';
                            bubbleContainer.style.bottom = margin + 'px';
                            bubbleContainer.style.left = 'auto';
                            bubbleContainer.style.top = 'auto';
                            // Clear invalid position
                            chrome.storage.local.remove(['nexa.bubble.pos'], () => {
                                console.log('Invalid position cleared from storage');
                            });
                        }
                    } else {
                        // Default position (bottom right)
                        bubbleContainer.style.right = margin + 'px';
                        bubbleContainer.style.bottom = margin + 'px';
                        bubbleContainer.style.left = 'auto';
                        bubbleContainer.style.top = 'auto';
                        console.log('Bubble using default position (no saved position)');
                    }
                    
                    // Verify it's visible after positioning
                    setTimeout(() => {
                        const rect = bubbleContainer.getBoundingClientRect();
                        console.log('Bubble final position:', rect);
                        const isVisible = rect.width > 0 && rect.height > 0;
                        const isOnScreen = rect.top >= 0 && rect.left >= 0 && 
                                          rect.bottom <= window.innerHeight + 10 && 
                                          rect.right <= window.innerWidth + 10;
                        console.log('Bubble visible?', isVisible);
                        console.log('Bubble on screen?', isOnScreen);
                        
                        // If bubble is still off-screen, reset to default
                        if (!isOnScreen && isVisible) {
                            console.warn('Bubble is off-screen, resetting to default position');
                            bubbleContainer.style.left = 'auto';
                            bubbleContainer.style.top = 'auto';
                            bubbleContainer.style.right = margin + 'px';
                            bubbleContainer.style.bottom = margin + 'px';
                            chrome.storage.local.remove(['nexa.bubble.pos']);
                        }
                    }, 200);
                });

                // Make bubble draggable
                makeDraggable(bubbleContainer);

                setupMessageListeners();
            } else {
                console.error('Document body not available');
            }
        } catch (error) {
            console.error('Error creating bubble:', error);
        }
    }

    // Make element draggable
    function makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let dragStartX;
        let dragStartY;
        let hasMoved = false;

        element.addEventListener('mousedown', dragStart);
        element.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        function dragStart(e) {
            // Get client position (handle both mouse and touch)
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            dragStartX = clientX;
            dragStartY = clientY;
            hasMoved = false;
            
            // Calculate initial offset
            const rect = element.getBoundingClientRect();
            initialX = clientX - rect.left;
            initialY = clientY - rect.top;
            
            // Don't prevent default yet - let click handler work if no drag happens
        }

        function drag(e) {
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            if (!clientX || !clientY) return;
            
            // Check if mouse has moved enough to start dragging
            const moveThreshold = 5;
            const deltaX = Math.abs(clientX - dragStartX);
            const deltaY = Math.abs(clientY - dragStartY);
            
            if (!isDragging && (deltaX > moveThreshold || deltaY > moveThreshold)) {
                // Start dragging
                isDragging = true;
                hasMoved = true;
                
                // Disable pointer events on iframe during drag
                if (bubbleIframe) bubbleIframe.style.pointerEvents = 'none';
                element.style.cursor = 'grabbing';
                e.preventDefault();
            }
            
            if (isDragging) {
                e.preventDefault();
                currentX = clientX - initialX;
                currentY = clientY - initialY;

                // Keep bubble within viewport (with margin)
                const margin = 10;
                const maxX = window.innerWidth - element.offsetWidth - margin;
                const maxY = window.innerHeight - element.offsetHeight - margin;

                currentX = Math.max(margin, Math.min(currentX, maxX));
                currentY = Math.max(margin, Math.min(currentY, maxY));

                element.style.left = currentX + 'px';
                element.style.top = currentY + 'px';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            }
        }

        function dragEnd(e) {
            if (isDragging) {
                isDragging = false;

                // Re-enable pointer events on iframe
                if (bubbleIframe) bubbleIframe.style.pointerEvents = 'auto';
                element.style.cursor = 'grab';

                // Save position
                const rect = element.getBoundingClientRect();
                chrome.storage.local.set({
                    'nexa.bubble.pos': {
                        x: rect.left,
                        y: rect.top,
                        right: window.innerWidth - rect.right,
                        bottom: window.innerHeight - rect.bottom
                    }
                });
                
                hasMoved = false;
            } else if (!hasMoved) {
                // No drag happened - this was a click, let it pass through to iframe
                // The click will be handled by the bubble's click handler
            }
        }
    }

    // Setup message listeners
    function setupMessageListeners() {
        // Listen for messages from iframe
        window.addEventListener('message', (event) => {
            // Verify origin is our extension
            if (event.source !== bubbleIframe.contentWindow) return;

            const message = event.data;

            if (message.type === 'expand') {
                bubbleContainer.style.width = '400px';
                bubbleContainer.style.height = '600px';
                bubbleIframe.style.borderRadius = '16px';
            }

            if (message.type === 'collapse') {
                bubbleContainer.style.width = '64px';
                bubbleContainer.style.height = '64px';
                bubbleIframe.style.borderRadius = '50%';
            }

            if (message.type === 'persistPosition') {
                try {
                    const rect = bubbleContainer.getBoundingClientRect();
                    chrome.storage.local.set({
                        'nexa.bubble.pos': {
                            x: rect.left,
                            y: rect.top,
                            right: window.innerWidth - rect.right,
                            bottom: window.innerHeight - rect.bottom
                        }
                    });
                } catch (e) {
                    console.error('Error persisting position:', e);
                }
            }

            if (message.type === 'requestSelection') {
                bubbleIframe.contentWindow.postMessage({
                    type: 'selection',
                    text: currentSelection
                }, '*');
            }

            if (message.type === 'openLogin') {
                chrome.runtime.openOptionsPage();
            }
            
            if (message.type === 'openChat' || message.type === 'openSidePanel') {
                // Open side panel for chat
                chrome.runtime.sendMessage({
                    type: 'open_side_panel'
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error opening side panel:', chrome.runtime.lastError);
                    }
                });
            }
            
            // Forward messages from iframe to service worker
            if (message.type === 'extensionMessage') {
                const messageId = message.payload.id || Date.now();
                console.log('Content script forwarding message:', message.payload.type, 'ID:', messageId);
                
                try {
                    chrome.runtime.sendMessage(message.payload, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Service worker error:', chrome.runtime.lastError);
                            if (bubbleIframe && bubbleIframe.contentWindow) {
                                bubbleIframe.contentWindow.postMessage({
                                    type: 'extensionResponse',
                                    id: messageId,
                                    error: chrome.runtime.lastError.message
                                }, '*');
                            }
                        } else {
                            console.log('Content script received response from service worker:', response);
                            if (bubbleIframe && bubbleIframe.contentWindow) {
                                bubbleIframe.contentWindow.postMessage({
                                    type: 'extensionResponse',
                                    id: messageId,
                                    response: response || {}
                                }, '*');
                            }
                        }
                    });
                } catch (e) {
                    console.error('Error sending message to service worker:', e);
                    if (bubbleIframe && bubbleIframe.contentWindow) {
                        bubbleIframe.contentWindow.postMessage({
                            type: 'extensionResponse',
                            id: messageId,
                            error: 'Extension context invalidated. Please reload the page.'
                        }, '*');
                    }
                }
            }
            
            // Handle storage operations from iframe
            if (message.type === 'storageGet') {
                chrome.storage.local.get(message.keys, (result) => {
                    bubbleIframe.contentWindow.postMessage({
                        type: 'storageResult',
                        data: result
                    }, '*');
                });
            }
            
            if (message.type === 'storageSet') {
                chrome.storage.local.set(message.data, () => {
                    bubbleIframe.contentWindow.postMessage({
                        type: 'storageResult',
                        success: true
                    }, '*');
                });
            }
            
            if (message.type === 'storageRemove') {
                chrome.storage.local.remove(message.keys, () => {
                    bubbleIframe.contentWindow.postMessage({
                        type: 'storageResult',
                        success: true
                    }, '*');
                });
            }
        });

        // Listen for messages from service worker (context menu)
        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === 'nexa_summarize' && message.text) {
                currentSelection = message.text;
                bubbleIframe.contentWindow.postMessage({
                    type: 'summarize',
                    text: message.text
                }, '*');
            }
        });
    }

    // Detect text selection
    document.addEventListener('mouseup', (e) => {
        // Don't trigger if clicking inside bubble
        if (bubbleContainer && bubbleContainer.contains(e.target)) return;

        const selection = window.getSelection().toString().trim();
        if (selection.length > 8) {
            currentSelection = selection;

            // Auto-expand bubble if not already expanded
            if (bubbleIframe && bubbleIframe.contentWindow) {
                // First show the bubble if hidden
                bubbleContainer.style.display = 'block';

                // Send selection to bubble
                bubbleIframe.contentWindow.postMessage({
                    type: 'summarize', // Auto-switch to summarize tab
                    text: selection
                }, '*');
            }
        }
    });

    // Initialize bubble - ALWAYS create it by default
    function initBubble() {
        // Check if bubble is enabled (default to true)
        chrome.storage.local.get(['nexa.bubble.enabled'], (result) => {
            const enabled = result['nexa.bubble.enabled'] !== false; // Default to true
            
            if (!enabled) {
                console.log('Nexa bubble is disabled');
                return;
            }
            
            function tryCreate() {
                if (document.body && (!bubbleContainer || !document.body.contains(bubbleContainer))) {
                    console.log('Attempting to create bubble...');
                    createBubble();
                    return true;
                }
                return false;
            }
            
            // Try immediately
            if (document.body) {
                setTimeout(() => {
                    const created = tryCreate();
                    if (created) console.log('Bubble created on first try');
                }, 50);
            }
            
            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        const created = tryCreate();
                        if (created) console.log('Bubble created after DOMContentLoaded');
                    }, 100);
                });
            } else {
                setTimeout(() => {
                    const created = tryCreate();
                    if (created) console.log('Bubble created after readyState check');
                }, 100);
            }
            
            // Observer fallback
            const obs = new MutationObserver(() => {
                if (tryCreate()) {
                    console.log('Bubble created via MutationObserver');
                    obs.disconnect();
                }
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(() => { 
                obs.disconnect(); 
                const created = tryCreate();
                if (created) console.log('Bubble created via timeout fallback');
                else console.warn('Bubble creation failed after all attempts');
            }, 2000);
        });
    }
    
    // Start immediately
    console.log('Nexa: Initializing bubble...');
    initBubble();
    
    // Listen for enable/disable changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes['nexa.bubble.enabled'] && bubbleContainer) {
            const enabled = changes['nexa.bubble.enabled'].newValue !== false;
            bubbleContainer.style.display = enabled ? 'block' : 'none';
        }
    });
})();

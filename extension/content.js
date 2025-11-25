// Content script - injects bubble into web pages
(function () {
    'use strict';

    // Don't inject on extension pages or already injected
    if (window.location.protocol === 'chrome-extension:' || window.nexaBubbleInjected) {
        return;
    }
    window.nexaBubbleInjected = true;

    let bubbleContainer = null;
    let bubbleIframe = null;
    let currentSelection = '';

    // Create bubble container and iframe
    function createBubble() {
        // Create container
        bubbleContainer = document.createElement('div');
        bubbleContainer.id = 'nexa-bubble-root';
        bubbleContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      width: 64px;
      height: 64px;
      transition: width 0.3s, height 0.3s;
      cursor: grab;
    `;

        // Create iframe
        bubbleIframe = document.createElement('iframe');
        bubbleIframe.src = chrome.runtime.getURL('bubble/index.html');
        bubbleIframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 50%;
      transition: border-radius 0.3s;
    `;
        bubbleIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

        bubbleContainer.appendChild(bubbleIframe);
        document.body.appendChild(bubbleContainer);

        // Load saved position
        chrome.storage.local.get(['nexa.bubble.pos'], (result) => {
            if (result['nexa.bubble.pos']) {
                const pos = result['nexa.bubble.pos'];
                if (pos.x !== undefined) bubbleContainer.style.left = pos.x + 'px';
                if (pos.y !== undefined) bubbleContainer.style.top = pos.y + 'px';
                if (pos.right !== undefined) bubbleContainer.style.right = pos.right + 'px';
                if (pos.bottom !== undefined) bubbleContainer.style.bottom = pos.bottom + 'px';
            }
        });

        // Make bubble draggable
        makeDraggable(bubbleContainer);

        setupMessageListeners();
    }

    // Make element draggable
    function makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            // Calculate initial offset
            const rect = element.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            isDragging = true;

            // Disable pointer events on iframe during drag
            bubbleIframe.style.pointerEvents = 'none';
            element.style.cursor = 'grabbing';
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                // Keep bubble within viewport
                const maxX = window.innerWidth - element.offsetWidth;
                const maxY = window.innerHeight - element.offsetHeight;

                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));

                element.style.left = currentX + 'px';
                element.style.top = currentY + 'px';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            }
        }

        function dragEnd() {
            if (isDragging) {
                isDragging = false;

                // Re-enable pointer events on iframe
                bubbleIframe.style.pointerEvents = 'auto';
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
                const rect = bubbleContainer.getBoundingClientRect();
                chrome.storage.local.set({
                    'nexa.bubble.pos': {
                        x: rect.left,
                        y: rect.top,
                        right: window.innerWidth - rect.right,
                        bottom: window.innerHeight - rect.bottom
                    }
                });
            }

            if (message.type === 'requestSelection') {
                bubbleIframe.contentWindow.postMessage({
                    type: 'selection',
                    text: currentSelection
                }, '*');
            }

            if (message.type === 'openLogin') {
                window.open('https://nexa-nu-three.vercel.app/login', '_blank');
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
    document.addEventListener('mouseup', () => {
        const selection = window.getSelection().toString().trim();
        if (selection.length > 8) {
            currentSelection = selection;
            // Optionally notify bubble of new selection
            if (bubbleIframe && bubbleIframe.contentWindow) {
                bubbleIframe.contentWindow.postMessage({
                    type: 'selectionAvailable',
                    text: selection
                }, '*');
            }
        }
    });

    // Initialize bubble when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBubble);
    } else {
        createBubble();
    }
})();

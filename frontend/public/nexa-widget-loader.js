/**
 * Nexa Bubble Widget Loader
 * Embed the Nexa AI assistant bubble on any website
 * 
 * Usage:
 * <script src="https://yourdomain.com/nexa-widget-loader.js"></script>
 * <script>
 *   NexaWidget.init({
 *     apiUrl: 'https://your-api-url.com',
 *     position: 'bottom-right', // or 'bottom-left'
 *     zIndex: 999999
 *   });
 * </script>
 */

(function() {
    'use strict';
    
    // Configuration defaults
    const DEFAULT_CONFIG = {
        apiUrl: 'http://localhost:4000',
        widgetUrl: null, // Will default to same origin + /widget
        position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
        zIndex: 999999,
        enabled: true
    };

    let config = {};
    let bubbleContainer = null;
    let bubbleIframe = null;
    let isInitialized = false;

    // Create unique namespace
    window.NexaWidget = {
        init: function(customConfig) {
            if (isInitialized) {
                console.warn('NexaWidget already initialized');
                return;
            }

            config = Object.assign({}, DEFAULT_CONFIG, customConfig);
            
            // Don't load on the widget page itself
            if (window.location.pathname.includes('nexa-widget.html')) {
                return;
            }

            createBubble();
            isInitialized = true;
        },

        destroy: function() {
            if (bubbleContainer && bubbleContainer.parentNode) {
                bubbleContainer.parentNode.removeChild(bubbleContainer);
            }
            bubbleContainer = null;
            bubbleIframe = null;
            isInitialized = false;
        },

        show: function() {
            if (bubbleContainer) {
                bubbleContainer.style.display = 'block';
            }
        },

        hide: function() {
            if (bubbleContainer) {
                bubbleContainer.style.display = 'none';
            }
        }
    };

    function createBubble() {
        // Create container
        bubbleContainer = document.createElement('div');
        bubbleContainer.id = 'nexa-bubble-root';
        
        // Position based on config
        const position = getPosition(config.position);
        bubbleContainer.style.cssText = `
            position: fixed;
            ${position.top ? `top: ${position.top};` : ''}
            ${position.bottom ? `bottom: ${position.bottom};` : ''}
            ${position.left ? `left: ${position.left};` : ''}
            ${position.right ? `right: ${position.right};` : ''}
            z-index: ${config.zIndex};
            width: 64px;
            height: 64px;
            pointer-events: none;
        `;

        // Create iframe
        bubbleIframe = document.createElement('iframe');
        
        // Determine widget URL
        let widgetUrl;
        if (config.widgetUrl) {
            widgetUrl = new URL(config.widgetUrl);
        } else {
            // Default to same origin + /widget
            widgetUrl = new URL('/widget', window.location.origin);
        }
        
        // Add API URL as query param
        if (config.apiUrl) {
            widgetUrl.searchParams.set('apiUrl', config.apiUrl);
        }
        
        bubbleIframe.src = widgetUrl.toString();
        bubbleIframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            pointer-events: auto;
        `;
        bubbleIframe.setAttribute('allow', 'clipboard-read; clipboard-write');
        bubbleIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');

        bubbleContainer.appendChild(bubbleIframe);
        
        // Append to body
        if (document.body) {
            document.body.appendChild(bubbleContainer);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(bubbleContainer);
            });
        }

        // Load saved position from localStorage
        loadSavedPosition();
        
        // Make draggable
        makeDraggable(bubbleContainer);
        
        // Handle text selection for auto-expand
        setupTextSelection();
    }

    function getPosition(position) {
        const positions = {
            'bottom-right': { bottom: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'top-left': { top: '20px', left: '20px' }
        };
        return positions[position] || positions['bottom-right'];
    }

    function loadSavedPosition() {
        try {
            const saved = localStorage.getItem('nexa.bubble.position');
            if (saved) {
                const pos = JSON.parse(saved);
                if (pos.x !== undefined) bubbleContainer.style.left = pos.x + 'px';
                if (pos.y !== undefined) bubbleContainer.style.top = pos.y + 'px';
                if (pos.right !== undefined) bubbleContainer.style.right = pos.right + 'px';
                if (pos.bottom !== undefined) bubbleContainer.style.bottom = pos.bottom + 'px';
                bubbleContainer.style.left = '';
                bubbleContainer.style.right = '';
                bubbleContainer.style.top = '';
                bubbleContainer.style.bottom = '';
            }
        } catch (e) {
            console.error('Error loading saved position:', e);
        }
    }

    function savePosition() {
        try {
            const rect = bubbleContainer.getBoundingClientRect();
            const pos = {
                x: rect.left,
                y: rect.top,
                right: window.innerWidth - rect.right,
                bottom: window.innerHeight - rect.bottom
            };
            localStorage.setItem('nexa.bubble.position', JSON.stringify(pos));
        } catch (e) {
            console.error('Error saving position:', e);
        }
    }

    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        element.style.cursor = 'grab';

        element.addEventListener('mousedown', function(e) {
            // Only drag on the container, not the iframe
            if (e.target === bubbleIframe) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            element.style.cursor = 'grabbing';
            
            // Disable pointer events on iframe during drag
            bubbleIframe.style.pointerEvents = 'none';
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            // Keep within viewport
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - element.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - element.offsetHeight));

            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            element.style.right = 'auto';
            element.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'grab';
                bubbleIframe.style.pointerEvents = 'auto';
                savePosition();
            }
        });
    }

    function setupTextSelection() {
        document.addEventListener('mouseup', function(e) {
            // Don't trigger if clicking inside bubble
            if (bubbleContainer && bubbleContainer.contains(e.target)) return;

            const selection = window.getSelection().toString().trim();
            if (selection.length > 8 && bubbleIframe && bubbleIframe.contentWindow) {
                // Send selection to bubble iframe
                bubbleIframe.contentWindow.postMessage({
                    type: 'nexa-text-selected',
                    text: selection
                }, '*');
            }
        });
    }

    // Auto-initialize if script tag has data attributes
    (function autoInit() {
        const script = document.currentScript;
        if (script && script.dataset.autoInit !== undefined) {
            const autoConfig = {};
            if (script.dataset.apiUrl) autoConfig.apiUrl = script.dataset.apiUrl;
            if (script.dataset.widgetUrl) autoConfig.widgetUrl = script.dataset.widgetUrl;
            if (script.dataset.position) autoConfig.position = script.dataset.position;
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    window.NexaWidget.init(autoConfig);
                });
            } else {
                window.NexaWidget.init(autoConfig);
            }
        }
    })();
})();


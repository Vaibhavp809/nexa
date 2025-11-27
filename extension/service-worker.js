// Backend API base URL
const BACKEND_BASE = 'https://nexa-yp12.onrender.com';
// const BACKEND_BASE = 'http://localhost:4000'; // Uncomment for local dev

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'nexa-summarize',
        title: 'Summarize with Nexa',
        contexts: ['selection']
    });

    // Set side panel path
    chrome.sidePanel.setOptions({
        path: 'sidepanel/chat.html',
        enabled: true
    });

    console.log('Nexa extension installed');
});

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'nexa-summarize' && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
            action: 'nexa_summarize',
            text: info.selectionText
        });
    }
});

// Handle messages from content script and bubble iframe
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') {
        console.warn('Invalid message received:', message);
        return false;
    }
    
    console.log('Service worker received message:', message.type || 'undefined', message);

    if (message.type === 'fetch_groq') {
        handleGroqRequest(message, sendResponse);
        return true; // Keep channel open for async response
    }

    if (message.type === 'fetch_tasks') {
        handleTasksRequest(message, sendResponse);
        return true; // Keep channel open for async response
    }

    if (message.type === 'get_token') {
        chrome.storage.local.get(['nexa_token'], (result) => {
            console.log('Getting token from storage:', { hasToken: !!result.nexa_token });
            sendResponse({ token: result.nexa_token || null });
        });
        return true;
    }

    if (message.type === 'set_token') {
        chrome.storage.local.set({ 
            nexa_token: message.token,
            nexa_user: message.user || null
        }, () => {
            console.log('Token set in service worker storage');
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.type === 'clear_token') {
        chrome.storage.local.remove(['nexa_token', 'nexa_user'], () => {
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (message.type === 'sync_cookies') {
        syncTokenFromCookies().then((token) => {
            sendResponse({ success: true, token });
        }).catch((error) => {
            console.error('Cookie sync error:', error);
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

                if (message.type === 'open_side_panel') {
                    // Open side panel for current tab
                    const page = message.page || 'chat';
                    let sidePanelPath = 'sidepanel/chat.html';
                    if (page === 'settings') {
                        sidePanelPath = 'sidepanel/settings.html';
                    } else if (page === 'translate') {
                        sidePanelPath = 'sidepanel/translate.html';
                    } else if (page === 'notes') {
                        sidePanelPath = 'sidepanel/notes.html';
                    } else if (page === 'tasks') {
                        sidePanelPath = 'sidepanel/tasks.html';
                    } else if (page === 'voicenotes') {
                        sidePanelPath = 'sidepanel/voicenotes.html';
                    } else if (page === 'voicesearch') {
                        sidePanelPath = 'sidepanel/voicesearch.html';
                    }
        
        // Update side panel path if needed
        chrome.sidePanel.setOptions({
            path: sidePanelPath,
            enabled: true
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
                chrome.sidePanel.open({ tabId: tabs[0].id }).then(() => {
                    sendResponse({ success: true });
                }).catch((error) => {
                    console.error('Error opening side panel:', error);
                    // Try without tabId
                    chrome.sidePanel.open({}).then(() => {
                        sendResponse({ success: true });
                    }).catch((err) => {
                        console.error('Error opening side panel (fallback):', err);
                        sendResponse({ success: false, error: err.message });
                    });
                });
            } else {
                // No active tab, try opening anyway
                chrome.sidePanel.open({}).then(() => {
                    sendResponse({ success: true });
                }).catch((err) => {
                    console.error('Error opening side panel:', err);
                    sendResponse({ success: false, error: err.message });
                });
            }
        });
        return true;
    }

    if (message.type === 'feature_clicked' || (message.toSidePanel && !message.type)) {
        // Handle feature clicks from bubble (compatible with both formats)
        const feature = message.feature;
        const label = message.label;
        console.log('Feature clicked:', feature, label);
        
        if (feature) {
            // Store last feature trigger (like reference)
            chrome.storage.local.set({ lastFeature: feature });
            
            // Broadcast to all clients (like reference)
            chrome.runtime.sendMessage({ from: 'background', feature: feature }).catch(() => {
                // Ignore errors when broadcasting
            });
        }
        
        sendResponse({ success: true });
        return true;
    }
    
    if (message.type === 'text_selected' || message.type === 'text_selected_for_summarize') {
        const selectedText = message.text;
        const feature = message.feature || 'summarize';
        
        if (!selectedText || selectedText.trim().length === 0) {
            console.warn('Text selection message received but text is empty');
            sendResponse({ success: false, error: 'No text provided' });
            return true;
        }
        
        // Determine which side panel to open based on feature
        const featureKey = feature === 'translate' ? 'feat-translate' : 'feat-summarize';
        const panelPage = feature === 'translate' ? 'translate' : 'chat';
        
        // Forward selected text to side panel via storage and message
        chrome.storage.local.set({
            nexa_selected_text: selectedText,
            nexa_selected_feature: featureKey
        }, () => {
            // Try to open the appropriate side panel
            chrome.sidePanel.open({ windowId: sender.tab?.windowId });
            
            // Broadcast to side panel via tabs
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'text_selected_for_sidepanel',
                        text: selectedText,
                        feature: feature
                    }).catch(() => {
                        // Side panel might not be open, that's okay - storage is the fallback
                        console.log('Side panel may not be open yet, text saved to storage');
                    });
                }
            });
        });
        
        sendResponse({ success: true });
        return true;
    }
    
    // Return false if message not handled
    return false;
});

// Handle Tasks API requests
async function handleTasksRequest(message, sendResponse) {
    try {
        // Get token from storage
        const storage = await chrome.storage.local.get(['nexa_token', 'nexa_user']);
        const token = storage.nexa_token;

        if (!token) {
            sendResponse({
                ok: false,
                error: 'Not authenticated',
                needsAuth: true
            });
            return;
        }

        // Make request to backend (service worker context doesn't have CORS restrictions)
        const response = await fetch(`${BACKEND_BASE}/api/tasks`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            await chrome.storage.local.remove(['nexa_token']);
            sendResponse({
                ok: false,
                error: 'Session expired',
                needsAuth: true
            });
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            sendResponse({
                ok: false,
                error: errorData.message || `Server error: ${response.status}`
            });
            return;
        }

        const data = await response.json();
        sendResponse({
            ok: true,
            data: data
        });

    } catch (error) {
        console.error('Tasks request error:', error);
        sendResponse({
            ok: false,
            error: error.message || 'Network error'
        });
    }
}

// Handle Groq API requests
async function handleGroqRequest(message, sendResponse) {
    try {
        // Get token from storage
        const storage = await chrome.storage.local.get(['nexa_token', 'nexa_user']);
        const token = storage.nexa_token;

        console.log('Checking token for Groq request:', {
            hasToken: !!token,
            tokenLength: token ? token.length : 0
        });

        if (!token) {
            console.warn('No token found in storage');
            sendResponse({
                ok: false,
                error: 'Not authenticated. Please log in.',
                needsAuth: true
            });
            return;
        }

        // Make request to backend
        const response = await fetch(`${BACKEND_BASE}/api/groq/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: message.prompt })
        });

        if (response.status === 401) {
            // Token expired or invalid
            await chrome.storage.local.remove(['nexa_token']);
            sendResponse({
                ok: false,
                error: 'Session expired. Please log in again.',
                needsAuth: true
            });
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            sendResponse({
                ok: false,
                error: errorData.message || `Server error: ${response.status}`
            });
            return;
        }

        const data = await response.json();
        sendResponse({
            ok: true,
            data: data
        });

    } catch (error) {
        console.error('Groq request error:', error);
        sendResponse({
            ok: false,
            error: error.message || 'Network error. Please try again.'
        });
    }
}

// Cookie syncing logic
const FRONTEND_URL = 'https://nexa-nu-three.vercel.app';

async function syncTokenFromCookies() {
    try {
        const cookie = await chrome.cookies.get({
            url: FRONTEND_URL,
            name: 'nexa_token'
        });

        if (cookie) {
            await chrome.storage.local.set({ 'nexa_token': cookie.value });
            console.log('Token synced from cookie');
            return cookie.value;
        } else {
            console.log('No auth cookie found');
            return null;
        }
    } catch (error) {
        console.error('Cookie sync error:', error);
        return null;
    }
}

// Sync on startup and when cookies change
chrome.runtime.onStartup.addListener(syncTokenFromCookies);
chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.cookie.name === 'nexa_token' && changeInfo.cookie.domain.includes('nexa-nu-three.vercel.app')) {
        if (changeInfo.removed) {
            chrome.storage.local.remove('nexa_token');
        } else {
            chrome.storage.local.set({ 'nexa_token': changeInfo.cookie.value });
        }
    }
});

// Initial sync
syncTokenFromCookies();

// Check storage on startup
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['nexa_token'], (result) => {
        console.log('Token on startup:', { hasToken: !!result.nexa_token });
    });
});

// Log storage changes for debugging
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        if (changes.nexa_token) {
            console.log('Token changed:', {
                newValue: changes.nexa_token.newValue ? 'exists (' + changes.nexa_token.newValue.length + ' chars)' : 'removed',
                oldValue: changes.nexa_token.oldValue ? 'existed' : 'did not exist'
            });
        }
    }
});

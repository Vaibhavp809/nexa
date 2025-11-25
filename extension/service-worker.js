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

    console.log('Nexa extension installed');
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
    console.log('Service worker received message:', message);

    if (message.type === 'fetch_groq') {
        handleGroqRequest(message, sendResponse);
        return true; // Keep channel open for async response
    }

    if (message.type === 'get_token') {
        chrome.storage.local.get(['nexa_token'], (result) => {
            sendResponse({ token: result.nexa_token || null });
        });
        return true;
    }

    if (message.type === 'set_token') {
        chrome.storage.local.set({ nexa_token: message.token }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.type === 'clear_token') {
        chrome.storage.local.remove(['nexa_token'], () => {
            sendResponse({ success: true });
        });
        return true;
    }
    if (message.type === 'sync_cookies') {
        syncTokenFromCookies().then((token) => {
            sendResponse({ success: true, token });
        });
        return true;
    }
});

// Handle Groq API requests
async function handleGroqRequest(message, sendResponse) {
    try {
        // Get token from storage
        const storage = await chrome.storage.local.get(['nexa_token']);
        const token = storage.nexa_token;

        if (!token) {
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

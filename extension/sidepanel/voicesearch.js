// Voice Search Side Panel Script
// No authentication needed - this is a simple search feature

// DOM Elements
const recordBtn = document.getElementById('record-btn');
const recordStatus = document.getElementById('record-status');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchPreview = document.getElementById('search-preview');
const micPermissionPrompt = document.getElementById('mic-permission-prompt');
const requestMicBtn = document.getElementById('request-mic-btn');

let isListening = false;
let recognition = null;
let micPermission = null;
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

// Initialize
checkMicrophonePermission();
setupSpeechRecognition();
initializeTranslations();

// Check microphone permission
async function checkMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        micPermission = 'granted';
        micPermissionPrompt.classList.add('hidden');
        return true;
    } catch (error) {
        console.error('Microphone permission check:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            micPermission = 'denied';
        } else {
            micPermission = 'prompt';
        }
        micPermissionPrompt.classList.remove('hidden');
        return false;
    }
}

// Request microphone permission
async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        micPermission = 'granted';
        micPermissionPrompt.classList.add('hidden');
        setupSpeechRecognition();
        return true;
    } catch (error) {
        console.error('Microphone permission error:', error);
        micPermission = 'denied';
        alert('Microphone permission is required for voice search. Please enable it in your browser settings.');
        return false;
    }
}

// Setup Speech Recognition
function setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        recordBtn.disabled = true;
        recordStatus.textContent = 'Speech recognition not supported';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const query = event.results[0][0].transcript;
        searchInput.value = query;
        isListening = false;
        recordBtn.classList.remove('recording');
        recordStatus.textContent = 'Click to search by voice';
        recordBtn.textContent = '🎤';
        
        // Show preview
        showPreview(query);
        
        // Perform search
        performSearch(query);
    };

    recognition.onerror = async (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        recordBtn.classList.remove('recording');
        recordStatus.textContent = 'Click to search by voice';
        recordBtn.textContent = '🎤';
        
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            micPermission = 'denied';
            micPermissionPrompt.classList.remove('hidden');
        } else if (event.error === 'no-speech') {
            recordStatus.textContent = 'No speech detected. Try again.';
            setTimeout(() => {
                recordStatus.textContent = 'Click to search by voice';
            }, 2000);
        } else if (event.error === 'audio-capture') {
            alert('No microphone found. Please connect a microphone and try again.');
        }
    };

    recognition.onend = () => {
        if (isListening) {
            // Recognition ended but we're still in listening mode - restart
            try {
                recognition.start();
            } catch (e) {
                console.error('Error restarting recognition:', e);
                stopListening();
            }
        }
    };
}

// Start listening
async function startListening() {
    if (isListening) return;
    
    // Check microphone permission first
    if (micPermission !== 'granted') {
        const granted = await requestMicrophonePermission();
        if (!granted) {
            return;
        }
    }
    
    if (!recognition) {
        setupSpeechRecognition();
        if (!recognition) {
            alert('Speech recognition is not available. Please check your browser settings.');
            return;
        }
    }
    
    try {
        searchInput.value = '';
        searchPreview.classList.remove('show');
        isListening = true;
        recordBtn.classList.add('recording');
        recordStatus.textContent = 'Listening...';
        recordBtn.textContent = '⏹️';
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            micPermission = 'denied';
            micPermissionPrompt.classList.remove('hidden');
            await requestMicrophonePermission();
        }
        stopListening();
    }
}

// Stop listening
function stopListening() {
    if (!isListening) return;
    
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            console.error('Error stopping recognition:', e);
        }
    }
    
    isListening = false;
    recordBtn.classList.remove('recording');
    recordStatus.textContent = 'Click to search by voice';
    recordBtn.textContent = '🎤';
}

// Perform search
function performSearch(query) {
    if (!query || !query.trim()) return;
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
    
    // Open in new tab - use window.open for side panel context
    window.open(searchUrl, '_blank');
    
    // Clear input after a short delay
    setTimeout(() => {
        searchInput.value = '';
        searchPreview.classList.remove('show');
    }, 1000);
}

// Show preview
function showPreview(query) {
    if (!query || !query.trim()) {
        searchPreview.classList.remove('show');
        return;
    }
    
    searchPreview.textContent = `Will search for: "${query}"`;
    searchPreview.classList.add('show');
}

// Event Listeners
recordBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        performSearch(query);
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    } else {
        // Show preview as user types
        const query = searchInput.value;
        if (query.trim()) {
            showPreview(query);
        } else {
            searchPreview.classList.remove('show');
        }
    }
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query.trim()) {
        showPreview(query);
    } else {
        searchPreview.classList.remove('show');
    }
});

// Request microphone permission button
requestMicBtn.addEventListener('click', async () => {
    await requestMicrophonePermission();
});

// Initialize preview on page load if there's existing text
if (searchInput.value.trim()) {
    showPreview(searchInput.value);
}


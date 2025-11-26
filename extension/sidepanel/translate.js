// Translate Page Script
const API_BASE = 'https://nexa-yp12.onrender.com/api';
const BACKEND_BASE = 'https://nexa-yp12.onrender.com';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

let currentMode = 'text';
let sourceLang = 'en';
let targetLang = 'hi';
let recognition = null;
let isListening = false;
let micPermission = null; // null, 'granted', 'denied', 'prompt'
let translateLangChanged = false;

const modeTextBtn = document.getElementById('mode-text');
const modeVoiceBtn = document.getElementById('mode-voice');
const sourceLangSelect = document.getElementById('source-lang');
const targetLangSelect = document.getElementById('target-lang');
const inputText = document.getElementById('input-text');
const translateBtn = document.getElementById('translate-btn');
const voiceBtn = document.getElementById('voice-btn');
const voiceIcon = document.getElementById('voice-icon');
const voiceText = document.getElementById('voice-text');
const transcriptContainer = document.getElementById('transcript-container');
const transcriptText = document.getElementById('transcript-text');
const translationOutput = document.getElementById('translation-output');
const actionButtons = document.getElementById('action-buttons');
const speakBtn = document.getElementById('speak-btn');
const copyBtn = document.getElementById('copy-btn');
const textMode = document.getElementById('text-mode');
const voiceMode = document.getElementById('voice-mode');
const saveTranslateLangBtn = document.getElementById('save-translate-lang-btn');

// Check microphone permission
async function checkMicrophonePermission() {
    try {
        // In Chrome extensions, we need to directly request access
        // Try to get a media stream to check permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        micPermission = 'granted';
        updateVoiceButtonState();
        return true;
    } catch (error) {
        console.error('Microphone permission check:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            micPermission = 'denied';
        } else if (error.name === 'NotFoundError') {
            micPermission = 'not-found';
        } else {
            micPermission = 'prompt';
        }
        updateVoiceButtonState();
        return false;
    }
}

// Request microphone permission
async function requestMicrophonePermission() {
    try {
        // Show permission request message
        if (micPermission === 'denied') {
            const retry = confirm('Microphone permission was denied. Would you like to try requesting it again? Make sure to click "Allow" in the browser permission prompt.');
            if (!retry) return false;
        }
        
        console.log('Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        micPermission = 'granted';
        updateVoiceButtonState();
        console.log('Microphone permission granted');
        return true;
    } catch (error) {
        console.error('Microphone permission error:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            micPermission = 'denied';
            updateVoiceButtonState();
            alert('Microphone permission is required for voice translation.\n\nPlease:\n1. Click the microphone icon in your browser\'s address bar\n2. Select "Allow" for microphone access\n3. Refresh this page and try again');
        } else if (error.name === 'NotFoundError') {
            micPermission = 'not-found';
            updateVoiceButtonState();
            alert('No microphone found. Please connect a microphone and try again.');
        } else {
            micPermission = 'prompt';
            alert('Unable to access microphone. Please check your browser settings and ensure microphone access is enabled.');
        }
        return false;
    }
}

// Update voice button based on permission state
function updateVoiceButtonState() {
    if (micPermission === 'denied') {
        voiceBtn.disabled = true;
        voiceBtn.style.opacity = '0.5';
        voiceBtn.style.cursor = 'not-allowed';
        voiceBtn.title = 'Microphone permission denied. Please enable it in browser settings.';
    } else if (micPermission === 'not-found') {
        voiceBtn.disabled = true;
        voiceBtn.style.opacity = '0.5';
        voiceBtn.style.cursor = 'not-allowed';
        voiceBtn.title = 'No microphone found. Please connect a microphone.';
    } else {
        voiceBtn.disabled = false;
        voiceBtn.style.opacity = '1';
        voiceBtn.style.cursor = 'pointer';
        voiceBtn.title = '';
    }
}

// Initialize Speech Recognition
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'kn': 'kn-IN'
    };
    recognition.lang = langMap[sourceLang] || sourceLang;

    recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        transcriptText.textContent = spokenText;
        transcriptContainer.style.display = 'block';
        isListening = false;
        updateVoiceButton();
        
        // Auto-translate
        await handleTranslate(spokenText);
    };

    recognition.onerror = async (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        updateVoiceButton();
        
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            micPermission = 'denied';
            updateVoiceButtonState();
            alert('Microphone permission denied. Please enable it in your browser settings or click the microphone icon in the address bar.');
        } else if (event.error === 'no-speech') {
            // No speech detected - this is normal, just stop listening
            console.log('No speech detected');
        } else if (event.error === 'audio-capture') {
            alert('No microphone found. Please connect a microphone and try again.');
        } else {
            console.warn('Speech recognition error:', event.error);
        }
    };

    recognition.onend = () => {
        isListening = false;
        updateVoiceButton();
    };

    return recognition;
}

// Find best voice for language
function findBestVoiceForLanguage(langCode) {
    const voices = speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const langCodes = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'kn': 'kn-IN'
    };
    const targetLang = langCodes[langCode] || langCode;

    // Try exact match first
    let voice = voices.find(v => v.lang === targetLang);
    if (voice) return voice;

    // Try partial match
    voice = voices.find(v => v.lang.toLowerCase().includes(targetLang.toLowerCase()));
    if (voice) return voice;

    // For Indian languages, try Indian English as fallback
    if (langCode !== 'en') {
        voice = voices.find(v => v.lang === 'en-IN');
        if (voice) return voice;
    }

    // Last resort: default voice
    return voices.find(v => v.default) || voices[0];
}

// Update voice button state
function updateVoiceButton() {
    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceIcon.textContent = '🔴';
        voiceText.textContent = 'Listening...';
        voiceBtn.disabled = false;
    } else {
        voiceBtn.classList.remove('listening');
        voiceIcon.textContent = '🎤';
        voiceText.textContent = 'Start Listening';
        voiceBtn.disabled = false;
    }
}

// Mode switching
modeTextBtn.addEventListener('click', () => {
    currentMode = 'text';
    modeTextBtn.classList.add('active');
    modeVoiceBtn.classList.remove('active');
    textMode.style.display = 'flex';
    voiceMode.style.display = 'none';
    if (recognition && isListening) {
        recognition.stop();
    }
});

modeVoiceBtn.addEventListener('click', async () => {
    currentMode = 'voice';
    modeVoiceBtn.classList.add('active');
    modeTextBtn.classList.remove('active');
    textMode.style.display = 'none';
    voiceMode.style.display = 'block';
    
    // Always check/request microphone permission when switching to voice mode
    if (micPermission === null || micPermission !== 'granted') {
        const granted = await requestMicrophonePermission();
        if (!granted && micPermission === 'denied') {
            // If permission denied, show helpful message but don't prevent switching to voice mode
            console.warn('Microphone permission not granted');
        }
    }
    
    if (!recognition) {
        recognition = initSpeechRecognition();
    }
    if (recognition) {
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        recognition.lang = langMap[sourceLang] || sourceLang;
    }
    
    updateVoiceButtonState();
});

// Language selection
sourceLangSelect.addEventListener('change', (e) => {
    sourceLang = e.target.value;
    translateLangChanged = true;
    saveTranslateLangBtn.disabled = false;
    saveTranslateLangBtn.style.opacity = '1';
    
    // Update target language options (exclude source)
    const targetOptions = targetLangSelect.querySelectorAll('option');
    targetOptions.forEach(opt => {
        opt.disabled = opt.value === sourceLang;
    });
    if (targetLang === sourceLang) {
        // Switch to first available language
        const available = Array.from(targetOptions).find(opt => opt.value !== sourceLang && !opt.disabled);
        if (available) {
            targetLang = available.value;
            targetLangSelect.value = targetLang;
        }
    }
    if (recognition) {
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        recognition.lang = langMap[sourceLang] || sourceLang;
    }
});

targetLangSelect.addEventListener('change', (e) => {
    targetLang = e.target.value;
    translateLangChanged = true;
    saveTranslateLangBtn.disabled = false;
    saveTranslateLangBtn.style.opacity = '1';
});

// Voice button
voiceBtn.addEventListener('click', async () => {
    // Check permission first
    if (micPermission !== 'granted') {
        const granted = await requestMicrophonePermission();
        if (!granted) {
            return;
        }
    }

    if (!recognition) {
        recognition = initSpeechRecognition();
        if (!recognition) {
            alert('Speech recognition not supported in this browser.');
            return;
        }
    }

    if (isListening) {
        recognition.stop();
        isListening = false;
        updateVoiceButton();
    } else {
        try {
            // Ensure microphone permission before starting
            if (micPermission !== 'granted') {
                const granted = await requestMicrophonePermission();
                if (!granted) {
                    return;
                }
            }

            isListening = true;
            updateVoiceButton();
            transcriptContainer.style.display = 'none';
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            isListening = false;
            updateVoiceButton();
            
            // If permission error, request again
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                const granted = await requestMicrophonePermission();
                if (granted) {
                    // Try again after permission granted
                    try {
                        isListening = true;
                        updateVoiceButton();
                        recognition.start();
                    } catch (retryError) {
                        console.error('Error after permission granted:', retryError);
                    }
                }
            }
        }
    }
});

// Translate function
async function handleTranslate(textToTranslate = null) {
    const text = textToTranslate || inputText.value.trim();
    if (!text) return;

    // Check authentication
    const result = await chrome.storage.local.get(['nexa_token']);
    if (!result.nexa_token) {
        translationOutput.innerHTML = '<div class="empty-state" style="color: #ef4444;">Please log in to use translation.</div>';
        return;
    }

    // Show loading
    translationOutput.innerHTML = '<div class="empty-state"><div class="loading" style="margin: 0 auto;"></div><div style="margin-top: 8px;">Translating...</div></div>';
    actionButtons.style.display = 'none';

    try {
        const sourceLangData = LANGUAGES.find(l => l.code === sourceLang);
        const targetLangData = LANGUAGES.find(l => l.code === targetLang);
        
        const sourceLangName = sourceLangData?.name || sourceLang;
        const targetLangName = targetLangData?.name || targetLang;
        const sourceNativeName = sourceLangData?.nativeName || '';
        const targetNativeName = targetLangData?.nativeName || '';

        // Create translation prompt
        const translationPrompt = `You are a professional translator. Your task is to translate text from ${sourceLangName}${sourceNativeName ? ` (${sourceNativeName})` : ''} to ${targetLangName}${targetNativeName ? ` (${targetNativeName})` : ''}.

CRITICAL INSTRUCTIONS:
- INPUT LANGUAGE: ${sourceLangName}${sourceNativeName ? ` (${sourceNativeName})` : ''}
- OUTPUT LANGUAGE: ${targetLangName}${targetNativeName ? ` (${targetNativeName})` : ''}
- You MUST translate FROM ${sourceLangName} TO ${targetLangName}
- Do NOT return the text in ${sourceLangName}, only return it in ${targetLangName}
- Only output the translated text - nothing else
- Do not include "Translation:", explanations, or any labels
- Do not include the original text
- Do not use quotation marks

Source text (${sourceLangName}): "${text}"

Translated text (${targetLangName}):`;

        // Call API via service worker
        const response = await chrome.runtime.sendMessage({
            type: 'fetch_groq',
            prompt: translationPrompt
        });

        if (response.ok && response.data) {
            let translatedText = '';
            if (response.data.data) {
                translatedText = typeof response.data.data === 'string' ? response.data.data : JSON.stringify(response.data.data);
            } else if (response.data.message) {
                translatedText = typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message);
            } else if (typeof response.data === 'string') {
                translatedText = response.data;
            }

            // Clean translation
            translatedText = translatedText.trim();
            translatedText = translatedText.replace(/^(Translation:|Translated text:|In .*?:|Here is the translation:|Translation in .*?:|The translation is:|Result:)/i, '').trim();
            
            if (translatedText.includes('"')) {
                const quotedMatch = translatedText.match(/"([^"]+)"/);
                if (quotedMatch) {
                    translatedText = quotedMatch[1];
                } else {
                    translatedText = translatedText.replace(/^["']|["']$/g, '');
                }
            }

            translatedText = translatedText.replace(new RegExp(`(${sourceLangName}:|${targetLangName}:)`, 'gi'), '').trim();
            translatedText = translatedText.replace(/^[\n\r]+|[\n\r]+$/g, '').trim();

            if (!translatedText || translatedText === text) {
                translatedText = 'Translation failed. Please try again.';
            }

            // Display translation
            translationOutput.textContent = translatedText;
            actionButtons.style.display = 'flex';

            // Auto-speak in voice mode
            if (currentMode === 'voice' && translatedText && 'speechSynthesis' in window) {
                speakTranslation(translatedText);
            }
        } else if (response.needsAuth) {
            translationOutput.innerHTML = '<div class="empty-state" style="color: #ef4444;">Please log in to use translation.</div>';
        } else {
            translationOutput.innerHTML = `<div class="empty-state" style="color: #ef4444;">${response.error || 'Translation failed. Please try again.'}</div>`;
        }
    } catch (error) {
        console.error('Translation error:', error);
        translationOutput.innerHTML = '<div class="empty-state" style="color: #ef4444;">Translation error. Please try again.</div>';
    }
}

// Speak translation
function speakTranslation(text) {
    if (!('speechSynthesis' in window)) return;

    speechSynthesis.cancel();
    
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        utterance.lang = langMap[targetLang] || targetLang;
        
        const voice = findBestVoiceForLanguage(targetLang);
        if (voice) {
            utterance.voice = voice;
        }
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
        };
        
        speechSynthesis.speak(utterance);
    }, 100);
}

// Translate button
translateBtn.addEventListener('click', () => {
    handleTranslate();
});

// Enter key to translate
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleTranslate();
    }
});

// Speak button
speakBtn.addEventListener('click', () => {
    const text = translationOutput.textContent;
    if (text && text !== 'Translation will appear here...') {
        speakTranslation(text);
    }
});

// Copy button
copyBtn.addEventListener('click', () => {
    const text = translationOutput.textContent;
    if (text && text !== 'Translation will appear here...') {
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }
});

// Load voices when available
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
    };
    
    // Try loading voices immediately
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        // Wait for voices to load
        setTimeout(() => {
            console.log('Voices loaded (delayed):', speechSynthesis.getVoices().length);
        }, 100);
    }
}

// Save translate language preferences
async function saveTranslateLanguagePreferences() {
    try {
        await chrome.storage.local.set({
            'nexa.translate.sourceLang': sourceLang,
            'nexa.translate.targetLang': targetLang
        });
        
        // Also sync to backend if user is logged in
        const result = await chrome.storage.local.get(['nexa_token']);
        if (result && result.nexa_token) {
            try {
                const response = await fetch(`${BACKEND_BASE}/api/auth/profile`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${result.nexa_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        translateSourceLang: sourceLang,
                        translateTargetLang: targetLang
                    })
                });
                if (response.ok) {
                    console.log('Translate language preferences synced to backend');
                }
            } catch (err) {
                console.warn('Failed to sync translate languages to backend:', err);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error saving translate language preferences:', error);
        return false;
    }
}

// Load translate language preferences
async function loadTranslateLanguagePreferences() {
    try {
        const result = await chrome.storage.local.get([
            'nexa.translate.sourceLang',
            'nexa.translate.targetLang',
            'nexa.preferredLanguage'
        ]);
        
        // Load saved translate preferences or use preferred language
        if (result['nexa.translate.targetLang']) {
            targetLang = result['nexa.translate.targetLang'];
            targetLangSelect.value = targetLang;
        } else if (result['nexa.preferredLanguage'] && result['nexa.preferredLanguage'] !== 'en') {
            // Use preferred language as default target if set
            targetLang = result['nexa.preferredLanguage'];
            targetLangSelect.value = targetLang;
        }
        
        if (result['nexa.translate.sourceLang']) {
            sourceLang = result['nexa.translate.sourceLang'];
            sourceLangSelect.value = sourceLang;
        }
        
        // Update target language options (exclude source)
        const targetOptions = targetLangSelect.querySelectorAll('option');
        targetOptions.forEach(opt => {
            opt.disabled = opt.value === sourceLang;
        });
        
        translateLangChanged = false;
        saveTranslateLangBtn.disabled = true;
        saveTranslateLangBtn.style.opacity = '0.5';
        
        return true;
    } catch (error) {
        console.error('Error loading translate language preferences:', error);
        return false;
    }
}

// Save button click handler
saveTranslateLangBtn.addEventListener('click', async () => {
    if (!translateLangChanged) return;
    
    saveTranslateLangBtn.disabled = true;
    saveTranslateLangBtn.textContent = 'Saving...';
    
    const success = await saveTranslateLanguagePreferences();
    
    if (success) {
        saveTranslateLangBtn.textContent = 'Saved!';
        saveTranslateLangBtn.classList.add('saved');
        saveTranslateLangBtn.style.opacity = '1';
        translateLangChanged = false;
        
        setTimeout(() => {
            saveTranslateLangBtn.textContent = 'Save Language Preference';
            saveTranslateLangBtn.classList.remove('saved');
            saveTranslateLangBtn.disabled = true;
            saveTranslateLangBtn.style.opacity = '0.5';
        }, 2000);
    } else {
        saveTranslateLangBtn.textContent = 'Error - Try Again';
        saveTranslateLangBtn.disabled = false;
        setTimeout(() => {
            saveTranslateLangBtn.textContent = 'Save Language Preference';
        }, 2000);
    }
});

// Translation initialization
let currentTranslateLanguage = 'en';

async function initializeTranslations() {
    try {
        const result = await chrome.storage.local.get(['nexa.preferredLanguage']);
        currentTranslateLanguage = result['nexa.preferredLanguage'] || 'en';
        applyTranslations();
        
        // Listen for language changes
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes['nexa.preferredLanguage']) {
                currentTranslateLanguage = changes['nexa.preferredLanguage'].newValue || 'en';
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
            const translated = getTranslation(currentTranslateLanguage, key);
            if (translated && translated !== key) {
                element.textContent = translated;
            }
        }
    });
}

// Initialize on load
window.addEventListener('load', async () => {
    // Initialize translations
    await initializeTranslations();
    
    // Load saved language preferences
    await loadTranslateLanguagePreferences();
    
    // Check microphone permission on page load
    await checkMicrophonePermission();
    
    if (currentMode === 'voice') {
        recognition = initSpeechRecognition();
        updateVoiceButtonState();
    }
});


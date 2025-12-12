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
let voiceModeType = 'basic'; // 'basic' or 'conversation'
let sourceLang = 'en';
let targetLang = 'hi';
let person1Lang = 'en';
let person2Lang = 'hi';
let currentSpeaker = null; // 'person1' or 'person2'
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
const voiceModeBasicBtn = document.getElementById('voice-mode-basic');
const voiceModeConversationBtn = document.getElementById('voice-mode-conversation');
const basicVoiceMode = document.getElementById('basic-voice-mode');
const conversationMode = document.getElementById('conversation-mode');
const person1Btn = document.getElementById('person1-btn');
const person2Btn = document.getElementById('person2-btn');
const person1LangSelect = document.getElementById('person1-lang');
const person2LangSelect = document.getElementById('person2-lang');
const person1Icon = document.getElementById('person1-icon');
const person1Text = document.getElementById('person1-text');
const person2Icon = document.getElementById('person2-icon');
const person2Text = document.getElementById('person2-text');
const conversationTranscripts = document.getElementById('conversation-transcripts');
const person1Transcript = document.getElementById('person1-transcript');
const person1TranscriptText = document.getElementById('person1-transcript-text');
const person1TranslationText = document.getElementById('person1-translation-text');
const person2Transcript = document.getElementById('person2-transcript');
const person2TranscriptText = document.getElementById('person2-transcript-text');
const person2TranslationText = document.getElementById('person2-translation-text');

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
    recognition.continuous = true;  // Keep listening continuously
    recognition.interimResults = true;  // Show interim results for real-time feedback

    const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'kn': 'kn-IN'
    };
    recognition.lang = langMap[sourceLang] || sourceLang;

    // Note: onresult, onerror, and onend handlers will be set up dynamically
    // based on the mode (basic or conversation) when starting recognition

    return recognition;
}

// Find best voice for language (with comprehensive Indian language fallbacks)
function findBestVoiceForLanguage(langCode) {
    const voices = speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
        console.warn('No voices available in speech synthesis');
        return null;
    }
    
    const langCodes = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'kn': 'kn-IN'
    };
    const targetLang = langCodes[langCode] || langCode;
    
    let matchingVoice = null;
    
    if (langCode === 'kn') {
        // Kannada: prioritize exact matches
        matchingVoice = voices.find(voice => voice.lang === 'kn-IN') ||
                       voices.find(voice => voice.lang === 'kn') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('kn-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('kn-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kannada')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('kn'));
        
        // Fallback: Use Hindi voice (better than English for Indian scripts)
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang === 'hi' || 
                                                voice.name.toLowerCase().includes('hindi') ||
                                                voice.name.toLowerCase().includes('हिन्दी'));
        }
        
        // Last resort: Use Indian English (en-IN) which handles Indian scripts better
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'en-IN' || 
                                                (voice.lang.startsWith('en-') && 
                                                 (voice.name.toLowerCase().includes('india') || 
                                                  voice.name.toLowerCase().includes('indian'))));
        }
        
        // Only log if no voice found at all (not for fallbacks)
        if (!matchingVoice) {
            console.warn('No Kannada voice found, even with fallbacks');
        }
    } else if (langCode === 'mr') {
        // Marathi: prioritize exact matches
        matchingVoice = voices.find(voice => voice.lang === 'mr-IN') ||
                       voices.find(voice => voice.lang === 'mr') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('mr-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('mr-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('marathi')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('mr'));
        
        // Fallback: Use Hindi voice (same script family - Devanagari)
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'hi-IN' || voice.lang === 'hi' || 
                                                voice.name.toLowerCase().includes('hindi') ||
                                                voice.name.toLowerCase().includes('हिन्दी'));
        }
        
        // Last resort: Use Indian English (en-IN) which handles Devanagari script better
        if (!matchingVoice) {
            matchingVoice = voices.find(voice => voice.lang === 'en-IN' || 
                                                (voice.lang.startsWith('en-') && 
                                                 (voice.name.toLowerCase().includes('india') || 
                                                  voice.name.toLowerCase().includes('indian'))));
        }
        
        // Only log if no voice found at all (not for fallbacks)
        if (!matchingVoice) {
            console.warn('No Marathi voice found, even with fallbacks');
        }
    } else if (langCode === 'hi') {
        // Hindi: prioritize exact matches
        matchingVoice = voices.find(voice => voice.lang === 'hi-IN') ||
                       voices.find(voice => voice.lang === 'hi') ||
                       voices.find(voice => voice.lang.toLowerCase().includes('hi-in')) ||
                       voices.find(voice => voice.lang.toLowerCase().startsWith('hi-')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('hindi') ||
                                           voice.name.toLowerCase().includes('हिन्दी'));
    } else if (langCode === 'en') {
        // English: prefer US English, fallback to any English
        matchingVoice = voices.find(voice => voice.lang === 'en-US') ||
                       voices.find(voice => voice.lang.startsWith('en-') || voice.lang === 'en');
    }
    
    // For Indian languages (kn, mr), we accept Hindi or Indian English as fallbacks
    // But still reject US English voices
    if (matchingVoice && ['kn', 'mr'].includes(langCode)) {
        const voiceLang = matchingVoice.lang.toLowerCase();
        const voiceName = matchingVoice.name.toLowerCase();
        // Only reject if it's US English (en-US), allow hi-IN or en-IN
        if ((voiceLang === 'en-us' || voiceLang === 'en') && 
            !voiceName.includes('india') && 
            !voiceName.includes('indian') &&
            !voiceLang.includes('in')) {
            console.warn(`Rejected US English voice for ${langCode}:`, matchingVoice.name);
            matchingVoice = null;
        }
    }
    
    // For Hindi, reject non-Hindi voices
    if (matchingVoice && langCode === 'hi') {
        const voiceLang = matchingVoice.lang.toLowerCase();
        if (!voiceLang.includes('hi') && !matchingVoice.name.toLowerCase().includes('hindi') && 
            !matchingVoice.name.toLowerCase().includes('हिन्दी')) {
            matchingVoice = null;
        }
    }
    
    // Final fallback: default voice if nothing else found
    if (!matchingVoice) {
        matchingVoice = voices.find(v => v.default) || voices[0];
    }
    
    return matchingVoice;
}

// Update voice button state
function updateVoiceButton() {
    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceIcon.textContent = '🔴';
        voiceText.textContent = 'Stop Listening';
        voiceBtn.disabled = false;
        voiceBtn.title = 'Click to stop listening and translate';
    } else {
        voiceBtn.classList.remove('listening');
        voiceIcon.textContent = '🎤';
        voiceText.textContent = 'Start Listening';
        voiceBtn.disabled = false;
        voiceBtn.title = 'Click to start listening';
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

// Voice button (Basic mode only)
voiceBtn.addEventListener('click', async () => {
    // Only work in basic mode
    if (voiceModeType !== 'basic') return;
    
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
        // Stop listening and process accumulated transcript
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
        isListening = false;
        updateVoiceButton();
        
        // Process the accumulated transcript when user manually stops
        const currentTranscript = transcriptText.textContent.trim();
        if (currentTranscript) {
            console.log('Processing transcript on manual stop:', currentTranscript);
            await handleTranslate(currentTranscript);
        }
    } else {
        try {
            // Ensure microphone permission before starting
            if (micPermission !== 'granted') {
                const granted = await requestMicrophonePermission();
                if (!granted) {
                    return;
                }
            }

            // Set up recognition handlers for basic mode with continuous recording
            const langMap = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'mr': 'mr-IN',
                'kn': 'kn-IN'
            };
            recognition.lang = langMap[sourceLang] || sourceLang;

            let accumulatedTranscript = '';  // Store all speech during session
            let lastProcessedIndex = 0;  // Track which results we've already processed
            
            recognition.onresult = (event) => {
                let interimTranscript = '';
                let newFinalTranscript = '';

                // Process only NEW results (from lastProcessedIndex onwards)
                for (let i = lastProcessedIndex; i < event.results.length; i++) {
                    const transcriptText = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        newFinalTranscript += transcriptText + ' ';
                        lastProcessedIndex = i + 1;  // Update processed index
                    } else {
                        interimTranscript += transcriptText;
                    }
                }

                // Add only NEW final results to accumulated transcript
                if (newFinalTranscript) {
                    accumulatedTranscript += newFinalTranscript;
                }

                // Show accumulated + interim text for real-time feedback
                const fullTranscript = accumulatedTranscript + interimTranscript;
                transcriptText.textContent = fullTranscript;
                transcriptContainer.style.display = 'block';
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    micPermission = 'denied';
                    updateVoiceButtonState();
                    alert('Microphone permission denied. Please enable it in your browser settings or click the microphone icon in the address bar.');
                    isListening = false;
                    updateVoiceButton();
                } else if (event.error === 'no-speech') {
                    // No speech detected - continue listening, don't stop
                    console.log('No speech detected, continuing to listen...');
                } else if (event.error === 'audio-capture') {
                    alert('No microphone found. Please connect a microphone and try again.');
                    isListening = false;
                    updateVoiceButton();
                } else {
                    console.warn('Speech recognition error:', event.error, '- continuing to listen');
                }
            };
            
            recognition.onend = () => {
                // Only restart if we're still supposed to be listening (user hasn't clicked stop)
                if (isListening) {
                    try {
                        console.log('Recognition ended, restarting...');
                        recognition.start();
                    } catch (e) {
                        console.error('Error restarting recognition:', e);
                        isListening = false;
                        updateVoiceButton();
                    }
                }
            };

            recognition.onstart = () => {
                console.log('Basic voice recognition started');
                accumulatedTranscript = '';  // Reset for new session
                lastProcessedIndex = 0;  // Reset processed index
            };

            isListening = true;
            updateVoiceButton();
            transcriptText.textContent = '';
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

// Voice mode type switching (Basic vs Conversation)
voiceModeBasicBtn.addEventListener('click', () => {
    voiceModeType = 'basic';
    voiceModeBasicBtn.classList.add('active');
    voiceModeConversationBtn.classList.remove('active');
    basicVoiceMode.style.display = 'block';
    conversationMode.style.display = 'none';
    if (recognition && isListening) {
        recognition.stop();
    }
    currentSpeaker = null;
    updatePersonButtons();
});

voiceModeConversationBtn.addEventListener('click', () => {
    voiceModeType = 'conversation';
    voiceModeConversationBtn.classList.add('active');
    voiceModeBasicBtn.classList.remove('active');
    basicVoiceMode.style.display = 'none';
    conversationMode.style.display = 'block';
    if (recognition && isListening) {
        recognition.stop();
    }
    currentSpeaker = null;
    updatePersonButtons();
});

// Person language selection
person1LangSelect.addEventListener('change', async (e) => {
    person1Lang = e.target.value;
    if (person1Lang === person2Lang) {
        // Swap if same
        person2Lang = person1LangSelect.querySelectorAll('option')[0].value === person1Lang ? 
                     person1LangSelect.querySelectorAll('option')[1].value : 
                     person1LangSelect.querySelectorAll('option')[0].value;
        person2LangSelect.value = person2Lang;
    }
    if (recognition && currentSpeaker === 'person1') {
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        recognition.lang = langMap[person1Lang] || person1Lang;
    }
    // Save preferences
    await chrome.storage.local.set({
        'nexa.conversation.person1Lang': person1Lang,
        'nexa.conversation.person2Lang': person2Lang
    });
});

person2LangSelect.addEventListener('change', async (e) => {
    person2Lang = e.target.value;
    if (person2Lang === person1Lang) {
        // Swap if same
        person1Lang = person2LangSelect.querySelectorAll('option')[0].value === person2Lang ? 
                     person2LangSelect.querySelectorAll('option')[1].value : 
                     person2LangSelect.querySelectorAll('option')[0].value;
        person1LangSelect.value = person1Lang;
    }
    if (recognition && currentSpeaker === 'person2') {
        const langMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'mr': 'mr-IN',
            'kn': 'kn-IN'
        };
        recognition.lang = langMap[person2Lang] || person2Lang;
    }
    // Save preferences
    await chrome.storage.local.set({
        'nexa.conversation.person1Lang': person1Lang,
        'nexa.conversation.person2Lang': person2Lang
    });
});

// Update person buttons state
function updatePersonButtons() {
    if (!isListening) {
        person1Icon.textContent = '👤';
        person1Text.textContent = 'Person 1 Start';
        person2Icon.textContent = '👤';
        person2Text.textContent = 'Person 2 Start';
        person1Btn.classList.remove('listening');
        person2Btn.classList.remove('listening');
        person1Btn.title = 'Click to start listening for Person 1';
        person2Btn.title = 'Click to start listening for Person 2';
    } else {
        if (currentSpeaker === 'person1') {
            person1Icon.textContent = '🔴';
            person1Text.textContent = 'Person 1 Stop';
            person1Btn.classList.add('listening');
            person2Btn.classList.remove('listening');
            person2Icon.textContent = '👤';
            person2Text.textContent = 'Person 2 Start';
            person1Btn.title = 'Click to stop listening and translate';
            person2Btn.title = 'Person 1 is speaking';
        } else if (currentSpeaker === 'person2') {
            person2Icon.textContent = '🔴';
            person2Text.textContent = 'Person 2 Stop';
            person2Btn.classList.add('listening');
            person1Btn.classList.remove('listening');
            person1Icon.textContent = '👤';
            person1Text.textContent = 'Person 1 Start';
            person2Btn.title = 'Click to stop listening and translate';
            person1Btn.title = 'Person 2 is speaking';
        }
    }
}

// Person 1 button
person1Btn.addEventListener('click', async () => {
    if (voiceModeType !== 'conversation') return;
    
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

    if (isListening && currentSpeaker === 'person1') {
        // Stop listening and process accumulated transcript
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
        isListening = false;
        currentSpeaker = null;
        updatePersonButtons();
        
        // Process the accumulated transcript when user manually stops
        const currentTranscript = person1TranscriptText.textContent.trim();
        if (currentTranscript) {
            console.log('Processing person1 transcript on manual stop:', currentTranscript);
            await handleConversationTranslate(currentTranscript, 'person1');
        }
    } else if (!isListening) {
        try {
            currentSpeaker = 'person1';
            isListening = true;
            const langMap = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'mr': 'mr-IN',
                'kn': 'kn-IN'
            };
            recognition.lang = langMap[person1Lang] || person1Lang;

            let accumulatedTranscript = '';  // Store all speech during session
            let lastProcessedIndex = 0;  // Track which results we've already processed
            
            // Set up result handler for conversation mode with continuous recording
            recognition.onresult = (event) => {
                let interimTranscript = '';
                let newFinalTranscript = '';

                // Process only NEW results (from lastProcessedIndex onwards)
                for (let i = lastProcessedIndex; i < event.results.length; i++) {
                    const transcriptText = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        newFinalTranscript += transcriptText + ' ';
                        lastProcessedIndex = i + 1;  // Update processed index
                    } else {
                        interimTranscript += transcriptText;
                    }
                }

                // Add only NEW final results to accumulated transcript
                if (newFinalTranscript) {
                    accumulatedTranscript += newFinalTranscript;
                }

                // Show accumulated + interim text for real-time feedback
                const fullTranscript = accumulatedTranscript + interimTranscript;
                person1TranscriptText.textContent = fullTranscript;
                person1Transcript.style.display = 'block';
                person1TranslationText.textContent = ''; // Clear previous translation
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    micPermission = 'denied';
                    updateVoiceButtonState();
                    isListening = false;
                    currentSpeaker = null;
                    updatePersonButtons();
                } else if (event.error === 'no-speech') {
                    // No speech detected - continue listening, don't stop
                    console.log('No speech detected, continuing to listen...');
                } else if (event.error === 'audio-capture') {
                    alert('No microphone found. Please connect a microphone and try again.');
                    isListening = false;
                    currentSpeaker = null;
                    updatePersonButtons();
                } else {
                    console.warn('Speech recognition error:', event.error, '- continuing to listen');
                }
            };
            
            recognition.onend = () => {
                // Only restart if we're still supposed to be listening (user hasn't clicked stop)
                if (isListening && currentSpeaker === 'person1') {
                    try {
                        console.log('Recognition ended, restarting...');
                        recognition.start();
                    } catch (e) {
                        console.error('Error restarting recognition:', e);
                        isListening = false;
                        currentSpeaker = null;
                        updatePersonButtons();
                    }
                }
            };

            recognition.onstart = () => {
                console.log('Person1 conversation recognition started');
                accumulatedTranscript = '';  // Reset for new session
                lastProcessedIndex = 0;  // Reset processed index
            };
            
            updatePersonButtons();
            conversationTranscripts.style.display = 'flex';
            person1TranscriptText.textContent = '';
            person1TranslationText.textContent = '';
            person1Transcript.style.display = 'none';
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            isListening = false;
            currentSpeaker = null;
            updatePersonButtons();
        }
    }
});

// Person 2 button
person2Btn.addEventListener('click', async () => {
    if (voiceModeType !== 'conversation') return;
    
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

    if (isListening && currentSpeaker === 'person2') {
        // Stop listening and process accumulated transcript
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
        isListening = false;
        currentSpeaker = null;
        updatePersonButtons();
        
        // Process the accumulated transcript when user manually stops
        const currentTranscript = person2TranscriptText.textContent.trim();
        if (currentTranscript) {
            console.log('Processing person2 transcript on manual stop:', currentTranscript);
            await handleConversationTranslate(currentTranscript, 'person2');
        }
    } else if (!isListening) {
        try {
            currentSpeaker = 'person2';
            isListening = true;
            const langMap = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'mr': 'mr-IN',
                'kn': 'kn-IN'
            };
            recognition.lang = langMap[person2Lang] || person2Lang;

            let accumulatedTranscript = '';  // Store all speech during session
            let lastProcessedIndex = 0;  // Track which results we've already processed
            
            // Set up result handler for conversation mode with continuous recording
            recognition.onresult = (event) => {
                let interimTranscript = '';
                let newFinalTranscript = '';

                // Process only NEW results (from lastProcessedIndex onwards)
                for (let i = lastProcessedIndex; i < event.results.length; i++) {
                    const transcriptText = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        newFinalTranscript += transcriptText + ' ';
                        lastProcessedIndex = i + 1;  // Update processed index
                    } else {
                        interimTranscript += transcriptText;
                    }
                }

                // Add only NEW final results to accumulated transcript
                if (newFinalTranscript) {
                    accumulatedTranscript += newFinalTranscript;
                }

                // Show accumulated + interim text for real-time feedback
                const fullTranscript = accumulatedTranscript + interimTranscript;
                person2TranscriptText.textContent = fullTranscript;
                person2Transcript.style.display = 'block';
                person2TranslationText.textContent = ''; // Clear previous translation
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    micPermission = 'denied';
                    updateVoiceButtonState();
                    isListening = false;
                    currentSpeaker = null;
                    updatePersonButtons();
                } else if (event.error === 'no-speech') {
                    // No speech detected - continue listening, don't stop
                    console.log('No speech detected, continuing to listen...');
                } else if (event.error === 'audio-capture') {
                    alert('No microphone found. Please connect a microphone and try again.');
                    isListening = false;
                    currentSpeaker = null;
                    updatePersonButtons();
                } else {
                    console.warn('Speech recognition error:', event.error, '- continuing to listen');
                }
            };
            
            recognition.onend = () => {
                // Only restart if we're still supposed to be listening (user hasn't clicked stop)
                if (isListening && currentSpeaker === 'person2') {
                    try {
                        console.log('Recognition ended, restarting...');
                        recognition.start();
                    } catch (e) {
                        console.error('Error restarting recognition:', e);
                        isListening = false;
                        currentSpeaker = null;
                        updatePersonButtons();
                    }
                }
            };

            recognition.onstart = () => {
                console.log('Person2 conversation recognition started');
                accumulatedTranscript = '';  // Reset for new session
                lastProcessedIndex = 0;  // Reset processed index
            };
            
            updatePersonButtons();
            conversationTranscripts.style.display = 'flex';
            person2TranscriptText.textContent = '';
            person2TranslationText.textContent = '';
            person2Transcript.style.display = 'none';
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            isListening = false;
            currentSpeaker = null;
            updatePersonButtons();
        }
    }
});

// Handle conversation translation
async function handleConversationTranslate(text, speaker) {
    const sourceLang = speaker === 'person1' ? person1Lang : person2Lang;
    const targetLang = speaker === 'person1' ? person2Lang : person1Lang;
    
    // Show transcript
    if (speaker === 'person1') {
        person1TranscriptText.textContent = text;
        person1TranslationText.textContent = 'Translating...';
        person1Transcript.style.display = 'block';
    } else {
        person2TranscriptText.textContent = text;
        person2TranslationText.textContent = 'Translating...';
        person2Transcript.style.display = 'block';
    }
    
    // Check authentication
    const result = await chrome.storage.local.get(['nexa_token']);
    if (!result.nexa_token) {
        if (speaker === 'person1') {
            person1TranslationText.textContent = 'Please log in to use translation.';
        } else {
            person2TranslationText.textContent = 'Please log in to use translation.';
        }
        return;
    }
    
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
            if (speaker === 'person1') {
                person1TranslationText.textContent = translatedText;
            } else {
                person2TranslationText.textContent = translatedText;
            }
            
            // Auto-speak translation
            if (translatedText && 'speechSynthesis' in window) {
                speakTranslation(translatedText, targetLang);
            }
        } else {
            const errorMsg = response.error || 'Translation failed. Please try again.';
            if (speaker === 'person1') {
                person1TranslationText.textContent = errorMsg;
            } else {
                person2TranslationText.textContent = errorMsg;
            }
        }
    } catch (error) {
        console.error('Translation error:', error);
        const errorMsg = 'Translation error. Please try again.';
        if (speaker === 'person1') {
            person1TranslationText.textContent = errorMsg;
        } else {
            person2TranslationText.textContent = errorMsg;
        }
    }
}

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

            // Auto-speak in voice mode (basic mode only)
            if (currentMode === 'voice' && voiceModeType === 'basic' && translatedText && 'speechSynthesis' in window) {
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
function speakTranslation(text, lang = null) {
    if (!('speechSynthesis' in window)) return;

    const targetLanguage = lang || targetLang;
    speechSynthesis.cancel();
    
    // Wait for voices to load if not already loaded
    const doSpeak = () => {
        const voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            // Voices not loaded yet, wait for them
            if (speechSynthesis.onvoiceschanged) {
                const voiceHandler = () => {
                    speechSynthesis.onvoiceschanged = null;
                    doSpeak();
                };
                speechSynthesis.onvoiceschanged = voiceHandler;
            } else {
                // Fallback: try again after delay
                setTimeout(doSpeak, 300);
            }
            return;
        }
        
        // Small delay after cancellation to ensure previous speech is stopped
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            const langMap = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'mr': 'mr-IN',
                'kn': 'kn-IN'
            };
            utterance.lang = langMap[targetLanguage] || targetLanguage;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Use improved voice selection with fallbacks
            const voice = findBestVoiceForLanguage(targetLanguage);
            if (voice) {
                utterance.voice = voice;
                console.log(`Speaking in ${targetLanguage}: Using ${voice.name} (${voice.lang})`);
            } else {
                console.warn(`No voice found for ${targetLanguage}, using browser default`);
            }
            
            utterance.onstart = () => {
                console.log('Speech started');
            };
            
            utterance.onend = () => {
                console.log('Speech ended');
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
            };
            
            speechSynthesis.speak(utterance);
        }, 100);
    };
    
    doSpeak();
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

// Listen for selected text from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') {
        return false;
    }
    
    // Handle selected text for translate
    if (message.type === 'text_selected_for_sidepanel' || 
        message.type === 'selected_text' || 
        message.type === 'text_selected') {
        const text = message.text;
        const feature = message.feature || 'translate';
        
        if (text && (feature === 'translate' || feature === 'feat-translate') && inputText) {
            // Set the selected text in input box
            inputText.value = text;
            // Switch to text mode if not already
            if (currentMode !== 'text') {
                currentMode = 'text';
                modeTextBtn.classList.add('active');
                modeVoiceBtn.classList.remove('active');
                textMode.style.display = 'flex';
                voiceMode.style.display = 'none';
            }
            // Focus the input
            inputText.focus();
            // Show a subtle notification
            const notification = document.createElement('div');
            notification.textContent = 'Text pasted! Click translate to translate.';
            notification.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 179, 255, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                z-index: 10000;
                font-size: 12px;
                font-family: Arial, sans-serif;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }
    
    return true;
});

// Check for selected text from storage (fallback)
async function checkForSelectedText() {
    try {
        const result = await chrome.storage.local.get(['nexa_selected_text', 'nexa_selected_feature']);
        if (result.nexa_selected_text && result.nexa_selected_feature === 'feat-translate') {
            if (inputText && !inputText.value) {
                inputText.value = result.nexa_selected_text;
                // Switch to text mode
                if (currentMode !== 'text') {
                    currentMode = 'text';
                    modeTextBtn.classList.add('active');
                    modeVoiceBtn.classList.remove('active');
                    textMode.style.display = 'flex';
                    voiceMode.style.display = 'none';
                }
                inputText.focus();
                // Clear the stored text after using it
                await chrome.storage.local.remove(['nexa_selected_text', 'nexa_selected_feature']);
            }
        }
    } catch (error) {
        console.error('Error checking for selected text:', error);
    }
}

// Initialize on load
window.addEventListener('load', async () => {
    // Initialize translations
    await initializeTranslations();
    
    // Load saved language preferences
    await loadTranslateLanguagePreferences();
    
    // Check for selected text
    checkForSelectedText();
    setTimeout(() => checkForSelectedText(), 500);
    setTimeout(() => checkForSelectedText(), 1000);
    
    // Check microphone permission on page load
    await checkMicrophonePermission();
    
    if (currentMode === 'voice') {
        recognition = initSpeechRecognition();
        updateVoiceButtonState();
        
        // Load conversation mode preferences
        const result = await chrome.storage.local.get(['nexa.conversation.person1Lang', 'nexa.conversation.person2Lang']);
        if (result['nexa.conversation.person1Lang']) {
            person1Lang = result['nexa.conversation.person1Lang'];
            person1LangSelect.value = person1Lang;
        }
        if (result['nexa.conversation.person2Lang']) {
            person2Lang = result['nexa.conversation.person2Lang'];
            person2LangSelect.value = person2Lang;
        }
    }
});


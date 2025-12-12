// Voice Notes Side Panel Script
const API_BASE = 'https://nexa-yp12.onrender.com/api';
const BACKEND_BASE = 'https://nexa-yp12.onrender.com';
const LOGIN_URL = 'https://nexa-nu-three.vercel.app/';
// const API_BASE = 'http://localhost:4000/api'; // Uncomment for local dev
// const BACKEND_BASE = 'http://localhost:4000'; // Uncomment for local dev

// DOM Elements
const loginForm = document.getElementById('login-form');
const voicenotesContent = document.getElementById('voicenotes-content');
const recordBtn = document.getElementById('record-btn');
const recordStatus = document.getElementById('record-status');
const transcriptSection = document.getElementById('transcript-section');
const transcript = document.getElementById('transcript');
const saveBtn = document.getElementById('save-btn');
const notesList = document.getElementById('notes-list');
const speechRateSlider = document.getElementById('speech-rate');
const rateValue = document.getElementById('rate-value');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginError = document.getElementById('login-error');
const micPermissionPrompt = document.getElementById('mic-permission-prompt');
const requestMicBtn = document.getElementById('request-mic-btn');

let notes = [];
let saving = false;
let isListening = false;
let recognition = null;
let synth = window.speechSynthesis;
let speechRate = 1.0;
let isPlaying = false;
let playingNoteId = null;
let currentUtterance = null;
let micPermission = null;
let editingNoteId = null;
let editingTitle = '';

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
checkAuth();
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
        alert('Microphone permission is required for voice notes. Please enable it in your browser settings.');
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
    recognition.continuous = true;  // Keep listening continuously
    recognition.interimResults = true;  // Show interim results for feedback
    recognition.lang = 'en-US';

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
        transcript.value = accumulatedTranscript + interimTranscript;
        
        // Scroll to bottom
        transcript.scrollTop = transcript.scrollHeight;
    };

    recognition.onerror = async (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            micPermission = 'denied';
            micPermissionPrompt.classList.remove('hidden');
            stopListening();
        } else if (event.error === 'no-speech') {
            // No speech detected - continue listening, don't stop
            console.log('No speech detected, continuing to listen...');
        } else if (event.error === 'audio-capture') {
            alert('No microphone found. Please connect a microphone and try again.');
            stopListening();
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
                stopListening();
            }
        }
    };

    recognition.onstart = () => {
        console.log('Speech recognition started');
        accumulatedTranscript = '';  // Reset accumulated transcript for new session
        lastProcessedIndex = 0;  // Reset processed index
    };
}

// Check authentication
async function checkAuth() {
    try {
        const result = await chrome.storage.local.get(['nexa_token', 'nexa_user']);
        const token = result.nexa_token;
        const user = result.nexa_user;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        // Verify token is still valid
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showVoiceNotesContent();
                await checkMicrophonePermission();
                setupSpeechRecognition();
                fetchNotes();
            } else {
                // Token invalid
                await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
                showLoginForm();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // If network error, still show notes if we have user data
            if (user) {
                showVoiceNotesContent();
                await checkMicrophonePermission();
                setupSpeechRecognition();
                fetchNotes();
            } else {
                showLoginForm();
            }
        }
    } catch (error) {
        console.error('Check auth error:', error);
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    loginForm.classList.remove('hidden');
    voicenotesContent.classList.add('hidden');
}

// Show voice notes content
function showVoiceNotesContent() {
    loginForm.classList.add('hidden');
    voicenotesContent.classList.remove('hidden');
}

// Fetch voice notes from backend
async function fetchNotes() {
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        notesList.innerHTML = '<div class="loading"><span class="spinner"></span>Loading voice notes...</div>';
        
        const response = await fetch(`${BACKEND_BASE}/api/notes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            // Token expired
            await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
            showLoginForm();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }
        
        const allNotes = await response.json();
        
        // Filter to show only voice notes
        notes = (allNotes || []).filter(note => note.type === 'voice');
        
        renderNotes();
    } catch (error) {
        console.error('Error fetching voice notes:', error);
        notesList.innerHTML = '<div class="empty-state">Failed to load voice notes. Please try again.</div>';
    }
}

// Render notes list
function renderNotes() {
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-state">No voice notes yet. Record your first voice note above!</div>';
        return;
    }
    
    // Sort notes by creation date (newest first)
    const sortedNotes = [...notes].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA;
    });
    
    notesList.innerHTML = sortedNotes.map(note => {
        const noteId = String(note._id || note.id || '');
        const title = note.title || 'Untitled Voice Note';
        const content = note.content || '';
        const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
        const isCurrentlyPlaying = isPlaying && playingNoteId === noteId;
        const isEditing = editingNoteId === noteId;
        
        if (isEditing) {
            return `
                <div class="note-item" data-note-id="${noteId}">
                    <div class="note-header">
                        <div class="note-content-section">
                            <input type="text" 
                                   class="edit-title-input" 
                                   value="${escapeHtml(editingTitle)}" 
                                   placeholder="Enter note title..."
                                   data-note-id="${noteId}"
                                   style="width: 100%; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 4px; color: white; font-size: 14px; margin-bottom: 8px;">
                            <div class="note-text">${escapeHtml(preview)}</div>
                        </div>
                    </div>
                    <div class="note-actions">
                        <button class="save-edit-btn" 
                                data-note-id="${noteId}" 
                                title="Save changes"
                                style="padding: 6px 12px; background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 6px; font-size: 12px; cursor: pointer;">
                            ✓ Save
                        </button>
                        <button class="cancel-edit-btn" 
                                data-note-id="${noteId}" 
                                title="Cancel editing"
                                style="padding: 6px 12px; background: rgba(107, 114, 128, 0.2); color: #9ca3af; border: 1px solid rgba(107, 114, 128, 0.3); border-radius: 6px; font-size: 12px; cursor: pointer;">
                            ✕ Cancel
                        </button>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="note-item" data-note-id="${noteId}">
                <div class="note-header">
                    <div class="note-content-section">
                        <div class="note-title">${escapeHtml(title)}</div>
                        <div class="note-text">${escapeHtml(preview)}</div>
                    </div>
                </div>
                <div class="note-actions">
                    <button class="${isCurrentlyPlaying ? 'stop-btn' : 'play-btn'}" 
                            data-note-id="${noteId}" 
                            ${isPlaying && !isCurrentlyPlaying ? 'disabled' : ''}
                            title="${isCurrentlyPlaying ? 'Stop playing' : 'Play voice note'}">
                        ${isCurrentlyPlaying ? '⏸️ Stop' : '▶️ Play'}
                    </button>
                    <button class="edit-btn" 
                            data-note-id="${noteId}" 
                            title="Edit note title"
                            style="padding: 6px 12px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; font-size: 12px; cursor: pointer;">
                        ✏️ Edit
                    </button>
                    <button class="note-delete" data-note-id="${noteId}" title="Delete voice note">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
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
        transcript.value = '';
        transcriptSection.classList.add('show');
        isListening = true;
        recordBtn.classList.add('recording');
        recordStatus.innerHTML = '<span class="recording-indicator"></span>Listening... Click to stop';
        recordBtn.textContent = '⏹️';
        recordBtn.title = 'Click to stop recording';
        
        // Add visual pulse effect
        recordBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
        
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
    recordStatus.textContent = transcript.value.trim() ? 'Recording complete - Click to record again' : 'Click to record';
    recordBtn.textContent = '🎤';
    recordBtn.title = 'Click to start recording';
    
    // Remove pulse effect
    recordBtn.style.animation = '';
    
    // Process the recorded text if available
    if (transcript.value.trim()) {
        recordStatus.textContent = 'Recording complete - You can now save or record again';
    }
}

// Save voice note
async function saveNote() {
    const text = transcript.value.trim();
    if (!text || saving) return;
    
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        saving = true;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const title = `Voice Note - ${new Date().toLocaleString()}`;
        
        const response = await fetch(`${BACKEND_BASE}/api/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: text,
                isPinned: false,
                type: 'voice'
            })
        });
        
        if (response.status === 401) {
            // Token expired
            await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
            showLoginForm();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to save voice note');
        }
        
        const newNote = await response.json();
        
        // Add to notes array
        notes.unshift(newNote);
        
        // Clear transcript
        transcript.value = '';
        transcriptSection.classList.remove('show');
        
        // Show success feedback
        saveBtn.textContent = 'Saved!';
        saveBtn.classList.add('saved');
        
        // Re-render notes
        renderNotes();
        
        // Reset button after 2 seconds
        setTimeout(() => {
            saveBtn.textContent = 'Save Voice Note';
            saveBtn.classList.remove('saved');
        }, 2000);
        
    } catch (error) {
        console.error('Error saving voice note:', error);
        alert('Failed to save voice note. Please try again.');
    } finally {
        saving = false;
        saveBtn.disabled = false;
    }
}

// Play voice note
function playNote(noteId) {
    const note = notes.find(n => String(n._id || n.id) === String(noteId));
    if (!note || !note.content) {
        console.error('Note not found or has no content');
        return;
    }
    
    // Stop current playback if playing
    if (isPlaying && currentUtterance) {
        synth.cancel();
        isPlaying = false;
        playingNoteId = null;
        currentUtterance = null;
        
        // If clicking the same note, just stop
        if (playingNoteId === noteId) {
            renderNotes();
            return;
        }
    }
    
    // Start playing
    isPlaying = true;
    playingNoteId = noteId;
    
    const utterance = new SpeechSynthesisUtterance(note.content);
    utterance.rate = speechRate;
    utterance.lang = 'en-US';
    
    utterance.onend = () => {
        isPlaying = false;
        playingNoteId = null;
        currentUtterance = null;
        renderNotes();
    };
    
    utterance.onerror = () => {
        isPlaying = false;
        playingNoteId = null;
        currentUtterance = null;
        renderNotes();
    };
    
    currentUtterance = utterance;
    synth.speak(utterance);
    renderNotes();
}

// Start editing note title
function startEditingNote(noteId) {
    const note = notes.find(n => String(n._id || n.id) === String(noteId));
    if (!note) return;
    
    editingNoteId = noteId;
    editingTitle = note.title || 'Untitled Voice Note';
    renderNotes();
    
    // Focus the input field after render
    setTimeout(() => {
        const input = notesList.querySelector(`input[data-note-id="${noteId}"]`);
        if (input) {
            input.focus();
            input.select();
        }
    }, 50);
}

// Cancel editing
function cancelEditing() {
    editingNoteId = null;
    editingTitle = '';
    renderNotes();
}

// Save edited note title
async function saveEditedNote(noteId) {
    const input = notesList.querySelector(`input[data-note-id="${noteId}"]`);
    if (!input) return;
    
    const newTitle = input.value.trim();
    if (!newTitle) {
        alert('Please enter a title for the note.');
        input.focus();
        return;
    }
    
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        const note = notes.find(n => String(n._id || n.id) === String(noteId));
        if (!note) return;
        
        // Show loading state
        const saveBtn = notesList.querySelector(`button.save-edit-btn[data-note-id="${noteId}"]`);
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }
        
        const response = await fetch(`${BACKEND_BASE}/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: newTitle,
                content: note.content,
                color: note.color,
                isPinned: note.isPinned,
                type: note.type
            })
        });
        
        if (response.status === 401) {
            await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
            showLoginForm();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to update note title');
        }
        
        const updatedNote = await response.json();
        
        // Update the note in our local array
        const noteIndex = notes.findIndex(n => String(n._id || n.id) === String(noteId));
        if (noteIndex !== -1) {
            notes[noteIndex] = updatedNote;
        }
        
        // Exit editing mode
        editingNoteId = null;
        editingTitle = '';
        
        // Re-render notes
        renderNotes();
        
    } catch (error) {
        console.error('Error updating note title:', error);
        alert('Failed to update note title. Please try again.');
        
        // Restore button state
        const saveBtn = notesList.querySelector(`button.save-edit-btn[data-note-id="${noteId}"]`);
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '✓ Save';
        }
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!noteId) {
        console.error('No note ID provided for deletion');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this voice note?')) {
        return;
    }
    
    // Find the note item element
    const noteElement = notesList.querySelector(`[data-note-id="${noteId}"]`);
    if (noteElement) {
        noteElement.style.opacity = '0.5';
        noteElement.style.pointerEvents = 'none';
    }
    
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            if (noteElement) {
                noteElement.style.opacity = '1';
                noteElement.style.pointerEvents = 'auto';
            }
            return;
        }
        
        console.log('Deleting voice note with ID:', noteId);
        
        const response = await fetch(`${BACKEND_BASE}/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            // Token expired
            await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
            showLoginForm();
            if (noteElement) {
                noteElement.style.opacity = '1';
                noteElement.style.pointerEvents = 'auto';
            }
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete failed:', response.status, errorText);
            throw new Error(`Failed to delete voice note: ${response.status}`);
        }
        
        // Stop playing if this note is currently playing
        if (playingNoteId === noteId && isPlaying) {
            synth.cancel();
            isPlaying = false;
            playingNoteId = null;
            currentUtterance = null;
        }
        
        // Remove from notes array
        notes = notes.filter(n => String(n._id || n.id) !== String(noteId));
        
        // Re-render notes
        renderNotes();
        
        console.log('Voice note deleted successfully');
        
    } catch (error) {
        console.error('Error deleting voice note:', error);
        alert(`Failed to delete voice note: ${error.message || 'Please try again.'}`);
        
        // Restore note element if deletion failed
        if (noteElement) {
            noteElement.style.opacity = '1';
            noteElement.style.pointerEvents = 'auto';
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
recordBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

saveBtn.addEventListener('click', saveNote);

// Speech rate slider
speechRateSlider.addEventListener('input', (e) => {
    speechRate = parseFloat(e.target.value);
    rateValue.textContent = speechRate.toFixed(1);
});

// Request microphone permission button
requestMicBtn.addEventListener('click', async () => {
    await requestMicrophonePermission();
});

// Event delegation for play, edit, and delete buttons
notesList.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.play-btn, .stop-btn');
    const deleteBtn = e.target.closest('.note-delete');
    const editBtn = e.target.closest('.edit-btn');
    const saveEditBtn = e.target.closest('.save-edit-btn');
    const cancelEditBtn = e.target.closest('.cancel-edit-btn');
    
    if (playBtn) {
        e.preventDefault();
        e.stopPropagation();
        const noteId = playBtn.getAttribute('data-note-id');
        if (noteId) {
            playNote(noteId);
        }
    }
    
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const noteId = deleteBtn.getAttribute('data-note-id');
        if (noteId) {
            deleteNote(noteId);
        }
    }
    
    if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const noteId = editBtn.getAttribute('data-note-id');
        if (noteId) {
            startEditingNote(noteId);
        }
    }
    
    if (saveEditBtn) {
        e.preventDefault();
        e.stopPropagation();
        const noteId = saveEditBtn.getAttribute('data-note-id');
        if (noteId) {
            saveEditedNote(noteId);
        }
    }
    
    if (cancelEditBtn) {
        e.preventDefault();
        e.stopPropagation();
        cancelEditing();
    }
});

// Handle keyboard events for editing
notesList.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('edit-title-input')) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const noteId = e.target.getAttribute('data-note-id');
            if (noteId) {
                saveEditedNote(noteId);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing();
        }
    }
});

// Handle input changes for editing
notesList.addEventListener('input', (e) => {
    if (e.target.classList.contains('edit-title-input')) {
        editingTitle = e.target.value;
    }
});

// Login form handlers
loginSubmitBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Logging in...';
    hideError();
    
    try {
        const response = await fetch(`${BACKEND_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Store token and user data
        await chrome.storage.local.set({
            nexa_token: data.token,
            nexa_user: data.user || { email }
        });
        
        // Show voice notes content and fetch notes
        showVoiceNotesContent();
        await checkMicrophonePermission();
        setupSpeechRecognition();
        fetchNotes();
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Login';
    }
});

// Allow Enter key to submit login form
loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginSubmitBtn.click();
    }
});

loginEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginPassword.focus();
    }
});

// Helper functions
function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function hideError() {
    loginError.classList.add('hidden');
}


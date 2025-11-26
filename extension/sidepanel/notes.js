// Quick Notes Side Panel Script
const API_BASE = 'https://nexa-yp12.onrender.com/api';
const BACKEND_BASE = 'https://nexa-yp12.onrender.com';
const LOGIN_URL = 'https://nexa-nu-three.vercel.app/';
// const API_BASE = 'http://localhost:4000/api'; // Uncomment for local dev
// const BACKEND_BASE = 'http://localhost:4000'; // Uncomment for local dev

// DOM Elements
const loginForm = document.getElementById('login-form');
const notesContent = document.getElementById('notes-content');
const noteInput = document.getElementById('note-input');
const saveBtn = document.getElementById('save-btn');
const notesList = document.getElementById('notes-list');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginError = document.getElementById('login-error');

let notes = [];
let saving = false;
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
                showNotesContent();
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
                showNotesContent();
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
    notesContent.classList.add('hidden');
}

// Show notes content
function showNotesContent() {
    loginForm.classList.add('hidden');
    notesContent.classList.remove('hidden');
}

// Fetch notes from backend
async function fetchNotes() {
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        notesList.innerHTML = '<div class="loading"><span class="spinner"></span>Loading notes...</div>';
        
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
        
        notes = await response.json();
        
        // Filter out voice notes (only show text notes for Quick Notes)
        notes = notes.filter(note => !note.type || note.type === 'text');
        
        renderNotes();
    } catch (error) {
        console.error('Error fetching notes:', error);
        notesList.innerHTML = '<div class="empty-state">Failed to load notes. Please try again.</div>';
    }
}

// Render notes list
function renderNotes() {
    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-state">No notes yet. Write your first note above!</div>';
        return;
    }
    
    // Sort notes by creation date (newest first)
    const sortedNotes = [...notes].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA;
    });
    
    notesList.innerHTML = sortedNotes.map(note => {
        const title = note.title || 'Untitled';
        const content = note.content || '';
        const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
        const noteId = String(note._id || note.id || '');
        
        return `
            <div class="note-item" data-note-id="${noteId}">
                <div class="note-content">
                    <div class="note-title">${escapeHtml(title)}</div>
                    <div class="note-text">${escapeHtml(preview)}</div>
                </div>
                <button class="note-delete" data-note-id="${noteId}" title="Delete note">
                    🗑️
                </button>
            </div>
        `;
    }).join('');
}

// Save note
async function saveNote() {
    const text = noteInput.value.trim();
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
        
        // Create title from first 50 characters
        const title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        
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
                type: 'text'
            })
        });
        
        if (response.status === 401) {
            // Token expired
            await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
            showLoginForm();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to save note');
        }
        
        const newNote = await response.json();
        
        // Add to notes array
        notes.unshift(newNote);
        
        // Clear input
        noteInput.value = '';
        
        // Show success feedback
        saveBtn.textContent = 'Saved!';
        saveBtn.classList.add('saved');
        
        // Re-render notes
        renderNotes();
        
        // Reset button after 2 seconds
        setTimeout(() => {
            saveBtn.textContent = 'Save Note';
            saveBtn.classList.remove('saved');
        }, 2000);
        
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
    } finally {
        saving = false;
        saveBtn.disabled = false;
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!noteId) {
        console.error('No note ID provided for deletion');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this note?')) {
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
        
        console.log('Deleting note with ID:', noteId);
        
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
            throw new Error(`Failed to delete note: ${response.status}`);
        }
        
        // Remove from notes array (compare as strings to handle ObjectId)
        notes = notes.filter(note => String(note._id || note.id) !== String(noteId));
        
        // Re-render notes
        renderNotes();
        
        console.log('Note deleted successfully');
        
    } catch (error) {
        console.error('Error deleting note:', error);
        alert(`Failed to delete note: ${error.message || 'Please try again.'}`);
        
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
saveBtn.addEventListener('click', saveNote);

noteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveNote();
    }
});

// Event delegation for delete buttons (works even when notes are re-rendered)
notesList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.note-delete');
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const noteId = deleteBtn.getAttribute('data-note-id');
        if (noteId) {
            deleteNote(noteId);
        } else {
            console.error('Delete button clicked but no note ID found');
        }
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
        
        // Show notes content and fetch notes
        showNotesContent();
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


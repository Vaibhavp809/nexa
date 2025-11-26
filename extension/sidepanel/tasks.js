// Tasks Side Panel Script
const API_BASE = 'https://nexa-yp12.onrender.com/api';
const BACKEND_BASE = 'https://nexa-yp12.onrender.com';
const LOGIN_URL = 'https://nexa-nu-three.vercel.app/';
// const API_BASE = 'http://localhost:4000/api'; // Uncomment for local dev
// const BACKEND_BASE = 'http://localhost:4000'; // Uncomment for local dev

// DOM Elements
const loginForm = document.getElementById('login-form');
const tasksContent = document.getElementById('tasks-content');
const taskTitle = document.getElementById('task-title');
const taskDescription = document.getElementById('task-description');
const taskDueDate = document.getElementById('task-due-date');
const taskDueTime = document.getElementById('task-due-time');
const saveBtn = document.getElementById('save-btn');
const tasksList = document.getElementById('tasks-list');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginError = document.getElementById('login-error');

let tasks = [];
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
                showTasksContent();
                fetchTasks();
            } else {
                // Token invalid
                await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
                showLoginForm();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // If network error, still show tasks if we have user data
            if (user) {
                showTasksContent();
                fetchTasks();
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
    tasksContent.classList.add('hidden');
}

// Show tasks content
function showTasksContent() {
    loginForm.classList.add('hidden');
    tasksContent.classList.remove('hidden');
}

// Fetch tasks from backend
async function fetchTasks() {
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        tasksList.innerHTML = '<div class="loading"><span class="spinner"></span>Loading tasks...</div>';
        
        const response = await fetch(`${BACKEND_BASE}/api/tasks`, {
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
            throw new Error('Failed to fetch tasks');
        }
        
        tasks = await response.json();
        if (!Array.isArray(tasks)) {
            tasks = [];
        }
        
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        tasksList.innerHTML = '<div class="empty-state">Failed to load tasks. Please try again.</div>';
    }
}

// Format due date for display
function formatDueDate(dueDateString) {
    if (!dueDateString) return null;
    
    try {
        const dueDate = new Date(dueDateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            // Overdue
            return {
                text: `Overdue: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                class: 'overdue'
            };
        } else if (diffDays === 0 || (dueDateOnly.getTime() === today.getTime())) {
            // Due today
            return {
                text: `Today at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                class: 'today'
            };
        } else if (diffDays === 1) {
            // Due tomorrow
            return {
                text: `Tomorrow at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                class: 'today'
            };
        } else if (diffDays <= 7) {
            // Due this week
            return {
                text: `In ${diffDays} days (${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
                class: ''
            };
        } else {
            // Due later
            return {
                text: dueDate.toLocaleDateString() + ' ' + dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                class: ''
            };
        }
    } catch (error) {
        return {
            text: 'Invalid date',
            class: ''
        };
    }
}

// Render tasks list
function renderTasks() {
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state">No tasks yet. Create your first task above!</div>';
        return;
    }
    
    // Sort tasks: incomplete first, then by due date
    const sortedTasks = [...tasks].sort((a, b) => {
        // Incomplete tasks first
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        // Then sort by due date (soonest first)
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        // Then by creation date (newest first)
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    
    tasksList.innerHTML = sortedTasks.map(task => {
        const taskId = String(task._id || task.id || '');
        const title = task.title || 'Untitled';
        const description = task.description || '';
        const completed = task.completed || false;
        const dueDateInfo = formatDueDate(task.dueDate);
        
        return `
            <div class="task-item ${completed ? 'completed' : ''}" data-task-id="${taskId}">
                <div class="task-checkbox ${completed ? 'checked' : ''}" data-task-id="${taskId}"></div>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(title)}</div>
                    ${description ? `<div class="task-description">${escapeHtml(description)}</div>` : ''}
                    ${dueDateInfo ? `<div class="task-due-date ${dueDateInfo.class}">📅 ${dueDateInfo.text}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-delete" data-task-id="${taskId}" title="Delete task">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Save task
async function saveTask() {
    const title = taskTitle.value.trim();
    if (!title || saving) return;
    
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
        
        // Combine date and time for dueDate
        let dueDateValue = null;
        if (taskDueDate.value) {
            const dateTime = taskDueTime.value 
                ? `${taskDueDate.value}T${taskDueTime.value}` 
                : `${taskDueDate.value}T23:59`;
            dueDateValue = new Date(dateTime).toISOString();
        }
        
        const response = await fetch(`${BACKEND_BASE}/api/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                description: taskDescription.value.trim() || '',
                dueDate: dueDateValue
            })
        });
        
        if (response.status === 401) {
            // Token expired
            await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
            showLoginForm();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to save task');
        }
        
        const newTask = await response.json();
        
        // Add to tasks array
        tasks.unshift(newTask);
        
        // Clear inputs
        taskTitle.value = '';
        taskDescription.value = '';
        taskDueDate.value = '';
        taskDueTime.value = '';
        
        // Show success feedback
        saveBtn.textContent = 'Saved!';
        saveBtn.classList.add('saved');
        
        // Re-render tasks
        renderTasks();
        
        // Reset button after 2 seconds
        setTimeout(() => {
            saveBtn.textContent = 'Add Task';
            saveBtn.classList.remove('saved');
        }, 2000);
        
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task. Please try again.');
    } finally {
        saving = false;
        saveBtn.disabled = false;
    }
}

// Toggle task completion
async function toggleTaskComplete(taskId) {
    if (!taskId) {
        console.error('No task ID provided for toggle');
        return;
    }
    
    const task = tasks.find(t => String(t._id || t.id) === String(taskId));
    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }
    
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            return;
        }
        
        const newCompleted = !task.completed;
        
        const response = await fetch(`${BACKEND_BASE}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...task,
                completed: newCompleted
            })
        });
        
        if (response.status === 401) {
            // Token expired
            await chrome.storage.local.remove(['nexa_token', 'nexa_user']);
            showLoginForm();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        
        const updatedTask = await response.json();
        
        // Update task in array
        tasks = tasks.map(t => String(t._id || t.id) === String(taskId) ? updatedTask : t);
        
        // Re-render tasks
        renderTasks();
        
    } catch (error) {
        console.error('Error toggling task completion:', error);
        alert('Failed to update task. Please try again.');
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!taskId) {
        console.error('No task ID provided for deletion');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    // Find the task item element
    const taskElement = tasksList.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.style.opacity = '0.5';
        taskElement.style.pointerEvents = 'none';
    }
    
    try {
        const result = await chrome.storage.local.get(['nexa_token']);
        const token = result.nexa_token;
        
        if (!token) {
            showLoginForm();
            if (taskElement) {
                taskElement.style.opacity = '1';
                taskElement.style.pointerEvents = 'auto';
            }
            return;
        }
        
        console.log('Deleting task with ID:', taskId);
        
        const response = await fetch(`${BACKEND_BASE}/api/tasks/${taskId}`, {
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
            if (taskElement) {
                taskElement.style.opacity = '1';
                taskElement.style.pointerEvents = 'auto';
            }
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete failed:', response.status, errorText);
            throw new Error(`Failed to delete task: ${response.status}`);
        }
        
        // Remove from tasks array (compare as strings)
        tasks = tasks.filter(t => String(t._id || t.id) !== String(taskId));
        
        // Re-render tasks
        renderTasks();
        
        console.log('Task deleted successfully');
        
    } catch (error) {
        console.error('Error deleting task:', error);
        alert(`Failed to delete task: ${error.message || 'Please try again.'}`);
        
        // Restore task element if deletion failed
        if (taskElement) {
            taskElement.style.opacity = '1';
            taskElement.style.pointerEvents = 'auto';
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
saveBtn.addEventListener('click', saveTask);

taskTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        taskDescription.focus();
    }
});

taskDescription.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveTask();
    }
});

// Event delegation for checkbox clicks and delete buttons
tasksList.addEventListener('click', (e) => {
    const checkbox = e.target.closest('.task-checkbox');
    const deleteBtn = e.target.closest('.task-delete');
    
    if (checkbox) {
        e.preventDefault();
        e.stopPropagation();
        const taskId = checkbox.getAttribute('data-task-id');
        if (taskId) {
            toggleTaskComplete(taskId);
        }
    }
    
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const taskId = deleteBtn.getAttribute('data-task-id');
        if (taskId) {
            deleteTask(taskId);
        } else {
            console.error('Delete button clicked but no task ID found');
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
        
        // Show tasks content and fetch tasks
        showTasksContent();
        fetchTasks();
        
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


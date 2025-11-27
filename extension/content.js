// Nexa Extension - Simplified Content Script
(function(){
  if (window.__nexa_injected) return;
  window.__nexa_injected = true;

  // Helper function to check if extension context is valid
  function isExtensionContextValid() {
    try {
      return typeof chrome !== 'undefined' && 
             chrome.runtime && 
             chrome.runtime.id &&
             !chrome.runtime.lastError;
    } catch (e) {
      return false;
    }
  }

  // Helper function to safely send messages
  function safeSendMessage(message, callback) {
    if (!isExtensionContextValid()) {
      console.warn('Extension context invalidated, cannot send message:', message.type);
      if (callback) callback({ error: 'Extension context invalidated' });
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Message error:', chrome.runtime.lastError.message);
          if (callback) callback({ error: chrome.runtime.lastError.message });
          return;
        }
        if (callback) callback(response);
      });
    } catch (e) {
      console.warn('Failed to send message:', e);
      if (callback) callback({ error: e.message });
    }
  }

  // Helper function to safely access storage
  function safeStorageGet(keys, callback) {
    if (!isExtensionContextValid()) {
      console.warn('Extension context invalidated, cannot access storage');
      if (callback) callback({});
      return;
    }

    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          console.warn('Storage error:', chrome.runtime.lastError.message);
          if (callback) callback({});
          return;
        }
        if (callback) callback(result);
      });
    } catch (e) {
      console.warn('Failed to access storage:', e);
      if (callback) callback({});
    }
  }

  function safeStorageSet(data, callback) {
    if (!isExtensionContextValid()) {
      console.warn('Extension context invalidated, cannot set storage');
      if (callback) callback();
      return;
    }

    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          console.warn('Storage set error:', chrome.runtime.lastError.message);
        }
        if (callback) callback();
      });
    } catch (e) {
      console.warn('Failed to set storage:', e);
      if (callback) callback();
    }
  }

  // Create bubble
  const bubble = document.createElement('div');
  bubble.id = 'nexa-bubble';
  bubble.innerHTML = '<div class="inner">N</div>';
  bubble.setAttribute('title', 'Nexa AI Assistant');
  
  // Load saved icon and update bubble
  safeStorageGet(['nexa.bubble.icon'], (result) => {
    const icon = result && result['nexa.bubble.icon'] || 'bot';
    const iconMap = {
      'bot': '🤖',
      'sparkles': '✨',
      'zap': '⚡',
      'circle': '●'
    };
    const iconEmoji = iconMap[icon] || 'N';
    const inner = bubble.querySelector('.inner');
    if (inner) {
      inner.textContent = iconEmoji;
    }
  });

  // Feature menu container (will be positioned smartly)
  const semi = document.createElement('div');
  semi.id = 'nexa-semicircle';
  semi.className = 'nexa-menu';

  // Translations for bubble features (simplified for content script)
  const featureTranslations = {
    en: {
      summarize: 'Summarize',
      translate: 'Translate',
      quicknotes: 'Quick Notes',
      voicenotes: 'Voice Notes',
      voicesearch: 'Voice Search',
      tasks: 'Tasks',
      settings: 'Settings'
    },
    hi: {
      summarize: 'सारांश',
      translate: 'अनुवाद',
      quicknotes: 'त्वरित नोट्स',
      voicenotes: 'वॉइस नोट्स',
      voicesearch: 'वॉइस खोज',
      tasks: 'कार्य',
      settings: 'सेटिंग्स'
    },
    mr: {
      summarize: 'सारांश',
      translate: 'भाषांतर',
      quicknotes: 'त्वरित नोट्स',
      voicenotes: 'व्हॉइस नोट्स',
      voicesearch: 'व्हॉइस शोध',
      tasks: 'कार्ये',
      settings: 'सेटिंग्ज'
    },
    kn: {
      summarize: 'ಸಾರಾಂಶ',
      translate: 'ಅನುವಾದ',
      quicknotes: 'ತ್ವರಿತ ಟಿಪ್ಪಣಿಗಳು',
      voicenotes: 'ವಾಯ್ಸ್ ಟಿಪ್ಪಣಿಗಳು',
      voicesearch: 'ವಾಯ್ಸ್ ಹುಡುಕಾಟ',
      tasks: 'ಕಾರ್ಯಗಳು',
      settings: 'ಸೆಟ್ಟಿಂಗ್ಗಳು'
    }
  };

  // Function to get translated feature name
  function getFeatureTranslation(featureKey, lang) {
    const langTranslations = featureTranslations[lang] || featureTranslations['en'];
    return langTranslations[featureKey] || featureKey;
  }

  // Feature buttons (will be translated after language loads)
  const features = [
    { id: 'feat-summarize', key: 'summarize', label: 'Summ', title: 'Summarize', icon: '📝' },
    { id: 'feat-translate', key: 'translate', label: 'Trans', title: 'Translate', icon: '🌐' },
    { id: 'feat-notes', key: 'quicknotes', label: 'Notes', title: 'Quick Notes', icon: '📋' },
    { id: 'feat-tasks', key: 'tasks', label: 'Tasks', title: 'Task Reminder', icon: '✅' },
    { id: 'feat-voice', key: 'voicenotes', label: 'Voice', title: 'Voice Notes', icon: '🎤' },
    { id: 'feat-search', key: 'voicesearch', label: 'Search', title: 'Voice Search', icon: '🔍' },
    { id: 'feat-settings', key: 'settings', label: '⚙️', title: 'Settings', icon: '⚙️' }
  ];

  // Function to update feature labels with translations
  function updateFeatureTranslations(lang) {
    features.forEach((f, idx) => {
      const btn = document.getElementById(f.id);
      if (btn) {
        const translatedTitle = getFeatureTranslation(f.key, lang);
        btn.setAttribute('title', translatedTitle);
        // Update label if it's not an icon-only button
        if (f.id !== 'feat-settings') {
          const span = btn.querySelector('span');
          if (span && span.textContent !== f.icon) {
            // Keep short label format, but update title
            // For longer feature names, use first 4-5 chars
            const shortLabel = translatedTitle.length > 5 
              ? translatedTitle.substring(0, 5) 
              : translatedTitle;
            // span.textContent = shortLabel;
          }
        }
      }
    });
  }

  features.forEach((f, idx) => {
    const btn = document.createElement('button');
    btn.className = 'nexa-feature f' + (idx + 1);
    btn.id = f.id;
    btn.title = f.title;
    btn.innerHTML = '<span>' + (f.icon || f.label) + '</span>';
    semi.appendChild(btn);

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      semi.classList.remove('open');
      
      // Visual feedback animation (like reference)
      btn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.9)' },
        { transform: 'scale(1)' }
      ], { duration: 220 });
      
      // Show quick tooltip (like reference)
      const tooltip = document.createElement('div');
      tooltip.textContent = f.title + ' triggered';
      tooltip.style.cssText = `
        position: fixed;
        right: ${(parseInt(getComputedStyle(bubble).right) || 20) + 80}px;
        bottom: ${(parseInt(getComputedStyle(bubble).bottom) || 20) + 10}px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 6px 8px;
        border-radius: 6px;
        z-index: 2147483647;
        font-size: 12px;
        font-family: Arial, sans-serif;
      `;
      document.documentElement.appendChild(tooltip);
      setTimeout(() => tooltip.remove(), 900);
      
      if (f.id === 'feat-settings') {
        // Open settings in side panel
        safeSendMessage({ type: 'open_side_panel', page: 'settings' });
      } else if (f.id === 'feat-translate') {
        // For translate, enable text selection mode
        enableTextSelectionMode('translate');
        
        // Send message to background to notify side panel
        safeSendMessage({ 
          toSidePanel: true,
          feature: f.id,
          label: f.label,
          mode: 'translate'
        });
        
        // Open translate page in side panel
        safeSendMessage({ type: 'open_side_panel', page: 'translate' });
      } else if (f.id === 'feat-notes') {
        // Open notes page in side panel
        safeSendMessage({ type: 'open_side_panel', page: 'notes' });
      } else if (f.id === 'feat-tasks') {
        // Open tasks page in side panel
        safeSendMessage({ type: 'open_side_panel', page: 'tasks' });
      } else if (f.id === 'feat-voice') {
        // Open voice notes page in side panel
        safeSendMessage({ type: 'open_side_panel', page: 'voicenotes' });
      } else if (f.id === 'feat-search') {
        // Open voice search page in side panel
        safeSendMessage({ type: 'open_side_panel', page: 'voicesearch' });
      } else if (f.id === 'feat-summarize') {
        // For summarizer, enable text selection mode
        enableTextSelectionMode('summarize');
        
        // Send message to background to notify side panel
        safeSendMessage({ 
          toSidePanel: true,
          feature: f.id,
          label: f.label,
          mode: 'summarize'
        });
        
        // Open chat in side panel for features
        safeSendMessage({ type: 'open_side_panel', page: 'chat' });
      } else {
        // Send message to background to notify side panel (like reference)
        safeSendMessage({ 
          toSidePanel: true,
          feature: f.id,
          label: f.label 
        });
        
        // Open chat in side panel for features
        safeSendMessage({ type: 'open_side_panel', page: 'chat' });
      }
    });
  });

  // Attach to document
  document.documentElement.appendChild(bubble);
  document.documentElement.appendChild(semi);

  // Dragging logic - simple pointer events approach
  let isDragging = false;
  let startX, startY, origRight, origBottom;
  
  bubble.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // Only left click
    isDragging = true;
    bubble.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    const rect = bubble.getBoundingClientRect();
    origRight = window.innerWidth - rect.right;
    origBottom = window.innerHeight - rect.bottom;
    bubble.style.cursor = 'grabbing';
  });

  document.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = startX - e.clientX;
    const dy = startY - e.clientY;
    const newRight = origRight + dx;
    const newBottom = origBottom + dy;
    
    // Clamp to viewport
    const margin = 10;
    const maxRight = window.innerWidth - bubble.offsetWidth - margin;
    const maxBottom = window.innerHeight - bubble.offsetHeight - margin;
    
    bubble.style.right = Math.max(margin, Math.min(newRight, maxRight)) + 'px';
    bubble.style.bottom = Math.max(margin, Math.min(newBottom, maxBottom)) + 'px';
    
    // Move semicircle to follow bubble
    semi.style.right = bubble.style.right;
    semi.style.bottom = bubble.style.bottom;
    
    // Update feature positions during drag
    updateFeaturePositions();
    
    // Save position (throttled to avoid too many storage writes)
    if (!window.positionSaveTimeout) {
      window.positionSaveTimeout = setTimeout(() => {
        safeStorageSet({
          'nexa.bubble.pos': {
            right: bubble.style.right,
            bottom: bubble.style.bottom
          }
        });
        window.positionSaveTimeout = null;
      }, 200);
    }
  });

  document.addEventListener('pointerup', (e) => {
    if (isDragging) {
      isDragging = false;
      bubble.style.cursor = 'grab';
      // Update feature positions after drag ends
      setTimeout(updateFeaturePositions, 50);
    }
  });

  // Smart positioning: Update feature positions based on bubble location
  const updateFeaturePositions = () => {
    const rect = bubble.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bubbleCenterX = rect.left + rect.width / 2;
    const bubbleCenterY = rect.top + rect.height / 2;
    
    // Determine if bubble is on left or right side
    const isOnLeft = bubbleCenterX < viewportWidth / 2;
    
    // Determine if bubble is in upper half
    const isInUpperHalf = bubbleCenterY < viewportHeight / 2;
    
    // Calculate distance from edges
    const distanceFromTop = rect.top;
    const distanceFromBottom = viewportHeight - rect.bottom;
    
    // Decide positioning
    let featuresDirection = 'left'; // Default: features appear to left of bubble
    let verticalDirection = 'up'; // Default: features stack upward
    
    if (isOnLeft) {
      // Bubble on left side → features appear on right
      featuresDirection = 'right';
    } else {
      // Bubble on right side → features appear on left
      featuresDirection = 'left';
    }
    
    // If bubble is in upper corners, features should go downward
    if (isInUpperHalf && distanceFromTop < 150) {
      verticalDirection = 'down';
    } else if (!isInUpperHalf && distanceFromBottom < 150) {
      verticalDirection = 'up';
    }
    
    // Apply positioning classes
    semi.className = 'nexa-menu';
    semi.classList.add(featuresDirection);
    semi.classList.add(verticalDirection);
    
    // Update semi position to match bubble
    semi.style.right = (window.innerWidth - rect.right) + 'px';
    semi.style.bottom = (window.innerHeight - rect.bottom) + 'px';
  };
  
  // Load saved language and apply translations to features
  safeStorageGet(['nexa.preferredLanguage'], (langResult) => {
    const currentLang = (langResult && langResult['nexa.preferredLanguage']) || 'en';
    updateFeatureTranslations(currentLang);
    
    // Listen for language changes
    if (isExtensionContextValid()) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes['nexa.preferredLanguage']) {
          const newLang = changes['nexa.preferredLanguage'].newValue || 'en';
          updateFeatureTranslations(newLang);
        }
      });
    }
  });

  // Load saved position and then update feature positions
  safeStorageGet(['nexa.bubble.pos'], (result) => {
    if (result && result['nexa.bubble.pos']) {
      const pos = result['nexa.bubble.pos'];
      if (pos.right) bubble.style.right = pos.right;
      if (pos.bottom) bubble.style.bottom = pos.bottom;
      // Update semicircle position
      semi.style.right = bubble.style.right;
      semi.style.bottom = bubble.style.bottom;
    }
    // Update feature positions after loading saved position
    setTimeout(updateFeaturePositions, 100);
  });
  
  // Initialize and update on resize/drag
  updateFeaturePositions();
  window.addEventListener('resize', updateFeaturePositions);
  

  // Click bubble toggles feature menu (like reference)
  bubble.addEventListener('click', (e) => {
    if (isDragging) return; // Don't toggle if dragging
    // Update positions before opening to ensure correct placement
    updateFeaturePositions();
    semi.classList.toggle('open');
  });

  // Right-click also toggles (for accessibility, like reference)
  bubble.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    semi.classList.toggle('open');
  });

  // Close semicircle when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!bubble.contains(e.target) && !semi.contains(e.target)) {
      semi.classList.remove('open');
    }
  }, true);

  // Text selection mode for summarizer
  let textSelectionMode = false;
  let selectionHandler = null;
  let activeTextSelectionFeature = 'summarize'; // Track which feature is using text selection
  
  function enableTextSelectionMode(feature = 'summarize') {
    if (textSelectionMode) return; // Already enabled
    
    textSelectionMode = true;
    activeTextSelectionFeature = feature;
    
    // Show visual indicator
    const indicator = document.createElement('div');
    indicator.id = 'nexa-selection-indicator';
    const indicatorText = feature === 'translate' 
      ? '🌐 Select text to translate' 
      : '📝 Select text to summarize';
    indicator.textContent = indicatorText;
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 2147483647;
      font-size: 14px;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      animation: fadeInOut 3s ease-in-out;
    `;
    
    // Add fade animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        20%, 80% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    
    // Remove indicator after 3 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 3000);
    
    // Listen for text selection
    selectionHandler = (e) => {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && selectedText.length > 0) {
          // Send selected text to service worker with active feature
          safeSendMessage({
            type: 'text_selected',
            text: selectedText,
            feature: activeTextSelectionFeature
          });
          
          // Show feedback that text was captured
          const feedback = document.createElement('div');
          const feedbackText = activeTextSelectionFeature === 'translate'
            ? '✓ Text captured! Opening translate panel...'
            : '✓ Text captured! Opening side panel...';
          feedback.textContent = feedbackText;
          feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(34, 197, 94, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 2147483647;
            font-size: 13px;
            font-family: Arial, sans-serif;
          `;
          document.body.appendChild(feedback);
          setTimeout(() => feedback.remove(), 2000);
          
          // Disable text selection mode after selection
          disableTextSelectionMode();
          
          // Clear selection
          selection.removeAllRanges();
        }
      }, 100);
    };
    
    document.addEventListener('mouseup', selectionHandler, true);
    
    // Disable after 30 seconds if no selection
    setTimeout(() => {
      if (textSelectionMode) {
        disableTextSelectionMode();
      }
    }, 30000);
  }
  
  // Task notification system
  let taskNotification = null;
  let taskCheckInterval = null;
  
  async function checkUpcomingTasks() {
    try {
      // Check if user is authenticated first
      safeStorageGet(['nexa_token'], async (result) => {
        if (!result || !result.nexa_token) {
          return; // Not logged in, skip task check
        }
        
        // Fetch tasks via service worker to avoid CORS issues
        safeSendMessage({ type: 'fetch_tasks' }, (response) => {
          if (!response || !response.ok) {
            // Silently fail - tasks endpoint might not be available or user not authenticated
            return;
          }
          
          const data = response.data;
          if (!data) return;
          
          const tasks = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          if (tasks.length === 0) return;
          
          const now = new Date();
          const upcomingTasks = [];
          
          tasks.forEach(task => {
            if (task && task.dueDate && !task.completed) {
              try {
                const dueDate = new Date(task.dueDate);
                if (!isNaN(dueDate.getTime())) {
                  const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
                  
                  // Show notification if task is due within 24 hours and not overdue
                  if (hoursUntilDue <= 24 && hoursUntilDue >= 0) {
                    const daysUntilDue = hoursUntilDue / 24;
                    upcomingTasks.push({
                      id: task._id || task.id,
                      title: task.title || 'Untitled Task',
                      dueDate: task.dueDate,
                      hoursUntilDue: hoursUntilDue,
                      daysUntilDue: daysUntilDue
                    });
                  }
                }
              } catch (err) {
                console.error('Error processing task:', err);
              }
            }
          });
          
          // Show notification for the most urgent task
          if (upcomingTasks.length > 0) {
            // Sort by urgency (soonest first)
            upcomingTasks.sort((a, b) => a.hoursUntilDue - b.hoursUntilDue);
            showTaskNotification(upcomingTasks[0]);
          }
        });
      });
    } catch (error) {
      // Silently fail
      console.log('Task check error:', error.message);
    }
  }
  
  function showTaskNotification(task) {
    // Remove existing notification if any
    if (taskNotification) {
      taskNotification.remove();
      taskNotification = null;
    }
    
    // Calculate time remaining
    const hours = Math.floor(task.hoursUntilDue);
    const minutes = Math.floor((task.hoursUntilDue - hours) * 60);
    let timeText = '';
    if (task.daysUntilDue < 1) {
      if (hours > 0) {
        timeText = `Due in ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        timeText = `Due in ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      if (hours === 0 && minutes === 0) {
        timeText = 'Due today';
      }
    } else {
      timeText = `Due in ${Math.ceil(task.daysUntilDue)} day${Math.ceil(task.daysUntilDue) > 1 ? 's' : ''}`;
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'nexa-task-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">⏰</div>
        <div class="notification-text">
          <div class="notification-title">${escapeHtml(task.title)}</div>
          <div class="notification-time">${timeText}</div>
        </div>
        <button class="notification-close" aria-label="Close">×</button>
      </div>
    `;
    
    // Position notification above bubble (centered horizontally)
    const bubbleRect = bubble.getBoundingClientRect();
    const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
    notification.style.cssText = `
      position: fixed;
      bottom: ${window.innerHeight - bubbleRect.top + 10}px;
      left: ${bubbleCenterX}px;
      transform: translateX(-50%);
      z-index: 2147483648;
      pointer-events: auto;
      animation: notificationSlideIn 0.3s ease-out;
    `;
    
    // Add click handler to open tasks
    notification.addEventListener('click', (e) => {
      if (!e.target.classList.contains('notification-close')) {
        safeSendMessage({
          type: 'open_side_panel',
          page: 'tasks'
        });
        notification.remove();
        taskNotification = null;
      }
    });
    
    // Close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notification.remove();
      taskNotification = null;
    });
    
    // Add to page
    document.body.appendChild(notification);
    taskNotification = notification;
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (taskNotification === notification) {
        notification.style.animation = 'notificationSlideOut 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
          if (taskNotification === notification) {
            taskNotification = null;
          }
        }, 300);
      }
    }, 10000);
  }
  
  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Start task checking (check immediately, then every minute)
  checkUpcomingTasks();
  taskCheckInterval = setInterval(checkUpcomingTasks, 60000); // Check every minute
  
  function disableTextSelectionMode() {
    textSelectionMode = false;
    if (selectionHandler) {
      document.removeEventListener('mouseup', selectionHandler, true);
      selectionHandler = null;
    }
    
    // Remove indicator if still present
    const indicator = document.getElementById('nexa-selection-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Listen for messages from service worker and settings
  if (isExtensionContextValid()) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.type === 'text_selected') {
          // Handle text selection if needed
          console.log('Text selected:', message.text);
        }
        
        if (message && message.type === 'disable_text_selection') {
          disableTextSelectionMode();
        }
        
        if (message && message.type === 'bubble_enabled_changed') {
          // Handle bubble enable/disable from settings
          if (message.enabled) {
            bubble.style.display = 'flex';
            bubble.style.opacity = '1';
            bubble.style.pointerEvents = 'auto';
          } else {
            bubble.style.display = 'none';
            semi.style.display = 'none';
          }
        }
        
        if (message && message.type === 'bubble_icon_changed') {
          // Handle bubble icon change from settings
          const iconMap = {
            'bot': '🤖',
            'sparkles': '✨',
            'zap': '⚡',
            'circle': '●'
          };
          const iconEmoji = iconMap[message.icon] || 'N';
          bubble.querySelector('.inner').textContent = iconEmoji;
        }
        
        if (message && message.type === 'language_changed') {
          // Handle language change - could trigger page reload or UI update
          console.log('Language changed to:', message.language);
        }
        
        return true; // Keep channel open for async responses
      });
    } catch (e) {
      console.warn('Failed to set up message listener:', e);
    }
  }
  
  // Check bubble enabled state on load
  safeStorageGet(['nexa.bubble.enabled'], (result) => {
    const isEnabled = result && result['nexa.bubble.enabled'] !== false;
    if (!isEnabled) {
      bubble.style.display = 'none';
      semi.style.display = 'none';
    }
  });
  
  // Check bubble icon on load
  safeStorageGet(['nexa.bubble.icon'], (result) => {
    const icon = result && result['nexa.bubble.icon'] || 'bot';
    const iconMap = {
      'bot': '🤖',
      'sparkles': '✨',
      'zap': '⚡',
      'circle': '●'
    };
    const iconEmoji = iconMap[icon] || 'N';
    if (bubble.querySelector('.inner')) {
      bubble.querySelector('.inner').textContent = iconEmoji;
    }
  });

})();

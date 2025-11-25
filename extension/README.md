# Chrome Extension Installation & Usage Guide

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from your project: `c:/nexa-auth-groq/extension/`
5. The Nexa extension should now appear in your extensions list

### 2. Pin the Extension (Optional)

- Click the puzzle icon in Chrome toolbar
- Find "Nexa AI Assistant"
- Click the pin icon to keep it visible

## Usage

### First Time Setup

1. **Login to Nexa**:
   - Click the Nexa bubble on any webpage
   - Click the "Login" button in Settings tab
   - A new tab will open to `https://nexa-nu-three.vercel.app/login`
   - Login or register with your credentials

2. **Copy Token to Extension**:
   After logging in on the web app, you need to copy your token to the extension:
   
   **Option A - Manual (Current)**:
   - Open browser console (F12) on the Nexa web app
   - Run this command:
     ```javascript
     // Copy token from web app to extension
     const token = localStorage.getItem('token');
     chrome.storage.local.set({ nexa_token: token }, () => {
       console.log('Token copied to extension!');
     });
     ```
   
   **Option B - Automatic (Future)**:
   - A "Copy to Extension" button will be added to the web app

3. **Verify Login**:
   - Go back to any webpage with the bubble
   - Try using Chat or Summarize
   - If it works, you're logged in!

### Features

#### 1. **Floating Bubble**
- Appears on every webpage (bottom-right corner)
- Click to expand/collapse
- Drag to reposition (position persists across pages)

#### 2. **Text Selection**
- Select any text on a webpage
- Right-click → "Summarize with Nexa"
- Bubble opens with text pre-filled in Summarize tab

#### 3. **Chat**
- Ask questions and get AI responses
- Conversation history maintained during session

#### 4. **Summarize**
- Paste or type text
- Click "Summarize" to get concise summary
- Works with selected text from context menu

#### 5. **Translate**
- Select target language
- Enter text to translate
- Supports: Spanish, French, German, Chinese, Japanese, Hindi

#### 6. **Notes**
- Quick notes that persist in extension storage
- Click "Save Notes" to store

#### 7. **Settings**
- **Enable/Disable Bubble**: Toggle bubble visibility
- **Reset Position**: Reset bubble to default position
- **Logout**: Clear stored token

## Troubleshooting

### Extension Not Loading
- **Error**: "Manifest file is missing or unreadable"
  - **Fix**: Ensure you selected the `extension/` folder, not a parent folder

### Bubble Not Appearing
- Check if bubble is enabled in Settings
- Refresh the webpage (Ctrl+R or Cmd+R)
- Check browser console for errors (F12 → Console)

### "Please log in" Error
- **Cause**: No JWT token stored
- **Fix**: 
  1. Click "Login" button in bubble
  2. Login at `https://nexa-nu-three.vercel.app/login`
  3. Manually set token:
     ```javascript
     // In browser console on any page:
     chrome.storage.local.set({ nexa_token: 'YOUR_JWT_TOKEN_HERE' });
     ```

### API Calls Failing
- **CORS Error**:
  - **Fix**: Backend must allow `chrome-extension://` origins
  - Check `backend/index.js` CORS configuration
  - Restart backend server after changes

- **401 Unauthorized**:
  - **Fix**: Token expired or invalid
  - Logout and login again

### Context Menu Not Working
- **Fix**: Reload extension
  - Go to `chrome://extensions/`
  - Click reload icon on Nexa extension

### Button Disappears When Disabled
- **This bug is fixed!** Buttons now use `disabled` attribute + CSS classes
- If you still see this, check browser console for errors

## Development

### Local Backend
To use local backend instead of production:

1. Edit `extension/service-worker.js`:
   ```javascript
   const BACKEND_BASE = 'http://localhost:4000'; // Uncomment this line
   // const BACKEND_BASE = 'https://nexa-yp12.onrender.com'; // Comment this line
   ```

2. Reload extension in `chrome://extensions/`

### Debugging
- **Service Worker Logs**: `chrome://extensions/` → Click "service worker" link under Nexa extension
- **Content Script Logs**: F12 → Console on any webpage
- **Bubble Iframe Logs**: F12 → Console → Select iframe context from dropdown

## Uninstallation

1. Go to `chrome://extensions/`
2. Find "Nexa AI Assistant"
3. Click "Remove"

---

## Quick Reference

| Feature | Shortcut |
|---------|----------|
| Open Bubble | Click floating icon |
| Summarize Selection | Right-click → "Summarize with Nexa" |
| Close Bubble | Click X button or collapse icon |
| Reset Position | Settings → Reset Position |

**Support**: For issues, check browser console (F12) for error messages.

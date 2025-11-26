# Nexa Browser Extension

A browser extension that provides a floating AI assistant bubble on all web pages with full functionality from the Nexa frontend application.

## Features

### Floating Bubble
- **Accessible on all web pages** - The bubble appears on every webpage you visit
- **Draggable** - Move the bubble anywhere on the screen
- **All Frontend Features**:
  - Summarize text (select text on page and auto-populate)
  - Translate text (voice and text modes)
  - Quick Notes (save notes directly)
  - Voice Notes (record and transcribe)
  - Voice Search (search with voice)
  - Tasks (create and manage tasks)
  - Settings (configure extension)

### Side Panel Chat
- **Dedicated Chat Interface** - Clicking "Chat" in the bubble opens a side panel
- **Full-screen chat experience** - Better for longer conversations
- **Chat and Summarize modes** - Switch between chat and summarization

### Authentication
- **Login/Logout in Settings** - Manage your authentication token
- **Token Recognition** - Extension uses your login token for all API calls
- **Settings Page** - Access via extension options or bubble settings

## Installation

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. The extension will be installed and the bubble will appear on all pages

## Usage

### First Time Setup
1. Click the extension icon or open the bubble
2. Go to Settings tab
3. Click "Login" or use the Options page
4. Enter your Nexa account credentials
5. Start using all features!

### Using the Bubble
- **Click the bubble** to open the feature menu
- **Click any feature icon** to use that feature
- **Click Chat** to open the side panel for chat
- **Drag the bubble** to reposition it anywhere on the page

### Using Side Panel Chat
- Click "Chat" in the bubble to open the side panel
- Type your message or paste text to summarize
- Switch between "Chat" and "Summarize" modes
- Chat history is saved automatically

### Using Features
- **Summarize**: Select text on any webpage, then click the bubble and go to Summarize
- **Translate**: Enter text or use voice input to translate between languages
- **Quick Notes**: Save quick notes that sync with your account
- **Voice Notes**: Record voice notes that are transcribed and saved
- **Voice Search**: Use voice to search on Google
- **Tasks**: Create tasks with deadlines and get reminders

## Settings

Access settings via:
- Extension Options page (right-click extension icon → Options)
- Bubble Settings tab

In settings you can:
- Login/Logout
- Enable/Disable bubble
- Reset bubble position
- Manage your account

## Development

### File Structure
```
extension/
├── manifest.json          # Extension manifest
├── service-worker.js      # Background service worker
├── content.js            # Content script (injects bubble)
├── content.css           # Bubble styles
├── options.html          # Settings/Login page
├── options.js            # Settings page logic
├── bubble/               # Bubble UI
│   ├── index.html
│   ├── index.js
│   └── index.css
├── sidepanel/            # Side panel for chat
│   ├── chat.html
│   └── chat.js
└── icons/                # Extension icons
```

### API Endpoints Used
- `/api/auth/login` - User authentication
- `/api/auth/me` - Get user info
- `/api/groq/generate` - AI chat/summarize
- `/api/notes/*` - Notes management
- `/api/tasks/*` - Tasks management

### Configuration
Update API URLs in:
- `service-worker.js` - `BACKEND_BASE`
- `options.js` - `API_BASE`
- `sidepanel/chat.js` - `API_BASE`

## Permissions

The extension requires these permissions:
- `storage` - Save user settings and data
- `scripting` - Inject content scripts
- `activeTab` - Access current tab
- `contextMenus` - Right-click context menu
- `tabs` - Tab management
- `cookies` - Sync authentication
- `sidePanel` - Side panel functionality
- `host_permissions` - Access to backend APIs

## Troubleshooting

### Bubble not appearing
- Check if bubble is enabled in Settings
- Try refreshing the page
- Check browser console for errors

### Not authenticated
- Go to Settings and login
- Check if token is valid
- Try logging out and logging back in

### Side panel not opening
- Ensure you're using Chrome/Edge with side panel support
- Try clicking the extension icon instead
- Check browser console for errors

## License

Part of the Nexa project.

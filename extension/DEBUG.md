# Debugging the Extension

## If bubble is not appearing:

1. **Check Browser Console**
   - Open any webpage
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Look for "Nexa content script loaded" message

2. **Check Extension Console**
   - Go to `chrome://extensions/`
   - Find "Nexa AI Assistant"
   - Click "service worker" or "background page"
   - Check for errors

3. **Verify Bubble is Enabled**
   - Right-click extension icon → Options
   - Check "Enable floating bubble" checkbox
   - Save and refresh the page

4. **Check Content Script Injection**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Errors" button next to extension
   - Look for content script errors

5. **Verify Files Exist**
   - Check that `extension/bubble/index.html` exists
   - Check that `extension/bubble/index.js` exists
   - Check that `extension/bubble/index.css` exists

6. **Test on Different Page**
   - Try on `https://example.com`
   - Try on `https://google.com`
   - Some pages may block iframes

## If side panel is not opening:

1. **Check Side Panel Support**
   - Ensure you're using Chrome 114+ or Edge 114+
   - Older browsers don't support side panel

2. **Check Service Worker**
   - Open extension service worker console
   - Look for errors
   - Verify `chrome.sidePanel` is available

3. **Manual Test**
   - Right-click extension icon
   - Select "Side panel" option (if available)
   - Or use keyboard shortcut

4. **Check manifest.json**
   - Verify `"sidePanel"` permission is present
   - Verify `"side_panel"` section exists
   - Verify path is correct: `"sidepanel/chat.html"`

## Common Issues:

### Issue: "Cannot read property 'appendChild' of null"
- **Fix**: Content script running before body exists
- **Solution**: Already handled with MutationObserver

### Issue: "Failed to load resource: chrome-extension://..."
- **Fix**: File path incorrect or missing
- **Solution**: Verify file paths in manifest.json

### Issue: "Refused to frame" or CSP errors
- **Fix**: Some websites block iframes
- **Solution**: Use different injection method (shadow DOM)

### Issue: Side panel opens but shows blank
- **Fix**: HTML/JS errors in side panel
- **Solution**: Check side panel console for errors

## Testing Steps:

1. Load extension
2. Open any website (e.g., google.com)
3. Check console for "Nexa content script loaded"
4. Look for bubble in bottom-right corner
5. Click extension icon → side panel should open
6. Click bubble → should expand panel


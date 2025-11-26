# Troubleshooting Guide

## Bubble Not Appearing

### Check Console
1. Open any webpage
2. Press F12 → Console tab
3. Look for: "Nexa content script loaded on: [URL]"
4. Look for: "Nexa bubble created successfully"

### Verify Extension is Loaded
1. Go to `chrome://extensions/`
2. Find "Nexa AI Assistant"
3. Make sure it's enabled (toggle ON)
4. Check for any errors (red icon)

### Check Bubble is Enabled
1. Right-click extension icon → Options
2. Verify "Enable floating bubble" is checked
3. Or check bubble settings in the bubble itself

### Manual Test
1. Open browser console on any page
2. Type: `document.getElementById('nexa-bubble-root')`
3. Should return the bubble element

## Side Panel Not Opening

### Check Browser Version
- Chrome 114+ or Edge 114+ required
- Older versions don't support side panel

### Verify Side Panel Permission
- Check `manifest.json` has `"sidePanel"` permission
- Reload extension after changes

### Test Side Panel
1. Right-click extension icon
2. Select "Side panel" option (if available)
3. Or click extension icon directly

## Connection Error Fix

The error "Could not establish connection. Receiving end does not exist" means:
- Service worker might not be running
- Message listener not properly set up

### Fix:
1. Reload extension: `chrome://extensions/` → Reload button
2. Check service worker: Click "service worker" link in extension details
3. Verify no errors in service worker console

## Common Issues

### Issue: Bubble appears but doesn't expand
- **Fix**: Check iframe is loading correctly
- Check browser console for iframe errors
- Verify `bubble/index.html` exists

### Issue: Side panel shows blank
- **Fix**: Check side panel console (F12 in side panel)
- Verify `sidepanel/chat.html` exists
- Check for JavaScript errors

### Issue: Features don't work
- **Fix**: Make sure you're logged in
- Open side panel and check login status
- Try logging in again

## Debug Steps

1. **Reload Extension**
   ```
   chrome://extensions/ → Reload extension
   ```

2. **Clear Storage**
   ```
   chrome://extensions/ → Details → Inspect views: service worker
   → Application tab → Clear storage
   ```

3. **Check Files**
   - Verify all files exist in extension folder
   - Check file paths in manifest.json

4. **Test on Simple Page**
   - Try on `https://example.com`
   - Some sites block iframes/content scripts


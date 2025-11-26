# Token Storage Fix

## Issue
Token is saved after login but service worker can't find it.

## Fixes Applied

1. **Added logging** to verify token is saved after login
2. **Notify service worker** explicitly when token is set
3. **Enhanced logging** in service worker to track token access
4. **Storage change listener** to debug token storage/retrieval

## Testing Steps

1. **Reload extension**: `chrome://extensions/` → Reload

2. **Open side panel** and login:
   - Click extension icon
   - Enter email/password
   - Click Login

3. **Check console logs**:
   - Side panel console: Should see "Token saved successfully: true"
   - Service worker console: Should see "Token changed: exists"
   - Should see "Token set in service worker storage"

4. **Test features**:
   - Try summarize in bubble
   - Try chat in side panel
   - Check service worker logs for "Checking token for Groq request"

## If Token Still Not Found

1. Check service worker console:
   - Right-click extension → Inspect → Service worker
   - Look for token-related logs

2. Check storage directly:
   - Service worker console, type:
     ```javascript
     chrome.storage.local.get(['nexa_token'], (r) => console.log(r));
     ```

3. Verify login response:
   - Check side panel console for login response
   - Verify `data.token` exists in response

4. Manual token check:
   - After login, in side panel console:
     ```javascript
     chrome.storage.local.get(['nexa_token'], (r) => console.log('Token:', r));
     ```


# Bubble Status

## ✅ What's Working
1. **Bubble is draggable** - Position saved and restored
2. **API calls working** - Summarize and Translate features functional
3. **Basic structure** - Bubble container and iframe set up

## 🔄 What Needs to be Done
1. **Semicircle Menu** - Currently missing. Need to:
   - Show menu when bubble is clicked (not expand to panel)
   - Display feature icons in semicircle around bubble
   - Position menu based on bubble location (left/right/center)

2. **Feature Panel Expansion** - Currently shows tabbed panel, need to:
   - Expand to show selected feature's panel when menu item clicked
   - Include all features: Summarize, Translate, Quick Notes, Voice Notes, Voice Search, Tasks, Settings

3. **Missing Features** - Need to add:
   - Voice Notes (with TTS playback)
   - Voice Search (redirect to browser search)
   - Tasks (with reminders)

## Implementation Plan
The semicircle menu requires significant refactoring of the bubble UI. The current structure expands directly to a panel, but we need:
1. Click bubble → Show semicircle menu
2. Click menu item → Expand bubble to show feature panel
3. Close panel → Return to bubble icon

This matches the frontend behavior in `Bubble.jsx`.


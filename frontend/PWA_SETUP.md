# PWA Setup Instructions

## ✅ Completed Steps

1. **Icons copied** - The icons have been successfully copied to:
   - `/public/favicon.ico` (from fevicon_nexa.png)
   - `/public/icons/icon-192x192.png`
   - `/public/icons/icon-512x512.png`

2. **Manifest.json created** - PWA manifest file is configured in `/public/manifest.json`

3. **Service Worker registered** - Service worker is set up in `/public/sw.js`

4. **Vite PWA plugin configured** - PWA plugin is installed and configured in `vite.config.js`

5. **Mobile responsive styles** - Bubble and all components are now mobile-friendly

## 📱 Installing the PWA

### On Mobile (Chrome/Edge):
1. Open the app in Chrome or Edge browser
2. You'll see an "Install" prompt or an install icon in the address bar
3. Tap "Install" or "Add to Home Screen"
4. The app will be installed and launch as a standalone app

### On Desktop (Chrome/Edge):
1. Open the app in Chrome or Edge browser
2. Look for the install icon (⊕) in the address bar
3. Click it and select "Install"
4. The app will be installed as a desktop app

### Manual Installation:
1. Go to Chrome/Edge settings
2. Navigate to "Apps" or "Site settings"
3. Find your site and click "Install"

## 🔧 Development

When developing, rebuild the app to regenerate service worker:
```bash
npm run build
npm run preview
```

Or in development mode, the service worker will be generated automatically by vite-plugin-pwa.

## 📝 Notes

- The app will work offline after first installation (thanks to service worker)
- App updates automatically when new versions are available
- Icons are optimized for mobile and desktop installation
- Touch-friendly interactions are enabled for mobile devices
- Bubble component is fully responsive and works on mobile screens

## 🎨 Mobile Optimizations

- Touch-friendly bubble interactions
- Responsive panel sizing (full-screen on mobile)
- Better touch targets (44px minimum)
- Improved scrolling on mobile
- Fixed text input zoom issues on iOS

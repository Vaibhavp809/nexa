// Script to copy icons from user's local paths to public folder
const fs = require('fs');
const path = require('path');

const iconsToCopy = [
  {
    source: 'C:\\Users\\vinay\\Downloads\\fevicon_nexa.png',
    destination: 'public/favicon.ico'
  },
  {
    source: 'C:\\Users\\vinay\\Downloads\\nexalogo 512x512.png',
    destination: 'public/icons/icon-512x512.png'
  },
  {
    source: 'C:\\Users\\vinay\\Downloads\\nexalogo 192x192.png',
    destination: 'public/icons/icon-192x192.png'
  }
];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy each icon
iconsToCopy.forEach(({ source, destination }) => {
  const destPath = path.join(__dirname, destination);
  const destDir = path.dirname(destPath);
  
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Check if source file exists
  if (fs.existsSync(source)) {
    try {
      fs.copyFileSync(source, destPath);
      console.log(`✓ Copied ${source} to ${destination}`);
    } catch (error) {
      console.error(`✗ Error copying ${source}:`, error.message);
    }
  } else {
    console.warn(`⚠ Source file not found: ${source}`);
    console.warn(`  Please manually copy this file to: ${destPath}`);
  }
});

console.log('\nIcon copy process completed!');

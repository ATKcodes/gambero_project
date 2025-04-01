const fs = require('fs');
const path = require('path');

// Create a simple color icon with text
function createIconCanvas(size, text) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#FFA500'; // Orange background
  ctx.fillRect(0, 0, size, size);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);
  
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}

// Create and save icon files
function createIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const iconsDir = path.join(__dirname, 'icons');
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  sizes.forEach(size => {
    const iconData = createIconCanvas(size, 'JC');
    const buffer = Buffer.from(iconData, 'base64');
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
    console.log(`Created icon-${size}x${size}.png`);
  });
}

createIcons(); 
import sharp from 'sharp'

const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#0d9488"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>

  <!-- House body -->
  <rect x="${size*0.28}" y="${size*0.46}" width="${size*0.44}" height="${size*0.34}" rx="${size*0.04}" fill="white"/>

  <!-- Roof -->
  <polygon points="${size*0.5},${size*0.22} ${size*0.76},${size*0.48} ${size*0.24},${size*0.48}" fill="white" opacity="0.95"/>

  <!-- Door -->
  <rect x="${size*0.435}" y="${size*0.6}" width="${size*0.13}" height="${size*0.2}" rx="${size*0.03}" fill="#10b981"/>

  <!-- Left window -->
  <rect x="${size*0.305}" y="${size*0.52}" width="${size*0.1}" height="${size*0.09}" rx="${size*0.02}" fill="#10b981" opacity="0.7"/>

  <!-- Right window -->
  <rect x="${size*0.595}" y="${size*0.52}" width="${size*0.1}" height="${size*0.09}" rx="${size*0.02}" fill="#10b981" opacity="0.7"/>

  <!-- People (3 circles representing family) -->
  <circle cx="${size*0.38}" cy="${size*0.175}" r="${size*0.055}" fill="white" opacity="0.9"/>
  <circle cx="${size*0.5}" cy="${size*0.145}" r="${size*0.065}" fill="white"/>
  <circle cx="${size*0.62}" cy="${size*0.175}" r="${size*0.055}" fill="white" opacity="0.9"/>
</svg>
`

await sharp(Buffer.from(svg(192))).png().toFile('public/icon-192.png')
await sharp(Buffer.from(svg(512))).png().toFile('public/icon-512.png')
await sharp(Buffer.from(svg(180))).png().toFile('public/apple-touch-icon.png')

console.log('Icons generated!')

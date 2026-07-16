const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'presentation.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

const regex = /src="screenshots\/([^"]+)"/g;
let replacements = [];

let match;
while ((match = regex.exec(html)) !== null) {
  const filename = match[1];
  const imagePath = path.join(__dirname, 'screenshots', filename);
  if (fs.existsSync(imagePath)) {
    const ext = path.extname(filename).substring(1);
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const base64 = fs.readFileSync(imagePath, 'base64');
    const dataUri = `data:${mime};base64,${base64}`;
    replacements.push({ original: match[0], dataUri: `src="${dataUri}"` });
  } else {
    console.warn("File not found:", imagePath);
  }
}

for (const r of replacements) {
  html = html.replace(r.original, r.dataUri);
}

fs.writeFileSync(htmlPath, html);
console.log("Images successfully embedded into HTML as Base64.");

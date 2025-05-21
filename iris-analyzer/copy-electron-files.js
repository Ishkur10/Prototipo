const fs = require('fs');
const path = require('path');

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

['main.js', 'preload.js'].forEach(file => {
  if (fs.existsSync(`./${file}`)) {
    fs.copyFileSync(`./${file}`, `./dist/${file}`);
    console.log(`Copied ${file} to dist directory`);
  } else {
    console.error(`Error: ${file} not found in root directory`);
  }
});
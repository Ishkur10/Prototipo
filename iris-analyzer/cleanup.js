const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Terminating possible locking processes...');
  execSync('taskkill /F /IM electron.exe /T', { stdio: 'ignore' });
  execSync('taskkill /F /IM "Iris Analyzer.exe" /T', { stdio: 'ignore' });
} catch (e) {

}


console.log('Waiting for processes to terminate...');
setTimeout(() => {
  const pathsToRemove = [
    path.join(__dirname, 'release'),
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'out')
  ];

  pathsToRemove.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      console.log(`Removing ${dirPath}...`);
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`Successfully removed ${dirPath}`);
      } catch (err) {
        console.log(`Could not remove with Node. Trying with rimraf...`);
        try {
          execSync(`rimraf "${dirPath}"`, { stdio: 'inherit' });
        } catch (e) {
          console.error(`Failed to remove ${dirPath}: ${e.message}`);
        }
      }
    }
  });
  
  console.log('Cleanup completed');
}, 2000);
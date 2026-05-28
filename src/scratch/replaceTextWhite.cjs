const fs = require('fs');
const path = require('path');

const map = {
  'text-white': 'text-[var(--text-heading)]',
  'hover:text-white': 'hover:text-[var(--text-heading)]',
  'text-white/70': 'text-[var(--text-heading)]/70',
  'text-white/40': 'text-[var(--text-heading)]/40',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, '..'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [key, value] of Object.entries(map)) {
      content = content.split(key).join(value);
    }
    
    // Fix buttons and primary backgrounds that actually need to be white
    content = content.split('bg-primary text-[var(--text-heading)]').join('bg-primary text-[var(--primary-foreground)]');
    content = content.split('bg-destructive text-[var(--text-heading)]').join('bg-destructive text-[var(--destructive-foreground)]');
    content = content.split('h-3.5 text-[var(--text-heading)]').join('h-3.5 text-[var(--primary-foreground)]'); // Logo icon
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Modified', filePath);
    }
  }
});

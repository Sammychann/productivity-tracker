const fs = require('fs');
const path = require('path');

const map = {
  '"#0d0d0d"': '"var(--surface)"',
  '"#111"': '"var(--panel)"',
  '"#111111"': '"var(--panel)"',
  '"#161616"': '"var(--panel-hover)"',
  '"#131313"': '"var(--panel-active)"',
  '"#0e0e0e"': '"var(--panel-deep)"',
  '"#1d1d1d"': '"var(--border-s)"',
  '"#1a1a1a"': '"var(--border-light)"',
  '"#222"': '"var(--border-strong)"',
  '"#222222"': '"var(--border-strong)"',
  '"#e2e8f0"': '"var(--text-body)"',
  '"#888"': '"var(--text-secondary)"',
  '"#888888"': '"var(--text-secondary)"',
  '"#666"': '"var(--text-tertiary)"',
  '"#666666"': '"var(--text-tertiary)"',
  '"#555"': '"var(--text-dim)"',
  '"#555555"': '"var(--text-dim)"',
  '"#444"': '"var(--text-muted)"',
  '"#444444"': '"var(--text-muted)"',
  '"#333"': '"var(--text-faint)"',
  '"#333333"': '"var(--text-faint)"',
  '"#2a2a2a"': '"var(--text-ghost)"',
  '"#fff"': '"var(--text-heading)"',
  '"#ffffff"': '"var(--text-heading)"',
  
  'bg-[#161616]': 'bg-[var(--panel-hover)]',
  'bg-[#111]': 'bg-[var(--panel)]',
  'border-[#222]': 'border-[var(--border-strong)]',
  'border-[#1d1d1d]': 'border-[var(--border-s)]',
  'placeholder:text-[#444]': 'placeholder:text-[var(--text-muted)]',
  'text-[#888]': 'text-[var(--text-secondary)]',
  'hover:bg-[#222]': 'hover:bg-[var(--border-strong)]',
  'hover:border-[#333]': 'hover:border-[var(--text-faint)]',
  'placeholder:text-[#333]': 'placeholder:text-[var(--text-faint)]',
  'text-[#555]': 'text-[var(--text-dim)]'
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
      // Create a global replacement
      content = content.split(key).join(value);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Modified', filePath);
    }
  }
});

const fs = require('fs');
const path = require('path');

function replaceColorsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Red to Blue replacements
    content = content.replace(/#e50914/gi, '#3b82f6');
    content = content.replace(/#ff1a27/gi, '#2563eb');
    content = content.replace(/#f40612/gi, '#2563eb');
    content = content.replace(/#b20710/gi, '#1d4ed8');
    content = content.replace(/#b81d24/gi, '#1d4ed8');
    content = content.replace(/#ff4d4d/gi, '#60a5fa');
    content = content.replace(/#ff6b6b/gi, '#60a5fa');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated:', filePath);
    }
}

function walkDir(dir, extensions) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, extensions);
        } else if (extensions.some(ext => file.endsWith(ext))) {
            replaceColorsInFile(filePath);
        }
    });
}

// Process web app CSS files
walkDir('d:/LapTrinh/Netflop/apps/web/src', ['.css']);
console.log('Web CSS done');

// Process admin app CSS files
walkDir('d:/LapTrinh/Netflop/apps/admin/src', ['.css']);
console.log('Admin CSS done');

// Process mobile app TSX files
walkDir('d:/LapTrinh/Netflop/apps/mobile', ['.tsx', '.ts']);
console.log('Mobile done');

console.log('All color replacements complete!');

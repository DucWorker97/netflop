const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['.gemini/commands', '.gemini/hooks'];
const EXTENSIONS = ['.toml', '.cjs', '.js', '.md'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

function repairMojibake(filePath) {
    if (!EXTENSIONS.includes(path.extname(filePath))) return;

    const raw = fs.readFileSync(filePath);
    let content = raw.toString('utf8');
    let originalContent = content;

    // 1. Double-encoding repair (Latin1 -> UTF8)
    // Common mojibake patterns often result from UTF-8 bytes being interpreted as Latin-1
    // and then saved again as UTF-8.
    // E.g. "✓" (E2 9C 93) -> "âœ“" (C3 A2 C5 93 E2 80 9C) if doubly messed up, 
    // or "âœ“" if just single layer.

    // Heuristic: If we find common mojibake sequences, try to fix.
    // The user gave examples: "Ă¢", "Ã¢", "â€”", "â€“", "â€", "âœ", "â”", "Â"

    // We will try a "blind" fix first: encode latin1, decode utf8. 
    // If it throws or doesn't look like valid text, we revert.
    try {
        const buffer = Buffer.from(content, 'binary'); // 'binary' is alias for latin1 in Node buffers roughly
        // Actually, Buffer.from(string, 'latin1') is better if supported, but let's try manual approach
        // if the file is truly broken.

        // However, simpler regex replacements for known mojibake might be safer 
        // than blind transcoding which might corrupt actual Latin1 chars if they exist.
        // But strictly speaking, we want ASCII.
    } catch (e) {
        // ignore
    }

    // 2. ASCII Normalization (The Hard Requirement)
    // Replace fancy chars with ASCII equivalents
    const replacements = [
        // Checkmarks
        { regex: /✓/g, replace: '[OK]' },
        { regex: /âœ“/g, replace: '[OK]' },
        { regex: /✅/g, replace: '[OK]' },

        // Box drawing
        { regex: /├──/g, replace: '|--' },
        { regex: /â”œâ”€â”€/g, replace: '|--' },
        { regex: /└──/g, replace: '`--' },
        { regex: /â””â”€â”€/g, replace: '`--' },
        { regex: /│/g, replace: '|' },
        { regex: /â”‚/g, replace: '|' },

        // Arrows
        { regex: /→/g, replace: '->' },
        { regex: /â†’/g, replace: '->' },
        { regex: /←/g, replace: '<-' },
        { regex: /â†/g, replace: '<-' },

        // Lightning / Emoji
        { regex: /⚡/g, replace: '!' },
        { regex: /âš¡/g, replace: '!' },
        { regex: /â ¸/g, replace: '[WAIT]' }, // Pause button/hourglass
        { regex: /⏸/g, replace: '[WAIT]' },

        // Quotes and Dashes
        { regex: /“/g, replace: '"' },
        { regex: /”/g, replace: '"' },
        { regex: /‘/g, replace: "'" },
        { regex: /’/g, replace: "'" },
        { regex: /â€“/g, replace: '-' }, // En dash
        { regex: /â€”/g, replace: '--' }, // Em dash
        { regex: /—/g, replace: '--' }, // Em dash

        // Misc Mojibake remnants (from user list)
        { regex: /Â/g, replace: '' }, // Often appears before non-breaking space or others
        { regex: /Ã¢/g, replace: '' },
        { regex: /Ă¢/g, replace: '' },
        { regex: /â[\x80-\xBF]{2}/g, replace: '[BAD_CHAR]' }, // Replaces 3-byte UTF-8 sequences starting with E2 (â)
        { regex: /â ¸/g, replace: '[WAIT]' },
        { regex: /¸/g, replace: '' }, // Leftover cedilla if separated
        { regex: /⏸/g, replace: '[WAIT]' }
    ];

    replacements.forEach(r => {
        content = content.replace(r.regex, r.replace);
    });

    // Final cleanup of [BAD_CHAR] to empty string
    content = content.replace(/\[BAD_CHAR\]/g, '');

    // 3. FINAL AGGRESSIVE ASCII ENFORCEMENT
    // Strip anything that isn't ASCII (0-127).
    // This ensures no mojibake survives.
    content = content.replace(/[^\x00-\x7F]/g, '');

    // 4. BOM Removal
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    if (content !== originalContent) {
        console.log(`Fixed: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

// Main
TARGET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = getAllFiles(dir);
        files.forEach(repairMojibake);
    } else {
        console.log(`Directory not found: ${dir}`);
    }
});

const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['.gemini/commands', '.gemini/hooks'];
const EXTENSIONS = ['.toml', '.cjs', '.js', '.md'];

// Banned sequences (Mojibake remnants + Non-ASCII symbols we want to convert)
const BANNED = [
    'Ă¢', 'Ã¢', 'â€”', 'â€“', 'â€', 'âœ', 'â”', 'Â',
    '✓', '✅', '├──', '└──', '→', '←', '⚡',
    'â', '¸'
];

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

let hasError = false;

function checkFile(filePath) {
    if (!EXTENSIONS.includes(path.extname(filePath))) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const found = [];

    BANNED.forEach(marker => {
        if (content.includes(marker)) {
            found.push(marker);
        }
    });

    // Also check for non-ASCII characters in general using regex
    // [^\x00-\x7F] matches any character that is NOT ASCII
    // We allow some latitude used in normal text if needed, but for now strict ASCII
    // We'll stick to the explicit BANNED list for the report as requested, 
    // plus a general warning.

    if (found.length > 0) {
        console.error(`[FAIL] ${filePath} contains banned sequences: ${found.join(', ')}`);
        hasError = true;
    }
}

// Main
TARGET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = getAllFiles(dir);
        files.forEach(checkFile);
    }
});

if (hasError) {
    console.error("Mojibake or non-ASCII characters detected. Please run 'npm run fix:mojibake'.");
    process.exit(1);
} else {
    console.log("No mojibake detected.");
}

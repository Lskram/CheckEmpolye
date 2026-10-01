const fs = require('fs');
const path = require('path');

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        scanDir(fullPath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = scanDir(path.join(__dirname, '..', 'src'));
console.log(`Scanning ${files.length} files for Rules of Hooks violations...`);

const hookRegex = /\b(useState|useEffect|useMemo|useCallback|useRef|useContext|useReducer)\s*\(/;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  let seenEarlyReturn = false;
  let componentDepth = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('if (') && (trimmed.includes('return null') || trimmed.includes('return <') || trimmed.includes('return;'))) {
      seenEarlyReturn = true;
    }
    if (seenEarlyReturn && hookRegex.test(trimmed)) {
      console.error(`[HOOK VIOLATION] ${file}:${idx + 1} -> Hook called after early return! Line: ${trimmed}`);
    }
  });
}

console.log('Hook scan complete!');

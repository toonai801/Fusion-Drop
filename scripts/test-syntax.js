// Syntax check for all JS files
const fs = require('fs');
const path = require('path');

const files = [
  'game.js', 'shapes.js', 'physics.js', 'sounds.js', 'themes.js', 'server.js',
  'game-engine.test.js', 'api.test.js'
];

let failed = false;
for (const file of files) {
  const fp = path.join(__dirname, '..', file);
  if (!fs.existsSync(fp)) {
    console.log(`SKIP: ${file} (not found)`);
    continue;
  }
  try {
    const content = fs.readFileSync(fp, 'utf8');
    new Function(content);
    console.log(`✅ ${file}`);
  } catch (e) {
    console.log(`❌ ${file}: ${e.message}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);

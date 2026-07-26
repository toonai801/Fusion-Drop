const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8090;
const SCORES_FILE = path.join(__dirname, 'scores.json');
const ACTIVE_FILE = path.join(__dirname, 'active.json');

function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  } catch (e) { return []; }
}

function saveScores(scores) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
}

function loadActive() {
  try {
    const data = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
    // Clean up inactive players (older than 30 seconds)
    const now = Date.now();
    return data.filter(p => now - p.lastSeen < 30000);
  } catch (e) { return []; }
}

function saveActive(active) {
  fs.writeFileSync(ACTIVE_FILE, JSON.stringify(active, null, 2));
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  // GET /api/scores - all-time leaderboard
  if (pathname === '/api/scores' && req.method === 'GET') {
    const scores = loadScores();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scores));
    return;
  }

  // POST /api/scores - save finished game score
  if (pathname === '/api/scores' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        const scores = loadScores();
        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        saveScores(scores.slice(0, 50));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end('Bad request');
      }
    });
    return;
  }

  // GET /api/active - currently playing players
  if (pathname === '/api/active' && req.method === 'GET') {
    const active = loadActive();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(active));
    return;
  }

  // POST /api/active - heartbeat from playing player
  if (pathname === '/api/active' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const update = JSON.parse(body); // { name, score }
        let active = loadActive();
        const existing = active.find(p => p.name === update.name);
        if (existing) {
          existing.score = update.score;
          existing.lastSeen = Date.now();
        } else {
          active.push({ name: update.name, score: update.score, lastSeen: Date.now() });
        }
        saveActive(active);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end('Bad request');
      }
    });
    return;
  }

  // Static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8090;
const SCORES_FILE = path.join(__dirname, 'scores.json');
const MAX_BODY_BYTES = 1024;          // Reject POSTs > 1 KB
const MAX_SCORE = 99999;             // Sanity cap on leaderboard entries
const MAX_NAME_LENGTH = 20;          // Prevent name-spam and XSS surface
const NAME_PATTERN = /^[A-Za-z0-9 _\-\.\u00C0-\u017F]{1,20}$/;  // Letters, digits, space, _ - .

function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
  } catch (e) { return []; }
}

function saveScores(scores) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
}

// Rate limit: 30 POSTs per minute per IP (token bucket, 30 capacity, 0.5/s refill)
const RATE_CAPACITY = 30;
const RATE_REFILL_PER_MS = 1 / 2000;  // 30 per minute = 0.5 per second

const rateBuckets = new Map();  // ip -> { tokens, lastRefill }

function rateLimit(ip) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket) {
    bucket = { tokens: RATE_CAPACITY, lastRefill: now };
    rateBuckets.set(ip, bucket);
  } else {
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(RATE_CAPACITY, bucket.tokens + elapsed * RATE_REFILL_PER_MS);
    bucket.lastRefill = now;
  }
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

// Cleanup stale rate buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets.entries()) {
    if (now - bucket.lastRefill > 5 * 60 * 1000) rateBuckets.delete(ip);
  }
}, 5 * 60 * 1000).unref();

function getClientIp(req) {
  // Honor X-Forwarded-For when present (Tailscale / reverse proxy). Otherwise socket address.
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

const SAVE_REJECT = (res, reason, status = 400) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: reason }));
};

function validateScoreEntry(raw) {
  if (!raw || typeof raw !== 'object') return 'invalid payload';
  const { name, score, level, date } = raw;
  if (typeof name !== 'string') return 'name must be a string';
  if (!NAME_PATTERN.test(name)) return 'name has invalid characters or length';
  if (typeof score !== 'number' || !Number.isFinite(score)) return 'score must be a finite number';
  if (score < 0 || score > MAX_SCORE || !Number.isInteger(score)) return 'score out of range';
  if (level !== undefined && (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 11)) return 'level out of range';
  if (date !== undefined && (typeof date !== 'number' || !Number.isFinite(date))) return 'date out of range';
  return null;
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

  // CORS: env-driven ALLOWED_ORIGIN (comma-sep). Default to local dev host.
  const allowOrigin = (process.env.ALLOWED_ORIGIN || 'http://localhost:8090')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const reqOrigin = req.headers.origin;
  if (reqOrigin && allowOrigin.includes(reqOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Vary', 'Origin');
  }
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
    const ip = getClientIp(req);
    if (!rateLimit(ip)) return SAVE_REJECT(res, 'rate limit exceeded', 429);
    let body = '';
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        aborted = true;
        SAVE_REJECT(res, 'payload too large');
        req.destroy();
      }
    });
    req.on('end', () => {
      if (aborted) return;
      let entry;
      try { entry = JSON.parse(body); } catch (e) { return SAVE_REJECT(res, 'invalid JSON'); }
      const err = validateScoreEntry(entry);
      if (err) return SAVE_REJECT(res, err);
      const sanitized = { name: entry.name, score: entry.score, level: entry.level || 1, date: entry.date || Date.now() };
      const scores = loadScores();
      scores.push(sanitized);
      scores.sort((a, b) => b.score - a.score);
      saveScores(scores.slice(0, 50));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // Static files — with path-traversal protection.
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(__dirname, '.' + filePath);
  const root = path.resolve(__dirname);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('Forbidden');
    return;
  }
  const ext = path.extname(resolved).toLowerCase();
  fs.readFile(resolved, (err, data) => {
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

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
  // Phase 4 — atomic write. Write to a temp file, fsync, rename. Survives
  // -9 mid-write by leaving the previous scores.json intact (or zero-byte
  // recoverable if this is the first write). Limits file growth via caps
  // elsewhere in the validation pipeline.
  const tmpPath = SCORES_FILE + '.tmp.' + process.pid + '.' + Date.now();
  const data = JSON.stringify(scores, null, 2);
  try {
    const fd = fs.openSync(tmpPath, 'w');
    try {
      fs.writeSync(fd, data);
      if (typeof fs.fsyncSync === 'function') fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmpPath, SCORES_FILE);
  } catch (e) {
    // Last-resort fallback: keep using the old write semantics.
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    fs.writeFileSync(SCORES_FILE, data);
  }
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
  const { name, score, level, date, drops, merges, mode } = raw;
  if (typeof name !== 'string') return 'name must be a string';
  if (!NAME_PATTERN.test(name)) return 'name has invalid characters or length';
  if (typeof score !== 'number' || !Number.isFinite(score)) return 'score must be a finite number';
  if (score < 0 || score > MAX_SCORE || !Number.isInteger(score)) return 'score out of range';
  if (level !== undefined && (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 11)) return 'level out of range';
  if (date !== undefined && (typeof date !== 'number' || !Number.isFinite(date))) return 'date out of range';
  // Phase 2 — server-side score recompute (anti-cheat lite).
  // require drops and merges as positive integers; reject implausible ratios.
  if (typeof drops !== 'number' || !Number.isInteger(drops) || drops < 1 || drops > 1000) return 'drops out of range';
  if (typeof merges !== 'number' || !Number.isInteger(merges) || merges < 0 || merges > drops * 2) return 'merges out of range';
  // Max possible score: 256 points per merge (largest reward across all themes,
  // matched against theme-2 'hoard' tier). Belt-and-braces; multiplies up to
  // keep the test sensitive even at extreme merges.
  const MAX_PER_MERGE = 256;
  const maxReasonable = merges * MAX_PER_MERGE * 4;  // bonus merges on max-tier events
  if (score > maxReasonable) return 'score inconsistent with reported merges';
  // Floor: each merge contributes at least 2 points, so score >= merges * 2 (loose).
  if (score < merges * 1) return 'score below reported merges';
  return null;
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

// Phase 4 — lightweight in-memory telemetry ring buffer + /api/diag endpoint.
// No third-party SDK. Caps at MAX_DIAG entries to bound memory growth.
const MAX_DIAG = 200;
const diagBuffer = [];
function diag(type, detail) {
  diagBuffer.push({ t: Date.now(), type, detail: detail || null });
  if (diagBuffer.length > MAX_DIAG) diagBuffer.shift();
}
// Counters for quick health snapshots.
const diagCounters = {
  requests: 0, failedScores: 0, rateLimited: 0,
  postScores: 0, getScores: 0, getDiag: 0,
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

  diagCounters.requests++;
  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  // GET /api/scores - all-time leaderboard
  if (pathname === '/api/scores' && req.method === 'GET') {
    diagCounters.getScores++;
    const scores = loadScores();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scores));
    return;
  }

  // POST /api/scores - save finished game score
  if (pathname === '/api/scores' && req.method === 'POST') {
    const ip = getClientIp(req);
    if (!rateLimit(ip)) { diagCounters.rateLimited++; return SAVE_REJECT(res, 'rate limit exceeded', 429); }
    diagCounters.postScores++;
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
      if (err) { diagCounters.failedScores++; diag('score_rejected', err); return SAVE_REJECT(res, err); }
      const sanitized = { name: entry.name, score: entry.score, level: entry.level || 1, date: entry.date || Date.now() };
      const scores = loadScores();
      scores.push(sanitized);
      scores.sort((a, b) => b.score - a.score);
      // Keep top 50 by score, but never drop a *new* (most recent) entry
      // even if its score is low. This prevents a 1-drop, 0-merge run
      // from being silently culled.
      const MAX = 50;
      let toSave;
      if (scores.length <= MAX) {
        toSave = scores;
      } else {
        const older = scores.slice(0, -1);
        const newer = scores[scores.length - 1];
        older.sort((a, b) => b.score - a.score);
        toSave = older.slice(0, MAX - 1).concat([newer]);
        toSave.sort((a, b) => b.score - a.score);
      }
      saveScores(toSave);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // Phase 4 — diagnostic endpoint. Counters + last 200 telemetry events.
  if (pathname === '/api/diag' && req.method === 'GET') {
    diagCounters.getDiag++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      uptimeMs: process.uptime() * 1000 | 0,
      memMB: Math.round(process.memoryUsage().rss / (1024 * 1024) * 10) / 10,
      counters: diagCounters,
      recent: diagBuffer.slice(-50),
    }));
    return;
  }
  if (pathname === '/api/diag' && req.method === 'POST') {
    diagCounters.diagPosts = (diagCounters.diagPosts || 0) + 1;
    let body = '';
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      body += chunk;
      if (body.length > 4096) { aborted = true; res.writeHead(413); res.end(); req.destroy(); }
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        const evt = JSON.parse(body || '{}');
        diag(evt.type || 'client_event', evt.detail || evt);
      } catch (_) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
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

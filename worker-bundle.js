const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TikTok → Gemini → Video Workflow</title>
<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --surface2: #21262d;
    --border: #30363d;
    --text: #e6edf3;
    --text-muted: #8b949e;
    --accent: #388bfd;
    --accent-hover: #58a6ff;
    --success: #3fb950;
    --error: #f85149;
    --warning: #d29922;
    --purple: #bc8cff;
    --radius: 8px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    min-height: 100vh;
  }

  .header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .header h1 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }

  .header .badge {
    background: var(--accent);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    letter-spacing: 0.5px;
  }

  .container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 16px;
    overflow: hidden;
  }

  .card-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
  }

  .card-header:hover { background: var(--surface2); }

  .card-header h2 {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-header .toggle { color: var(--text-muted); font-size: 12px; transition: transform 0.2s; }
  .card-header.collapsed .toggle { transform: rotate(-90deg); }

  .card-body { padding: 20px; }
  .card-body.hidden { display: none; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid .full { grid-column: 1 / -1; }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .field .hint { font-size: 11px; color: var(--text-muted); margin-top: -2px; }

  input, select, textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    padding: 8px 12px;
    width: 100%;
    transition: border-color 0.15s;
    outline: none;
  }

  input:focus, select:focus, textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.12);
  }

  textarea { resize: vertical; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; }

  input[type="password"] { font-family: monospace; letter-spacing: 1px; }

  select option { background: var(--surface2); }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0 0 12px 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }

  .section-label:not(:first-child) { margin-top: 24px; }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    text-decoration: none;
  }

  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-primary { background: #238636; color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #2ea043; }

  .btn-accent { background: var(--accent); color: #fff; }
  .btn-accent:hover:not(:disabled) { background: var(--accent-hover); }

  .btn-outline {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }
  .btn-outline:hover:not(:disabled) { background: var(--surface2); border-color: var(--text-muted); }

  .btn-danger { background: transparent; color: var(--error); border: 1px solid var(--error); }
  .btn-danger:hover:not(:disabled) { background: rgba(248, 81, 73, 0.1); }

  .action-bar {
    display: flex;
    gap: 10px;
    padding: 16px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 16px;
    align-items: center;
  }

  .action-bar .spacer { flex: 1; }

  .status-card { display: none; }
  .status-card.visible { display: block; }

  .status-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-badge.queued   { background: rgba(139, 148, 158, 0.15); color: var(--text-muted); }
  .status-badge.running  { background: rgba(56, 139, 253, 0.15); color: var(--accent-hover); }
  .status-badge.success  { background: rgba(63, 185, 80, 0.15); color: var(--success); }
  .status-badge.failure  { background: rgba(248, 81, 73, 0.15); color: var(--error); }

  .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: currentColor;
  }
  .dot.pulse { animation: pulse 1.5s infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .steps { display: flex; flex-direction: column; gap: 8px; }

  .step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
  }

  .step-icon { width: 22px; text-align: center; font-size: 16px; flex-shrink: 0; }
  .step-label { flex: 1; font-size: 13px; }
  .step-status { font-size: 12px; color: var(--text-muted); }

  .step.active { border-color: var(--accent); background: rgba(56, 139, 253, 0.05); }
  .step.done   { border-color: var(--success); }
  .step.failed { border-color: var(--error); }

  .result-box {
    background: rgba(63, 185, 80, 0.08);
    border: 1px solid rgba(63, 185, 80, 0.3);
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
  }

  .result-box h3 { font-size: 14px; font-weight: 600; color: var(--success); margin-bottom: 14px; }

  .result-meta { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 13px; }
  .result-meta .key { color: var(--text-muted); font-weight: 500; }

  .result-actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }

  .video-url {
    font-family: monospace;
    font-size: 11px;
    color: var(--accent-hover);
    word-break: break-all;
    background: var(--surface2);
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 8px;
    border: 1px solid var(--border);
    cursor: pointer;
  }

  .error-box {
    background: rgba(248, 81, 73, 0.08);
    border: 1px solid rgba(248, 81, 73, 0.3);
    border-radius: 8px;
    padding: 16px 20px;
    margin-top: 20px;
    color: var(--error);
    font-size: 13px;
  }

  .meta-row {
    display: flex;
    gap: 20px;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .meta-row span { display: flex; align-items: center; gap: 5px; }

  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 18px;
    font-size: 13px;
    font-weight: 500;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    transition: opacity 0.3s;
    max-width: 320px;
  }

  .toast.success { border-color: var(--success); color: var(--success); }
  .toast.error   { border-color: var(--error); color: var(--error); }
  .toast.hidden  { opacity: 0; pointer-events: none; }

  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--accent-hover);
    text-decoration: none;
    font-size: 13px;
  }
  .github-link:hover { text-decoration: underline; }

  .elapsed { font-variant-numeric: tabular-nums; }

  @media (max-width: 600px) {
    .form-grid { grid-template-columns: 1fr; }
    .form-grid .full { grid-column: 1; }
    .action-bar { flex-wrap: wrap; }
  }
</style>
</head>
<body>

<div class="header">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#388bfd" stroke-width="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>
  <h1>TikTok → Gemini → Video</h1>
  <span class="badge">Workflow Runner</span>
</div>

<div class="container">

  <!-- GitHub Settings -->
  <div class="card">
    <div class="card-header" onclick="toggleCard(this)">
      <h2>⚙️ GitHub Connection</h2>
      <span class="toggle">▼</span>
    </div>
    <div class="card-body" id="github-body">
      <div class="form-grid">
        <div class="field">
          <label>GitHub Owner</label>
          <input type="text" id="gh-owner" placeholder="your-username" oninput="saveSettings()">
        </div>
        <div class="field">
          <label>Repository Name</label>
          <input type="text" id="gh-repo" placeholder="tiktok-workflow-app" oninput="saveSettings()">
        </div>
        <div class="field">
          <label>Branch</label>
          <input type="text" id="gh-branch" placeholder="main" oninput="saveSettings()">
        </div>
        <div class="field">
          <label>Personal Access Token</label>
          <input type="password" id="gh-pat" placeholder="ghp_xxxxxxxxxxxx" oninput="saveSettings()">
          <span class="hint">Needs: repo, actions:write permissions</span>
        </div>
      </div>
      <div style="margin-top:14px;">
        <button class="btn btn-outline" onclick="testConnection()">🔌 Test Connection</button>
      </div>
    </div>
  </div>

  <!-- Config Form -->
  <div class="card">
    <div class="card-header" onclick="toggleCard(this)">
      <h2>📋 Workflow Config</h2>
      <span class="toggle">▼</span>
    </div>
    <div class="card-body" id="config-body">

      <div class="section-label">🔍 TikTok Search</div>
      <div class="form-grid">
        <div class="field">
          <label>Keyword</label>
          <input type="text" id="keyword" placeholder="e.g. ubat kuat lelaki">
        </div>
        <div class="field">
          <label>Max Videos</label>
          <input type="number" id="max_videos" min="1" max="10" placeholder="3">
        </div>
      </div>

      <div class="section-label">🤖 Gemini Analysis</div>
      <div class="form-grid">
        <div class="field">
          <label>Gemini Model</label>
          <select id="gemini_model">
            <option value="gemini-3.1-pro">gemini-3.1-pro (recommended)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
          </select>
        </div>
        <div class="field">
          <label>Poll Interval (seconds)</label>
          <input type="number" id="poll_interval_seconds" min="10" max="120" placeholder="30">
        </div>
        <div class="field full">
          <label>Gemini Prompt</label>
          <textarea id="gemini_prompt" rows="10" placeholder="Enter your Gemini prompt..."></textarea>
        </div>
      </div>

      <div class="section-label">🎬 Video Generation</div>
      <div class="form-grid">
        <div class="field">
          <label>Video Model</label>
          <select id="seedance_model" onchange="onModelChange()">
            <option value="wan/2-6-text-to-video">Wan 2.6 (recommended, $1.05/15s)</option>
            <option value="sora-2-text-to-video">Sora 2 (~$2/15s)</option>
            <option value="bytedance/seedance-2-lite-text-to-video">Seedance 2 Lite</option>
          </select>
        </div>
        <div class="field">
          <label>Duration</label>
          <select id="seedance_duration">
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
            <option value="15" selected>15 seconds</option>
          </select>
        </div>
        <div class="field" id="resolution-field">
          <label>Resolution</label>
          <select id="seedance_resolution">
            <option value="720p" selected>720p (~$1.05)</option>
            <option value="1080p">1080p (~$1.58)</option>
          </select>
        </div>
        <div class="field">
          <label>Aspect Ratio</label>
          <select id="seedance_aspect_ratio">
            <option value="9:16" selected>9:16 Portrait (TikTok)</option>
            <option value="16:9">16:9 Landscape</option>
            <option value="1:1">1:1 Square</option>
            <option value="portrait">Portrait (Sora 2)</option>
            <option value="landscape">Landscape (Sora 2)</option>
          </select>
        </div>
      </div>

      <div style="margin-top:14px;">
        <button class="btn btn-outline" onclick="loadConfig()">🔄 Reload from GitHub</button>
      </div>
    </div>
  </div>

  <!-- Action Bar -->
  <div class="action-bar">
    <button class="btn btn-outline" onclick="saveConfig()" id="btn-save">
      💾 Save Config
    </button>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="startWorkflow()" id="btn-start">
      ▶ Start Workflow
    </button>
  </div>

  <!-- Status Card -->
  <div class="card status-card" id="status-card">
    <div class="card-header" style="cursor:default;">
      <h2 id="status-title">⏳ Workflow Status</h2>
    </div>
    <div class="card-body">
      <div class="status-header">
        <div class="status-badge queued" id="status-badge">
          <div class="dot"></div>
          <span id="status-text">Queued</span>
        </div>
        <div class="meta-row" style="margin:0">
          <span id="run-meta-id" style="display:none">🔗 Run <a id="run-link" href="#" target="_blank" class="github-link"></a></span>
          <span>⏱ <span class="elapsed" id="elapsed-display">0s</span></span>
          <span id="run-number-display" style="display:none">Run #<span id="run-number"></span></span>
        </div>
      </div>

      <div class="steps" id="steps-list">
        <div class="step" id="step-1"><div class="step-icon">⏸</div><div class="step-label">Apify: Search TikTok</div><div class="step-status" id="step-1-status"></div></div>
        <div class="step" id="step-2"><div class="step-icon">⏸</div><div class="step-label">TikWM: Get HD URL</div><div class="step-status" id="step-2-status"></div></div>
        <div class="step" id="step-3"><div class="step-icon">⏸</div><div class="step-label">Download TikTok Video</div><div class="step-status" id="step-3-status"></div></div>
        <div class="step" id="step-4"><div class="step-icon">⏸</div><div class="step-label">Gemini Video Analysis</div><div class="step-status" id="step-4-status"></div></div>
        <div class="step" id="step-5"><div class="step-icon">⏸</div><div class="step-label">Create Video Task (Kie.ai)</div><div class="step-status" id="step-5-status"></div></div>
        <div class="step" id="step-6"><div class="step-icon">⏸</div><div class="step-label">Poll Until Video Ready</div><div class="step-status" id="step-6-status"></div></div>
        <div class="step" id="step-7"><div class="step-icon">⏸</div><div class="step-label">Save Result</div><div class="step-status" id="step-7-status"></div></div>
      </div>

      <div class="result-box" id="result-box" style="display:none">
        <h3>✅ Video Generated Successfully!</h3>
        <div class="result-meta" id="result-meta"></div>
        <div class="video-url" id="result-url" onclick="copyVideoUrl()" title="Click to copy"></div>
        <div class="result-actions">
          <a id="result-open" href="#" target="_blank" class="btn btn-primary">▶ Open Video</a>
          <a id="result-github" href="#" target="_blank" class="btn btn-outline">📦 Download Artifact</a>
          <button onclick="copyVideoUrl()" class="btn btn-outline">📋 Copy URL</button>
        </div>
      </div>

      <div class="error-box" id="error-box" style="display:none">
        <strong>❌ Workflow Failed</strong><br>
        <span id="error-msg" style="font-size:12px;opacity:0.8;"></span>
      </div>
    </div>
  </div>

</div>

<!-- Toast -->
<div class="toast hidden" id="toast"></div>

<script>
// ── State ─────────────────────────────────────────────────────────────────────
let pollTimer = null;
let elapsedTimer = null;
let startMs = 0;
let currentRunId = null;
let triggerTime = null;
let loadedApiKeys = {}; // stored from config, never shown in UI

// ── Persistence ───────────────────────────────────────────────────────────────
function saveSettings() {
  localStorage.setItem('gh_owner',  document.getElementById('gh-owner').value);
  localStorage.setItem('gh_repo',   document.getElementById('gh-repo').value);
  localStorage.setItem('gh_branch', document.getElementById('gh-branch').value);
  localStorage.setItem('gh_pat',    document.getElementById('gh-pat').value);
}

function loadSettings() {
  document.getElementById('gh-owner').value  = localStorage.getItem('gh_owner')  || '';
  document.getElementById('gh-repo').value   = localStorage.getItem('gh_repo')   || 'tiktok-workflow-app';
  document.getElementById('gh-branch').value = localStorage.getItem('gh_branch') || 'main';
  document.getElementById('gh-pat').value    = localStorage.getItem('gh_pat')    || '';
}

function getGH() {
  return {
    owner : document.getElementById('gh-owner').value.trim(),
    repo  : document.getElementById('gh-repo').value.trim(),
    branch: document.getElementById('gh-branch').value.trim() || 'main',
    pat   : document.getElementById('gh-pat').value.trim()
  };
}

function ghHeaders(pat) {
  return { 'Authorization': \`Bearer \${pat}\`, 'Accept': 'application/vnd.github.v3+json' };
}

// ── Base64 UTF-8 helpers ──────────────────────────────────────────────────────
function toBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
}

function fromBase64(str) {
  return decodeURIComponent(
    Array.from(atob(str.replace(/\\n/g, '')))
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

// ── Card toggle ───────────────────────────────────────────────────────────────
function toggleCard(header) {
  const body = header.nextElementSibling;
  header.classList.toggle('collapsed');
  body.classList.toggle('hidden');
}

// ── Config ────────────────────────────────────────────────────────────────────
async function loadConfig() {
  const gh = getGH();
  if (!gh.owner || !gh.repo || !gh.pat) { toast('Fill in GitHub settings first', 'error'); return; }

  try {
    const res = await fetch(
      \`https://api.github.com/repos/\${gh.owner}/\${gh.repo}/contents/workflow/config.json\`,
      { headers: ghHeaders(gh.pat) }
    );
    if (!res.ok) throw new Error(\`GitHub API \${res.status}: \${(await res.json()).message}\`);
    const data = await res.json();
    const cfg = JSON.parse(fromBase64(data.content));
    populateForm(cfg);
    toast('Config loaded from GitHub ✓', 'success');
  } catch(e) {
    toast('Failed to load config: ' + e.message, 'error');
  }
}

function populateForm(cfg) {
  // Store API keys silently — never shown in UI
  if (cfg.apify_api_key) loadedApiKeys.apify_api_key = cfg.apify_api_key;
  if (cfg.kie_api_key)   loadedApiKeys.kie_api_key   = cfg.kie_api_key;
  if (cfg.keyword)                    document.getElementById('keyword').value        = cfg.keyword;
  if (cfg.max_videos)                 document.getElementById('max_videos').value     = cfg.max_videos;
  if (cfg.gemini_model)               setSelect('gemini_model', cfg.gemini_model);
  if (cfg.gemini_prompt)              document.getElementById('gemini_prompt').value  = cfg.gemini_prompt;
  if (cfg.poll_interval_seconds)      document.getElementById('poll_interval_seconds').value = cfg.poll_interval_seconds;
  if (cfg.seedance) {
    if (cfg.seedance.model)           setSelect('seedance_model', cfg.seedance.model);
    if (cfg.seedance.duration)        setSelect('seedance_duration', String(cfg.seedance.duration));
    if (cfg.seedance.resolution)      setSelect('seedance_resolution', cfg.seedance.resolution);
    if (cfg.seedance.aspect_ratio)    setSelect('seedance_aspect_ratio', cfg.seedance.aspect_ratio);
  }
  onModelChange();
}

function setSelect(id, value) {
  const el = document.getElementById(id);
  const opt = Array.from(el.options).find(o => o.value === value);
  if (opt) el.value = value;
  else {
    const newOpt = new Option(value, value);
    el.add(newOpt);
    el.value = value;
  }
}

function collectConfig() {
  return {
    "_comment": "TikTok → Gemini → Video Workflow Config.",
    "_section_api_keys": "=== API KEYS ===",
    "apify_api_key": loadedApiKeys.apify_api_key || '',
    "kie_api_key":   loadedApiKeys.kie_api_key   || '',
    "_section_search": "=== TIKTOK SEARCH ===",
    "keyword":    document.getElementById('keyword').value,
    "max_videos": parseInt(document.getElementById('max_videos').value) || 3,
    "_section_gemini": "=== GEMINI ANALYSIS ===",
    "gemini_model":  document.getElementById('gemini_model').value,
    "gemini_prompt": document.getElementById('gemini_prompt').value,
    "_section_seedance": "=== VIDEO GENERATION ===",
    "seedance": {
      "model":        document.getElementById('seedance_model').value,
      "duration":     parseInt(document.getElementById('seedance_duration').value) || 15,
      "resolution":   document.getElementById('seedance_resolution').value,
      "aspect_ratio": document.getElementById('seedance_aspect_ratio').value
    },
    "_section_polling": "=== POLLING ===",
    "poll_interval_seconds": parseInt(document.getElementById('poll_interval_seconds').value) || 30
  };
}

async function saveConfig() {
  const gh = getGH();
  if (!gh.owner || !gh.repo || !gh.pat) { toast('Fill in GitHub settings first', 'error'); return; }

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';

  try {
    const cfg = collectConfig();
    const content = toBase64(JSON.stringify(cfg, null, 2));
    const url = \`https://api.github.com/repos/\${gh.owner}/\${gh.repo}/contents/workflow/config.json\`;

    // Get current SHA
    const getRes = await fetch(url, { headers: ghHeaders(gh.pat) });
    const getData = await getRes.json();
    const sha = getData.sha;

    const body = {
      message: \`config: update keyword to "\${cfg.keyword}"\`,
      content,
      ...(sha && { sha })
    };

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: { ...ghHeaders(gh.pat), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) throw new Error(\`GitHub API \${putRes.status}: \${(await putRes.json()).message}\`);
    toast('Config saved to GitHub ✓', 'success');
  } catch(e) {
    toast('Save failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save Config';
  }
}

// ── Model change handler ──────────────────────────────────────────────────────
function onModelChange() {
  const model = document.getElementById('seedance_model').value;
  const resField = document.getElementById('resolution-field');
  resField.style.display = model.startsWith('sora') ? 'none' : '';
}

// ── Connection test ───────────────────────────────────────────────────────────
async function testConnection() {
  const gh = getGH();
  if (!gh.pat) { toast('Enter your GitHub PAT first', 'error'); return; }

  try {
    const res = await fetch('https://api.github.com/user', { headers: ghHeaders(gh.pat) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast(\`Connected as @\${data.login} ✓\`, 'success');
    if (!gh.owner) document.getElementById('gh-owner').value = data.login;
    saveSettings();
  } catch(e) {
    toast('Connection failed: ' + e.message, 'error');
  }
}

// ── Start Workflow ────────────────────────────────────────────────────────────
async function startWorkflow() {
  const gh = getGH();
  if (!gh.owner || !gh.repo || !gh.pat) { toast('Fill in GitHub settings first', 'error'); return; }

  const btn = document.getElementById('btn-start');
  btn.disabled = true;
  btn.textContent = '⏳ Starting...';

  try {
    // Save config first
    await saveConfig();

    // Trigger workflow_dispatch
    triggerTime = new Date().toISOString();
    const res = await fetch(
      \`https://api.github.com/repos/\${gh.owner}/\${gh.repo}/actions/workflows/run-workflow.yml/dispatches\`,
      {
        method: 'POST',
        headers: { ...ghHeaders(gh.pat), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: gh.branch })
      }
    );

    if (res.status !== 204) {
      const data = await res.json();
      throw new Error(data.message || \`HTTP \${res.status}\`);
    }

    toast('Workflow triggered ✓', 'success');
    showStatusCard();
    startPolling();

  } catch(e) {
    toast('Failed to start: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = '▶ Start Workflow';
  }
}

// ── Status Display ────────────────────────────────────────────────────────────
function showStatusCard() {
  const card = document.getElementById('status-card');
  card.classList.add('visible');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Reset UI
  document.getElementById('result-box').style.display = 'none';
  document.getElementById('error-box').style.display  = 'none';
  setStatusBadge('queued', 'Queued');
  resetSteps();

  // Start elapsed timer
  startMs = Date.now();
  clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const s = Math.floor((Date.now() - startMs) / 1000);
    const m = Math.floor(s / 60);
    document.getElementById('elapsed-display').textContent = m > 0 ? \`\${m}m \${s % 60}s\` : \`\${s}s\`;
  }, 1000);
}

function setStatusBadge(state, text) {
  const badge = document.getElementById('status-badge');
  badge.className = 'status-badge ' + state;
  badge.innerHTML = \`<div class="dot \${state === 'running' ? 'pulse' : ''}"></div><span>\${text}</span>\`;
}

function resetSteps() {
  for (let i = 1; i <= 7; i++) {
    const step = document.getElementById('step-' + i);
    step.className = 'step';
    step.querySelector('.step-icon').textContent = '⏸';
    step.querySelector('.step-status').textContent = '';
  }
}

// ── Polling ───────────────────────────────────────────────────────────────────
function startPolling() {
  clearInterval(pollTimer);
  currentRunId = null;
  // First poll after 5s (give GitHub time to queue the run)
  setTimeout(() => pollStatus(), 5000);
}

async function pollStatus() {
  const gh = getGH();

  try {
    // Step 1: Find the run
    if (!currentRunId) {
      const res = await fetch(
        \`https://api.github.com/repos/\${gh.owner}/\${gh.repo}/actions/runs?per_page=10&event=workflow_dispatch\`,
        { headers: ghHeaders(gh.pat) }
      );
      const data = await res.json();
      const runs = data.workflow_runs || [];
      // Find run created after we triggered (minus 2 min buffer)
      const triggerMs = new Date(triggerTime).getTime() - 120000;
      const run = runs.find(r => new Date(r.created_at).getTime() > triggerMs);

      if (run) {
        currentRunId = run.id;
        document.getElementById('run-meta-id').style.display = '';
        document.getElementById('run-number-display').style.display = '';
        document.getElementById('run-number').textContent = run.run_number;

        const gh2 = getGH();
        const runUrl = \`https://github.com/\${gh2.owner}/\${gh2.repo}/actions/runs/\${run.id}\`;
        const link = document.getElementById('run-link');
        link.href = runUrl;
        link.textContent = '#' + run.run_number;
      }
    }

    // Step 2: Poll run + jobs status
    if (currentRunId) {
      const [runRes, jobsRes] = await Promise.all([
        fetch(\`https://api.github.com/repos/\${gh.owner}/\${gh.repo}/actions/runs/\${currentRunId}\`, { headers: ghHeaders(gh.pat) }),
        fetch(\`https://api.github.com/repos/\${gh.owner}/\${gh.repo}/actions/runs/\${currentRunId}/jobs\`, { headers: ghHeaders(gh.pat) })
      ]);

      const runData  = await runRes.json();
      const jobsData = await jobsRes.json();

      const status     = runData.status;     // queued, in_progress, completed
      const conclusion = runData.conclusion; // success, failure, cancelled

      updateStepsFromJobs(jobsData.jobs || []);

      if (status === 'in_progress') {
        setStatusBadge('running', 'Running');
      } else if (status === 'completed') {
        clearInterval(pollTimer);
        clearInterval(elapsedTimer);

        if (conclusion === 'success') {
          setStatusBadge('success', 'Completed');
          markAllDone();
          await loadResult();
        } else {
          setStatusBadge('failure', 'Failed');
          showError('Run ' + conclusion + '. Check GitHub for logs.');
        }
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-start').textContent = '▶ Start Workflow';
        return;
      }
    }

    // Keep polling every 15s
    pollTimer = setTimeout(() => pollStatus(), 15000);

  } catch(e) {
    console.error('Poll error:', e);
    pollTimer = setTimeout(() => pollStatus(), 15000);
  }
}

function updateStepsFromJobs(jobs) {
  if (!jobs.length) return;
  const job = jobs[0];
  const steps = job.steps || [];

  // Map job steps to our step indices
  const stepMap = {
    'Run workflow': null, // the main step — we infer from log output
  };

  // Activate steps based on elapsed time estimation (since we can't parse logs)
  // We use the job step names to update status
  steps.forEach(s => {
    const name = s.name.toLowerCase();
    if (name.includes('checkout'))       updateStep(null, s.status, s.conclusion);
    if (name.includes('run workflow'))   markRunningStepsFromJobStatus(s.status);
    if (name.includes('upload'))         updateStep(7, s.status, s.conclusion);
    if (name.includes('save result'))    updateStep(7, s.status, s.conclusion);
  });
}

function markRunningStepsFromJobStatus(status) {
  if (status === 'in_progress') {
    // Mark first few steps as active since we can't see individual step progress
    for (let i = 1; i <= 6; i++) {
      const step = document.getElementById('step-' + i);
      if (step.classList.contains('done')) continue;
      if (!step.classList.contains('active')) {
        step.classList.add('active');
        step.querySelector('.step-icon').textContent = '🔄';
      }
    }
  } else if (status === 'completed') {
    for (let i = 1; i <= 6; i++) {
      const step = document.getElementById('step-' + i);
      step.className = 'step done';
      step.querySelector('.step-icon').textContent = '✅';
    }
  }
}

function updateStep(index, status, conclusion) {
  if (!index) return;
  const step = document.getElementById('step-' + index);
  if (!step) return;
  if (status === 'in_progress') {
    step.className = 'step active';
    step.querySelector('.step-icon').textContent = '🔄';
    step.querySelector('.step-status').textContent = 'Running';
  } else if (status === 'completed') {
    step.className = conclusion === 'success' ? 'step done' : 'step failed';
    step.querySelector('.step-icon').textContent = conclusion === 'success' ? '✅' : '❌';
    step.querySelector('.step-status').textContent = conclusion === 'success' ? 'Done' : 'Failed';
  }
}

function markAllDone() {
  for (let i = 1; i <= 7; i++) {
    const step = document.getElementById('step-' + i);
    step.className = 'step done';
    step.querySelector('.step-icon').textContent = '✅';
    step.querySelector('.step-status').textContent = 'Done';
  }
}

async function loadResult() {
  const gh = getGH();
  try {
    await new Promise(r => setTimeout(r, 3000)); // wait for commit to propagate
    const res = await fetch(
      \`https://api.github.com/repos/\${gh.owner}/\${gh.repo}/contents/workflow/latest-result.json?t=\${Date.now()}\`,
      { headers: ghHeaders(gh.pat) }
    );
    if (!res.ok) throw new Error('Result not available yet');
    const data = await res.json();
    const result = JSON.parse(fromBase64(data.content));

    if (result.success) {
      showResult(result);
    } else {
      showError(result.error || 'Workflow failed');
    }
  } catch(e) {
    // Result file might not be ready yet, show generic success
    const runUrl = \`https://github.com/\${gh.owner}/\${gh.repo}/actions/runs/\${currentRunId}\`;
    document.getElementById('result-box').style.display = 'block';
    document.getElementById('result-meta').innerHTML = '';
    document.getElementById('result-url').textContent = 'Video URL will be in the GitHub Actions summary →';
    document.getElementById('result-open').href = runUrl;
    document.getElementById('result-open').textContent = '🔗 View Run Summary';
    document.getElementById('result-github').href = runUrl;
  }
}

function showResult(result) {
  const box = document.getElementById('result-box');
  box.style.display = 'block';

  const metaEl = document.getElementById('result-meta');
  metaEl.innerHTML = \`
    <span class="key">Keyword</span><span>\${escHtml(result.keyword || 'N/A')}</span>
    <span class="key">Model</span><span>\${escHtml(result.model || 'N/A')}</span>
    <span class="key">Duration</span><span>\${result.duration || 15}s \${result.resolution || ''}</span>
    <span class="key">Time</span><span>\${result.elapsedMinutes || '?'} minutes</span>
    <span class="key">TikTok</span><span>@\${escHtml(result.tiktokAuthor || 'N/A')}</span>
    <span class="key">Task ID</span><span style="font-family:monospace;font-size:11px">\${escHtml(result.taskId || '')}</span>
  \`;

  const urlEl = document.getElementById('result-url');
  urlEl.textContent = result.videoUrl || 'No URL available';

  const gh = getGH();
  const runUrl = \`https://github.com/\${gh.owner}/\${gh.repo}/actions/runs/\${currentRunId}\`;
  document.getElementById('result-open').href = result.videoUrl || runUrl;
  document.getElementById('result-github').href = runUrl;
}

function showError(msg) {
  document.getElementById('error-box').style.display = 'block';
  document.getElementById('error-msg').textContent = msg;
}

function copyVideoUrl() {
  const url = document.getElementById('result-url').textContent;
  navigator.clipboard.writeText(url).then(() => toast('URL copied ✓', 'success'));
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimeout;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.className = \`toast \${type}\`;
  el.innerHTML = (type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : '') + escHtml(msg);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), 3500);
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadSettings();

// Pre-fill defaults if fields are empty
window.addEventListener('load', () => {
  if (!document.getElementById('gh-owner').value)  document.getElementById('gh-owner').value  = 'adrentan888-adren';
  if (!document.getElementById('gh-repo').value)   document.getElementById('gh-repo').value   = 'tiktok-workflow-app';
  if (!document.getElementById('gh-branch').value) document.getElementById('gh-branch').value = 'main';
  saveSettings();

  const gh = getGH();
  if (gh.owner && gh.repo && gh.pat) {
    loadConfig();
  }
});
</script>
</body>
</html>
`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }
    return new Response('Not found', { status: 404 });
  }
};
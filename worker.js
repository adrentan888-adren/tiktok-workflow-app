
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TikTok → AI → Video Workflow</title>
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
  .header h1 { font-size: 16px; font-weight: 600; }
  .badge { background: var(--accent); color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }

  .container { max-width: 860px; margin: 0 auto; padding: 24px 16px; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 16px; overflow: hidden; }
  .card-header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }
  .card-header:hover { background: var(--surface2); }
  .card-header h2 { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .card-header .toggle { color: var(--text-muted); font-size: 12px; transition: transform 0.2s; }
  .card-header.collapsed .toggle { transform: rotate(-90deg); }
  .card-body { padding: 20px; }
  .card-body.hidden { display: none; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid .full { grid-column: 1 / -1; }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

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
  input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(56,139,253,.12); }
  textarea { resize: vertical; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; }

  .section-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .section-label:not(:first-child) { margin-top: 24px; }

  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all .15s; white-space: nowrap; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .btn-primary { background: #238636; color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #2ea043; }
  .btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .btn-outline:hover:not(:disabled) { background: var(--surface2); }
  .btn-blue { background: var(--accent); color: #fff; }
  .btn-blue:hover:not(:disabled) { background: var(--accent-hover); }

  /* Keyword search row */
  .keyword-row { display: flex; gap: 8px; align-items: flex-end; }
  .keyword-row .field { flex: 1; }
  .keyword-row .btn { flex-shrink: 0; height: 37px; }

  .action-bar { display: flex; gap: 10px; padding: 16px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 16px; align-items: center; }
  .action-bar .spacer { flex: 1; }

  /* Video search results */
  .video-results-wrap { margin-top: 20px; }
  .video-results-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px; border-bottom: 1px solid var(--border); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
  .video-results-label span { font-size: 11px; color: var(--accent-hover); font-weight: 500; text-transform: none; letter-spacing: 0; }
  .video-list { display: flex; flex-direction: column; gap: 8px; }
  .video-card { display: flex; gap: 12px; padding: 12px; background: var(--surface2); border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: border-color .15s, background .15s; }
  .video-card:hover { border-color: var(--accent); }
  .video-card.selected { border-color: var(--accent); background: rgba(56,139,253,.08); }
  .video-thumb { width: 72px; height: 72px; border-radius: 6px; object-fit: cover; background: var(--border); flex-shrink: 0; }
  .video-thumb-placeholder { width: 72px; height: 72px; border-radius: 6px; background: var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .video-info { flex: 1; min-width: 0; }
  .video-author { font-size: 12px; font-weight: 600; color: var(--accent-hover); margin-bottom: 3px; }
  .video-desc { font-size: 12px; color: var(--text); margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .video-stats { font-size: 11px; color: var(--text-muted); display: flex; gap: 10px; flex-wrap: wrap; }
  .video-badge { display: inline-flex; align-items: center; gap: 3px; }
  .video-selected-tag { font-size: 11px; font-weight: 700; color: var(--accent-hover); background: rgba(56,139,253,.15); padding: 1px 8px; border-radius: 20px; margin-left: auto; flex-shrink: 0; align-self: flex-start; }
  .search-empty { text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px; }
  .search-spinner { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 20px; color: var(--text-muted); font-size: 13px; }

  /* Status */
  .status-card { display: none; }
  .status-card.visible { display: block; }

  .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .status-badge.queued  { background: rgba(139,148,158,.15); color: var(--text-muted); }
  .status-badge.running { background: rgba(56,139,253,.15); color: var(--accent-hover); }
  .status-badge.success { background: rgba(63,185,80,.15); color: var(--success); }
  .status-badge.failure { background: rgba(248,81,73,.15); color: var(--error); }

  .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .dot.pulse { animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

  .steps { display: flex; flex-direction: column; gap: 8px; }
  .step { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; }
  .step-icon { width: 22px; text-align: center; font-size: 16px; flex-shrink: 0; }
  .step-label { flex: 1; font-size: 13px; }
  .step-status { font-size: 12px; color: var(--text-muted); }
  .step.active { border-color: var(--accent); background: rgba(56,139,253,.05); }
  .step.done   { border-color: var(--success); }
  .step.failed { border-color: var(--error); }

  .status-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .meta-row { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; }

  .result-box { background: rgba(63,185,80,.08); border: 1px solid rgba(63,185,80,.3); border-radius: 8px; padding: 20px; margin-top: 20px; }
  .result-box h3 { font-size: 14px; font-weight: 600; color: var(--success); margin-bottom: 14px; }
  .result-meta { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 13px; }
  .result-meta .key { color: var(--text-muted); font-weight: 500; }
  .result-actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
  .video-url { font-family: monospace; font-size: 11px; color: var(--accent-hover); word-break: break-all; background: var(--surface2); padding: 8px 12px; border-radius: 6px; margin-top: 8px; border: 1px solid var(--border); cursor: pointer; }

  .error-box { background: rgba(248,81,73,.08); border: 1px solid rgba(248,81,73,.3); border-radius: 8px; padding: 16px 20px; margin-top: 20px; color: var(--error); font-size: 13px; }

  .github-link { display: inline-flex; align-items: center; gap: 6px; color: var(--accent-hover); text-decoration: none; font-size: 13px; }
  .github-link:hover { text-decoration: underline; }

  .loading-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 50; align-items: center; justify-content: center; flex-direction: column; gap: 16px; }
  .loading-overlay.visible { display: flex; }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
  .spinner-sm { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .toast { position: fixed; bottom: 24px; right: 24px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 12px 18px; font-size: 13px; font-weight: 500; z-index: 100; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.4); transition: opacity .3s; max-width: 320px; }
  .toast.success { border-color: var(--success); color: var(--success); }
  .toast.error   { border-color: var(--error);   color: var(--error); }
  .toast.hidden  { opacity: 0; pointer-events: none; }

  .hint { font-size: 11px; color: var(--text-muted); margin-left: 8px; }

  /* Product photo upload */
  .product-upload-wrap { margin-bottom: 4px; }
  .product-drop-area { border: 2px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; transition: border-color .15s, background .15s; background: var(--surface2); }
  .product-drop-area:hover { border-color: var(--accent); background: rgba(56,139,253,.05); }
  .product-drop-area.has-image { border-style: solid; border-color: var(--accent); }
  .product-status { font-size: 12px; color: var(--text-muted); margin-top: 6px; min-height: 18px; }
  .product-status.ok { color: var(--success); }
  .product-status.err { color: var(--error); }

  @media (max-width:600px) {
    .form-grid { grid-template-columns: 1fr; }
    .form-grid .full { grid-column: 1; }
    .keyword-row { flex-direction: column; }
  }
  /* ── Tabs ── */
  .tab-bar { display:flex; gap:4px; padding:0 16px; max-width:860px; margin:0 auto 0; border-bottom:2px solid var(--border); }
  .tab-btn { background:none; border:none; padding:10px 20px; font-size:14px; font-weight:500; color:var(--text-muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; transition:color .2s, border-color .2s; }
  .tab-btn:hover { color:var(--text); }
  .tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }
  /* ── Campaigns ── */
  .campaign-card { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px 16px; display:flex; flex-direction:column; gap:8px; }
  .campaign-card-header { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .campaign-card-name { font-weight:600; font-size:15px; flex:1; }
  .campaign-badge { display:inline-flex; align-items:center; gap:4px; background:var(--surface-alt); border:1px solid var(--border); border-radius:4px; padding:2px 7px; font-size:11px; }
  .campaign-badge.active { background:#d1fae5; border-color:#6ee7b7; color:#065f46; }
  .campaign-badge.paused { background:#fef3c7; border-color:#fcd34d; color:#92400e; }
  .campaign-meta { font-size:12px; color:var(--text-muted); display:flex; gap:14px; flex-wrap:wrap; }
  .campaign-result { font-size:12px; padding:6px 8px; border-radius:4px; }
  .campaign-result.ok  { background:#d1fae5; color:#065f46; }
  .campaign-result.err { background:#fee2e2; color:#991b1b; }
  .campaign-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
  .account-check { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:8px 12px; cursor:pointer; transition:border-color .2s; }
  .account-check:hover { border-color:var(--accent); }
  .account-check input[type=checkbox] { width:16px; height:16px; cursor:pointer; }
  .account-check img { width:32px; height:32px; border-radius:50%; object-fit:cover; }
  .account-check .acc-info { display:flex; flex-direction:column; }
  .account-check .acc-name { font-size:13px; font-weight:600; }
  .account-check .acc-sub  { font-size:11px; color:var(--text-muted); }
  .platform-icon { font-size:14px; }
  .model-card { display:flex; align-items:center; gap:10px; border:2px solid var(--border); border-radius:8px; padding:12px 16px; cursor:pointer; transition:border-color .2s,background .2s; flex:1; min-width:160px; }
  .model-card:has(input:checked) { border-color:var(--accent); background:rgba(56,139,253,.08); }
  .model-card input[type=radio] { width:16px; height:16px; accent-color:var(--accent); flex-shrink:0; }
  .model-card-name { font-size:13px; font-weight:600; }
  .model-card-sub  { font-size:11px; color:var(--text-muted); margin-top:2px; }
  .price-est { margin-top:8px; font-size:13px; font-weight:600; color:var(--accent); }
  input[type=range] { width:100%; accent-color:var(--accent); }

  /* ── Logs tab ── */
  .log-run { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); margin-bottom:10px; overflow:hidden; }
  .log-run-header { display:flex; align-items:center; gap:10px; padding:12px 16px; cursor:pointer; user-select:none; transition:background .15s; }
  .log-run-header:hover { background:var(--surface2); }
  .log-run-status { font-size:16px; flex-shrink:0; }
  .log-run-info { flex:1; min-width:0; }
  .log-run-name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .log-run-meta { font-size:11px; color:var(--text-muted); margin-top:2px; }
  .log-run-badge { font-size:11px; font-weight:600; padding:2px 8px; border-radius:20px; flex-shrink:0; }
  .log-run-badge.success { background:#1a3a2a; color:#3fb950; }
  .log-run-badge.failure { background:#3a1a1a; color:#f85149; }
  .log-run-badge.in_progress { background:#1a2a3a; color:#58a6ff; }
  .log-run-badge.queued    { background:#2a2a1a; color:#d29922; }
  .log-run-badge.cancelled { background:#2a2a2a; color:#8b949e; }
  .log-run-chevron { color:var(--text-muted); font-size:12px; flex-shrink:0; transition:transform .2s; }
  .log-run-chevron.open { transform:rotate(90deg); }
  .log-run-body { display:none; border-top:1px solid var(--border); padding:12px 16px; }
  .log-run-body.open { display:block; }
  .log-step { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid var(--border); font-size:12px; }
  .log-step:last-child { border-bottom:none; }
  .log-step-icon { flex-shrink:0; font-size:14px; }
  .log-step-name { flex:1; }
  .log-step-dur { color:var(--text-muted); flex-shrink:0; }
  .log-gh-link { display:inline-block; margin-top:10px; font-size:12px; color:var(--accent); text-decoration:none; }
  .log-gh-link:hover { text-decoration:underline; }
</style>
</head>
<body>

<div class="header">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#388bfd" stroke-width="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>
  <h1>TikTok → AI → Video</h1>
  <span class="badge">Workflow Runner</span>
</div>

<div class="loading-overlay" id="loading-overlay">
  <div class="spinner"></div>
  <span style="color:var(--text-muted);font-size:13px" id="loading-text">Loading config...</span>
</div>

<div class="tab-bar">
  <button class="tab-btn active" id="tab-btn-workflow" onclick="switchTab('workflow')">🎬 Workflow</button>
  <button class="tab-btn" id="tab-btn-campaigns" onclick="switchTab('campaigns')">📅 Campaigns</button>
  <button class="tab-btn" id="tab-btn-logs" onclick="switchTab('logs')">📋 Logs</button>
</div>

<div id="tab-workflow" class="container">

  <!-- Config Form -->
  <div class="card">
    <div class="card-header" onclick="toggleCard(this)">
      <h2>📋 Workflow Config</h2>
      <span class="toggle">▼</span>
    </div>
    <div class="card-body" id="config-body">

      <!-- Step 1: TikTok Search -->
      <div class="section-label">🔍 Step 1 — TikTok Search</div>
      <div class="form-grid">
        <div class="field full">
          <label>Keyword</label>
          <div class="keyword-row">
            <div class="field">
              <input type="text" id="keyword" placeholder="e.g. dragonball" onkeydown="if(event.key==='Enter') searchVideos()">
            </div>
            <button class="btn btn-blue" id="btn-search" onclick="searchVideos()">🔍 Search</button>
          </div>
        </div>
        <div class="field">
          <label>Max Results</label>
          <select id="max_videos">
            <option value="1">1 video</option>
            <option value="5" selected>5 videos</option>
            <option value="8">8 videos</option>
            <option value="10">10 videos</option>
          </select>
        </div>
      </div>

      <!-- Video results panel -->
      <div id="video-results-wrap" style="display:none" class="video-results-wrap">
        <div class="video-results-label">
          📹 Select a Video
          <span id="video-results-hint"></span>
        </div>
        <div class="video-list" id="video-list"></div>
      </div>

      <!-- Step 2: AI Analysis -->
      <div class="section-label">🤖 Step 2 — AI Analysis</div>
      <div class="form-grid">
        <div class="field">
          <label>Analysis Model</label>
          <select id="analysis_model">
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (recommended)</option>
            <option value="gemini-3.1-pro">gemini-3.1-pro</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
          </select>
        </div>
        <div class="field">
          <label>Poll Interval (seconds)</label>
          <input type="number" id="poll_interval_seconds" min="10" max="120" placeholder="30">
        </div>
        <textarea id="analysis_prompt" style="display:none"></textarea>
      </div>

      <!-- Product Photo -->
      <div class="section-label">📸 Step 2b — Product Photo <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">(optional)</span></div>
      <div class="product-upload-wrap">
        <input type="file" id="product-file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="onProductFileSelected(event)">
        <div class="product-drop-area" id="product-drop-area" onclick="document.getElementById('product-file').click()">
          <div id="product-placeholder">
            <div style="font-size:28px;margin-bottom:6px">📷</div>
            <div style="font-size:13px;font-weight:600">Click to upload product photo</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">JPG · PNG · WebP — max 1 MB compressed</div>
          </div>
          <div id="product-preview-wrap" style="display:none">
            <img id="product-preview" alt="Product" style="max-height:140px;max-width:100%;border-radius:6px;display:block;margin:0 auto">
          </div>
        </div>
        <div class="product-status" id="product-status"></div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-blue" id="btn-upload-product" style="display:none" onclick="uploadProductImage(event)">☁ Save to Workflow</button>
          <button class="btn btn-outline" id="btn-clear-product" style="display:none" onclick="removeProductImage(event)">✕ Remove</button>
        </div>
      </div>

      <!-- Step 3: Video Generation -->
      <div class="section-label">🎬 Step 3 — Video Generation</div>
      <div class="form-grid">
        <div class="field">
          <label>Video Model</label>
          <select id="seedance_model" onchange="onModelChange()">
            <option value="wan/2-6-text-to-video">Wan 2.6 (recommended, $1.05/15s)</option>
            <option value="grok-imagine/text-to-video">Grok Aurora ($0.05/s)</option>
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

    </div>
  </div>

  <!-- Action Bar -->
  <div class="action-bar">
    <button class="btn btn-outline" onclick="saveConfig()" id="btn-save">💾 Save Config</button>
    <div class="spacer"></div>
    <span class="hint" id="start-hint" style="display:none">Search and select a video first</span>
    <button class="btn btn-primary" onclick="startWorkflow()" id="btn-start" disabled>▶ Generate Video</button>
  </div>

  <!-- Status Card -->
  <div class="card status-card" id="status-card">
    <div class="card-header" style="cursor:default">
      <h2 id="status-title">⏳ Workflow Status</h2>
    </div>
    <div class="card-body">
      <div class="status-header">
        <div class="status-badge queued" id="status-badge"><div class="dot"></div><span id="status-text">Queued</span></div>
        <div class="meta-row">
          <span id="run-meta-id" style="display:none">🔗 Run <a id="run-link" href="#" target="_blank" class="github-link"></a></span>
          <span>⏱ <span id="elapsed-display">0s</span></span>
        </div>
      </div>

      <div class="steps" id="steps-list">
        <div class="step" id="step-1"><div class="step-icon">⏸</div><div class="step-label">TikTok Video (pre-selected)</div><div class="step-status"></div></div>
        <div class="step" id="step-2"><div class="step-icon">⏸</div><div class="step-label">TikWM: Get HD URL</div><div class="step-status"></div></div>
        <div class="step" id="step-3"><div class="step-icon">⏸</div><div class="step-label">Download TikTok Video</div><div class="step-status"></div></div>
        <div class="step" id="step-4"><div class="step-icon">⏸</div><div class="step-label">AI Video Analysis</div><div class="step-status"></div></div>
        <div class="step" id="step-5"><div class="step-icon">⏸</div><div class="step-label">Create Video Task (Kie.ai)</div><div class="step-status"></div></div>
        <div class="step" id="step-6"><div class="step-icon">⏸</div><div class="step-label">Poll Until Video Ready</div><div class="step-status"></div></div>
        <div class="step" id="step-7"><div class="step-icon">⏸</div><div class="step-label">Save Result</div><div class="step-status"></div></div>
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
        <span id="error-msg" style="font-size:12px;opacity:.8"></span>
      </div>
    </div>
  </div>

</div>

</div><!-- /tab-workflow -->

<div id="tab-campaigns" class="container" style="display:none">
<div class="card" id="campaigns-card">
  <div class="card-header" onclick="toggleCard(this)">
    <span>📅 Campaigns — Auto-generate &amp; Post</span>
    <button class="btn btn-blue" style="margin-left:auto" onclick="event.stopPropagation(); openCampaignForm(null)">➕ New Campaign</button>
  </div>
  <div class="card-body">

    <!-- Create / Edit form -->
    <div id="campaign-form" style="display:none; background:var(--surface-alt); border:1px solid var(--border); border-radius:8px; padding:16px; margin-bottom:16px;">
      <div style="font-weight:600; margin-bottom:12px;" id="campaign-form-title">New Campaign</div>
      <input type="hidden" id="campaign-edit-id">
      <div class="form-grid">
        <div class="field">
          <label>Campaign Name</label>
          <input type="text" id="campaign-name" placeholder="e.g. Daily Cat Videos">
        </div>
        <div class="field">
          <label>Keyword</label>
          <input type="text" id="campaign-keyword" placeholder="e.g. washing machine">
        </div>
        <div class="field">
          <label>Post Every</label>
          <select id="campaign-interval">
            <option value="6">Every 6 hours</option>
            <option value="12">Every 12 hours</option>
            <option value="24" selected>Every 24 hours (daily)</option>
            <option value="48">Every 2 days</option>
            <option value="72">Every 3 days</option>
            <option value="168">Every week</option>
          </select>
        </div>
        <div class="field full">
          <label>Video Model</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <label class="model-card">
              <input type="radio" name="campaign_model" value="grok-imagine/text-to-video" id="model-grok" onchange="onCampaignModelChange()" checked>
              <div>
                <div class="model-card-name">⚡ Grok Aurora</div>
                <div class="model-card-sub">Max 10s · $0.05/s</div>
              </div>
            </label>
            <label class="model-card">
              <input type="radio" name="campaign_model" value="wan/2-6-text-to-video" id="model-seedance" onchange="onCampaignModelChange()">
              <div>
                <div class="model-card-name">🌊 Wan 2.6</div>
                <div class="model-card-sub">Max 15s · ~$0.03/s</div>
              </div>
            </label>
          </div>
          <div style="margin-top:14px;">
            <label style="display:flex;justify-content:space-between;"><span>Duration</span><strong><span id="campaign-duration-val">10</span>s</strong></label>
            <input type="range" id="campaign-duration" min="3" max="10" value="10" style="margin-top:6px" oninput="onCampaignDurationChange()">
          </div>
          <div class="price-est" id="campaign-price-est">Estimated cost: ~$0.50 / video</div>
        </div>
        <div class="field full">
          <label>Product Photo <span style="font-weight:400;color:var(--text-muted)">(optional — used to replace product in AI-generated video)</span></label>
          <input type="file" id="campaign-product-file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="onCampaignProductSelected(event)">
          <div class="product-drop-area" id="campaign-product-drop" onclick="document.getElementById('campaign-product-file').click()" style="min-height:80px">
            <div id="campaign-product-placeholder">
              <div style="font-size:22px;margin-bottom:4px">📷</div>
              <div style="font-size:13px;font-weight:600">Click to upload product photo</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">JPG · PNG · WebP</div>
            </div>
            <div id="campaign-product-preview-wrap" style="display:none">
              <img id="campaign-product-preview" alt="Product" style="max-height:100px;max-width:100%;border-radius:6px;display:block;margin:0 auto">
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-outline" id="btn-clear-campaign-product" style="display:none;font-size:12px" onclick="clearCampaignProduct(event)">✕ Remove Photo</button>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px">Caption is copied automatically from the TikTok video description.</div>
        </div>
        <div class="field full">
          <label>Post To (select accounts)</label>
          <div id="campaign-accounts-list" style="display:flex; flex-wrap:wrap; gap:10px; padding:8px 0;">
            <span style="color:var(--text-muted); font-size:13px;">Loading accounts...</span>
          </div>
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-top:12px;">
        <button class="btn btn-primary" onclick="saveCampaign()">💾 Save Campaign</button>
        <button class="btn btn-outline" onclick="closeCampaignForm()">Cancel</button>
      </div>
    </div>

    <!-- Campaign list -->
    <div id="campaign-list" style="display:flex; flex-direction:column; gap:10px;">
      <div style="color:var(--text-muted); font-size:13px; padding:8px 0;">Loading campaigns...</div>
    </div>

  </div>
</div>
</div><!-- /tab-campaigns -->

<div id="tab-logs" class="container" style="display:none">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <h2 style="font-size:16px;font-weight:600">Execution Logs</h2>
    <button class="btn btn-outline" onclick="loadLogs()">↻ Refresh</button>
  </div>
  <div id="logs-list"><p style="color:var(--text-muted);font-size:13px">Loading logs...</p></div>
</div><!-- /tab-logs -->

<div class="toast hidden" id="toast"></div>

<script>
// ── State ──────────────────────────────────────────────────────────────────────
let pollTimer      = null;
let elapsedTimer   = null;
let startMs        = 0;
let currentRunId   = null;
let triggerTime    = null;
let loadedApiKeys  = {};
let selectedVideo      = null;
let productImageSha    = null;   // GitHub sha of current product-image.jpg
let pendingProductB64  = null;   // compressed base64 chosen but not yet uploaded

// ── API ────────────────────────────────────────────────────────────────────────
async function api(path, options = {}) { return fetch(path, options); }

// ── Card toggle ────────────────────────────────────────────────────────────────
function toggleCard(header) {
  header.classList.toggle('collapsed');
  header.nextElementSibling.classList.toggle('hidden');
}

// ── Config ─────────────────────────────────────────────────────────────────────
async function loadConfig() {
  document.getElementById('loading-overlay').classList.add('visible');
  document.getElementById('loading-text').textContent = 'Loading config...';
  try {
    const res = await api('/api/config');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const cfg = JSON.parse(fromBase64(data.content));
    populateForm(cfg);
    toast('Config loaded ✓', 'success');
  } catch(e) {
    toast('Failed to load config: ' + e.message, 'error');
  } finally {
    document.getElementById('loading-overlay').classList.remove('visible');
    updateStartButton();
  }
}

function fromBase64(str) {
  return decodeURIComponent(
    Array.from(atob(str.replace(/\\n/g, '')))
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

function toBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))));
}

function populateForm(cfg) {
  if (cfg.apify_api_key) loadedApiKeys.apify_api_key = cfg.apify_api_key;
  if (cfg.kie_api_key)   loadedApiKeys.kie_api_key   = cfg.kie_api_key;
  if (cfg.keyword)               document.getElementById('keyword').value                = cfg.keyword;
  if (cfg.max_videos)            setSelect('max_videos', String(cfg.max_videos));
  if (cfg.analysis_model)          setSelect('analysis_model', cfg.analysis_model);
  if (cfg.analysis_prompt)         document.getElementById('analysis_prompt').value          = cfg.analysis_prompt;
  if (cfg.poll_interval_seconds) document.getElementById('poll_interval_seconds').value  = cfg.poll_interval_seconds;
  if (cfg.seedance) {
    if (cfg.seedance.model)        setSelect('seedance_model', cfg.seedance.model);
    if (cfg.seedance.duration)     setSelect('seedance_duration', String(cfg.seedance.duration));
    if (cfg.seedance.resolution)   setSelect('seedance_resolution', cfg.seedance.resolution);
    if (cfg.seedance.aspect_ratio) setSelect('seedance_aspect_ratio', cfg.seedance.aspect_ratio);
  }
  onModelChange();
}

function setSelect(id, value) {
  const el = document.getElementById(id);
  const opt = Array.from(el.options).find(o => o.value === value);
  if (opt) { el.value = value; }
  else {
    const label = id === 'max_videos' ? value + (value === '1' ? ' video' : ' videos') : value;
    el.add(new Option(label, value));
    el.value = value;
  }
}

function collectConfig(includeSelectedVideo = false) {
  const cfg = {
    "_comment": "TikTok → AI → Video Workflow Config.",
    "_section_api_keys": "=== API KEYS ===",
    "apify_api_key": loadedApiKeys.apify_api_key || '',
    "kie_api_key":   loadedApiKeys.kie_api_key   || '',
    "_section_search": "=== TIKTOK SEARCH ===",
    "keyword":    document.getElementById('keyword').value,
    "max_videos": parseInt(document.getElementById('max_videos').value) || 5,
    "_section_analysis": "=== AI ANALYSIS ===",
    "analysis_model":  document.getElementById('analysis_model').value,
    "analysis_prompt": document.getElementById('analysis_prompt').value,
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
  if (includeSelectedVideo && selectedVideo) cfg.selected_video = selectedVideo;
  return cfg;
}

async function saveConfig() {
  const btn = document.getElementById('btn-save');
  btn.disabled = true; btn.textContent = '⏳ Saving...';
  try {
    const cfg = collectConfig(false);
    const getRes = await api('/api/config');
    const getData = await getRes.json();
    const sha = getData.sha;
    const putRes = await api('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: toBase64(JSON.stringify(cfg, null, 2)), sha, message: \`config: update keyword to "\${cfg.keyword}"\` })
    });
    if (!putRes.ok) throw new Error('HTTP ' + putRes.status);
    toast('Config saved ✓', 'success');
  } catch(e) {
    toast('Save failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '💾 Save Config';
  }
}

function onModelChange() {
  const model = document.getElementById('seedance_model').value;
  document.getElementById('resolution-field').style.display = model.startsWith('sora') ? 'none' : '';
  // Grok Aurora max duration is 10s
  const durSelect = document.getElementById('seedance_duration');
  if (model.startsWith('grok')) {
    Array.from(durSelect.options).forEach(o => { o.disabled = parseInt(o.value) > 10; });
    if (parseInt(durSelect.value) > 10) setSelect('seedance_duration', '10');
  } else {
    Array.from(durSelect.options).forEach(o => { o.disabled = false; });
  }
}

// ── TikTok Search ──────────────────────────────────────────────────────────────
async function searchVideos() {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) { toast('Enter a keyword first', 'error'); return; }

  const btn = document.getElementById('btn-search');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner-sm"></div> Searching...';

  const wrap = document.getElementById('video-results-wrap');
  const list = document.getElementById('video-list');
  wrap.style.display = 'block';
  list.innerHTML = '<div class="search-spinner"><div class="spinner-sm"></div> Searching TikTok for "' + escHtml(keyword) + '" (~30 seconds)...</div>';

  // Reset selection
  selectedVideo = null;
  updateStartButton();

  try {
    const maxVideos = parseInt(document.getElementById('max_videos').value) || 5;

    // Step 1: Trigger GitHub Actions search workflow
    const triggerRes = await api('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, max_videos: maxVideos })
    });
    if (!triggerRes.ok) throw new Error('HTTP ' + triggerRes.status);
    const triggerData = await triggerRes.json();
    if (!triggerData.triggered) throw new Error('Failed to trigger search (status ' + triggerData.status + ')');

    // Step 2: Poll for results every 4 seconds (max 25 attempts = ~100s)
    const maxAttempts = 25;
    let attempt = 0;
    while (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, 4000));
      attempt++;
      list.innerHTML = '<div class="search-spinner"><div class="spinner-sm"></div> Waiting for results... (' + attempt * 4 + 's)</div>';

      const pollRes = await api('/api/search-results?keyword=' + encodeURIComponent(keyword));
      if (!pollRes.ok) continue;
      const data = await pollRes.json();

      if (data.ready) {
        renderVideoResults(data.videos, keyword);
        return;
      }
    }

    // Timeout
    list.innerHTML = '<div class="search-empty">Search timed out for "' + escHtml(keyword) + '". Please try again.</div>';
    document.getElementById('video-results-hint').textContent = 'Timed out';
  } catch(e) {
    list.innerHTML = '<div class="search-empty">Search failed: ' + escHtml(e.message) + '</div>';
    toast('Search failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 Search';
  }
}

function renderVideoResults(videos, keyword) {
  const list = document.getElementById('video-list');
  if (!videos || videos.length === 0) {
    list.innerHTML = '<div class="search-empty">No videos found for "' + escHtml(keyword) + '". Try another keyword.</div>';
    document.getElementById('video-results-hint').textContent = '0 results';
    return;
  }
  document.getElementById('video-results-hint').textContent = videos.length + ' results — click one to select';
  list.innerHTML = '';
  videos.forEach((v, i) => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.id = 'vcard-' + i;
    card.onclick = () => selectVideo(v, i);

    const thumb = v.thumbnail
      ? \`<img class="video-thumb" src="\${escHtml(v.thumbnail)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\`
      + \`<div class="video-thumb-placeholder" style="display:none">🎬</div>\`
      : \`<div class="video-thumb-placeholder">🎬</div>\`;

    const plays = fmtNum(v.playCount);
    const likes = fmtNum(v.likeCount);
    const dur   = v.duration ? v.duration + 's' : '';

    card.innerHTML = \`
      \${thumb}
      <div class="video-info">
        <div class="video-author">@\${escHtml(v.authorName)}</div>
        <div class="video-desc">\${escHtml(v.description || '(no description)')}</div>
        <div class="video-stats">
          <span class="video-badge">▶ \${plays}</span>
          <span class="video-badge">♥ \${likes}</span>
          \${dur ? \`<span class="video-badge">⏱ \${dur}</span>\` : ''}
          \${v.webUrl ? \`<a href="\${escHtml(v.webUrl)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent-hover);font-size:11px;margin-left:auto">TikTok ↗</a>\` : ''}
        </div>
      </div>\`;
    list.appendChild(card);
  });
}

function selectVideo(video, index) {
  // Clear previous selection
  document.querySelectorAll('.video-card').forEach(c => {
    c.classList.remove('selected');
    const tag = c.querySelector('.video-selected-tag');
    if (tag) tag.remove();
  });

  // Select this one
  selectedVideo = video;
  const card = document.getElementById('vcard-' + index);
  card.classList.add('selected');
  const tag = document.createElement('span');
  tag.className = 'video-selected-tag';
  tag.textContent = '✓ Selected';
  card.querySelector('.video-info').appendChild(tag);

  document.getElementById('video-results-hint').textContent = 'Selected: @' + video.authorName;
  updateStartButton();
  toast('Video selected ✓', 'success');
}

function updateStartButton() {
  const btn   = document.getElementById('btn-start');
  const hint  = document.getElementById('start-hint');
  if (selectedVideo) {
    btn.disabled = false;
    hint.style.display = 'none';
  } else {
    btn.disabled = true;
    hint.style.display = '';
  }
}

// ── Start Workflow ─────────────────────────────────────────────────────────────
async function startWorkflow() {
  if (!selectedVideo) { toast('Select a video first', 'error'); return; }

  const btn = document.getElementById('btn-start');
  btn.disabled = true; btn.textContent = '⏳ Starting...';
  try {
    // Save config with selected_video included
    const cfg = collectConfig(true);
    const getRes = await api('/api/config');
    const getData = await getRes.json();
    const sha = getData.sha;
    const putRes = await api('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: toBase64(JSON.stringify(cfg, null, 2)),
        sha,
        message: \`config: generate video for @\${cfg.selected_video.authorName} [\${cfg.keyword}]\`
      })
    });
    if (!putRes.ok) throw new Error('Save config failed: HTTP ' + putRes.status);

    triggerTime = new Date().toISOString();
    const res = await api('/api/trigger', { method: 'POST' });
    const data = await res.json();
    if (data.status !== 204) throw new Error('Trigger failed: HTTP ' + data.status);

    toast('Workflow started ✓', 'success');
    showStatusCard();
    startPolling();
  } catch(e) {
    toast('Failed to start: ' + e.message, 'error');
    btn.disabled = false; btn.textContent = '▶ Generate Video';
  }
}

// ── Status ─────────────────────────────────────────────────────────────────────
function showStatusCard() {
  const card = document.getElementById('status-card');
  card.classList.add('visible');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('result-box').style.display = 'none';
  document.getElementById('error-box').style.display  = 'none';
  setStatusBadge('queued', 'Queued');
  resetSteps();
  startMs = Date.now();
  clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const s = Math.floor((Date.now() - startMs) / 1000);
    const m = Math.floor(s / 60);
    document.getElementById('elapsed-display').textContent = m > 0 ? \`\${m}m \${s%60}s\` : \`\${s}s\`;
  }, 1000);
}

function setStatusBadge(state, text) {
  const badge = document.getElementById('status-badge');
  badge.className = 'status-badge ' + state;
  badge.innerHTML = \`<div class="dot \${state==='running'?'pulse':''}"></div><span>\${text}</span>\`;
}

function resetSteps() {
  for (let i = 1; i <= 7; i++) {
    const s = document.getElementById('step-' + i);
    s.className = 'step';
    s.querySelector('.step-icon').textContent = '⏸';
    s.querySelector('.step-status').textContent = '';
  }
}

function startPolling() {
  clearTimeout(pollTimer);
  currentRunId = null;
  setTimeout(() => pollStatus(), 6000);
}

async function pollStatus() {
  try {
    if (!currentRunId) {
      const res = await api('/api/runs');
      const data = await res.json();
      const runs = data.workflow_runs || [];
      const triggerMs = new Date(triggerTime).getTime() - 120000;
      const run = runs.find(r => new Date(r.created_at).getTime() > triggerMs);
      if (run) {
        currentRunId = run.id;
        document.getElementById('run-meta-id').style.display = '';
        const link = document.getElementById('run-link');
        link.href = \`https://github.com/adrentan888-adren/tiktok-workflow-app/actions/runs/\${run.id}\`;
        link.textContent = '#' + run.run_number;
      }
    }

    if (currentRunId) {
      const res = await api(\`/api/run/\${currentRunId}\`);
      const { run, jobs } = await res.json();

      if (run.status === 'in_progress') {
        setStatusBadge('running', 'Running');
        markRunningSteps(jobs.jobs || []);
      } else if (run.status === 'completed') {
        clearTimeout(pollTimer);
        clearInterval(elapsedTimer);
        if (run.conclusion === 'success') {
          setStatusBadge('success', 'Completed');
          markAllDone();
          await loadResult();
        } else {
          setStatusBadge('failure', 'Failed');
          showError(run.conclusion + ' — check GitHub for logs');
        }
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-start').textContent = '▶ Generate Video';
        updateStartButton();
        return;
      }
    }
  } catch(e) { console.error('Poll error:', e); }
  pollTimer = setTimeout(() => pollStatus(), 15000);
}

function markRunningSteps(jobs) {
  if (!jobs.length) return;
  const steps = jobs[0].steps || [];
  steps.forEach(s => {
    if (s.name.toLowerCase().includes('run workflow')) {
      if (s.status === 'in_progress') {
        for (let i = 1; i <= 6; i++) {
          const el = document.getElementById('step-' + i);
          if (!el.classList.contains('done')) { el.classList.add('active'); el.querySelector('.step-icon').textContent = '🔄'; }
        }
      } else if (s.status === 'completed') {
        for (let i = 1; i <= 6; i++) {
          const el = document.getElementById('step-' + i);
          el.className = 'step done'; el.querySelector('.step-icon').textContent = '✅';
        }
      }
    }
  });
}

function markAllDone() {
  for (let i = 1; i <= 7; i++) {
    const s = document.getElementById('step-' + i);
    s.className = 'step done'; s.querySelector('.step-icon').textContent = '✅'; s.querySelector('.step-status').textContent = 'Done';
  }
}

async function loadResult() {
  await new Promise(r => setTimeout(r, 3000));
  try {
    const res = await api('/api/result');
    if (!res.ok) throw new Error('not ready');
    const data = await res.json();
    const result = JSON.parse(fromBase64(data.content));
    if (result.success) showResult(result);
    else showError(result.error || 'Workflow failed');
  } catch(e) {
    document.getElementById('result-box').style.display = 'block';
    document.getElementById('result-url').textContent = 'Video URL available in GitHub Actions summary →';
    document.getElementById('result-open').href = \`https://github.com/adrentan888-adren/tiktok-workflow-app/actions/runs/\${currentRunId}\`;
    document.getElementById('result-open').textContent = '🔗 View Run';
    document.getElementById('result-github').href = document.getElementById('result-open').href;
  }
}

function showResult(result) {
  document.getElementById('result-box').style.display = 'block';
  document.getElementById('result-meta').innerHTML = \`
    <span class="key">Keyword</span><span>\${escHtml(result.keyword||'N/A')}</span>
    <span class="key">Model</span><span>\${escHtml(result.model||'N/A')}</span>
    <span class="key">Duration</span><span>\${result.duration||15}s \${result.resolution||''}</span>
    <span class="key">Time</span><span>\${result.elapsedMinutes||'?'} minutes</span>
    <span class="key">TikTok</span><span>@\${escHtml(result.tiktokAuthor||'N/A')}</span>
  \`;
  document.getElementById('result-url').textContent = result.videoUrl || 'No URL';
  document.getElementById('result-open').href = result.videoUrl || '#';
  document.getElementById('result-github').href = \`https://github.com/adrentan888-adren/tiktok-workflow-app/actions/runs/\${currentRunId}\`;
}

function showError(msg) {
  document.getElementById('error-box').style.display = 'block';
  document.getElementById('error-msg').textContent = msg;
}

function copyVideoUrl() {
  navigator.clipboard.writeText(document.getElementById('result-url').textContent)
    .then(() => toast('URL copied ✓', 'success'));
}

function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n/1000).toFixed(1) + 'K';
  return String(n);
}

let toastTimeout;
function toast(msg, type='info') {
  const el = document.getElementById('toast');
  el.className = \`toast \${type}\`;
  el.innerHTML = (type==='success'?'✓ ':type==='error'?'✕ ':'') + escHtml(msg);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), 3500);
}

function escHtml(str) {
  return String(str||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Product Image ──────────────────────────────────────────────────────────────
async function loadProductImage() {
  try {
    const res = await api('/api/product-image');
    if (!res.ok) return;
    const data = await res.json();
    if (data.exists === false) return;
    if (data.content) {
      productImageSha = data.sha || null;
      const src = 'data:image/jpeg;base64,' + data.content.replace(/\\n/g, '');
      showProductPreview(src);
      setProductStatus('✓ Product photo saved to workflow', 'ok');
    }
  } catch(e) { /* silently ignore */ }
}

function onProductFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  setProductStatus('Compressing...', '');
  compressImage(file).then(b64 => {
    pendingProductB64 = b64;
    showProductPreview('data:image/jpeg;base64,' + b64);
    setProductStatus('Image ready — click "Save to Workflow"', '');
    document.getElementById('btn-upload-product').style.display = '';
    document.getElementById('btn-clear-product').style.display = '';
  }).catch(err => setProductStatus('Error: ' + err.message, 'err'));
  // reset so same file can be reselected
  e.target.value = '';
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
          else        { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        // Try quality levels until under 1 MB
        for (const q of [0.85, 0.70, 0.55, 0.40]) {
          const dataUrl = canvas.toDataURL('image/jpeg', q);
          const b64 = dataUrl.split(',')[1];
          if (b64.length * 0.75 < 1024 * 1024) { resolve(b64); return; }
        }
        reject(new Error('Image too large even after compression'));
      };
      img.onerror = () => reject(new Error('Cannot read image'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Cannot read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadProductImage(e) {
  e.stopPropagation();
  if (!pendingProductB64) return;
  const btn = document.getElementById('btn-upload-product');
  btn.disabled = true; btn.textContent = '⏳ Saving...';
  try {
    const res = await api('/api/product-image', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: pendingProductB64, sha: productImageSha })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    productImageSha = data.content && data.content.sha ? data.content.sha : productImageSha;
    pendingProductB64 = null;
    btn.style.display = 'none';
    setProductStatus('✓ Product photo saved to workflow', 'ok');
    toast('Product photo saved ✓', 'success');
  } catch(err) {
    setProductStatus('Save failed: ' + err.message, 'err');
    toast('Upload failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '☁ Save to Workflow';
  }
}

async function removeProductImage(e) {
  e.stopPropagation();
  if (!productImageSha && !pendingProductB64) {
    clearProductUI(); return;
  }
  if (pendingProductB64) { clearProductUI(); return; }
  const btn = document.getElementById('btn-clear-product');
  btn.disabled = true; btn.textContent = '⏳ Removing...';
  try {
    const res = await api('/api/product-image', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: productImageSha })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    clearProductUI();
    toast('Product photo removed ✓', 'success');
  } catch(err) {
    setProductStatus('Remove failed: ' + err.message, 'err');
    toast('Remove failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '✕ Remove';
  }
}

function showProductPreview(src) {
  document.getElementById('product-placeholder').style.display = 'none';
  const wrap = document.getElementById('product-preview-wrap');
  wrap.style.display = 'block';
  document.getElementById('product-preview').src = src;
  document.getElementById('product-drop-area').classList.add('has-image');
  document.getElementById('btn-clear-product').style.display = '';
}

function clearProductUI() {
  productImageSha = null; pendingProductB64 = null;
  document.getElementById('product-placeholder').style.display = '';
  document.getElementById('product-preview-wrap').style.display = 'none';
  document.getElementById('product-preview').src = '';
  document.getElementById('product-drop-area').classList.remove('has-image');
  document.getElementById('btn-upload-product').style.display = 'none';
  document.getElementById('btn-clear-product').style.display = 'none';
  setProductStatus('', '');
}

function setProductStatus(msg, type) {
  const el = document.getElementById('product-status');
  el.textContent = msg;
  el.className = 'product-status' + (type ? ' ' + type : '');
}

// ── Init ───────────────────────────────────────────────────────────────────────
// ── Tab switching ──────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('tab-workflow').style.display  = tab === 'workflow'  ? '' : 'none';
  document.getElementById('tab-campaigns').style.display = tab === 'campaigns' ? '' : 'none';
  document.getElementById('tab-logs').style.display      = tab === 'logs'      ? '' : 'none';
  document.getElementById('tab-btn-workflow').classList.toggle('active',  tab === 'workflow');
  document.getElementById('tab-btn-campaigns').classList.toggle('active', tab === 'campaigns');
  document.getElementById('tab-btn-logs').classList.toggle('active',      tab === 'logs');
  if (tab === 'logs') loadLogs();
}

// ── Campaign model / pricing ───────────────────────────────────────────────────
const CAMPAIGN_MODELS = {
  'grok-imagine/text-to-video': { label: 'Grok Aurora', maxDuration: 10, pricePerSec: 0.05, flatPrice: null },
  'wan/2-6-text-to-video':      { label: 'Wan 2.6',     maxDuration: 15, pricePerSec: 0.03, flatPrice: null },
};

function getSelectedModel() {
  return document.querySelector('input[name=campaign_model]:checked')?.value || 'grok-imagine/text-to-video';
}

function onCampaignModelChange() {
  const m   = CAMPAIGN_MODELS[getSelectedModel()];
  const dur = document.getElementById('campaign-duration');
  dur.max   = m.maxDuration;
  if (parseInt(dur.value) > m.maxDuration) { dur.value = m.maxDuration; }
  onCampaignDurationChange();
}

function onCampaignDurationChange() {
  const model = getSelectedModel();
  const m     = CAMPAIGN_MODELS[model];
  const dur   = parseInt(document.getElementById('campaign-duration').value);
  document.getElementById('campaign-duration-val').textContent = dur;
  let est;
  if (m.flatPrice !== null) {
    est = \`~$\${m.flatPrice.toFixed(2)} / video (flat rate)\`;
  } else {
    est = \`~$\${(m.pricePerSec * dur).toFixed(2)} / video  ($\${m.pricePerSec}/s × \${dur}s)\`;
  }
  document.getElementById('campaign-price-est').textContent = 'Estimated cost: ' + est;
}

// ── Campaigns ──────────────────────────────────────────────────────────────────
let campaignsSha       = null;
let socialAccounts     = [];   // [{username, platform, display_name, handle, img}]

const PLATFORM_ICONS = { tiktok:'🎵', youtube:'▶️', instagram:'📸', facebook:'👤', twitter:'🐦', linkedin:'💼', threads:'🧵', pinterest:'📌', bluesky:'🦋', reddit:'🤖' };

async function loadCampaigns() {
  try {
    const res  = await api('/api/campaigns');
    if (!res.ok) { renderCampaignList([]); return; }
    const data = await res.json();
    const obj  = JSON.parse(atob(data.content.replace(/\\n/g, '')));
    campaignsSha = data.sha;
    renderCampaignList(obj.campaigns || []);
  } catch(e) { renderCampaignList([]); }
}

async function loadSocialAccounts() {
  try {
    const res  = await api('/api/social-accounts');
    if (!res.ok) return;
    const data = await res.json();
    socialAccounts = [];
    for (const profile of (data.profiles || [])) {
      for (const [platform, info] of Object.entries(profile.social_accounts || {})) {
        if (!info || typeof info !== 'object') continue;
        socialAccounts.push({ username: profile.username, platform, display_name: info.display_name || profile.username, handle: info.handle || '', img: info.social_images || '' });
      }
    }
  } catch(e) {}
}

function renderCampaignList(campaigns) {
  const el = document.getElementById('campaign-list');
  if (!campaigns.length) { el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">No campaigns yet. Click ➕ New Campaign to create one.</div>'; return; }
  el.innerHTML = '';
  campaigns.forEach(c => {
    const div = document.createElement('div');
    div.className = 'campaign-card';
    const accounts = (c.accounts || []).map(a => \`<span class="campaign-badge">\${PLATFORM_ICONS[a.platform]||'📱'} \${a.handle || a.platform} <span style="color:var(--text-muted)">@\${a.username}</span></span>\`).join(' ');
    const lastRun  = c.last_run_at  ? new Date(c.last_run_at).toLocaleString()  : 'Never';
    const nextRun  = c.next_run_at  ? new Date(c.next_run_at).toLocaleString()  : 'On next check';
    const resultHtml = c.last_result
      ? c.last_result.success
        ? \`<div class="campaign-result ok">✅ Last run succeeded · <a href="\${escHtml(c.last_result.videoUrl||'#')}" target="_blank">View video</a></div>\`
        : \`<div class="campaign-result err">❌ Last run failed: \${escHtml(c.last_result.error||'unknown')}</div>\`
      : '';
    div.innerHTML = \`
      <div class="campaign-card-header">
        <div class="campaign-card-name">\${escHtml(c.name)}</div>
        <span class="campaign-badge \${c.status==='active'?'active':'paused'}">\${c.status==='active'?'● Active':'⏸ Paused'}</span>
      </div>
      <div class="campaign-meta">
        <span>🔍 \${escHtml(c.keyword)}</span>
        <span>🕐 Every \${c.interval_hours}h</span>
        <span>🎬 \${(CAMPAIGN_MODELS[c.video_model]||{label:'Grok Aurora'}).label} · \${c.video_duration||10}s</span>
        <span>📅 Last: \${lastRun}</span>
        <span>⏭ Next: \${nextRun}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">\${accounts}</div>
      \${resultHtml}
      <div class="campaign-actions">
        <button class="btn btn-outline" style="font-size:12px" onclick="openCampaignForm('\${c.id}')">✏️ Edit</button>
        <button class="btn btn-outline" style="font-size:12px" onclick="toggleCampaignStatus('\${c.id}')">\${c.status==='active'?'⏸ Pause':'▶ Resume'}</button>
        <button class="btn btn-outline" style="font-size:12px;color:#0ea5e9;border-color:#0ea5e9" onclick="runCampaignNow('\${c.id}')">▶▶ Post Now</button>
        <button class="btn btn-outline" style="font-size:12px;color:#e53e3e;border-color:#e53e3e" onclick="deleteCampaign('\${c.id}')">🗑 Delete</button>
      </div>\`;
    el.appendChild(div);
  });
}

function renderAccountCheckboxes(selectedAccounts) {
  const el = document.getElementById('campaign-accounts-list');
  if (!socialAccounts.length) { el.innerHTML = '<span style="color:var(--text-muted);font-size:13px;">No connected accounts found. Connect accounts at upload-post.com.</span>'; return; }
  el.innerHTML = '';
  socialAccounts.forEach(acc => {
    const key     = \`\${acc.username}::\${acc.platform}\`;
    const checked = (selectedAccounts || []).some(a => a.username === acc.username && a.platform === acc.platform);
    const label   = document.createElement('label');
    label.className = 'account-check';
    label.innerHTML = \`
      <input type="checkbox" value="\${escHtml(key)}" \${checked ? 'checked' : ''}>
      \${acc.img ? \`<img src="\${escHtml(acc.img)}" alt="">\` : '<div style="width:32px;height:32px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center">\${PLATFORM_ICONS[acc.platform]||"📱"}</div>'}
      <div class="acc-info">
        <span class="acc-name">\${PLATFORM_ICONS[acc.platform]||'📱'} \${escHtml(acc.display_name)}</span>
        <span class="acc-sub">\${escHtml(acc.handle)} · via @\${escHtml(acc.username)}</span>
      </div>\`;
    el.appendChild(label);
  });
}

async function openCampaignForm(campaignId) {
  if (!socialAccounts.length) await loadSocialAccounts();
  const form = document.getElementById('campaign-form');
  form.style.display = 'block';

  if (!campaignId) {
    document.getElementById('campaign-form-title').textContent = 'New Campaign';
    document.getElementById('campaign-edit-id').value = 'c' + Date.now();
    document.getElementById('campaign-name').value = '';
    document.getElementById('campaign-keyword').value = '';
    document.getElementById('campaign-interval').value = '24';
    document.getElementById('model-grok').checked = true;
    document.getElementById('campaign-duration').max = '10';
    document.getElementById('campaign-duration').value = '10';
    onCampaignDurationChange();
    clearCampaignProductUI();
    renderAccountCheckboxes([]);
  } else {
    // Load existing campaign data
    const res    = await api('/api/campaigns');
    const data   = await res.json();
    const obj    = JSON.parse(atob(data.content.replace(/\\n/g, '')));
    campaignsSha = data.sha;
    const c      = (obj.campaigns || []).find(x => x.id === campaignId);
    if (!c) return;
    document.getElementById('campaign-form-title').textContent = 'Edit Campaign';
    document.getElementById('campaign-edit-id').value = c.id;
    document.getElementById('campaign-name').value = c.name;
    document.getElementById('campaign-keyword').value = c.keyword;
    document.getElementById('campaign-interval').value = String(c.interval_hours || 24);
    const savedModel = c.video_model || 'grok-imagine/text-to-video';
    const modelRadio = document.querySelector(\`input[name=campaign_model][value="\${savedModel}"]\`);
    if (modelRadio) modelRadio.checked = true;
    const mCfg = CAMPAIGN_MODELS[savedModel] || CAMPAIGN_MODELS['grok-imagine/text-to-video'];
    document.getElementById('campaign-duration').max = String(mCfg.maxDuration);
    document.getElementById('campaign-duration').value = String(c.video_duration || mCfg.maxDuration);
    onCampaignDurationChange();
    clearCampaignProductUI();
    if (c.has_product_photo) {
      document.getElementById('campaign-product-placeholder').style.display = 'none';
      document.getElementById('campaign-product-preview-wrap').style.display = '';
      document.getElementById('btn-clear-campaign-product').style.display = '';
      const pr = await api('/api/campaign-photo/' + c.id);
      if (pr.ok) { const pd = await pr.json(); if (pd.content) document.getElementById('campaign-product-preview').src = 'data:image/jpeg;base64,' + pd.content.replace(/\\n/g,''); }
    }
    renderAccountCheckboxes(c.accounts || []);
  }
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCampaignForm() {
  document.getElementById('campaign-form').style.display = 'none';
}

function getCheckedAccounts() {
  return Array.from(document.querySelectorAll('#campaign-accounts-list input[type=checkbox]:checked')).map(cb => {
    const [username, platform] = cb.value.split('::');
    const acc = socialAccounts.find(a => a.username === username && a.platform === platform);
    return { username, platform, display_name: acc ? acc.display_name : username, handle: acc ? acc.handle : '' };
  });
}

async function saveCampaign() {
  const name        = document.getElementById('campaign-name').value.trim();
  const keyword     = document.getElementById('campaign-keyword').value.trim();
  const interval    = parseInt(document.getElementById('campaign-interval').value) || 24;
  const accounts    = getCheckedAccounts();
  const editId      = document.getElementById('campaign-edit-id').value;
  const videoModel  = getSelectedModel();
  const videoDuration = parseInt(document.getElementById('campaign-duration').value) || 10;

  if (!name)    { toast('Enter a campaign name', 'error'); return; }
  if (!keyword) { toast('Enter a keyword', 'error'); return; }
  if (!accounts.length) { toast('Select at least one account', 'error'); return; }

  try {
    // Load current campaigns
    const res  = await api('/api/campaigns');
    const data = await res.json();
    const obj  = JSON.parse(atob(data.content.replace(/\\n/g, '')));
    const campaigns = obj.campaigns || [];
    const sha  = data.sha;

    const idx = campaigns.findIndex(c => c.id === editId);
    if (idx >= 0) {
      Object.assign(campaigns[idx], { name, keyword, interval_hours: interval, accounts, video_model: videoModel, video_duration: videoDuration });
    } else {
      campaigns.push({
        id: editId,
        name, keyword, interval_hours: interval, accounts,
        video_model: videoModel, video_duration: videoDuration,
        status: 'active',
        created_at: new Date().toISOString(),
        last_run_at: null,
        next_run_at: new Date().toISOString(),
        last_result: null
      });
    }

    const content = btoa(JSON.stringify({ campaigns }, null, 2));
    const putRes  = await api('/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: editId ? 'campaign: update' : 'campaign: create', content, sha })
    });
    if (!putRes.ok) throw new Error('HTTP ' + putRes.status);

    // Save product photo if one was selected
    if (pendingCampaignProductB64) {
      const photoSaved = await saveCampaignPhoto(editId);
      if (photoSaved) {
        // Mark campaign as having a photo
        const c2 = (obj.campaigns || []).find(x => x.id === editId) || campaigns.find(x => x.id === editId);
        if (c2) c2.has_product_photo = true;
        const content2 = btoa(JSON.stringify({ campaigns }, null, 2));
        const sha2Res = await api('/api/campaigns');
        const sha2Data = await sha2Res.json();
        await api('/api/campaigns', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'campaign: add photo flag', content: content2, sha: sha2Data.sha }) });
      }
      pendingCampaignProductB64 = null;
    }

    toast(editId ? 'Campaign updated ✓' : 'Campaign created ✓', 'success');
    closeCampaignForm();
    await loadCampaigns();
  } catch(e) { toast('Save failed: ' + e.message, 'error'); }
}

async function toggleCampaignStatus(id) {
  try {
    const res  = await api('/api/campaigns');
    const data = await res.json();
    const obj  = JSON.parse(atob(data.content.replace(/\\n/g, '')));
    const c    = (obj.campaigns || []).find(x => x.id === id);
    if (!c) return;
    c.status = c.status === 'active' ? 'paused' : 'active';
    if (c.status === 'active') c.next_run_at = new Date().toISOString();
    const content = btoa(JSON.stringify(obj, null, 2));
    await api('/api/campaigns', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'campaign: toggle status', content, sha: data.sha }) });
    toast(\`Campaign \${c.status === 'active' ? 'resumed' : 'paused'} ✓\`, 'success');
    await loadCampaigns();
  } catch(e) { toast('Failed: ' + e.message, 'error'); }
}

async function deleteCampaign(id) {
  if (!confirm('Delete this campaign?')) return;
  try {
    const res  = await api('/api/campaigns');
    const data = await res.json();
    const obj  = JSON.parse(atob(data.content.replace(/\\n/g, '')));
    obj.campaigns = (obj.campaigns || []).filter(c => c.id !== id);
    const content = btoa(JSON.stringify(obj, null, 2));
    await api('/api/campaigns', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'campaign: delete', content, sha: data.sha }) });
    toast('Campaign deleted', 'success');
    await loadCampaigns();
  } catch(e) { toast('Failed: ' + e.message, 'error'); }
}

async function runCampaignNow(id) {
  if (!confirm('Force this campaign to run now?')) return;
  try {
    // Set next_run_at to now so runner picks it up immediately
    const res  = await api('/api/campaigns');
    const data = await res.json();
    const obj  = JSON.parse(atob(data.content.replace(/\\n/g, '')));
    const c    = (obj.campaigns || []).find(x => x.id === id);
    if (!c) throw new Error('Campaign not found');
    c.next_run_at = new Date().toISOString();
    const content = btoa(JSON.stringify(obj, null, 2));
    await api('/api/campaigns', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'campaign: force run now', content, sha: data.sha }) });
    // Trigger the campaign runner workflow
    const trigRes = await api('/api/trigger-campaign-runner', { method: 'POST' });
    if (!trigRes.ok) throw new Error('Trigger failed: HTTP ' + trigRes.status);
    toast('Campaign triggered! It will run shortly.', 'success');
    await loadCampaigns();
  } catch(e) { toast('Failed: ' + e.message, 'error'); }
}

// ── Campaign product photo ─────────────────────────────────────────────────────
let pendingCampaignProductB64 = null;

function onCampaignProductSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file).then(b64 => {
    pendingCampaignProductB64 = b64;
    document.getElementById('campaign-product-placeholder').style.display = 'none';
    document.getElementById('campaign-product-preview-wrap').style.display = '';
    document.getElementById('campaign-product-preview').src = 'data:image/jpeg;base64,' + b64;
    document.getElementById('btn-clear-campaign-product').style.display = '';
  }).catch(err => toast('Image error: ' + err.message, 'error'));
}

function clearCampaignProductUI() {
  pendingCampaignProductB64 = null;
  document.getElementById('campaign-product-placeholder').style.display = '';
  document.getElementById('campaign-product-preview-wrap').style.display = 'none';
  document.getElementById('campaign-product-preview').src = '';
  document.getElementById('btn-clear-campaign-product').style.display = 'none';
  const fi = document.getElementById('campaign-product-file');
  if (fi) fi.value = '';
}

async function clearCampaignProduct(e) {
  e.stopPropagation();
  const id = document.getElementById('campaign-edit-id').value;
  if (id && !pendingCampaignProductB64) {
    // Delete from GitHub
    const gr = await api('/api/campaign-photo/' + id);
    if (gr.ok) {
      const gd = await gr.json();
      if (gd.sha) await api('/api/campaign-photo/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sha: gd.sha }) });
    }
  }
  clearCampaignProductUI();
}

async function saveCampaignPhoto(campaignId) {
  if (!pendingCampaignProductB64) return false;
  // Check for existing sha
  let sha = null;
  const gr = await api('/api/campaign-photo/' + campaignId);
  if (gr.ok) { const gd = await gr.json(); sha = gd.sha || null; }
  const res = await api('/api/campaign-photo/' + campaignId, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: pendingCampaignProductB64, sha })
  });
  return res.ok;
}

// ── Logs ──────────────────────────────────────────────────────────────────────
const WORKFLOW_LABELS = {
  'campaign-runner.yml': '📅 Campaign Runner',
  'run-workflow.yml':    '🎬 Workflow Run',
  'search.yml':          '🔍 Search',
};

function statusIcon(conclusion, status) {
  if (status === 'in_progress') return '🔄';
  if (status === 'queued')      return '⏳';
  if (conclusion === 'success') return '✅';
  if (conclusion === 'failure') return '❌';
  if (conclusion === 'cancelled') return '⛔';
  return '❔';
}

function stepIcon(conclusion) {
  if (conclusion === 'success')   return '✅';
  if (conclusion === 'failure')   return '❌';
  if (conclusion === 'skipped')   return '⏭';
  if (conclusion === 'cancelled') return '⛔';
  return '🔄';
}

function fmtDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return '';
  const s = Math.round((new Date(completedAt) - new Date(startedAt)) / 1000);
  if (s < 60) return \`\${s}s\`;
  return \`\${Math.floor(s/60)}m \${s%60}s\`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

async function loadLogs() {
  const el = document.getElementById('logs-list');
  el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Loading...</p>';
  try {
    const res  = await api('/api/logs');
    const data = await res.json();
    const runs = data.runs || [];
    if (!runs.length) { el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No runs found.</p>'; return; }
    el.innerHTML = '';
    runs.forEach((run, i) => {
      const wfFile   = (run.path || '').split('/').pop();
      const label    = WORKFLOW_LABELS[wfFile] || wfFile;
      const badgeCls = run.conclusion || run.status || 'queued';
      const badgeTxt = run.conclusion || run.status || 'queued';
      const dur      = fmtDuration(run.run_started_at, run.updated_at);
      const div = document.createElement('div');
      div.className = 'log-run';
      div.innerHTML = \`
        <div class="log-run-header" onclick="toggleLogRun(this, \${run.id})">
          <span class="log-run-status">\${statusIcon(run.conclusion, run.status)}</span>
          <div class="log-run-info">
            <div class="log-run-name">\${escHtml(run.display_title || run.name || 'Run #' + run.run_number)}</div>
            <div class="log-run-meta">\${escHtml(label)} · #\${run.run_number} · \${fmtDate(run.created_at)}\${dur ? ' · ' + dur : ''}</div>
          </div>
          <span class="log-run-badge \${badgeCls}">\${badgeTxt}</span>
          <span class="log-run-chevron">▶</span>
        </div>
        <div class="log-run-body" id="log-body-\${run.id}">
          <p style="color:var(--text-muted);font-size:12px">Loading steps...</p>
          <a class="log-gh-link" href="\${escHtml(run.html_url)}" target="_blank">↗ Open in GitHub</a>
        </div>\`;
      el.appendChild(div);
    });
  } catch(e) { el.innerHTML = \`<p style="color:var(--error);font-size:13px">Failed to load logs: \${escHtml(e.message)}</p>\`; }
}

async function toggleLogRun(header, runId) {
  const chevron = header.querySelector('.log-run-chevron');
  const body    = document.getElementById('log-body-' + runId);
  const isOpen  = body.classList.contains('open');
  if (isOpen) { body.classList.remove('open'); chevron.classList.remove('open'); return; }
  body.classList.add('open');
  chevron.classList.add('open');
  if (body.dataset.loaded) return;
  body.dataset.loaded = '1';
  try {
    const res  = await api('/api/run/' + runId);
    const data = await res.json();
    const jobs = (data.jobs && data.jobs.jobs) || [];
    let html = '';
    jobs.forEach(job => {
      html += \`<div style="margin-bottom:8px">
        <div style="font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-muted)">\${escHtml(job.name)} — \${job.conclusion || job.status}</div>\`;
      (job.steps || []).forEach(step => {
        const dur = fmtDuration(step.started_at, step.completed_at);
        html += \`<div class="log-step">
          <span class="log-step-icon">\${stepIcon(step.conclusion)}</span>
          <span class="log-step-name">\${escHtml(step.name)}</span>
          <span class="log-step-dur">\${dur}</span>
          \${step.conclusion !== 'skipped' ? \`<button onclick="loadJobLogs(\${job.id},'log-output-\${runId}')" style="font-size:10px;padding:1px 6px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text-muted);cursor:pointer">📋 View Logs</button>\` : ''}
        </div>\`;
      });
      html += '</div>';
    });
    if (!html) html = '<p style="color:var(--text-muted);font-size:12px">No step data available.</p>';
    html += \`<div id="log-output-\${runId}" style="display:none;margin-top:10px"></div>\`;
    html += \`<a class="log-gh-link" href="\${escHtml((data.run||{}).html_url||'#')}" target="_blank">↗ Open in GitHub</a>\`;
    body.innerHTML = html;
  } catch(e) {
    body.innerHTML += \`<p style="color:var(--error);font-size:12px">Failed: \${escHtml(e.message)}</p>\`;
  }
}

async function loadJobLogs(jobId, outputId) {
  const el = document.getElementById(outputId);
  el.style.display = 'block';
  el.innerHTML = '<p style="font-size:12px;color:var(--text-muted)">Loading logs...</p>';
  try {
    const res  = await api('/api/job-logs/' + jobId);
    const text = await res.text();
    // Strip ANSI codes and GitHub timestamp prefixes, keep meaningful lines
    const lines = text.split('\\n')
      .map(l => l.replace(/^\\d{4}-\\d{2}-\\d{2}T[\\d:.]+Z\\s+/, '').replace(/\\x1b\\[[0-9;]*m/g, ''))
      .filter(l => l.trim());
    el.innerHTML = \`<pre style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:12px;font-size:11px;line-height:1.6;overflow-x:auto;white-space:pre-wrap;max-height:500px;overflow-y:auto">\${escHtml(lines.join('\\n'))}</pre>\`;
  } catch(e) {
    el.innerHTML = \`<p style="color:var(--error);font-size:12px">Failed: \${escHtml(e.message)}</p>\`;
  }
}

window.addEventListener('load', () => { loadConfig(); loadProductImage(); loadCampaigns(); });
</script>
</body>
</html>
`;

const OWNER  = 'adrentan888-adren';
const REPO   = 'tiktok-workflow-app';
const BRANCH = 'main';

function ghHeaders(pat) {
  return {
    'Authorization': `Bearer ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'tiktok-workflow-app'
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request, env) {
    try {
    const url = new URL(request.url);
    const pat = env.GITHUB_PAT;

    // Serve frontend
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // GET /api/config — fetch config.json from GitHub
    if (url.pathname === '/api/config' && request.method === 'GET') {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/config.json`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // PUT /api/config — save config.json to GitHub
    if (url.pathname === '/api/config' && request.method === 'PUT') {
      const body = await request.json();
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/config.json`,
        { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(body) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // POST /api/trigger — trigger workflow_dispatch
    if (url.pathname === '/api/trigger' && request.method === 'POST') {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/run-workflow.yml/dispatches`,
        { method: 'POST', headers: ghHeaders(pat), body: JSON.stringify({ ref: BRANCH }) }
      );
      return json({ status: res.status });
    }

    // POST /api/trigger-campaign-runner — trigger campaign-runner workflow_dispatch
    if (url.pathname === '/api/trigger-campaign-runner' && request.method === 'POST') {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/campaign-runner.yml/dispatches`,
        { method: 'POST', headers: ghHeaders(pat), body: JSON.stringify({ ref: BRANCH }) }
      );
      return json({ status: res.status });
    }

    // GET /api/logs — list recent runs from all workflows
    if (url.pathname === '/api/logs' && request.method === 'GET') {
      const [r1, r2, r3] = await Promise.all([
        fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/campaign-runner.yml/runs?per_page=15`, { headers: ghHeaders(pat) }),
        fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/run-workflow.yml/runs?per_page=10`,    { headers: ghHeaders(pat) }),
        fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/search.yml/runs?per_page=5`,          { headers: ghHeaders(pat) }),
      ]);
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      const runs = [
        ...(d1.workflow_runs || []),
        ...(d2.workflow_runs || []),
        ...(d3.workflow_runs || []),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30);
      return json({ runs });
    }

    // GET /api/runs — list recent workflow runs
    if (url.pathname === '/api/runs' && request.method === 'GET') {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs?per_page=10&event=workflow_dispatch`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // GET /api/run/:id — run status + jobs
    const runMatch = url.pathname.match(/^\/api\/run\/(\d+)$/);
    if (runMatch && request.method === 'GET') {
      const runId = runMatch[1];
      const [runRes, jobsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${runId}`, { headers: ghHeaders(pat) }),
        fetch(`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${runId}/jobs`, { headers: ghHeaders(pat) })
      ]);
      const [run, jobs] = await Promise.all([runRes.json(), jobsRes.json()]);
      return json({ run, jobs });
    }

    // GET /api/job-logs/:job_id — fetch raw console output for a job
    const jobLogsMatch = url.pathname.match(/^\/api\/job-logs\/(\d+)$/);
    if (jobLogsMatch && request.method === 'GET') {
      const jobId = jobLogsMatch[1];
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/actions/jobs/${jobId}/logs`,
        { headers: ghHeaders(pat), redirect: 'follow' }
      );
      const text = await res.text();
      return new Response(text, { headers: { 'Content-Type': 'text/plain' } });
    }

    // GET /api/result — get latest-result.json from GitHub
    if (url.pathname === '/api/result' && request.method === 'GET') {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/latest-result.json?t=${Date.now()}`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // GET /api/product-image — check if product-image.jpg exists in GitHub repo
    if (url.pathname === '/api/product-image' && request.method === 'GET') {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/product-image.jpg`,
        { headers: ghHeaders(pat) }
      );
      if (res.status === 404) return json({ exists: false });
      const data = await res.json();
      return json({ exists: true, content: data.content, sha: data.sha }, res.status);
    }

    // PUT /api/product-image — save product-image.jpg to GitHub repo
    if (url.pathname === '/api/product-image' && request.method === 'PUT') {
      const body = await request.json();
      const payload = {
        message: 'product-image: update',
        content: body.content
      };
      if (body.sha) payload.sha = body.sha;
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/product-image.jpg`,
        { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(payload) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // DELETE /api/product-image — remove product-image.jpg from GitHub repo
    if (url.pathname === '/api/product-image' && request.method === 'DELETE') {
      const body = await request.json();
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/product-image.jpg`,
        {
          method: 'DELETE',
          headers: ghHeaders(pat),
          body: JSON.stringify({ message: 'product-image: remove', sha: body.sha })
        }
      );
      return json({ deleted: res.ok, status: res.status }, res.status);
    }

    // POST /api/search — trigger GitHub Actions search workflow (tikwm blocked from CF IPs)
    if (url.pathname === '/api/search' && request.method === 'POST') {
      const body = await request.json();
      const keyword = (body.keyword || '').trim();
      const maxVideos = parseInt(body.max_videos) || 5;
      if (!keyword) return json({ error: 'keyword required' }, 400);
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/search.yml/dispatches`,
        { method: 'POST', headers: ghHeaders(pat), body: JSON.stringify({ ref: BRANCH, inputs: { keyword, max_videos: String(maxVideos) } }) }
      );
      return json({ triggered: res.status === 204, status: res.status, keyword });
    }

    // GET /api/search-results?keyword=X — read search-results.json from GitHub
    if (url.pathname === '/api/search-results' && request.method === 'GET') {
      const keyword = url.searchParams.get('keyword') || '';
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/search-results.json?t=${Date.now()}`,
        { headers: ghHeaders(pat) }
      );
      if (!res.ok) return json({ ready: false });
      const data = await res.json();
      const results = JSON.parse(atob(data.content.replace(/\n/g, '')));
      if (results.keyword.toLowerCase() !== keyword.toLowerCase()) return json({ ready: false, currentKeyword: results.keyword });
      const age = Date.now() - new Date(results.timestamp).getTime();
      if (age > 10 * 60 * 1000) return json({ ready: false, reason: 'stale' });
      return json({ ready: true, videos: results.videos, keyword: results.keyword });
    }

    // GET /api/campaign-photo/:id — get per-campaign product photo
    const campaignPhotoMatch = url.pathname.match(/^\/api\/campaign-photo\/([\w-]+)$/);
    if (campaignPhotoMatch && request.method === 'GET') {
      const cid = campaignPhotoMatch[1];
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/photos/${cid}.jpg?t=${Date.now()}`, { headers: ghHeaders(pat) });
      if (res.status === 404) return json({ exists: false });
      const data = await res.json();
      return json({ exists: true, content: data.content, sha: data.sha });
    }

    // PUT /api/campaign-photo/:id — save per-campaign product photo
    if (campaignPhotoMatch && request.method === 'PUT') {
      const cid = campaignPhotoMatch[1];
      const body = await request.json();
      const payload = { message: 'campaign-photo: update', content: body.content };
      if (body.sha) payload.sha = body.sha;
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/photos/${cid}.jpg`, { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(payload) });
      const data = await res.json();
      return json(data, res.status);
    }

    // DELETE /api/campaign-photo/:id — remove per-campaign product photo
    if (campaignPhotoMatch && request.method === 'DELETE') {
      const cid = campaignPhotoMatch[1];
      const body = await request.json();
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/photos/${cid}.jpg`, { method: 'DELETE', headers: ghHeaders(pat), body: JSON.stringify({ message: 'campaign-photo: remove', sha: body.sha }) });
      return json({ deleted: res.ok }, res.status);
    }

    // GET /api/campaigns — fetch campaigns.json from GitHub
    if (url.pathname === '/api/campaigns' && request.method === 'GET') {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/campaigns.json?t=${Date.now()}`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // PUT /api/campaigns — save campaigns.json to GitHub
    if (url.pathname === '/api/campaigns' && request.method === 'PUT') {
      const body = await request.json();
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/campaigns.json`,
        { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(body) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // GET /api/social-accounts — proxy to upload-post, get connected accounts
    if (url.pathname === '/api/social-accounts' && request.method === 'GET') {
      // First fetch config to get uploadpost_api_key
      const cfgRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/workflow/config.json`,
        { headers: ghHeaders(pat) }
      );
      const cfgData = await cfgRes.json();
      const cfg = JSON.parse(atob(cfgData.content.replace(/\n/g, '')));
      const upKey = cfg.uploadpost_api_key || '';
      const res = await fetch('https://api.upload-post.com/api/uploadposts/users', {
        headers: { 'Authorization': `Apikey ${upKey}` }
      });
      const data = await res.json();
      return json(data, res.status);
    }

    return new Response('Not found', { status: 404 });
    } catch(err) {
      return json({ error: err.message || 'Internal error' }, 500);
    }
  }
};

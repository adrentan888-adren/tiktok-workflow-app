const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType, convertInchesToTwip } = require('docx');
const fs = require('fs');

const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 } });
const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } });
const h3 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 } });
const p  = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, size: 22, ...opts })], spacing: { after: 120 } });
const bullet = (text, level = 0) => new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level }, spacing: { after: 80 } });
const mono   = (text) => new Paragraph({ children: [new TextRun({ text, font: 'Courier New', size: 20, color: '2B6CB0' })], spacing: { after: 80 }, indent: { left: convertInchesToTwip(0.3) } });
const spacer = () => new Paragraph({ text: '', spacing: { after: 80 } });

const tableRow = (cells, isHeader = false) => new TableRow({
  children: cells.map(text => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20, bold: isHeader, color: isHeader ? 'FFFFFF' : '1A202C' })] })],
    shading: isHeader ? { type: ShadingType.SOLID, color: '2B6CB0' } : {},
    margins: { top: 80, bottom: 80, left: 120, right: 120 }
  }))
});

const makeTable = (headers, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [tableRow(headers, true), ...rows.map(r => tableRow(r))],
  margins: { top: 80, bottom: 80, left: 120, right: 120 }
});

const doc = new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    children: [

      // Title
      new Paragraph({ children: [new TextRun({ text: 'TikTok → AI → Video Workflow', bold: true, size: 52, color: '1A365D' })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }),
      new Paragraph({ children: [new TextRun({ text: 'Product Requirements Document (PRD)', size: 28, color: '4A5568' })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: 'Version 3.1  |  April 2026', size: 22, color: '718096' })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),

      // 1. Overview
      h1('1. Project Overview'),
      p('This system automates the creation of AI-generated short-form videos by sourcing trending TikTok content, analysing it with an AI model (Claude Sonnet 4.6 or Gemini), generating a structured video prompt, and producing a final rendered video via a text-to-video model — all orchestrated from a simple web interface with no local infrastructure required.'),
      spacer(),
      p('The user interacts through a Cloudflare Worker-hosted web app. All video processing runs on GitHub Actions (ubuntu-latest). Results are polled and displayed live in the browser.'),
      spacer(),

      // 2. Architecture
      h1('2. System Architecture'),
      h2('2.1 High-Level Flow'),
      bullet('User opens the web frontend (Cloudflare Worker at tiktok-workflow-app.adrentan888.workers.dev)'),
      bullet('User enters a keyword and clicks Search → GitHub Actions search.yml is triggered → results polled every 4s'),
      bullet('Up to 10 TikTok video cards are displayed with thumbnails, stats, and author info'),
      bullet('User optionally uploads a product photo (stored in GitHub repo as product-image.jpg)'),
      bullet('User selects a video card and clicks Generate Video'),
      bullet('Frontend saves config + selected_video to GitHub; triggers run-workflow.yml via workflow_dispatch'),
      bullet('Workflow: downloads TikTok video → extracts 6 frames via FFmpeg → sends frames + optional product photo to Claude'),
      bullet('Claude returns a timestamped JSON prompt (4 segments with visual_action + edit_instruction)'),
      bullet('Prompt sent to Kie.ai video model (Grok Aurora / Wan 2.6 / Sora 2 / Seedance 2 Lite)'),
      bullet('Kie.ai task is polled every 30s until complete; video URL saved to latest-result.json in the repo'),
      bullet('Frontend polls and displays the generated video URL with download and copy options'),
      spacer(),

      h2('2.2 Component Table'),
      makeTable(
        ['Layer', 'Technology', 'Purpose'],
        [
          ['Frontend', 'Cloudflare Worker', 'Serves HTML UI, proxies all GitHub API calls — GITHUB_PAT never exposed'],
          ['Search CI', 'GitHub Actions (search.yml)', 'Runs tikwm search from GH Actions IPs (bypasses Cloudflare rate-limit)'],
          ['Main CI', 'GitHub Actions (run-workflow.yml)', 'Full pipeline: download → analyse → generate → save'],
          ['TikTok Search', 'tikwm.com /api/feed/search', 'Free keyword search, returns video list with thumbnails and stats'],
          ['TikTok Download', 'tikwm.com /api/', 'Resolves HD/SD watermark-free download URL from video ID'],
          ['Frame Extraction', 'FFmpeg (ubuntu-latest)', 'Extracts 6 evenly-spaced JPEG frames, max 640px wide'],
          ['AI Analysis', 'Kie.ai → Claude Sonnet 4.6', 'Frames + optional product image → structured JSON prompt'],
          ['Video Generation', 'Kie.ai (Grok Aurora / Wan 2.6 / Sora 2 / Seedance 2 Lite)', 'Text-to-video, 9:16, configurable duration and resolution'],
          ['Config Storage', 'GitHub Contents API', 'config.json read/written by Worker; consumed by workflow'],
          ['Result Storage', 'GitHub Contents API', 'latest-result.json and search-results.json committed after each run'],
          ['Secrets', 'Cloudflare Worker Secrets', 'GITHUB_PAT stored server-side, never in browser'],
        ]
      ),
      spacer(),

      // 3. Frontend
      h1('3. Frontend Requirements'),
      h2('3.1 Hosting & Deployment'),
      bullet('Deployed as a Cloudflare Worker (script name: tiktok-workflow-app)'),
      bullet('Live URL: https://tiktok-workflow-app.adrentan888.workers.dev'),
      bullet('HTML embedded in Worker at build time via build-worker.js (template literal escape)'),
      bullet('No separate CDN or Pages deployment — single Worker handles both HTML and API proxy'),
      spacer(),

      h2('3.2 UI Sections'),
      h3('Step 1 — TikTok Search'),
      bullet('Keyword text input (Enter key also triggers search)'),
      bullet('Max Results dropdown: 1 video, 5 videos, 8 videos, 10 videos'),
      bullet('Search button → POST /api/search triggers GitHub Actions search.yml'),
      bullet('Frontend polls GET /api/search-results?keyword=X every 4 seconds (max 25 attempts ≈ 100s)'),
      bullet('Loading state shows "Searching TikTok (~30 seconds)..." with elapsed time counter'),
      bullet('Each video card: thumbnail image, @author, description (2 lines), ▶ plays, ♥ likes, ⏱ duration, TikTok ↗ link'),
      bullet('Clicking a card selects it (highlighted in blue, ✓ Selected badge)'),
      spacer(),

      h3('Step 2 — Product Photo (Optional)'),
      bullet('Upload button accepts JPEG/PNG images'),
      bullet('Client-side compression: canvas resize to ≤1024px, JPEG at 85%→70%→55% until ≤1MB'),
      bullet('Image stored in GitHub repo as workflow/product-image.jpg via PUT /api/product-image'),
      bullet('Preview shown with Remove button (DELETE /api/product-image clears from repo)'),
      bullet('If present, workflow appends product image to Claude\'s input with product placement instructions'),
      spacer(),

      h3('Step 3 — AI Analysis'),
      bullet('Analysis model dropdown: Claude Sonnet 4.6 (default), Gemini 3.1 Pro, Gemini 2.5 Pro, Gemini 2.0 Flash'),
      bullet('Poll interval input (seconds between Kie.ai task status polls, default 30s)'),
      bullet('Analysis prompt stored in config.json (analysis_prompt) — hidden from UI'),
      spacer(),

      h3('Step 4 — Video Generation'),
      bullet('Video model dropdown: Wan 2.6 ($1.05/15s), Grok Aurora ($0.05/s), Sora 2 (~$2/15s), Seedance 2 Lite'),
      bullet('Duration dropdown: 5s, 10s, 15s — options >10s disabled when Grok Aurora selected (max 10s)'),
      bullet('Resolution dropdown: 480p, 720p, 1080p — hidden for Sora 2'),
      bullet('Aspect ratio dropdown: 9:16 (default), 16:9, 1:1'),
      spacer(),

      h2('3.3 Action Bar'),
      bullet('Save Config — writes current form values to GitHub config.json'),
      bullet('Generate Video — disabled until a video card is selected; saves config.selected_video, triggers workflow'),
      bullet('"Search and select a video first" hint shown while disabled'),
      spacer(),

      h2('3.4 Status Panel'),
      bullet('Appears after Generate Video is clicked'),
      bullet('Shows run ID with direct link to GitHub Actions run page'),
      bullet('Live elapsed timer (updates every 15s)'),
      bullet('Step indicators: Queued / Running / Done / Failed for each workflow step'),
      bullet('On success: video URL, Open Video button, Download Artifact button, Copy URL button'),
      bullet('On failure: error message from result.json'),
      spacer(),

      h2('3.5 Security'),
      bullet('GITHUB_PAT stored as Cloudflare Worker secret — never sent to browser'),
      bullet('All GitHub API calls proxied through the Worker; browser only calls /api/* on workers.dev'),
      bullet('Kie.ai and other API keys stored in GitHub config.json, fetched server-side by the Worker'),
      bullet('Worker has global try-catch — returns JSON error instead of raw 502 on unhandled exceptions'),
      spacer(),

      // 4. Workflow
      h1('4. GitHub Actions Workflow Requirements'),
      h2('4.1 run-workflow.yml (Main Pipeline)'),
      bullet('Trigger: workflow_dispatch (via frontend or direct API call)'),
      bullet('Runner: ubuntu-latest | Timeout: 45 minutes | Permissions: contents: write'),
      bullet('Steps: Checkout → Setup Node.js 20 → Install FFmpeg → node workflow/run-workflow.js'),
      bullet('Artifacts: generated video (.mp4) + log file (.log) retained 7 days'),
      spacer(),

      makeTable(
        ['Step', 'Name', 'Description'],
        [
          ['1', 'Pre-selected Video', 'Uses config.selected_video if set by frontend (skips Apify search)'],
          ['2', 'TikWM: HD URL', 'Resolves HD download URL from tikwm.com /api/'],
          ['3', 'Download Video', 'Downloads TikTok video into memory buffer (~2–10 MB)'],
          ['4', 'AI Analysis', 'FFmpeg extracts 6 frames → Claude Sonnet 4.6 via Kie.ai; optional product image appended'],
          ['5', 'Create Video Task', 'Sends prompt to Kie.ai video model, receives taskId'],
          ['6', 'Poll Until Done', 'Polls Kie.ai /api/v1/jobs/recordInfo every 30s until state = success'],
          ['7', 'Save Result', 'Saves video file as artifact; commits latest-result.json to repo'],
        ]
      ),
      spacer(),

      h2('4.2 search.yml (TikTok Search)'),
      bullet('Trigger: workflow_dispatch with inputs: keyword (string), max_videos (string, default "5")'),
      bullet('Runner: ubuntu-latest | Timeout: 3 minutes | Permissions: contents: write'),
      bullet('Runs workflow/search.js: fetches tikwm /api/feed/search, maps results, commits search-results.json'),
      bullet('Runs from GitHub Actions IPs — bypasses tikwm\'s rate-limit on Cloudflare shared IPs'),
      spacer(),

      h2('4.3 Error Handling'),
      bullet('Kie.ai maintenance (HTTP 500 + "maintained"): 3 retries, 60s wait each'),
      bullet('TikTok download failure: logs warning, falls back to CDN URL for analysis'),
      bullet('All errors: writes failure result.json so frontend displays the error message'),
      spacer(),

      // 5. API Integrations
      h1('5. API Integrations'),
      makeTable(
        ['Service', 'Endpoint', 'Usage', 'Auth'],
        [
          ['tikwm Search', 'GET /api/feed/search', 'Keyword search, runs from GH Actions', 'None (free)'],
          ['tikwm Download', 'POST /api/', 'HD download URL resolution', 'None (free)'],
          ['Kie.ai Claude', 'POST /claude/v1/messages', 'Anthropic Messages API, claude-sonnet-4-6', 'Bearer kie_api_key'],
          ['Kie.ai Gemini', 'POST /{model}/v1/chat/completions', 'OpenAI-compatible chat endpoint', 'Bearer kie_api_key'],
          ['Kie.ai Video Create', 'POST /api/v1/jobs/createTask', 'Create text-to-video generation task', 'Bearer kie_api_key'],
          ['Kie.ai Video Poll', 'GET /api/v1/jobs/recordInfo', 'Poll task status until state = success', 'Bearer kie_api_key'],
          ['GitHub Contents', 'GET/PUT /repos/.../contents/...', 'Read/write config.json, result files, product-image.jpg', 'Bearer GITHUB_PAT'],
          ['GitHub Actions', 'POST /repos/.../actions/workflows/.../dispatches', 'Trigger workflow_dispatch for search and main pipeline', 'Bearer GITHUB_PAT'],
        ]
      ),
      spacer(),

      // 6. Video Models
      h1('6. Supported Video Generation Models'),
      makeTable(
        ['Model ID', 'Display Name', 'Max Duration', 'Notes'],
        [
          ['grok-imagine/text-to-video', 'Grok Aurora', '10s', '$0.05/s via Kie.ai; 480p–720p; mode: normal'],
          ['wan/2-6-text-to-video', 'Wan 2.6', '15s', '$1.05/15s; 720p–1080p; recommended default'],
          ['sora-2-text-to-video', 'Sora 2', '15s', '~$2/15s; resolution field hidden (fixed internally)'],
          ['bytedance/seedance-2-lite-text-to-video', 'Seedance 2 Lite', '15s', 'Lightweight option via Kie.ai'],
        ]
      ),
      spacer(),

      // 7. Configuration
      h1('7. Configuration (workflow/config.json)'),
      makeTable(
        ['Field', 'Type', 'Description'],
        [
          ['apify_api_key', 'string', 'Apify token (fallback search in workflow when no video pre-selected)'],
          ['kie_api_key', 'string', 'Kie.ai API key for Claude analysis and video generation'],
          ['keyword', 'string', 'TikTok search keyword (shown in frontend input)'],
          ['max_videos', 'integer', 'Number of search results to request (1/5/8/10)'],
          ['analysis_model', 'string', 'AI model for video analysis (e.g. claude-sonnet-4-6)'],
          ['analysis_prompt', 'string', 'Prompt sent to AI model — hidden from UI, stored in config'],
          ['poll_interval_seconds', 'integer', 'Seconds between Kie.ai task status polls (default 30)'],
          ['seedance.model', 'string', 'Video model ID on Kie.ai'],
          ['seedance.duration', 'integer', 'Output video duration in seconds'],
          ['seedance.resolution', 'string', 'Output resolution (480p / 720p / 1080p)'],
          ['seedance.aspect_ratio', 'string', 'Output aspect ratio (9:16 / 16:9 / 1:1)'],
          ['selected_video', 'object|null', 'Set by frontend when user selects a video card; consumed and cleared by workflow'],
        ]
      ),
      spacer(),

      // 8. Worker API Endpoints
      h1('8. Cloudflare Worker API Endpoints'),
      makeTable(
        ['Method', 'Path', 'Description'],
        [
          ['GET', '/', 'Serve frontend HTML'],
          ['GET', '/api/config', 'Fetch config.json from GitHub'],
          ['PUT', '/api/config', 'Save config.json to GitHub'],
          ['POST', '/api/search', 'Trigger GitHub Actions search.yml with keyword + max_videos'],
          ['GET', '/api/search-results?keyword=X', 'Read search-results.json from GitHub; returns {ready, videos} or {ready: false}'],
          ['POST', '/api/trigger', 'Trigger run-workflow.yml (workflow_dispatch)'],
          ['GET', '/api/runs', 'List last 10 workflow_dispatch runs'],
          ['GET', '/api/run/:id', 'Get run status + job steps for live status panel'],
          ['GET', '/api/result', 'Fetch latest-result.json (cache-busted with ?t=timestamp)'],
          ['GET', '/api/product-image', 'Check if product-image.jpg exists; returns base64 content + sha'],
          ['PUT', '/api/product-image', 'Upload/update product-image.jpg in GitHub repo'],
          ['DELETE', '/api/product-image', 'Remove product-image.jpg from GitHub repo'],
        ]
      ),
      spacer(),

      // 9. Repository Structure
      h1('9. Repository Structure'),
      mono('.github/workflows/run-workflow.yml   — Main pipeline workflow definition'),
      mono('.github/workflows/search.yml         — Lightweight TikTok search workflow'),
      mono('workflow/run-workflow.js             — Main pipeline Node.js script'),
      mono('workflow/search.js                   — TikTok search script (runs in search.yml)'),
      mono('workflow/config.json                 — Live configuration (read/written by frontend + workflow)'),
      mono('workflow/latest-result.json          — Output of last pipeline run'),
      mono('workflow/search-results.json         — Output of last search run'),
      mono('workflow/product-image.jpg           — Optional product photo (uploaded via frontend)'),
      mono('frontend/index.html                  — Web UI source'),
      mono('build-worker.js                      — Embeds index.html into worker.js at build time'),
      mono('worker.js                            — Generated Cloudflare Worker script (deployed)'),
      spacer(),

      // 10. Version History
      h1('10. Version History'),
      makeTable(
        ['Version', 'Tag', 'Key Changes'],
        [
          ['v1.0-stable', 'v1.0-stable', 'Full pipeline: keyword search (Apify) → Claude → Wan 2.6 video'],
          ['v2.0', 'v2.0', 'Video selection UI: search (tikwm) → pick card → generate'],
          ['v2.1-stable', 'v2.1-stable', 'Remove analysis prompt from UI; generate DOCX requirements'],
          ['v3.0', 'v3.0', 'Product photo upload; async search via GitHub Actions (bypasses tikwm IP rate-limit)'],
          ['v3.1', '(untagged)', 'Grok Aurora video model; rename gemini_* → analysis_*; GITHUB_PAT fix; error handling'],
        ]
      ),
      spacer(),

      // 11. Known Limitations
      h1('11. Known Limitations & Notes'),
      bullet('tikwm search must run from GitHub Actions IPs — Cloudflare shared IPs are rate-limited (10,000 req/day exhausted quickly)'),
      bullet('Grok Aurora maximum duration is 10s; UI disables longer options automatically'),
      bullet('Kie.ai video URLs (tempfile.aiquickdraw.com) are temporary — download the artifact for permanent storage'),
      bullet('GitHub Actions artifact retention is 7 days'),
      bullet('Claude receives static JPEG frames (not live video) — fast motion may not be fully captured'),
      bullet('TikTok CDN URLs in search-results.json expire after a few hours — trigger generation promptly after search'),
      bullet('Apify free plan returns only 1 result — only used as fallback in workflow when no video is pre-selected'),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('TikTok-AI-Video-Workflow-PRD-v3.1.docx', buffer);
  console.log('Written: TikTok-AI-Video-Workflow-PRD-v3.1.docx (' + (buffer.length / 1024).toFixed(0) + ' KB)');
});

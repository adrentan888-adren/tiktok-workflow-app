const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const repo   = process.env.GITHUB_REPOSITORY;
const token  = process.env.GITHUB_TOKEN;

// ── Logger ────────────────────────────────────────────────────────────────────
function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── GitHub helpers ─────────────────────────────────────────────────────────────
function ghHeaders() {
    return { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
}

async function githubGet(file) {
    const res  = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, { headers: ghHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return { content: JSON.parse(Buffer.from(data.content, 'base64').toString()), sha: data.sha };
}

async function githubPut(file, content, sha, message) {
    const body = { message, content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64') };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
        method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body)
    });
    return res.ok;
}

// ── FFmpeg frame extraction ───────────────────────────────────────────────────
function extractFrames(videoBuffer) {
    const tmpDir   = path.join('/tmp', '_campaign_frames_' + Date.now());
    const tmpVideo = path.join(tmpDir, 'video.mp4');
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpVideo, videoBuffer);
    execSync(`ffmpeg -y -i "${tmpVideo}" -vf "fps=1/3,scale=640:-1" -frames:v 6 "${tmpDir}/frame_%02d.jpg" 2>/dev/null || true`);
    const frames = fs.readdirSync(tmpDir).filter(f => f.endsWith('.jpg')).sort()
        .map(f => fs.readFileSync(path.join(tmpDir, f)).toString('base64'));
    try { fs.rmSync(tmpDir, { recursive: true }); } catch(e) {}
    log(`  Frames extracted: ${frames.length}`);
    return frames;
}

// ── Claude analysis ───────────────────────────────────────────────────────────
async function analyzeVideo(videoBuffer, campaign) {
    const model = config.analysis_model || 'claude-sonnet-4-6';
    let prompt = config.analysis_prompt || 'Analyze this video and return a JSON array of 4 timestamped segments. Each must have: timestamp, visual_action, edit_instruction. Return only valid JSON.';
    log(`  Analyzing with ${model}...`);

    const frames = extractFrames(videoBuffer);
    const imageBlocks = frames.map(b64 => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }));

    // Check for campaign-specific product photo
    const photoPath = path.join(__dirname, 'photos', campaign.id + '.jpg');
    if (fs.existsSync(photoPath)) {
        const productB64 = fs.readFileSync(photoPath).toString('base64');
        imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: productB64 } });
        prompt += '\n\nIMPORTANT: The last image provided is a product photo. Rewrite each segment\'s visual_action to feature this product prominently, replacing any similar products visible in the video frames with this exact product. Describe the product\'s specific appearance — shape, colour, branding, texture, and any visible text — in precise detail within every visual_action.';
        log(`  Product photo: included for campaign ${campaign.id}`);
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
        if (attempt > 1) { log(`  Retry ${attempt}...`); await sleep(60000); }
        const res  = await fetch('https://api.kie.ai/claude/v1/messages', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + config.kie_api_key, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model, max_tokens: 2000, messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: prompt }] }] })
        });
        const data = await res.json();
        // Retry on any server/network error from Kie.ai or Anthropic
        const isRetryable = data.code === 500 || data.type === 'error' || (data.error && data.error.type === 'api_error');
        if (isRetryable && attempt < 3) { log(`  API error (attempt ${attempt}): ${JSON.stringify(data).substring(0,120)}`); continue; }
        let content = '';
        try { content = data.content[0].text; } catch(e) {}
        if (!content) throw new Error('Claude returned empty: ' + JSON.stringify(data).substring(0, 200));
        const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        let parsed = null;
        try { parsed = JSON.parse(cleaned); } catch(e) {
            const m = cleaned.match(/[\[{][\s\S]*[\]}]/);
            if (m) try { parsed = JSON.parse(m[0]); } catch(e2) {}
        }
        if (Array.isArray(parsed)) return parsed.map(s => `[${s.timestamp}] ${s.visual_action} ${s.edit_instruction}`).join(' | ');
        return cleaned.substring(0, 2000);
    }
    throw new Error('Claude analysis failed after 3 attempts');
}

// ── Kie.ai video generation ───────────────────────────────────────────────────
async function generateVideo(prompt, modelOverrides = {}) {
    const model    = modelOverrides.model    || config.seedance.model    || 'grok-imagine/text-to-video';
    const duration = modelOverrides.duration || config.seedance.duration || 10;
    const resolution  = config.seedance.resolution  || '720p';
    const aspectRatio = config.seedance.aspect_ratio || '9:16';
    const isGrok   = model.startsWith('grok');
    const isWan    = model.startsWith('wan');
    const isSora   = model.startsWith('sora');
    let input;
    if (isGrok) {
        input = { prompt, duration: String(Math.min(duration, 10)), resolution, aspect_ratio: aspectRatio, mode: 'normal' };
    } else if (isWan) {
        input = { prompt, duration: String(Math.min(duration, 15)), resolution, aspect_ratio: aspectRatio };
    } else if (isSora) {
        input = { prompt, n_frames: String(duration), aspect_ratio: aspectRatio === '9:16' ? 'portrait' : aspectRatio };
    } else {
        input = { prompt, duration, resolution, aspect_ratio: aspectRatio, generate_audio: true };
    }

    const res  = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + config.kie_api_key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input })
    });
    const data = await res.json();
    if (!data.data || !data.data.taskId) throw new Error('No taskId: ' + JSON.stringify(data).substring(0, 200));
    const taskId = data.data.taskId;
    log(`  Video task created: ${taskId}`);

    // Poll until done
    const interval = (config.poll_interval_seconds || 30) * 1000;
    for (let i = 0; i < 60; i++) {
        await sleep(interval);
        const pr   = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: { 'Authorization': 'Bearer ' + config.kie_api_key } });
        const pd   = await pr.json();
        const d    = pd.data || {};
        log(`  Poll #${i + 1} — ${d.state} ${d.progress || 0}%`);
        if (d.state === 'success') {
            const result = JSON.parse(d.resultJson || '{}');
            return result.resultUrls && result.resultUrls[0];
        }
        if (d.state === 'fail') {
            const msg = d.failMsg || 'unknown error';
            throw new Error(`Video generation failed: ${msg}`);
        }
    }
    throw new Error('Video generation timed out');
}

async function generateVideoWithRetry(prompt, modelOverrides = {}) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await generateVideo(prompt, modelOverrides);
        } catch (err) {
            const isServerError = /server exception|please try again|internal/i.test(err.message);
            if (attempt < maxAttempts && isServerError) {
                log(`  Video attempt ${attempt} failed (${err.message}), retrying in 60s...`);
                await sleep(60000);
            } else {
                throw err;
            }
        }
    }
}

// ── Post to social media ──────────────────────────────────────────────────────
async function postToSocialMedia(videoUrl, campaign, videoCaption) {
    const apiKey = config.uploadpost_api_key;
    if (!apiKey) throw new Error('uploadpost_api_key not set in config.json');

    // Download video binary so upload-post gets a real file, not a URL with missing Content-Type
    log(`  Downloading generated video for upload...`);
    const vRes = await fetch(videoUrl);
    log(`  Video fetch status: ${vRes.status} content-type: ${vRes.headers.get('content-type') || '(none)'}`);
    if (!vRes.ok) throw new Error(`Failed to download generated video: HTTP ${vRes.status}`);
    const vBuffer = Buffer.from(await vRes.arrayBuffer());
    log(`  Video size: ${(vBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    const vBlob = new Blob([vBuffer], { type: 'video/mp4' });

    // Group accounts by username (one API call per profile)
    const grouped = {};
    for (const acc of (campaign.accounts || [])) {
        if (!grouped[acc.username]) grouped[acc.username] = [];
        grouped[acc.username].push(acc.platform);
    }

    const caption = videoCaption || campaign.caption || `#${(campaign.keyword || '').replace(/\s+/g, '')} #viral #trending #ai`;
    log(`  Caption: ${caption.substring(0, 120)}`);

    const results = [];
    for (const [username, platforms] of Object.entries(grouped)) {
        log(`  Posting to platforms: ${platforms.join(', ')} | profile: "${username}"`);
        const form = new FormData();
        form.append('user', username);
        platforms.forEach(p => form.append('platform[]', p));
        form.append('video', vBlob, 'video.mp4');
        form.append('title', caption);
        form.append('async_upload', 'true');

        const res  = await fetch('https://api.upload-post.com/api/upload', {
            method: 'POST', headers: { 'Authorization': `Apikey ${apiKey}` }, body: form
        });
        const rawText = await res.text();
        log(`  Upload-post HTTP ${res.status}: ${rawText}`);
        let data;
        try { data = JSON.parse(rawText); } catch(e) { data = { raw: rawText }; }
        results.push({ username, platforms, response: data });
    }
    return results;
}

// ── Run one campaign ──────────────────────────────────────────────────────────
async function runCampaign(campaign) {
    const sep = '─'.repeat(60);
    log(`\n${sep}`);
    log(`▶ CAMPAIGN START`);
    log(`  name      : ${campaign.name}`);
    log(`  id        : ${campaign.id}`);
    log(`  keyword   : ${campaign.keyword}`);
    log(`  model     : ${campaign.video_model || config.seedance.model}`);
    log(`  duration  : ${campaign.video_duration || config.seedance.duration}s`);
    log(`  accounts  : ${(campaign.accounts||[]).map(a=>`${a.username}/${a.platform}`).join(', ')}`);
    log(sep);

    // ── Step 1: Search TikTok ────────────────────────────────────────────────
    log(`\n[STEP 1] TikTok Search`);
    const maxVideos = campaign.max_videos || 5;
    const searchRes = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(campaign.keyword)}&count=${maxVideos}&cursor=0&hd=1`);
    const searchData = await searchRes.json();
    log(`  tikwm_code    : ${searchData.code}`);
    log(`  videos_found  : ${((searchData.data && searchData.data.videos) || []).length}`);
    if (searchData.code !== 0) throw new Error(`tikwm search error: ${searchData.msg}`);
    const rawVideos = (searchData.data && searchData.data.videos) || [];
    if (rawVideos.length === 0) throw new Error('No videos found for keyword: ' + campaign.keyword);
    const video = rawVideos.sort((a, b) => (b.play_count || 0) - (a.play_count || 0))[0];
    const videoCaption = (video.title || video.desc || '').trim();
    log(`  selected_user : @${video.author && video.author.unique_id}`);
    log(`  play_count    : ${video.play_count}`);
    log(`  caption       : ${videoCaption.substring(0, 100)}`);

    // ── Step 2: HD URL ───────────────────────────────────────────────────────
    log(`\n[STEP 2] Get HD Download URL`);
    const tikwmRes = await fetch('https://www.tikwm.com/api/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(video.play || '')}&hd=1`
    });
    const tikwmData = await tikwmRes.json();
    const downloadUrl = (tikwmData.data && (tikwmData.data.hdplay || tikwmData.data.play)) || video.play || video.hdplay;
    log(`  download_url  : ${(downloadUrl || 'NOT FOUND').substring(0, 120)}`);
    if (!downloadUrl) throw new Error('Could not resolve download URL');

    // ── Step 3: Download ─────────────────────────────────────────────────────
    log(`\n[STEP 3] Download TikTok Video`);
    const dlRes = await fetch(downloadUrl);
    log(`  http_status   : ${dlRes.status}`);
    if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);
    const videoBuffer = Buffer.from(await dlRes.arrayBuffer());
    log(`  size_mb       : ${(videoBuffer.length / 1024 / 1024).toFixed(2)}`);

    // ── Step 4: AI Analysis ──────────────────────────────────────────────────
    log(`\n[STEP 4] AI Video Analysis`);
    log(`  claude_model  : ${config.analysis_model || 'claude-sonnet-4-6'}`);
    const prompt = await analyzeVideo(videoBuffer, campaign);
    log(`  prompt_chars  : ${prompt.length}`);
    log(`  prompt_preview: ${prompt.substring(0, 200)}`);

    // ── Step 5: Generate Video ───────────────────────────────────────────────
    log(`\n[STEP 5] Generate AI Video`);
    const modelOverrides = { model: campaign.video_model, duration: campaign.video_duration };
    log(`  gen_model     : ${modelOverrides.model || config.seedance.model}`);
    log(`  gen_duration  : ${modelOverrides.duration || config.seedance.duration}s`);
    log(`  resolution    : ${config.seedance.resolution}`);
    const videoUrl = await generateVideoWithRetry(prompt, modelOverrides);
    if (!videoUrl) throw new Error('No video URL returned');
    log(`  VIDEO_URL     : ${videoUrl}`);

    // ── Step 6: Post to Social ───────────────────────────────────────────────
    log(`\n[STEP 6] Post to Social Media`);
    const postResults = await postToSocialMedia(videoUrl, campaign, videoCaption);
    postResults.forEach(r => {
        log(`  platform      : ${r.platforms.join(', ')} | profile: ${r.username}`);
        log(`  upload_result : ${JSON.stringify(r.response)}`);
    });

    log(`\n${sep}`);
    log(`✅ CAMPAIGN DONE`);
    log(`  VIDEO_URL   : ${videoUrl}`);
    const postIds = postResults.map(r => `${r.platforms.join('+')}=${r.response.job_id||r.response.request_id||'?'}`).join(', ');
    log(`  POST_JOB_IDS: ${postIds}`);
    log(sep);

    return { videoUrl, postResults };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    log('Campaign Runner started');
    const result = await githubGet('workflow/campaigns.json');
    if (!result) { log('campaigns.json not found, nothing to do.'); return; }

    const { content, sha } = result;
    const campaigns = content.campaigns || [];
    const now = new Date();
    let anyUpdated = false;

    for (const campaign of campaigns) {
        if (campaign.status !== 'active') continue;
        const nextRun = campaign.next_run_at ? new Date(campaign.next_run_at) : new Date(0);
        if (nextRun > now) {
            log(`Campaign "${campaign.name}" not due yet (next: ${campaign.next_run_at})`);
            continue;
        }

        try {
            const runResult = await runCampaign(campaign);
            campaign.last_run_at  = now.toISOString();
            campaign.next_run_at  = new Date(now.getTime() + (campaign.interval_hours || 24) * 3600000).toISOString();
            campaign.last_result  = { success: true, videoUrl: runResult.videoUrl, posted_at: now.toISOString(), posts: runResult.postResults };
            log(`Campaign "${campaign.name}" completed successfully`);
        } catch (err) {
            log(`Campaign "${campaign.name}" failed: ${err.message}`);
            campaign.last_run_at = now.toISOString();
            campaign.next_run_at = new Date(now.getTime() + (campaign.interval_hours || 24) * 3600000).toISOString();
            campaign.last_result = { success: false, error: err.message, failed_at: now.toISOString() };
        }
        anyUpdated = true;
    }

    if (anyUpdated) {
        log('Saving updated campaigns.json...');
        await githubPut('workflow/campaigns.json', { campaigns }, sha, 'chore: update campaign results [skip ci]');
    } else {
        log('No campaigns were due. Done.');
    }
}

main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });

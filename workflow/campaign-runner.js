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
async function analyzeVideo(videoBuffer) {
    const model = config.analysis_model || 'claude-sonnet-4-6';
    const prompt = config.analysis_prompt || 'Analyze this video and return a JSON array of 4 timestamped segments. Each must have: timestamp, visual_action, edit_instruction. Return only valid JSON.';
    log(`  Analyzing with ${model}...`);

    const frames = extractFrames(videoBuffer);
    const imageBlocks = frames.map(b64 => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }));

    for (let attempt = 1; attempt <= 3; attempt++) {
        if (attempt > 1) { log(`  Retry ${attempt}...`); await sleep(60000); }
        const res  = await fetch('https://api.kie.ai/claude/v1/messages', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + config.kie_api_key, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model, max_tokens: 2000, messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: prompt }] }] })
        });
        const data = await res.json();
        if (data.code === 500 && attempt < 3) continue;
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
async function generateVideo(prompt) {
    const model    = config.seedance.model    || 'wan/2-6-text-to-video';
    const isGrok   = model.startsWith('grok');
    const isWan    = model.startsWith('wan');
    const isSora   = model.startsWith('sora');
    let input;
    if (isGrok) {
        input = { prompt, duration: String(Math.min(config.seedance.duration || 6, 10)), resolution: config.seedance.resolution || '480p', aspect_ratio: config.seedance.aspect_ratio || '9:16', mode: 'normal' };
    } else if (isWan) {
        input = { prompt, duration: String(config.seedance.duration || 15), resolution: config.seedance.resolution || '720p', aspect_ratio: config.seedance.aspect_ratio || '9:16' };
    } else if (isSora) {
        input = { prompt, n_frames: String(config.seedance.duration || 15), aspect_ratio: config.seedance.aspect_ratio || 'portrait' };
    } else {
        input = { prompt, duration: config.seedance.duration || 15, resolution: config.seedance.resolution || '720p', aspect_ratio: config.seedance.aspect_ratio || '9:16', generate_audio: true };
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
        if (d.state === 'fail') throw new Error(`Video generation failed: ${d.failMsg}`);
    }
    throw new Error('Video generation timed out');
}

// ── Post to social media ──────────────────────────────────────────────────────
async function postToSocialMedia(videoUrl, campaign, videoCaption) {
    const apiKey = config.uploadpost_api_key;
    if (!apiKey) throw new Error('uploadpost_api_key not set in config.json');

    // Group accounts by username (one API call per profile)
    const grouped = {};
    for (const acc of (campaign.accounts || [])) {
        if (!grouped[acc.username]) grouped[acc.username] = [];
        grouped[acc.username].push(acc.platform);
    }

    const results = [];
    for (const [username, platforms] of Object.entries(grouped)) {
        log(`  Posting to ${platforms.join(', ')} via profile "${username}"...`);
        const caption = videoCaption || campaign.caption || `#${(campaign.keyword || '').replace(/\s+/g, '')} #viral #trending #ai`;
        const form = new FormData();
        form.append('user', username);
        platforms.forEach(p => form.append('platform[]', p));
        form.append('video', videoUrl);
        form.append('title', caption);
        form.append('async_upload', 'true');

        const res  = await fetch('https://api.upload-post.com/api/upload', {
            method: 'POST', headers: { 'Authorization': `Apikey ${apiKey}` }, body: form
        });
        const data = await res.json();
        log(`  Post result: ${JSON.stringify(data).substring(0, 200)}`);
        results.push({ username, platforms, response: data });
    }
    return results;
}

// ── Run one campaign ──────────────────────────────────────────────────────────
async function runCampaign(campaign) {
    log(`\n=== Running campaign: "${campaign.name}" (keyword: "${campaign.keyword}") ===`);

    // Step 1: Search TikTok via tikwm
    log('Step 1 — Searching TikTok...');
    const maxVideos = campaign.max_videos || 5;
    const searchRes = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(campaign.keyword)}&count=${maxVideos}&cursor=0&hd=1`);
    const searchData = await searchRes.json();
    if (searchData.code !== 0) throw new Error(`tikwm search error: ${searchData.msg}`);
    const rawVideos = (searchData.data && searchData.data.videos) || [];
    if (rawVideos.length === 0) throw new Error('No videos found for keyword: ' + campaign.keyword);

    // Pick video with highest play count
    const video = rawVideos.sort((a, b) => (b.play_count || 0) - (a.play_count || 0))[0];
    const videoCaption = (video.title || video.desc || '').trim();
    log(`  Selected: @${video.author && video.author.unique_id} — ${videoCaption.substring(0, 60)}`);

    // Step 2: Get HD download URL
    log('Step 2 — Getting HD URL...');
    const tikwmRes  = await fetch('https://www.tikwm.com/api/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(video.play || '')}&hd=1`
    });
    const tikwmData = await tikwmRes.json();
    const downloadUrl = (tikwmData.data && (tikwmData.data.hdplay || tikwmData.data.play)) || video.play || video.hdplay;
    if (!downloadUrl) throw new Error('Could not resolve download URL');

    // Step 3: Download video
    log('Step 3 — Downloading video...');
    const dlRes = await fetch(downloadUrl);
    if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);
    const videoBuffer = Buffer.from(await dlRes.arrayBuffer());
    log(`  Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB`);

    // Step 4: AI Analysis
    log('Step 4 — AI analysis...');
    const prompt = await analyzeVideo(videoBuffer);
    log(`  Prompt length: ${prompt.length} chars`);

    // Step 5: Generate video
    log('Step 5 — Generating video...');
    const videoUrl = await generateVideo(prompt);
    if (!videoUrl) throw new Error('No video URL returned');
    log(`  Generated: ${videoUrl.substring(0, 80)}...`);

    // Step 6: Post to social media
    log('Step 6 — Posting to social media...');
    const postResults = await postToSocialMedia(videoUrl, campaign, videoCaption);

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

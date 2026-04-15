const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// ── Output folder (env var for CI, config for local) ─────────────────────────
const outputFolder = process.env.OUTPUT_FOLDER || path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

// ── Logger ────────────────────────────────────────────────────────────────────
const logFile = path.join(outputFolder, `workflow_${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    logStream.write(line + '\n');
}

function logSection(title) {
    const bar = '─'.repeat(50);
    log('');
    log(bar);
    log(`  ${title}`);
    log(bar);
}

function logOutput(label, data) {
    const bar = '·'.repeat(50);
    log(`  ┌─ OUTPUT: ${label}`);
    if (typeof data === 'object') {
        JSON.stringify(data, null, 2).split('\n').forEach(l => log(`  │  ${l}`));
    } else {
        String(data).split('\n').forEach(l => log(`  │  ${l}`));
    }
    log(`  └${bar}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fmt(n) { return Number(n).toLocaleString(); }

// ── Steps ─────────────────────────────────────────────────────────────────────
async function searchTikTok(keyword) {
    logSection(`STEP 1 — Apify: Search TikTok`);
    log(`  Keyword  : "${keyword}"`);
    log(`  Max      : 10 results requested`);

    const url = `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${config.apify_api_key}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SEARCH', searchQueries: [keyword], maxResultsPerQuery: 10, resultsType: 'videos' })
    });
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    log(`  HTTP status : ${res.status}`);
    log(`  Videos returned : ${items.length}`);
    return items;
}

function filterVideos(items) {
    const filtered = items.filter(d => {
        const vm = d.videoMeta || {};
        return vm.downloadAddr || vm.playAddr || d.downloadUrl || d.videoUrl || d.webVideoUrl;
    }).slice(0, 1).map(d => {
        const vm = d.videoMeta || {};
        return {
            videoId     : d.id || d.videoId || '',
            description : d.desc || d.text || d.description || '',
            videoUrl    : vm.downloadAddr || vm.playAddr || d.downloadUrl || d.videoUrl || d.webVideoUrl || '',
            authorName  : (d.authorMeta && d.authorMeta.name) || (d.author && d.author.uniqueId) || '',
            playCount   : (d.stats && d.stats.playCount) || d.playCount || 0,
            likeCount   : (d.stats && d.stats.diggCount) || d.diggCount || 0,
            commentCount: (d.stats && d.stats.commentCount) || d.commentCount || 0,
            shareCount  : (d.stats && d.stats.shareCount) || d.shareCount || 0,
            duration    : (d.videoMeta && d.videoMeta.duration) || d.duration || 0
        };
    });

    logOutput('Apify — Selected Video', {
        videoId    : filtered[0]?.videoId,
        author     : '@' + filtered[0]?.authorName,
        description: filtered[0]?.description,
        duration   : filtered[0]?.duration + 's',
        stats: {
            plays   : fmt(filtered[0]?.playCount),
            likes   : fmt(filtered[0]?.likeCount),
            comments: fmt(filtered[0]?.commentCount),
            shares  : fmt(filtered[0]?.shareCount)
        },
        videoUrl   : filtered[0]?.videoUrl?.substring(0, 100) + '...'
    });

    return filtered;
}

async function getDownloadUrl(video) {
    logSection(`STEP 2 — TikWM: Get HD Download URL`);
    log(`  Video ID : ${video.videoId}`);

    const res = await fetch('https://www.tikwm.com/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'url=' + encodeURIComponent(video.videoUrl) + '&hd=1'
    });
    const data = await res.json();
    const hdUrl  = data.data && data.data.hdplay;
    const sdUrl  = data.data && data.data.play;
    const chosen = hdUrl || sdUrl || video.videoUrl;
    const source = hdUrl ? 'HD' : sdUrl ? 'SD' : 'Apify fallback';

    logOutput('TikWM — Download URL', {
        source: source,
        hdplay: hdUrl ? hdUrl.substring(0, 100) + '...' : 'N/A',
        play  : sdUrl ? sdUrl.substring(0, 100) + '...' : 'N/A',
        chosen: chosen.substring(0, 100) + '...'
    });

    return chosen;
}

async function downloadVideo(url) {
    logSection(`STEP 3 — Download TikTok Video`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const sizeMB = (buf.length / 1024 / 1024).toFixed(2);

    logOutput('Downloaded Video', {
        size  : sizeMB + ' MB',
        bytes : fmt(buf.length),
        method: 'Binary buffer (base64 for Gemini)'
    });

    return buf;
}

async function analyzeWithGemini(videoBuffer, downloadUrl) {
    logSection(`STEP 4 — Kie.ai: Gemini Video Analysis`);
    const model = config.gemini_model || 'gemini-2.5-pro';
    const mode  = (videoBuffer && videoBuffer.length > 500) ? 'inline base64' : 'CDN URL';
    log(`  Model : ${model}`);
    log(`  Mode  : ${mode}`);

    const promptText = config.gemini_prompt || 'Describe this video in detail as a JSON array of timestamped segments with visual_action and edit_instruction keys.';

    let body;
    if (videoBuffer && videoBuffer.length > 500) {
        body = { model, stream: false, messages: [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: 'data:video/mp4;base64,' + videoBuffer.toString('base64') } },
            { type: 'text', text: promptText }
        ]}]};
    } else {
        body = { model, stream: false, messages: [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: downloadUrl } },
            { type: 'text', text: promptText }
        ]}]};
    }

    const res = await fetch(`https://api.kie.ai/${model}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + config.kie_api_key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    log(`  HTTP status : ${res.status}`);
    return data;
}

function parseGeminiResponse(data) {
    let content = '';
    try { content = data.choices[0].message.content; } catch(e) {}
    try { if (!content) content = data.data.choices[0].message.content; } catch(e) {}
    if (!content) throw new Error('Cannot extract Gemini content: ' + JSON.stringify(data).substring(0, 300));

    const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

    let parsed = null;
    try { parsed = JSON.parse(cleaned); } catch(e) {
        const m = cleaned.match(/[\[{][\s\S]*[\]}]/);
        if (m) try { parsed = JSON.parse(m[0]); } catch(e2) {}
    }

    let prompt = '';

    if (Array.isArray(parsed)) {
        logOutput('Gemini — Timestamped Segments', parsed.map(s => ({
            timestamp       : s.timestamp,
            visual_action   : s.visual_action,
            edit_instruction: s.edit_instruction
        })));
        prompt = parsed.map(s =>
            `[${s.timestamp}] ${s.visual_action} ${s.edit_instruction}`
        ).join(' | ');
    } else if (parsed && typeof parsed === 'object') {
        prompt = parsed.prompt || parsed.generation_prompt || parsed.visual_prompt || cleaned.substring(0, 500);
        logOutput('Gemini — Generated Prompt', { prompt, style: parsed.style || '', motion: parsed.motion || '', prompt_chars: prompt.length });
    } else {
        prompt = cleaned.substring(0, 500);
        logOutput('Gemini — Raw Prompt (fallback)', { prompt });
    }

    if (!prompt || prompt.length < 10) throw new Error('Gemini returned an empty or invalid prompt');
    if (prompt.length > 10000) prompt = prompt.substring(0, 10000);
    return prompt;
}

async function createVideoTask(prompt) {
    const model  = config.seedance.model || 'wan/2-6-text-to-video';
    const isSora = model.startsWith('sora');
    const isWan  = model.startsWith('wan');

    logSection(`STEP 5 — Kie.ai: Create Video Task`);

    let input;
    if (isSora) {
        input = {
            prompt,
            n_frames    : String(config.seedance.duration || 15),
            aspect_ratio: config.seedance.aspect_ratio || 'portrait'
        };
        log(`  Model        : ${model}`);
        log(`  Duration     : ${input.n_frames}s`);
        log(`  Aspect ratio : ${input.aspect_ratio}`);
    } else if (isWan) {
        input = {
            prompt,
            duration    : String(config.seedance.duration || 15),
            resolution  : config.seedance.resolution || '720p',
            aspect_ratio: config.seedance.aspect_ratio || '9:16'
        };
        log(`  Model        : ${model}`);
        log(`  Duration     : ${input.duration}s`);
        log(`  Resolution   : ${input.resolution}`);
        log(`  Aspect ratio : ${input.aspect_ratio}`);
    } else {
        input = {
            prompt,
            duration      : config.seedance.duration || 15,
            generate_audio: config.seedance.generate_audio !== false,
            resolution    : config.seedance.resolution || '720p',
            aspect_ratio  : config.seedance.aspect_ratio || '9:16'
        };
        log(`  Model        : ${model}`);
        log(`  Duration     : ${input.duration}s`);
        log(`  Audio        : ${input.generate_audio}`);
        log(`  Resolution   : ${input.resolution}`);
        log(`  Aspect ratio : ${input.aspect_ratio}`);
    }

    const res = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + config.kie_api_key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input })
    });
    const data = await res.json();
    log(`  HTTP status : ${res.status}`);

    if (!data.data || !data.data.taskId) throw new Error('No taskId returned: ' + JSON.stringify(data).substring(0, 300));

    logOutput('Video Task Created', { taskId: data.data.taskId, model, status: 'queued' });

    return data.data.taskId;
}

async function pollUntilDone(taskId) {
    logSection(`STEP 6 — Poll Task Status`);
    log(`  Task ID  : ${taskId}`);
    log(`  Interval : every ${config.poll_interval_seconds || 30}s`);

    let attempt = 0;
    while (true) {
        await sleep((config.poll_interval_seconds || 30) * 1000);
        attempt++;
        const res = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            headers: { 'Authorization': 'Bearer ' + config.kie_api_key }
        });
        const data = await res.json();
        const d = data.data || {};
        log(`  Poll #${attempt} — state: ${d.state} | progress: ${d.progress || 0}%`);

        if (d.state === 'success') {
            const result = JSON.parse(d.resultJson || '{}');
            const videoUrl = result.resultUrls && result.resultUrls[0];
            const elapsed = attempt * (config.poll_interval_seconds || 30);
            logOutput('Video Task Complete', { taskId, totalPolls: attempt, elapsedSec: elapsed + 's', videoUrl });
            return videoUrl;
        }
        if (d.state === 'fail') throw new Error(`Task failed: ${d.failMsg || 'Unknown error'} (code: ${d.failCode || 'N/A'})`);
    }
}

async function saveVideo(url, taskId) {
    logSection(`STEP 7 — Download & Save Final Video`);
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
    const filepath  = path.join(outputFolder, `video_${taskId}_${timestamp}.mp4`);

    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filepath, buf);

    logOutput('Saved File', {
        path : filepath,
        size : (buf.length / 1024 / 1024).toFixed(2) + ' MB',
        bytes: fmt(buf.length)
    });

    return { filepath, kieUrl: url };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const startTime = Date.now();
    logSection('TikTok → Gemini → Video Workflow');
    log(`  Log file : ${logFile}`);
    log(`  Keyword  : "${config.keyword}"`);
    log(`  Config   : max_videos=${config.max_videos}, model=${config.seedance.model}, duration=${config.seedance.duration}s`);

    const items  = await searchTikTok(config.keyword);
    const videos = filterVideos(items);

    if (videos.length === 0) {
        log('ERROR: No valid videos found after filtering. Exiting.');
        process.exit(1);
    }

    const downloadUrl = await getDownloadUrl(videos[0]);

    let videoBuffer = null;
    try { videoBuffer = await downloadVideo(downloadUrl); }
    catch(e) { log(`  WARNING: Video download failed (${e.message}) — using URL fallback for Gemini`); }

    const geminiResponse = await analyzeWithGemini(videoBuffer, downloadUrl);
    const prompt         = parseGeminiResponse(geminiResponse);
    const taskId         = await createVideoTask(prompt);
    const videoUrl       = await pollUntilDone(taskId);
    const { filepath, kieUrl } = await saveVideo(videoUrl, taskId);

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    // Write result.json for the frontend to consume
    const result = {
        success      : true,
        videoUrl     : kieUrl,
        taskId       : taskId,
        keyword      : config.keyword,
        model        : config.seedance.model,
        resolution   : config.seedance.resolution || '720p',
        duration     : config.seedance.duration,
        timestamp    : new Date().toISOString(),
        elapsedMinutes: parseFloat(elapsed),
        tiktokAuthor : videos[0].authorName,
        tiktokVideoId: videos[0].videoId
    };
    fs.writeFileSync(path.join(outputFolder, 'result.json'), JSON.stringify(result, null, 2));

    logSection('WORKFLOW COMPLETE');
    log(`  ✅ Video  : ${filepath}`);
    log(`  🔗 URL    : ${kieUrl}`);
    log(`  ⏱  Total  : ${elapsed} minutes`);
    log(`  📄 Log    : ${logFile}`);
    logStream.end();
}

main().catch(err => {
    log(`\n❌ ERROR: ${err.message}`);

    // Write failure result.json so frontend knows it failed
    const result = {
        success  : false,
        error    : err.message,
        timestamp: new Date().toISOString()
    };
    try { fs.writeFileSync(path.join(outputFolder, 'result.json'), JSON.stringify(result, null, 2)); } catch(e) {}

    logStream.end();
    process.exit(1);
});

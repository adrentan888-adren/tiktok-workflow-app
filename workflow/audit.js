/**
 * audit.js — Self-audit: verifies that campaign videos were actually posted.
 * Runs every 20 minutes via audit.yml.
 * For each campaign that ran "successfully" within the last 40 minutes,
 * checks the upload-post history. If the post is missing or failed, re-posts.
 */

const fs   = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const repo   = process.env.GITHUB_REPOSITORY;
const token  = process.env.GITHUB_TOKEN;

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

// ── Upload-post helpers ────────────────────────────────────────────────────────
async function getUploadHistory() {
    const apiKey = config.uploadpost_api_key;
    if (!apiKey) return [];
    const res = await fetch('https://api.upload-post.com/api/uploadposts/history', {
        headers: { 'Authorization': `Apikey ${apiKey}` }
    });
    if (!res.ok) {
        log(`  upload-post history HTTP ${res.status}`);
        return [];
    }
    const data = await res.json();
    // history may be { posts: [...] } or an array
    return Array.isArray(data) ? data : (data.posts || data.data || []);
}

function isPostSuccessful(historyEntry) {
    // upload-post marks success with status "done" / "published" / "success" or non-null post_id
    const s = (historyEntry.status || '').toLowerCase();
    return s === 'done' || s === 'published' || s === 'success' || !!historyEntry.post_id;
}

async function repost(campaign, videoUrl) {
    const apiKey = config.uploadpost_api_key;
    log(`  Re-downloading video from: ${videoUrl}`);
    const vRes = await fetch(videoUrl);
    if (!vRes.ok) throw new Error(`Video download failed: HTTP ${vRes.status}`);
    const vBuffer = Buffer.from(await vRes.arrayBuffer());
    log(`  Video size: ${(vBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    const vBlob = new Blob([vBuffer], { type: 'video/mp4' });

    const grouped = {};
    for (const acc of (campaign.accounts || [])) {
        if (!grouped[acc.username]) grouped[acc.username] = [];
        grouped[acc.username].push(acc.platform);
    }

    const caption = campaign.last_result && campaign.last_result.caption
        ? campaign.last_result.caption
        : `#${(campaign.keyword || '').replace(/\s+/g, '')} #viral #trending #ai`;

    const results = [];
    for (const [username, platforms] of Object.entries(grouped)) {
        log(`  Re-posting to ${platforms.join(', ')} | profile: "${username}"`);
        const form = new FormData();
        form.append('user', username);
        platforms.forEach(p => form.append('platform[]', p));
        form.append('video', vBlob, 'video.mp4');
        form.append('title', caption);
        form.append('async_upload', 'true');

        const res      = await fetch('https://api.upload-post.com/api/upload', {
            method: 'POST', headers: { 'Authorization': `Apikey ${apiKey}` }, body: form
        });
        const rawText  = await res.text();
        log(`  Upload-post HTTP ${res.status}: ${rawText}`);
        let data;
        try { data = JSON.parse(rawText); } catch(e) { data = { raw: rawText }; }
        results.push({ username, platforms, response: data });
    }
    return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    log('=== AUDIT START ===');

    const result = await githubGet('workflow/campaigns.json');
    if (!result) { log('campaigns.json not found. Done.'); return; }

    const { content, sha } = result;
    const campaigns = content.campaigns || [];
    const now = new Date();
    const WINDOW_MS = 40 * 60 * 1000; // 40-minute audit window

    // Collect campaigns that need auditing
    const toAudit = campaigns.filter(c => {
        if (c.status !== 'active') return false;
        if (!c.last_result || !c.last_result.success) return false;
        if (c.last_result.audit_ok) return false; // already audited successfully
        const postedAt = new Date(c.last_result.posted_at || 0);
        return (now - postedAt) <= WINDOW_MS;
    });

    if (toAudit.length === 0) {
        log('No campaigns within audit window. Done.');
        return;
    }

    log(`Campaigns to audit: ${toAudit.map(c => c.name).join(', ')}`);

    // Fetch upload-post history once (covers all campaigns)
    log('Fetching upload-post history...');
    const history = await getUploadHistory();
    log(`  History entries: ${history.length}`);

    let anyUpdated = false;

    for (const campaign of toAudit) {
        const lr = campaign.last_result;
        log(`\nAuditing campaign: "${campaign.name}"`);
        log(`  posted_at: ${lr.posted_at}`);
        log(`  videoUrl : ${lr.videoUrl}`);

        // Collect job_ids from the original post
        const jobIds = (lr.posts || []).map(p => p.response && (p.response.job_id || p.response.request_id)).filter(Boolean);
        log(`  job_ids  : ${jobIds.join(', ') || 'none'}`);

        let postVerified = false;

        if (jobIds.length > 0) {
            // Check if any of the job_ids appear as successful in history
            for (const jobId of jobIds) {
                const entry = history.find(h => h.job_id === jobId || h.id === jobId || h.request_id === jobId);
                if (entry) {
                    log(`  Found history entry for job ${jobId}: status=${entry.status}`);
                    if (isPostSuccessful(entry)) {
                        postVerified = true;
                        log(`  ✅ Post confirmed as successful`);
                    } else {
                        log(`  ⚠️  Post status is "${entry.status}" — not yet successful`);
                    }
                } else {
                    log(`  job ${jobId} not found in history`);
                }
            }
        } else {
            // No job_ids stored — check by recency: any post within 5 minutes of posted_at
            const postedAt = new Date(lr.posted_at);
            const recent = history.find(h => {
                const createdAt = new Date(h.created_at || h.timestamp || 0);
                return Math.abs(createdAt - postedAt) < 5 * 60 * 1000 && isPostSuccessful(h);
            });
            if (recent) {
                log(`  ✅ Found recent successful post by timestamp`);
                postVerified = true;
            }
        }

        if (postVerified) {
            // Mark as audited so we skip next time
            campaign.last_result.audit_ok = true;
            anyUpdated = true;
            log(`  Campaign "${campaign.name}" — audit passed`);
        } else {
            // Post not confirmed — re-post now
            log(`  ❌ Post NOT confirmed. Re-posting video...`);
            try {
                if (!lr.videoUrl) throw new Error('No videoUrl in last_result — cannot re-post');
                const repostResults = await repost(campaign, lr.videoUrl);
                campaign.last_result.audit_ok = false;
                campaign.last_result.repost_at = now.toISOString();
                campaign.last_result.repost_results = repostResults;
                log(`  Re-post submitted for campaign "${campaign.name}"`);
                anyUpdated = true;
            } catch (err) {
                log(`  Re-post FAILED for "${campaign.name}": ${err.message}`);
                campaign.last_result.audit_error = err.message;
                anyUpdated = true;
            }
        }
    }

    if (anyUpdated) {
        log('\nSaving updated campaigns.json...');
        const ok = await githubPut('workflow/campaigns.json', { campaigns }, sha, 'chore: audit update [skip ci]');
        log(ok ? 'Saved.' : 'Save failed!');
    }

    log('\n=== AUDIT DONE ===');
}

main().catch(e => { log('FATAL: ' + e.message); process.exit(1); });

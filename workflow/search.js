const keyword   = process.env.KEYWORD || '';
const maxVideos = parseInt(process.env.MAX_VIDEOS) || 5;
const repo      = process.env.GITHUB_REPOSITORY;
const token     = process.env.GITHUB_TOKEN;

async function run() {
    console.log(`Searching TikTok for "${keyword}" (max ${maxVideos})...`);

    const res  = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(keyword)}&count=${maxVideos}&cursor=0&hd=1`);
    const data = await res.json();

    if (data.code !== 0) throw new Error(`tikwm error: ${data.msg || JSON.stringify(data)}`);

    const rawVideos = (data.data && data.data.videos) || [];
    const videos    = rawVideos.slice(0, maxVideos).map(v => ({
        videoId    : v.video_id || v.id || '',
        description: v.title || v.desc || '',
        videoUrl   : v.play || v.hdplay || '',
        webUrl     : (v.video_id || v.id) ? `https://www.tiktok.com/@${(v.author && v.author.unique_id) || 'unknown'}/video/${v.video_id || v.id}` : '',
        authorName : (v.author && v.author.unique_id) || '',
        thumbnail  : v.cover || v.origin_cover || '',
        playCount  : v.play_count  || 0,
        likeCount  : v.digg_count  || 0,
        duration   : v.duration    || 0
    }));

    console.log(`Found ${videos.length} videos`);

    const results = { keyword, videos, timestamp: new Date().toISOString() };
    const content = Buffer.from(JSON.stringify(results, null, 2)).toString('base64');
    const file    = 'workflow/search-results.json';

    // Get existing SHA if file exists
    let sha = '';
    try {
        const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (getRes.ok) sha = (await getRes.json()).sha || '';
    } catch(e) {}

    const body = { message: 'chore: update search results [skip ci]', content };
    if (sha) body.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
        method : 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body   : JSON.stringify(body)
    });

    if (!putRes.ok) throw new Error(`Failed to save results: ${putRes.status} ${await putRes.text()}`);
    console.log(`Saved search-results.json (${videos.length} videos)`);
}

run().catch(e => { console.error('Search failed:', e.message); process.exit(1); });

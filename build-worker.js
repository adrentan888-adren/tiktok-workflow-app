const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');

const escaped = html
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const worker = `
const HTML = \`${escaped}\`;

const OWNER  = 'adrentan888-adren';
const REPO   = 'tiktok-workflow-app';
const BRANCH = 'main';

function ghHeaders(pat) {
  return {
    'Authorization': \`Bearer \${pat}\`,
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
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/config.json\`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // PUT /api/config — save config.json to GitHub
    if (url.pathname === '/api/config' && request.method === 'PUT') {
      const body = await request.json();
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/config.json\`,
        { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(body) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // POST /api/trigger — trigger workflow_dispatch
    if (url.pathname === '/api/trigger' && request.method === 'POST') {
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/workflows/run-workflow.yml/dispatches\`,
        { method: 'POST', headers: ghHeaders(pat), body: JSON.stringify({ ref: BRANCH }) }
      );
      return json({ status: res.status });
    }

    // POST /api/trigger-campaign-runner — trigger campaign-runner workflow_dispatch
    if (url.pathname === '/api/trigger-campaign-runner' && request.method === 'POST') {
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/workflows/campaign-runner.yml/dispatches\`,
        { method: 'POST', headers: ghHeaders(pat), body: JSON.stringify({ ref: BRANCH }) }
      );
      return json({ status: res.status });
    }

    // GET /api/logs — list recent runs from all workflows
    if (url.pathname === '/api/logs' && request.method === 'GET') {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/workflows/campaign-runner.yml/runs?per_page=15\`, { headers: ghHeaders(pat) }),
        fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/workflows/run-workflow.yml/runs?per_page=10\`,    { headers: ghHeaders(pat) }),
        fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/workflows/search.yml/runs?per_page=5\`,          { headers: ghHeaders(pat) }),
        fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/workflows/audit.yml/runs?per_page=10\`,          { headers: ghHeaders(pat) }),
      ]);
      const [d1, d2, d3, d4] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json()]);
      const runs = [
        ...(d1.workflow_runs || []),
        ...(d2.workflow_runs || []),
        ...(d3.workflow_runs || []),
        ...(d4.workflow_runs || []),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30);
      return json({ runs });
    }

    // GET /api/runs — list recent workflow runs
    if (url.pathname === '/api/runs' && request.method === 'GET') {
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/runs?per_page=10&event=workflow_dispatch\`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // GET /api/run/:id — run status + jobs
    const runMatch = url.pathname.match(/^\\/api\\/run\\/(\\d+)$/);
    if (runMatch && request.method === 'GET') {
      const runId = runMatch[1];
      const [runRes, jobsRes] = await Promise.all([
        fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/runs/\${runId}\`, { headers: ghHeaders(pat) }),
        fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/runs/\${runId}/jobs\`, { headers: ghHeaders(pat) })
      ]);
      const [run, jobs] = await Promise.all([runRes.json(), jobsRes.json()]);
      return json({ run, jobs });
    }

    // GET /api/job-logs/:job_id — fetch raw console output for a job
    const jobLogsMatch = url.pathname.match(/^\\/api\\/job-logs\\/(\\d+)$/);
    if (jobLogsMatch && request.method === 'GET') {
      const jobId = jobLogsMatch[1];
      // Step 1: get redirect URL from GitHub (do NOT follow — auth header must not go to Azure)
      const ghRes = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/jobs/\${jobId}/logs\`,
        { headers: ghHeaders(pat), redirect: 'manual' }
      );
      const logUrl = ghRes.headers.get('location');
      if (!logUrl) return new Response('No log URL returned by GitHub', { status: 502 });
      // Step 2: fetch the Azure Blob URL without auth headers
      const logRes = await fetch(logUrl);
      const text = await logRes.text();
      return new Response(text, { headers: { 'Content-Type': 'text/plain' } });
    }

    // GET /api/result — get latest-result.json from GitHub
    if (url.pathname === '/api/result' && request.method === 'GET') {
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/latest-result.json?t=\${Date.now()}\`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // GET /api/product-image — check if product-image.jpg exists in GitHub repo
    if (url.pathname === '/api/product-image' && request.method === 'GET') {
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/product-image.jpg\`,
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
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/product-image.jpg\`,
        { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(payload) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // DELETE /api/product-image — remove product-image.jpg from GitHub repo
    if (url.pathname === '/api/product-image' && request.method === 'DELETE') {
      const body = await request.json();
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/product-image.jpg\`,
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
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/actions/workflows/search.yml/dispatches\`,
        { method: 'POST', headers: ghHeaders(pat), body: JSON.stringify({ ref: BRANCH, inputs: { keyword, max_videos: String(maxVideos) } }) }
      );
      return json({ triggered: res.status === 204, status: res.status, keyword });
    }

    // GET /api/search-results?keyword=X — read search-results.json from GitHub
    if (url.pathname === '/api/search-results' && request.method === 'GET') {
      const keyword = url.searchParams.get('keyword') || '';
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/search-results.json?t=\${Date.now()}\`,
        { headers: ghHeaders(pat) }
      );
      if (!res.ok) return json({ ready: false });
      const data = await res.json();
      const results = JSON.parse(atob(data.content.replace(/\\n/g, '')));
      if (results.keyword.toLowerCase() !== keyword.toLowerCase()) return json({ ready: false, currentKeyword: results.keyword });
      const age = Date.now() - new Date(results.timestamp).getTime();
      if (age > 10 * 60 * 1000) return json({ ready: false, reason: 'stale' });
      return json({ ready: true, videos: results.videos, keyword: results.keyword });
    }

    // GET /api/campaign-photo/:id — get per-campaign product photo
    const campaignPhotoMatch = url.pathname.match(/^\\/api\\/campaign-photo\\/([\\w-]+)$/);
    if (campaignPhotoMatch && request.method === 'GET') {
      const cid = campaignPhotoMatch[1];
      const res = await fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/photos/\${cid}.jpg?t=\${Date.now()}\`, { headers: ghHeaders(pat) });
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
      const res = await fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/photos/\${cid}.jpg\`, { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(payload) });
      const data = await res.json();
      return json(data, res.status);
    }

    // DELETE /api/campaign-photo/:id — remove per-campaign product photo
    if (campaignPhotoMatch && request.method === 'DELETE') {
      const cid = campaignPhotoMatch[1];
      const body = await request.json();
      const res = await fetch(\`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/photos/\${cid}.jpg\`, { method: 'DELETE', headers: ghHeaders(pat), body: JSON.stringify({ message: 'campaign-photo: remove', sha: body.sha }) });
      return json({ deleted: res.ok }, res.status);
    }

    // GET /api/campaigns — fetch campaigns.json from GitHub
    if (url.pathname === '/api/campaigns' && request.method === 'GET') {
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/campaigns.json?t=\${Date.now()}\`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // PUT /api/campaigns — save campaigns.json to GitHub
    if (url.pathname === '/api/campaigns' && request.method === 'PUT') {
      const body = await request.json();
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/campaigns.json\`,
        { method: 'PUT', headers: ghHeaders(pat), body: JSON.stringify(body) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    // GET /api/social-accounts — proxy to upload-post, get connected accounts
    if (url.pathname === '/api/social-accounts' && request.method === 'GET') {
      // First fetch config to get uploadpost_api_key
      const cfgRes = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/config.json\`,
        { headers: ghHeaders(pat) }
      );
      const cfgData = await cfgRes.json();
      const cfg = JSON.parse(atob(cfgData.content.replace(/\\n/g, '')));
      const upKey = cfg.uploadpost_api_key || '';
      const res = await fetch('https://api.upload-post.com/api/uploadposts/users', {
        headers: { 'Authorization': \`Apikey \${upKey}\` }
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
`;

fs.writeFileSync('worker.js', worker);
console.log('worker.js written:', worker.length, 'bytes');

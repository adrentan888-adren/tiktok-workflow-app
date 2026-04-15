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

    // GET /api/result — get latest-result.json from GitHub
    if (url.pathname === '/api/result' && request.method === 'GET') {
      const res = await fetch(
        \`https://api.github.com/repos/\${OWNER}/\${REPO}/contents/workflow/latest-result.json?t=\${Date.now()}\`,
        { headers: ghHeaders(pat) }
      );
      const data = await res.json();
      return json(data, res.status);
    }

    return new Response('Not found', { status: 404 });
  }
};
`;

fs.writeFileSync('worker.js', worker);
console.log('worker.js written:', worker.length, 'bytes');

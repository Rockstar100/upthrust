import type { APIRoute } from 'astro';

export const prerender = false;

// Decap CMS opens /api/auth in a popup and waits for this page to post the token back to /admin.
const inline = (value: string) => JSON.stringify(value).replace(/</g, '\\u003c');

function reply(origin: string, status: 'success' | 'error', content: Record<string, string>) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><html><body><script>
  (function () {
    var origin = ${inline(origin)};
    var message = ${inline(message)};
    function receive(event) {
      if (event.origin !== origin) return;
      window.opener.postMessage(message, origin);
      window.removeEventListener('message', receive);
    }
    window.addEventListener('message', receive);
    window.opener && window.opener.postMessage('authorizing:github', origin);
  })();
  </script></body></html>`;
  return new Response(html, {
    status: status === 'success' ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = cookies.get('cms_oauth_state')?.value;
  cookies.delete('cms_oauth_state', { path: '/api' });

  if (!code || !state || state !== expected) {
    return reply(origin, 'error', { message: 'Sign-in expired or was tampered with. Try again.' });
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL('/api/callback', origin).href,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as { access_token?: string; error_description?: string };

  if (!payload.access_token) {
    return reply(origin, 'error', { message: payload.error_description || 'GitHub sign-in failed.' });
  }
  return reply(origin, 'success', { token: payload.access_token, provider: 'github' });
};

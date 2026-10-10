import type { APIRoute } from 'astro';

export const prerender = false;

// Starts the GitHub sign-in for the CMS at /admin. The callback is ./callback.ts.
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('CMS sign-in is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.', { status: 500 });
  }

  const state = crypto.randomUUID();
  cookies.set('cms_oauth_state', state, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/api',
    maxAge: 600,
  });

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', new URL('/api/callback', url.origin).href);
  authorize.searchParams.set('scope', url.searchParams.get('scope') || 'repo');
  authorize.searchParams.set('state', state);
  return redirect(authorize.href);
};

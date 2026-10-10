import type { APIRoute } from 'astro';
import { saveSubmission } from '../../lib/submissions';

export const prerender = false;

const MAX = { name: 120, email: 200, company: 160, message: 2000 };

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? '').trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function store(entry: Parameters<typeof saveSubmission>[0]) {
  try {
    const id = await saveSubmission(entry);
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error('Failed to store submission', error);
    return Response.json({ ok: false, error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}

export const POST: APIRoute = async ({ request }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  if (clean(data.get('company_website'), 200)) {
    return Response.json({ ok: true });
  }

  const email = clean(data.get('email'), MAX.email);
  const meta = { id: crypto.randomUUID(), submittedAt: new Date().toISOString() };

  if (data.get('form') === 'newsletter') {
    const fields: Record<string, string> = {};
    if (!isEmail(email)) fields.email = 'Enter a valid email address.';
    if (data.get('consent') !== 'yes') fields.consent = 'Tick the box to sign up.';
    if (Object.keys(fields).length) {
      return Response.json({ ok: false, error: 'Check the highlighted fields.', fields }, { status: 400 });
    }
    return store({ ...meta, type: 'newsletter', email });
  }

  const name = clean(data.get('name'), MAX.name);
  const company = clean(data.get('company'), MAX.company);
  const message = clean(data.get('message'), MAX.message);

  const fields: Record<string, string> = {};
  if (!name) fields.name = 'Name is required.';
  if (!isEmail(email)) fields.email = 'Enter a valid email address.';
  if (!message) fields.message = 'Message is required.';

  if (Object.keys(fields).length) {
    return Response.json({ ok: false, error: 'Check the highlighted fields.', fields }, { status: 400 });
  }

  return store({ ...meta, type: 'contact', name, email, company, message });
};

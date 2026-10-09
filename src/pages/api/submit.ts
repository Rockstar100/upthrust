import type { APIRoute } from 'astro';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const MAX = { name: 120, email: 200, company: 160, message: 2000 };

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? '').trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();

  if (clean(data.get('company_website'), 200)) {
    return Response.json({ ok: true });
  }

  const email = clean(data.get('email'), MAX.email);

  if (data.get('form') === 'newsletter') {
    const fields: Record<string, string> = {};
    if (!isEmail(email)) fields.email = 'Enter a valid email address.';
    if (data.get('consent') !== 'yes') fields.consent = 'Tick the box to sign up.';
    if (Object.keys(fields).length) {
      return Response.json({ ok: false, error: 'Check the highlighted fields.', fields }, { status: 400 });
    }
    const id = await store({ id: crypto.randomUUID(), type: 'newsletter', email, submittedAt: new Date().toISOString() });
    return Response.json({ ok: true, id });
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

  const id = await store({
    id: crypto.randomUUID(),
    type: 'contact',
    name,
    email,
    company,
    message,
    submittedAt: new Date().toISOString(),
  });

  return Response.json({ ok: true, id });
};

async function store(entry: Record<string, string>) {
  const dir = path.join(process.cwd(), 'data');
  const file = path.join(dir, 'submissions.json');
  await mkdir(dir, { recursive: true });

  let existing: unknown[] = [];
  try {
    existing = JSON.parse(await readFile(file, 'utf8'));
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  existing.push(entry);
  await writeFile(file, JSON.stringify(existing, null, 2));
  return entry.id;
}

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';

export type Submission = Record<string, string> & { id: string; type: string; submittedAt: string };

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

// One private blob per entry, so concurrent submissions never overwrite each other.
async function storeInBlob(entry: Submission) {
  const day = entry.submittedAt.slice(0, 10);
  await put(`submissions/${entry.type}/${day}/${entry.id}.json`, JSON.stringify(entry, null, 2), {
    access: 'private',
    contentType: 'application/json',
  });
}

// Local development only. Serverless filesystems are read-only.
async function storeInFile(entry: Submission) {
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
}

export async function saveSubmission(entry: Submission) {
  if (useBlob) await storeInBlob(entry);
  else await storeInFile(entry);
  return entry.id;
}

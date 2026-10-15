import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function shouldPublish(eventName, manualPublish, current, previous) {
  if (eventName === 'workflow_dispatch') return manualPublish === 'true';
  if (eventName !== 'push') return false;
  return !previous || current.version !== previous.version || current.runtimeRevision !== previous.runtimeRevision;
}

async function main() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const current = JSON.parse(await readFile(new URL('./runtime.json', import.meta.url), 'utf8'));
  let previous;
  if (process.env.GITHUB_EVENT_NAME === 'push' && event.before && !/^0+$/.test(event.before)) {
    const url = `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/contents/scripts/cherry-runtime/runtime.json?ref=${encodeURIComponent(event.before)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' }
    });
    if (response.ok) {
      const file = await response.json();
      previous = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    } else {
      throw new Error(`Unable to read previous runtime configuration: HTTP ${response.status}`);
    }
  }
  const publish = shouldPublish(process.env.GITHUB_EVENT_NAME, process.env.MANUAL_PUBLISH, current, previous);
  await appendFile(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
  process.stdout.write(`Runtime publication requested: ${publish}\n`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();

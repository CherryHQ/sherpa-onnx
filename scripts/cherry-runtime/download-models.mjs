import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

async function hashFile(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

const models = JSON.parse(await readFile(new URL('./models.json', import.meta.url), 'utf8'));
for (const model of models) {
  for (const file of model.files) {
    const output = join('.native-models', model.id, file.relPath);
    const existing = await hashFile(output).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (existing === file.sha256) continue;
    const { repo, revision, remoteFile } = file.source;
    const response = await fetch(`https://huggingface.co/${repo}/resolve/${revision}/${remoteFile}`, {
      signal: AbortSignal.timeout(600_000)
    });
    assert(response.ok, `${file.relPath}: HTTP ${response.status}`);
    await mkdir(dirname(output), { recursive: true });
    const temporary = `${output}.part`;
    await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
    assert.equal(await hashFile(temporary), file.sha256, file.relPath);
    await rename(temporary, output);
    process.stdout.write(`${model.id}/${file.relPath}: verified\n`);
  }
}

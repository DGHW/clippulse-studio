import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { complete, completeJSON, getAIConfig } from './agnes';

test('Agnes adapter sends the configured endpoint, vision and tool schema; reloads ENV and hides upstream secrets', async t => {
  const originalDirectory = process.cwd();
  const fixtureDirectory = fs.mkdtempSync(path.resolve('../work/agnes-client-'));
  const envFile = path.join(fixtureDirectory, '.env');
  process.chdir(fixtureDirectory);
  try {
    fs.writeFileSync(envFile, 'AGNES_BASE_URL=https://apihub.agnes-ai.com/v1/\nAGNES_MODEL=agnes-3.0-flash\nAGNES_API_KEY=unit-test-only\n');
    const request = t.mock.method(globalThis, 'fetch', async (url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      assert.equal(url, 'https://apihub.agnes-ai.com/v1/chat/completions');
      assert.equal((options!.headers as Record<string, string>).Authorization, 'Bearer unit-test-only');
      const body = JSON.parse(options!.body as string);
      assert.equal(body.model, 'agnes-3.0-flash');
      assert.equal(body.messages[1].content[1].type, 'image_url');
      return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: '{"observation":"蓝色画面"}' } }] }), { status: 200 });
    });
    const result = await completeJSON('描述画面', 'data:image/jpeg;base64,dGVzdA==');
    assert.deepEqual(result, { observation: '蓝色画面' });
    request.mock.mockImplementation(async (_url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      const body = JSON.parse(options!.body as string);
      assert.equal(body.tools[0].function.name, 'probe_video');
      assert.equal(body.tool_choice, 'auto');
      return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: '1', type: 'function', function: { name: 'probe_video', arguments: '{}' } }] } }] }), { status: 200 });
    });
    assert.equal((await complete([{ role: 'user', content: '检查视频' }], [{ type: 'function', function: { name: 'probe_video' } }])).tool_calls?.[0].function.name, 'probe_video');
    request.mock.mockImplementation(async () => new Response('secret echoed by upstream', { status: 401 }));
    await assert.rejects(complete([{ role: 'user', content: 'test' }]), error => {
      assert.match((error as Error).message, /401/);
      assert.doesNotMatch((error as Error).message, /secret echoed|unit-test-only/);
      return true;
    });
    fs.writeFileSync(envFile, 'AGNES_MODEL=agnes-3.0-flash\nAGNES_API_KEY=\n');
    assert.equal(getAIConfig().apiKey, '');
    await assert.rejects(complete([{ role: 'user', content: 'test' }]), /AGNES_API_KEY/);
  } finally {
    process.chdir(originalDirectory);
    t.mock.restoreAll();
    fs.unlinkSync(envFile);
    fs.rmdirSync(fixtureDirectory);
  }
});

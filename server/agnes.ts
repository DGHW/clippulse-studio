import fs from 'node:fs';
import dotenv from 'dotenv';

export function getAIConfig() {
  // Read the saved file for every task, so filling the key does not require a restart.
  const local = fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {};
  const value = (key: string, fallback = '') => local[key] ?? process.env[key] ?? fallback;
  return {
    baseUrl: value('AGNES_BASE_URL', 'https://apihub.agnes-ai.com/v1').replace(/\/+$/, ''),
    model: value('AGNES_MODEL', 'agnes-3.0-flash'),
    apiKey: value('AGNES_API_KEY'),
  };
}

export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export async function complete(messages: ChatMessage[], tools?: unknown[]) {
  const config = getAIConfig();
  if (!config.apiKey || /^(MY_|YOUR_|填入|replace)/i.test(config.apiKey)) {
    throw new Error('请先在项目 .env 文件中填写 AGNES_API_KEY，保存后即可重试。');
  }
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, messages, max_tokens: 8192, temperature: 0.3,
      ...(tools ? { tools, tool_choice: 'auto' } : {}) }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    // Do not relay upstream bodies: gateways may echo request headers or secrets.
    throw new Error(`Agnes 请求失败（HTTP ${response.status}），请检查 API Key、模型权限与网络。`);
  }
  const data = await response.json() as { choices?: Array<{ message: ChatMessage }> };
  const message = data.choices?.[0]?.message;
  if (!message || (!message.content && !message.tool_calls?.length)) throw new Error('Agnes 返回了空响应，请重试。');
  return message;
}

export async function completeJSON(prompt: string, imageUrl?: string): Promise<unknown> {
  const message = await complete([
    { role: 'system', content: '严格返回有效 JSON，不要 Markdown，不要解释。只描述有证据的内容。' },
    { role: 'user', content: imageUrl ? [
      { type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } },
    ] : prompt },
  ]);
  if (typeof message.content !== 'string') throw new Error('Agnes 未返回 JSON 文本。');
  try { return JSON.parse(message.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
  catch { throw new Error('Agnes 返回的 JSON 格式无效，请重试。'); }
}

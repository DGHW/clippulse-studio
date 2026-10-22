import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import dotenv from 'dotenv';
import type { Express } from 'express';

const apiPaths = new Set(['/api/codex/status','/api/agent/status','/api/export/readme','/api/media/upload',
  '/api/media/library',
  '/api/agent/run','/api/export/render-mp4','/api/crawler/fetch-and-cut','/api/agent/analyze-frame',
  '/api/agent/generate-script','/api/agent/tts','/api/export/project-bundle']);
export function bridgeAllows(method: string, pathname: string) {
  if (pathname.includes('..') || pathname.includes('\\') || pathname.includes('%')) return false;
  return ((method === 'GET' || method === 'HEAD') && /^\/assets\/(uploads|agent|crawled|aistudio)\//.test(pathname)) ||
    (apiPaths.has(pathname) && (method === 'GET' || method === 'POST'));
}
export function bridgeAuthorized(header: string | undefined, token: string) {
  if (!token || !header?.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function startLocalBridge(app: Express) {
  const config = fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {};
  const token = config.LOCAL_BRIDGE_TOKEN || process.env.LOCAL_BRIDGE_TOKEN;
  if (!token) return;
  http.createServer((req, res) => {
    if (!bridgeAuthorized(req.headers.authorization, token)) {
      res.writeHead(401, {'Content-Type':'application/json','Cache-Control':'no-store'});
      res.end(JSON.stringify({error:'本地桥接认证失败'})); return;
    }
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    if (!bridgeAllows(req.method || 'GET', pathname)) {
      res.writeHead(404); res.end(); return;
    }
    req.headers.host = '127.0.0.1:3000';
    delete req.headers.authorization;
    app(req, res);
  }).listen(3001,'127.0.0.1',() => console.log('Authenticated local bridge listening on 127.0.0.1:3001'));
}

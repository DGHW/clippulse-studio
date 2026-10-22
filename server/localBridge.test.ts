import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeAllows, bridgeAuthorized } from './localBridge';
test('cloud bridge fails closed and limits access to video capabilities', () => {
  assert.equal(bridgeAuthorized(undefined, 'unit-token'), false);
  assert.equal(bridgeAuthorized('Bearer unit-token', ''), false);
  assert.equal(bridgeAuthorized('Bearer wrong', 'unit-token'), false);
  assert.equal(bridgeAuthorized('Bearer unit-token', 'unit-token'), true);
  assert.equal(bridgeAllows('POST','/api/agent/run'), true);
  assert.equal(bridgeAllows('GET','/assets/agent/video.mp4'), true);
  for (const p of ['/api/export/github-push','/.env','/@fs/C:/secret','/assets/agent/../../.env','/assets/agent/%2e%2e/secret']) assert.equal(bridgeAllows('GET',p), false);
  assert.equal(bridgeAllows('POST','/assets/agent/video.mp4'), false);
});

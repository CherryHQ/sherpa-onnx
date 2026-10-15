import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldPublish } from './release-plan.mjs';

const previous = { version: '1.13.6', runtimeRevision: 1, electronVersion: '44.4.4' };

test('publishes only version or runtime revision changes on push', () => {
  assert.equal(shouldPublish('push', '', { ...previous }, previous), false);
  assert.equal(shouldPublish('push', '', { ...previous, electronVersion: '44.5.0' }, previous), false);
  assert.equal(shouldPublish('push', '', { ...previous, version: '1.13.7' }, previous), true);
  assert.equal(shouldPublish('push', '', { ...previous, runtimeRevision: 2 }, previous), true);
  assert.equal(shouldPublish('push', '', previous, undefined), true);
});

test('pull requests cannot publish and manual runs require explicit selection', () => {
  assert.equal(shouldPublish('pull_request', 'true', previous, undefined), false);
  assert.equal(shouldPublish('workflow_dispatch', 'false', previous, undefined), false);
  assert.equal(shouldPublish('workflow_dispatch', '', previous, undefined), false);
  assert.equal(shouldPublish('workflow_dispatch', 'true', previous, previous), true);
});

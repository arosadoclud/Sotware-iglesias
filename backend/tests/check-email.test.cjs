const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkEmail } = require('../scripts/check-email.cjs');

test('diagnostic requires a key without calling Brevo', async () => {
  await assert.rejects(checkEmail({}, () => { throw new Error('must not run'); }), /Falta BREVO_API_KEY/);
});

test('diagnostic identifies the Brevo account using a read-only endpoint', async () => {
  await checkEmail({ BREVO_API_KEY: ' fake-test-key ' }, async (url, options) => {
    assert.equal(url, 'https://api.brevo.com/v3/account');
    assert.equal(options.headers['api-key'], 'fake-test-key');
    assert.equal(options.method, undefined);
    return { ok: true, json: async () => ({ email: 'qa@example.com' }) };
  });
});

test('diagnostic preserves a disabled key error', async () => {
  await assert.rejects(checkEmail({ BREVO_API_KEY: 'fake-test-key' }, async () => ({
    ok: false, status: 401, json: async () => ({ code: 'unauthorized', message: 'API Key is not enabled' }),
  })), /Brevo HTTP 401: unauthorized — API Key is not enabled/);
});

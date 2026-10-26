// Run with Node 24: node --test backend/tests/verificationEmail.config.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVerificationEmailConfig } from '../src/modules/auth/verificationEmail.config.ts';

test('missing sender fails instead of reporting a successful send', () => {
  assert.throws(() => getVerificationEmailConfig({}), /EMAIL_FROM/);
});

test('Brevo without an API key fails instead of falling back to SMTP', () => {
  for (const settings of [
    { EMAIL_PROVIDER: 'brevo' },
    { SMTP_HOST: 'smtp-relay.brevo.com' },
    { SMTP_HOST: 'smtp-relay.sendinblue.com' },
  ]) {
    assert.throws(() => getVerificationEmailConfig({ EMAIL_FROM: 'sender@example.com', ...settings }), /BREVO_API_KEY/);
  }
});

test('API key selects Brevo when provider is omitted and trims settings', () => {
  const config = getVerificationEmailConfig({ EMAIL_FROM: ' sender@example.com ', BREVO_API_KEY: ' test-key ' });
  assert.equal(config.isBrevo, true);
  assert.equal(config.apiKey, 'test-key');
  assert.equal(config.emailFrom, 'sender@example.com');
});

test('explicit providers take precedence over an unrelated Brevo key', () => {
  const config = getVerificationEmailConfig({ EMAIL_FROM: 'sender@example.com', EMAIL_PROVIDER: ' SendGrid ', BREVO_API_KEY: 'test-key' });
  assert.equal(config.provider, 'sendgrid');
  assert.equal(config.isBrevo, false);
});

test('generic SMTP remains available', () => {
  const config = getVerificationEmailConfig({ EMAIL_FROM: 'sender@example.com', SMTP_HOST: 'smtp.example.com' });
  assert.equal(config.provider, 'smtp');
  assert.equal(config.isBrevo, false);
});

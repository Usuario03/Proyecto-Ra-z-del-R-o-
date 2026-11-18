import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAdminFisherFilters,
  parseAdminFisherPatch,
  parseAdminPage,
  parseTemporaryPassword,
} from './admin';
import { AppHttpError } from '../security/errors';

test('admin fisher filters default to 25 rows and cap the page size at 100', () => {
  assert.equal(parseAdminFisherFilters(new URLSearchParams()).pageSize, 25);
  assert.equal(parseAdminFisherFilters(new URLSearchParams('pageSize=100')).pageSize, 100);
  assert.throws(() => parseAdminFisherFilters(new URLSearchParams('pageSize=101')), AppHttpError);
});

test('admin fisher filters validate status, dates, pagination and allowed fields', () => {
  assert.throws(() => parseAdminFisherFilters(new URLSearchParams('status=unknown')), AppHttpError);
  assert.throws(() => parseAdminFisherFilters(new URLSearchParams('createdFrom=2026-02-30')), AppHttpError);
  assert.throws(() => parseAdminFisherFilters(new URLSearchParams('page=0')), AppHttpError);
  assert.throws(() => parseAdminFisherFilters(new URLSearchParams('sort=password_hash')), AppHttpError);
});

test('admin fisher filters parse independent name, email and document searches', () => {
  assert.deepEqual(
    parseAdminFisherFilters(new URLSearchParams('name=Ana&email=example.com&document=12345')),
    {
      query: '',
      name: 'Ana',
      email: 'example.com',
      document: '12345',
      status: null,
      port: null,
      createdFrom: null,
      createdTo: null,
      page: 1,
      pageSize: 25,
    },
  );
  assert.throws(() => parseAdminFisherFilters(new URLSearchParams(`email=${'x'.repeat(151)}`)), AppHttpError);
});

test('admin fisher patch accepts only allowlisted validated profile fields', () => {
  assert.deepEqual(parseAdminFisherPatch({ name: ' Ana Pérez ', email: ' ANA@EXAMPLE.COM ' }), {
    name: 'Ana Pérez',
    email: 'ana@example.com',
  });
  assert.throws(() => parseAdminFisherPatch({ role: 'admin' }), AppHttpError);
  assert.throws(() => parseAdminFisherPatch({ document: '123' }), AppHttpError);
});

test('temporary password parser rejects extra fields and enforces length', () => {
  assert.equal(parseTemporaryPassword({ password: 'temporary-123' }), 'temporary-123');
  assert.throws(() => parseTemporaryPassword({ password: '12345678', email: 'x@example.com' }), AppHttpError);
  assert.throws(() => parseTemporaryPassword({ password: 'short' }), AppHttpError);
});

test('audit API page parser rejects unknown query parameters', () => {
  assert.deepEqual(parseAdminPage(new URLSearchParams()), { page: 1, pageSize: 25 });
  assert.throws(() => parseAdminPage(new URLSearchParams('pageSize=500')), AppHttpError);
  assert.throws(() => parseAdminPage(new URLSearchParams('q=leak')), AppHttpError);
});

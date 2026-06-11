import assert from 'node:assert/strict';
import test from 'node:test';
import authDtoValidator from '../src/dtos/authDtos';
import pdfDtoValidator from '../src/dtos/pdfDtos';

test('auth DTO validator normalizes signup input', () => {
  const dto = authDtoValidator.validateSignup({
    name: '  Ada  ',
    email: '  ADA@example.COM ',
    password: 'password123'
  });

  assert.deepEqual(dto, {
    name: 'Ada',
    email: 'ada@example.com',
    password: 'password123'
  });
});

test('auth DTO validator rejects invalid OTP shape', () => {
  assert.throws(
    () => authDtoValidator.validateVerifyOtp({ email: 'user@example.com', otp: '12' }),
    /Invalid OTP/
  );
});

test('PDF DTO validator maps one-based pages to zero-based indices', () => {
  const dto = pdfDtoValidator.validateExtractPages({ pages: [3, '1', 2] });

  assert.deepEqual(dto, { pageIndices: [2, 0, 1] });
});

test('PDF DTO validator rejects non-array pages', () => {
  assert.throws(
    () => pdfDtoValidator.validateExtractPages({ pages: '1,2' }),
    /Pages must be provided as an array/
  );
});

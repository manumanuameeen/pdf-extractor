import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTH_LIMITS, OTP_TIMING } from '../src/constants/config';
import { AuthService } from '../src/services/authService';
import type { IUserMapper } from '../src/contracts/mappers';
import type { IUserRepository } from '../src/contracts/repositories';
import type { IEmailService } from '../src/contracts/services';
import type { PublicUser, UserRecord } from '../src/types/models';

class MemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserRecord>();

  async findAll(): Promise<UserRecord[]> {
    return Array.from(this.users.values());
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.findAll().then((users) => users.find((user) => user.email === email) ?? null);
  }

  async findByRefreshToken(): Promise<UserRecord | null> {
    return null;
  }

  async save(record: UserRecord): Promise<UserRecord> {
    this.users.set(record.id, record);
    return record;
  }
}

const emailService: IEmailService = {
  async sendOtp() {
    return { delivered: true, devMode: false };
  },
  async sendPasswordResetOtp() {
    return { delivered: true, devMode: false };
  }
};

const mapper: IUserMapper = {
  toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      profilePhotoUrl: user.profilePhotoUrl ?? null
    };
  }
};

test('signup returns OTP expiry and half-life resend timing', async () => {
  const service = new AuthService(new MemoryUserRepository(), emailService, mapper);

  const result = await service.signup({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'password123'
  });

  assert.equal(result.otpExpiresInSeconds, OTP_TIMING.EXPIRY_SECONDS);
  assert.equal(result.resendAvailableInSeconds, OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS);
});

test('resend OTP is blocked until half of OTP expiry time has passed', async () => {
  const repository = new MemoryUserRepository();
  const service = new AuthService(repository, emailService, mapper);

  await service.signup({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'password123'
  });

  await assert.rejects(
    () => service.resendOtp({ email: 'grace@example.com' }),
    /Please wait \d+ seconds before requesting another OTP/
  );

  const user = await repository.findByEmail('grace@example.com');
  assert.ok(user);
  user.otpLastSentAt = new Date(Date.now() - OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS * 1000).toISOString();
  await repository.save(user);

  const result = await service.resendOtp({ email: 'grace@example.com' });

  assert.equal(result.resendAvailableInSeconds, OTP_TIMING.RESEND_AVAILABLE_AFTER_SECONDS);
  assert.equal(result.otpExpiresInSeconds, AUTH_LIMITS.OTP_EXPIRY_MINUTES * 60);
});

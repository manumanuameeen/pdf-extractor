import bcrypt from 'bcryptjs';
import path from 'node:path';
import { JsonFileRepository } from './jsonFileRepository.js';
import type { IUserRepository } from '../contracts/repositories.js';
import type { UserRecord } from '../types/models.js';

export class UserRepository extends JsonFileRepository<UserRecord> implements IUserRepository {
  constructor() {
    super(path.join(process.cwd(), 'data', 'users.json'));
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const users = await this.findAll();
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findByRefreshToken(refreshToken: string): Promise<UserRecord | null> {
    const users = await this.findAll();

    for (const user of users) {
      if (!user.refreshTokenHash) {
        continue;
      }

      if (await bcrypt.compare(refreshToken, user.refreshTokenHash)) {
        return user;
      }
    }

    return null;
  }
}

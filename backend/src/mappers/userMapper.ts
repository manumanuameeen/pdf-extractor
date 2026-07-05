import type { IUserMapper } from '../contracts/index.js';
import type { PublicUser, UserRecord } from '../types/models.js';

export class UserMapper implements IUserMapper {
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
}

export default new UserMapper();


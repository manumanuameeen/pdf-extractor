"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
class UserMapper {
    toPublicUser(user) {
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
exports.UserMapper = UserMapper;
exports.default = new UserMapper();

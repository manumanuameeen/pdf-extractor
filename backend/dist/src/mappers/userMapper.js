export class UserMapper {
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
export default new UserMapper();

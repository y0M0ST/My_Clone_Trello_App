import { AppDataSource } from '../../config/data-source';
import { User } from '../../common/entities/user.entity';
import { UpdateProfileDto } from './user.dto';
import { redisClient } from '@/config/redisClient';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find({
      select: [
        'id',
        'email',
        'name',
        'bio',
        'avatarUrl',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
    return users;
  }

  async getDetailUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'name',
        'bio',
        'avatarUrl',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
    return user;
  }

  async updateProfile(
    
    userId: string,
    dto: UpdateProfileDto
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.bio !== undefined) user.bio = dto.bio;

    await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = user;

    await redisClient.set(
      `user:${userId}`,
      JSON.stringify(userWithoutPassword),
      { EX: 900 }
    );

    return userWithoutPassword as User;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    user.avatarUrl = avatarUrl;
    await userRepository.save(user);
    const { password, ...userWithoutPassword } = user;

    await redisClient.set(
      `user:${userId}`,
      JSON.stringify(userWithoutPassword),
      { EX: 900 }
    );

    return userWithoutPassword as User;
  }

  async findUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found');
    return user;
  }
}

import { Types } from 'mongoose';
import { UserModel } from '../models/user.model';
import { UserEntity, PublicUserEntity, UserCreateInput } from '../interfaces/user.interface';

export class UserRepository {
  /**
   * Overloaded on `withPassword` so the return type itself encodes whether
   * `passwordHash` is present — the caller can't accidentally read a
   * password hash off a lookup that never selected it.
   */
  async findByUsername(username: string, withPassword: true): Promise<UserEntity | null>;
  async findByUsername(username: string, withPassword?: false): Promise<PublicUserEntity | null>;
  async findByUsername(
    username: string,
    withPassword = false
  ): Promise<UserEntity | PublicUserEntity | null> {
    const query = UserModel.findOne({ username: username.toLowerCase() });
    if (withPassword) {
      return query.select('+passwordHash').lean<UserEntity | null>();
    }
    return query.lean<PublicUserEntity | null>();
  }

  async findById(id: string): Promise<PublicUserEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return UserModel.findById(id).lean<PublicUserEntity | null>();
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ username: username.toLowerCase() });
    return count > 0;
  }

  async countAll(): Promise<number> {
    return UserModel.countDocuments({});
  }

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } });
  }

  async create(data: UserCreateInput): Promise<UserEntity> {
    const created = await UserModel.create(data);
    return created.toObject<UserEntity>();
  }
}

export const userRepository = new UserRepository();

import { Types } from 'mongoose';
import { toAuthUserDTO } from './userMapper';
import { UserRole } from '../constants/enums';

describe('toAuthUserDTO', () => {
  it('maps a persisted user entity to the public DTO shape', () => {
    const id = new Types.ObjectId();

    const dto = toAuthUserDTO({
      _id: id,
      username: 'admin',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(dto).toEqual({
      id: id.toString(),
      username: 'admin',
      role: UserRole.ADMIN,
    });
  });

  it('never leaks a passwordHash field even if present on the input object', () => {
    const id = new Types.ObjectId();

    const dto = toAuthUserDTO({
      _id: id,
      username: 'admin',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(dto).not.toHaveProperty('passwordHash');
  });
});

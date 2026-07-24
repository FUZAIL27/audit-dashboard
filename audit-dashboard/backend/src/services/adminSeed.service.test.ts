import { seedAdminUser } from './adminSeed.service';
import { userRepository } from '../repositories/user.repository';
import { UserRole } from '../constants/enums';
import { Types } from 'mongoose';

jest.mock('../repositories/user.repository');

const mockedExists = jest.mocked(userRepository.existsByUsername);
const mockedCreate = jest.mocked(userRepository.create);

describe('seedAdminUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the admin account when none exists', async () => {
    mockedExists.mockResolvedValue(false);
    mockedCreate.mockResolvedValue({
      _id: new Types.ObjectId(),
      username: 'admin',
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await seedAdminUser();

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'admin', role: UserRole.ADMIN })
    );
  });

  it('is idempotent — does not create a second admin if one already exists', async () => {
    mockedExists.mockResolvedValue(true);

    await seedAdminUser();

    expect(mockedCreate).not.toHaveBeenCalled();
  });
});

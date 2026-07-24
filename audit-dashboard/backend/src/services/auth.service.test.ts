import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { authService } from './auth.service';
import { userRepository } from '../repositories/user.repository';
import { UserRole } from '../constants/enums';
import { UnauthorizedError } from '../utils/AppError';

jest.mock('../repositories/user.repository');

const mockedFindByUsername = jest.mocked(userRepository.findByUsername);
const mockedUpdateLastLogin = jest.mocked(userRepository.updateLastLogin);
const mockedFindById = jest.mocked(userRepository.findById);

describe('AuthService.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a username that does not exist', async () => {
    mockedFindByUsername.mockResolvedValue(null);

    await expect(
      authService.login({ username: 'ghost', password: 'whatever' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects an incorrect password without revealing which field was wrong', async () => {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    mockedFindByUsername.mockResolvedValue({
      _id: new Types.ObjectId(),
      username: 'admin',
      passwordHash,
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.login({ username: 'admin', password: 'WrongPassword' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('returns tokens and a DTO for correct credentials, and records last login', async () => {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    mockedFindByUsername.mockResolvedValue({
      _id: new Types.ObjectId(),
      username: 'admin',
      passwordHash,
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedUpdateLastLogin.mockResolvedValue(undefined);

    const result = await authService.login({ username: 'admin', password: 'Admin@123' });

    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.user).toEqual(
      expect.objectContaining({ username: 'admin', role: UserRole.ADMIN })
    );
    expect(mockedUpdateLastLogin).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService.me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the profile DTO for a valid user id', async () => {
    const id = new Types.ObjectId();
    mockedFindById.mockResolvedValue({
      _id: id,
      username: 'admin',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.me(id.toString());
    expect(result).toEqual({ id: id.toString(), username: 'admin', role: UserRole.ADMIN });
  });

  it('throws when the user no longer exists', async () => {
    mockedFindById.mockResolvedValue(null);
    await expect(authService.me(new Types.ObjectId().toString())).rejects.toBeInstanceOf(
      UnauthorizedError
    );
  });
});

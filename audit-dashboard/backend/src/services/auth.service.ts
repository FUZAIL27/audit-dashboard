import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/AppError';
import { JwtPayload, AuthTokens, AuthUserDTO, LoginInput } from '../interfaces/user.interface';
import { toAuthUserDTO } from '../utils/userMapper';

export class AuthService {
  async login(input: LoginInput): Promise<{ tokens: AuthTokens; user: AuthUserDTO }> {
    const user = await userRepository.findByUsername(input.username, true);
    if (!user) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid username or password');
    }

    await userRepository.updateLastLogin(user._id.toString());

    const tokens = this.generateTokens({
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    return { tokens, user: toAuthUserDTO(user) };
  }

  async me(userId: string): Promise<AuthUserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError('User no longer exists');
    return toAuthUserDTO(user);
  }

  generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as SignOptions);

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const decoded = this.verifyRefreshToken(refreshToken);
    const user = await userRepository.findById(decoded.sub);
    if (!user) throw new UnauthorizedError('User no longer exists');

    return this.generateTokens({
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    });
  }
}

export const authService = new AuthService();

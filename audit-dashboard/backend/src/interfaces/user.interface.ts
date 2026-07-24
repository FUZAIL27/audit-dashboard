import { Types } from 'mongoose';
import { UserRole } from '../constants/enums';

/**
 * Database Entity — canonical persisted shape of a user record, including
 * the password hash. Only the repository layer (and the auth service,
 * which needs the hash to verify a login) should ever see this in full.
 *
 * This system provisions exactly one account — a seeded administrator —
 * via `username`, not email. There is no registration flow.
 */
export interface UserEntity {
  _id: Types.ObjectId;
  username: string;
  passwordHash: string;
  role: UserRole;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The user shape safe to pass anywhere outside a password-verification
 * check — `passwordHash` is structurally absent, not just "not selected".
 */
export type PublicUserEntity = Omit<UserEntity, 'passwordHash'>;

/** DTO — fields required to persist a new user record (used only by the admin seed). */
export type UserCreateInput = Omit<UserEntity, '_id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;

/** DTO — public-safe user shape returned by every auth endpoint. */
export interface AuthUserDTO {
  id: string;
  username: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

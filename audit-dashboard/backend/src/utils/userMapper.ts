import { PublicUserEntity, AuthUserDTO } from '../interfaces/user.interface';

/**
 * Maps a persisted user (Entity) to the public DTO shape returned by every
 * auth API response. Centralized here so `_id -> id` string conversion
 * happens in exactly one place.
 */
export function toAuthUserDTO(user: PublicUserEntity): AuthUserDTO {
  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
  };
}

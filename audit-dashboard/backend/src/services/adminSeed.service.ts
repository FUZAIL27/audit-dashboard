import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { env, isProduction } from '../config/env';
import { UserRole } from '../constants/enums';
import { logger } from '../utils/logger';

const PASSWORD_HASH_COST = 12;

/**
 * Ensures exactly one administrator account exists. Safe to call on every
 * server boot: it checks for an existing account with the configured
 * username before creating anything, so restarts (or multiple instances
 * starting concurrently against the same database) never produce
 * duplicate admins — `username` is also uniquely indexed at the schema
 * level as a second line of defense against a race between two instances.
 */
export async function seedAdminUser(): Promise<void> {
  const username = env.ADMIN_USERNAME.toLowerCase();

  const exists = await userRepository.existsByUsername(username);
  if (exists) {
    logger.info(`Admin account "${username}" already exists — skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, PASSWORD_HASH_COST);

  await userRepository.create({
    username,
    passwordHash,
    role: UserRole.ADMIN,
  });

  logger.info(`✅ Admin account "${username}" created.`);
  if (!isProduction) {
    logger.info(`   Login with: ${username} / ${env.ADMIN_PASSWORD}`);
  }
}

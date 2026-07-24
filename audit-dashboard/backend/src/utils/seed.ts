/* eslint-disable no-console */
import { connectDatabase, disconnectDatabase } from '../config/db';
import { seedAdminUser } from '../services/adminSeed.service';

/**
 * Manual entry point (`npm run seed`) for the same idempotent admin-seed
 * logic that also runs automatically on every server boot. Useful for
 * seeding a database before the server's first deploy, or re-running by
 * hand without a full restart.
 */
async function main(): Promise<void> {
  await connectDatabase();
  await seedAdminUser();
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

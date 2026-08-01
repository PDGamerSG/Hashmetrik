import bcrypt from "bcryptjs";

/**
 * Password hashing.
 *
 * `bcryptjs` rather than native `bcrypt`: the native module ships a binary that
 * will not load in the Edge runtime or on Vercel's build image without extra
 * work, and this is used from server actions that may be compiled either way.
 *
 * Ten rounds is the usual balance — enough to make a stolen hash expensive,
 * cheap enough that a login on a cold serverless instance stays under a second.
 */
const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Burns roughly the same time as a real `verifyPassword` call.
 *
 * A login for an address with no account would otherwise return in a fraction
 * of the time a wrong password takes, and that difference is enough to
 * enumerate which addresses have accounts. The hash below is a real bcrypt
 * digest of a value nobody knows, so comparing against it does the same work.
 */
const DECOY = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function wasteTime(plain: string): Promise<void> {
  await bcrypt.compare(plain, DECOY);
}

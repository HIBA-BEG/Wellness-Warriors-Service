import { tmpdir } from 'os';
import { join } from 'path';

// On Vercel the deployment directory is read-only; only the OS temp dir is
// writable (and it is ephemeral). Everywhere else keep the original location.
export function uploadRoot(folder: 'uploads' | 'uploads-profile'): string {
  return process.env.VERCEL
    ? join(tmpdir(), folder)
    : join(process.cwd(), folder);
}

import * as FileSystem from 'expo-file-system/legacy';
import keyManager from '@/services/keyManager';
import crypto, { isEncryptedPayload } from '@/utils/crypto';

/**
 * fileCrypto
 *
 * Lightweight file-level encryption helpers for image assets. The module:
 * - encrypts image files (reads as base64, AES‑GCM encrypt, writes JSON payload)
 * - decrypts encrypted payloads back to a temporary cached image for display
 *
 * Notes:
 * - Works in Expo Go (pure JS + expo-file-system + expo-secure-store)
 * - Uses the app key stored in SecureStore (see `keyManager`)
 */
// Use any-cast to avoid TypeScript surface-level mismatch with expo-file-system
const FS: any = FileSystem as any;
const ENCRYPTED_DIR = `${FS.documentDirectory}encrypted_images/`;

// Lightweight UUIDv4 generator (avoid importing 'uuid' to keep Jest/node happy)
function generateUuidV4() {
  // from https://stackoverflow.com/a/2117523/404792
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * ensureDir
 *
 * Ensure the encrypted images directory exists under the app document directory.
 */
async function ensureDir() {
  try { await FS.makeDirectoryAsync(ENCRYPTED_DIR, { intermediates: true }); } catch (e) {}
}

/**
 * encryptImageFile
 *
 * Reads an image file (local URI), converts it to base64, encrypts it using the
 * app AES key and writes the encrypted JSON payload to an .enc file under
 * the app document directory. Returns the destination encrypted URI.
 *
 * If encryption fails for any reason, falls back to returning the original URI
 * so existing flows continue to work.
 */
export async function encryptImageFile(origUri: string): Promise<string> {
  if (!origUri) return origUri;
  await ensureDir();
  try {
    // read as base64
    const b64 = await FS.readAsStringAsync(origUri, { encoding: 'base64' });
    const key = await keyManager.getOrCreateKey();
    const payload = await crypto.encryptString(b64, key);
    const dest = `${ENCRYPTED_DIR}${generateUuidV4()}.enc`;
    await FS.writeAsStringAsync(dest, payload, { encoding: 'utf8' });
    return dest;
  } catch (e) {
    // on failure, fall back to original URI
    return origUri;
  }
}

/**
 * decryptImageToTemp
 *
 * Reads an encrypted .enc file, decrypts the base64 image payload and writes a
 * temporary decoded image into the cache directory for use with <Image/>.
 * If the provided URI is not an encrypted payload the function returns it unchanged.
 */
export async function decryptImageToTemp(encUri: string): Promise<string> {
  if (!encUri) return encUri;
  try {
    const payload = await FS.readAsStringAsync(encUri, { encoding: 'utf8' });
    if (!isEncryptedPayload(payload)) return encUri; // not encrypted
    const key = await keyManager.getOrCreateKey();
    const b64 = await crypto.decryptString(payload, key);
    const tmp = `${FS.cacheDirectory}dec-${generateUuidV4()}.jpg`;
    await FS.writeAsStringAsync(tmp, b64, { encoding: 'base64' });
    return tmp;
  } catch (e) {
    return encUri;
  }
}

export default { encryptImageFile, decryptImageToTemp };

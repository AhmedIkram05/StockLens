import forge from 'node-forge';

const b64enc = (s: string) => forge.util.encode64(s);
const b64dec = (s: string) => forge.util.decode64(s);

/**
 * generateKeyBase64
 *
 * Generates a cryptographically secure 256-bit key and returns it as a base64 string.
 * Used for storing the encryption key in SecureStore.
 *
 * @returns base64-encoded 32-byte key
 */
export function generateKeyBase64(): string {
  return b64enc(forge.random.getBytesSync(32));
}

/**
 * isEncryptedPayload
 *
 * Quick heuristic to determine if a stored string looks like our AES-GCM JSON payload.
 * The payload format is JSON: { iv: <b64>, ct: <b64>, tag: <b64> }
 */
export function isEncryptedPayload(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  try {
    const p = JSON.parse(str);
    // Ensure we return a boolean (not the last truthy value which could be a string)
    return !!(p && typeof p.iv === 'string' && typeof p.ct === 'string' && typeof p.tag === 'string');
  } catch (e) {
    return false;
  }
}

/**
 * encryptString
 *
 * Encrypts a UTF-8 string using AES-256-GCM and returns a JSON string containing
 * base64-encoded iv, ciphertext and tag. This is small, portable and human-readable
 * for debugging (but still ciphertext).
 */
export async function encryptString(plain: string, keyBase64: string): Promise<string> {
  const key = b64dec(keyBase64);
  const iv = forge.random.getBytesSync(12);
  const cipher = forge.cipher.createCipher('AES-GCM', key);
  cipher.start({ iv, tagLength: 128 });
  cipher.update(forge.util.createBuffer(plain, 'utf8'));
  cipher.finish();
  const ct = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();
  return JSON.stringify({ iv: b64enc(iv), ct: b64enc(ct), tag: b64enc(tag) });
}

/**
 * decryptString
 *
 * Decrypts the JSON payload produced by encryptString back to a UTF-8 string.
 */
export async function decryptString(payloadJson: string, keyBase64: string): Promise<string> {
  const payload = JSON.parse(payloadJson);
  const key = b64dec(keyBase64);
  const iv = b64dec(payload.iv);
  const ct = b64dec(payload.ct);
  const tag = b64dec(payload.tag);
  const decipher = forge.cipher.createDecipher('AES-GCM', key);
  decipher.start({ iv, tagLength: 128, tag });
  decipher.update(forge.util.createBuffer(ct));
  const ok = decipher.finish();
  if (!ok) throw new Error('Decryption failed');
  return decipher.output.toString('utf8');
}

export default { generateKeyBase64, encryptString, decryptString, isEncryptedPayload };

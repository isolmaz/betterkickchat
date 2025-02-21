import crypto from 'crypto';
import { readFileSync } from 'fs';

// Read manifest file
const manifest = JSON.parse(readFileSync('./manifest.json', 'utf8'));

// Convert Base64 to bytes
const keyBytes = Buffer.from(manifest.key, 'base64');

// Calculate SHA256 hash
const hash = crypto.createHash('sha256').update(keyBytes).digest('hex');

// Convert to Chrome extension ID format (first 32 chars)
const extensionId = hash.slice(0, 32).split('').map(c => {
  const n = parseInt(c, 16);
  return String.fromCharCode(n < 10 ? n + 97 : n + 87);
}).join('');

console.log('Extension ID:', extensionId); 
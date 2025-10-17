// Print and parse DATABASE_URL environment variable
// Usage (PowerShell):
//   node print-db-url.js

const raw = process.env.DATABASE_URL;
console.log('DATABASE_URL (raw) =', raw);
if (!raw) {
  console.error('DATABASE_URL is not set in the environment.');
  process.exit(1);
}

try {
  // Try to parse as a URL
  const u = new URL(raw);
  // Mask password for safe logging
  const maskedUser = u.username ? `${u.username}` : '';
  const maskedPass = u.password ? '*****' : '';
  const masked = `${u.protocol}//${maskedUser}:${maskedPass}@${u.hostname}${u.port ? `:${u.port}` : ''}${u.pathname}${u.search}`;
  console.log('Masked connection string =', masked);
  console.log('protocol =', u.protocol);
  console.log('hostname =', u.hostname);
  console.log('port =', u.port);
  console.log('pathname =', u.pathname);
  console.log('search =', u.search);
} catch (err) {
  console.error('Failed to parse DATABASE_URL:', err.message);
}

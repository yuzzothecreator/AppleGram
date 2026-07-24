import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node src/run-migration.js <file.sql>');
    process.exit(1);
  }
  const sql = readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Applied', file);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const schemaPath = path.join(__dirname, '../schema.sql');
const schema = readFileSync(schemaPath, 'utf8');

async function migrate() {
  console.log('Connecting to Neon…');
  const client = await pool.connect();
  try {
    console.log('Applying schema…');
    await client.query(schema);
    console.log('Schema applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});

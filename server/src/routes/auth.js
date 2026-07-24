import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'applegram-dev-secret-change-me';
const TOKEN_TTL = '30d';

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    lastSeen: row.last_seen ?? undefined,
    isBot: row.is_bot,
    isPremium: row.is_premium,
  };
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function usernameFromEmail(email) {
  const base = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]+/g, '_') || 'user';
  return base.slice(0, 24);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function signUp(req, res) {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const displayName = String(req.body.displayName || '').trim();

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (displayName.length < 2) {
      return res.status(400).json({ error: 'Enter a display name (2+ characters).' });
    }

    const existing = await query('select id from profiles where email = $1 limit 1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const baseUsername = usernameFromEmail(email);
    const suffix = Math.random().toString(36).slice(2, 8);
    const username = `${baseUsername}_${suffix}`;

    const inserted = await query(
      `insert into profiles (username, display_name, email, password_hash)
       values ($1, $2, $3, $4)
       returning *`,
      [username, displayName, email, passwordHash],
    );

    const user = publicUser(inserted.rows[0]);
    const token = signToken(user.id);
    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('signUp', err);
    return res.status(500).json({ error: err.message || 'Sign up failed' });
  }
}

export async function signIn(req, res) {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');

    const found = await query('select * from profiles where email = $1 limit 1', [email]);
    if (!found.rows.length || !found.rows[0].password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const row = found.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await query('update profiles set last_seen = now() where id = $1', [row.id]);

    const user = publicUser(row);
    const token = signToken(user.id);
    return res.json({ user, token });
  } catch (err) {
    console.error('signIn', err);
    return res.status(500).json({ error: err.message || 'Sign in failed' });
  }
}

export async function me(req, res) {
  try {
    const found = await query('select * from profiles where id = $1 limit 1', [req.userId]);
    if (!found.rows.length) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.json({ user: publicUser(found.rows[0]) });
  } catch (err) {
    console.error('me', err);
    return res.status(500).json({ error: err.message || 'Failed to load profile' });
  }
}

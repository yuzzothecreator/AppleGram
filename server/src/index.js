import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware, me, signIn, signUp } from './routes/auth.js';
import {
  createDirectChat,
  getChat,
  listChats,
  listMessages,
  searchUsers,
  sendMessage,
} from './routes/chats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'applegram-api' });
});

app.post('/auth/signup', signUp);
app.post('/auth/signin', signIn);
app.get('/auth/me', authMiddleware, me);

app.get('/users/search', authMiddleware, searchUsers);

app.get('/chats', authMiddleware, listChats);
app.post('/chats/direct', authMiddleware, createDirectChat);
app.get('/chats/:id', authMiddleware, getChat);
app.get('/chats/:id/messages', authMiddleware, listMessages);
app.post('/chats/:id/messages', authMiddleware, sendMessage);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Applegram API listening on http://0.0.0.0:${port}`);
  console.log(`Phone/emulator should use http://<this-pc-lan-ip>:${port}`);
});

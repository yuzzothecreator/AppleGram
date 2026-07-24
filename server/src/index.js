import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadsDir } from './lib/mappers.js';
import { authMiddleware, me, signIn, signUp, updateProfile } from './routes/auth.js';
import {
  createDirectChat,
  deleteMessage,
  getChat,
  getUserProfile,
  listChats,
  listContacts,
  listMessages,
  searchUsers,
  sendImageMessage,
  sendMessage,
  updateChatPrefs,
} from './routes/chats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const port = Number(process.env.PORT || 3001);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'applegram-api' });
});

app.post('/auth/signup', signUp);
app.post('/auth/signin', signIn);
app.get('/auth/me', authMiddleware, me);
app.patch('/auth/me', authMiddleware, updateProfile);

app.get('/users/contacts', authMiddleware, listContacts);
app.get('/users/search', authMiddleware, searchUsers);
app.get('/users/:id', authMiddleware, getUserProfile);

app.get('/chats', authMiddleware, listChats);
app.post('/chats/direct', authMiddleware, createDirectChat);
app.get('/chats/:id', authMiddleware, getChat);
app.patch('/chats/:id', authMiddleware, updateChatPrefs);
app.get('/chats/:id/messages', authMiddleware, listMessages);
app.post('/chats/:id/messages', authMiddleware, sendMessage);
app.post('/chats/:id/messages/image', authMiddleware, upload.single('image'), sendImageMessage);
app.delete('/messages/:messageId', authMiddleware, deleteMessage);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Applegram API listening on http://0.0.0.0:${port}`);
});

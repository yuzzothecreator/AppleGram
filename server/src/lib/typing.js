/** In-memory typing state: chatId -> Map(userId -> expiresAtMs) */
const typingByChat = new Map();

const TTL_MS = 3500;

function chatMap(chatId) {
  if (!typingByChat.has(chatId)) typingByChat.set(chatId, new Map());
  return typingByChat.get(chatId);
}

export function setTyping(chatId, userId, isTyping) {
  const map = chatMap(chatId);
  if (isTyping) {
    map.set(userId, Date.now() + TTL_MS);
  } else {
    map.delete(userId);
  }
}

export function getTypingUserIds(chatId, excludeUserId) {
  const map = chatMap(chatId);
  const now = Date.now();
  const active = [];
  for (const [userId, expires] of map.entries()) {
    if (expires < now) {
      map.delete(userId);
      continue;
    }
    if (userId !== excludeUserId) active.push(userId);
  }
  return active;
}

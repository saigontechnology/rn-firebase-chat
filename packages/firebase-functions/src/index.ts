/**
 * Firebase Cloud Functions — Chatbot auto-response
 *
 * Triggers:
 *   onMessageCreated      — fires whenever a new message lands in
 *                           conversations/{conversationId}/messages/{messageId}
 *   onConversationCreated — fires when a new conversation is created;
 *                           sends the bot's opening greeting automatically
 *
 * Deploy:
 *   firebase deploy --only functions
 *
 * Emulate locally:
 *   pnpm --filter firebase-functions serve
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { getBotReply } from './bot';

admin.initializeApp();
const db = admin.firestore();

// ─── Constants ────────────────────────────────────────────────────────────────

/** The Firestore user ID that represents the bot. Must match the senderId in
 *  test messages pushed by push-test-message.mjs (default: 'bot'). */
const BOT_ID = 'bot';

/** Milliseconds to wait before the bot replies (simulates typing). */
const BOT_REPLY_DELAY_MS = 1200;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeBotMessage(
  conversationId: string,
  text: string,
  quickReplies?: object
): Promise<void> {
  const messageData: Record<string, unknown> = {
    text,
    senderId: BOT_ID,
    readBy: {},
    status: 0, // MessageStatus.sent
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (quickReplies) {
    messageData.quickReplies = quickReplies;
  }

  const msgRef = await db
    .collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .add(messageData);

  // Update parent conversation doc (mirrors what the RN app does on send)
  await db
    .collection('conversations')
    .doc(conversationId)
    .set(
      {
        latestMessage: {
          text,
          senderId: BOT_ID,
          name: 'Bot',
          readBy: {},
          status: 0,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  logger.info(`Bot replied (${msgRef.id}) in conversation ${conversationId}: "${text}"`);
}

// ─── Trigger: new message ─────────────────────────────────────────────────────

export const onMessageCreated = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const { conversationId } = event.params;
    const data = event.data?.data();

    // Ignore messages sent by the bot itself to avoid infinite loops
    if (!data || data['senderId'] === BOT_ID) return;

    const userText: string = (data['text'] ?? '').trim();
    if (!userText) return;

    logger.info(`New user message in ${conversationId}: "${userText}"`);

    await sleep(BOT_REPLY_DELAY_MS);

    const reply = getBotReply(userText);
    await writeBotMessage(conversationId, reply.text, reply.quickReplies);
  }
);

// ─── Trigger: new conversation ────────────────────────────────────────────────
// Sends a greeting when a brand-new conversation document is created so the
// user always sees a welcome message without needing to send anything first.

export const onConversationCreated = onDocumentCreated(
  'conversations/{conversationId}',
  async (event) => {
    const { conversationId } = event.params;

    logger.info(`New conversation created: ${conversationId} — sending greeting`);

    await sleep(800);

    await writeBotMessage(conversationId, "Hey there! 👋 How can I help you today?", {
      type: 'radio',
      values: [
        { title: '📦 Order tracking', value: 'order tracking' },
        { title: '🛍️ Product info',   value: 'product info'  },
        { title: '🆘 Support',         value: 'support'       },
      ],
    });
  }
);

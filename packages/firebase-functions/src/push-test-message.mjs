/**
 * Push test messages / start a bot conversation in Firestore.
 *
 * Prerequisites:
 *   Download a service account key:
 *     Firebase Console → Project Settings → Service accounts → Generate new private key
 *     Save it as packages/firebase-functions/service-account.json (already in .gitignore)
 *
 * Modes:
 *   push-message <conversationId> [senderId]
 *     Push sample quick-reply messages from <senderId> (default: 'bot').
 *
 *   --create-conversation <conversationId> <memberId1> [memberId2...] [--name <n>] [--image <url>]
 *     Create the conversation document (members, typing, unRead) and exit.
 *
 *   --start-bot <conversationId> <userId> [--name <n>] [--image <url>]
 *     One-shot setup: creates the conversation (members = [userId, 'bot']),
 *     then pushes the bot's opening greeting with quick-reply chips.
 *     Use this when you don't have Firebase Cloud Functions deployed.
 *
 * Examples:
 *   pnpm --filter firebase-functions push-message my-conv-id
 *   pnpm --filter firebase-functions push-message --create-conversation my-conv-id user1 user2
 *   pnpm --filter firebase-functions push-message --start-bot my-conv-id user1
 *   pnpm --filter firebase-functions push-message --start-bot my-conv-id user1 --name "Support Chat"
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ID = 'chatapp-b2db3';
const SERVICE_ACCOUNT_PATH = resolve(__dirname, '..', 'service-account.json');

/** Must match BOT_ID in packages/firebase-functions/src/index.ts */
const BOT_ID = 'bot';

// Optional: if FirestoreServices was configured with a prefix, set it here
const PREFIX = ''; // e.g. 'dev' → collection becomes 'dev-conversations'

// ─── CLI arg parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const CREATE_CONVERSATION = args[0] === '--create-conversation';
const START_BOT           = args[0] === '--start-bot';

const argsCopy = [...args];
function extractFlag(argv, flag) {
  const i = argv.indexOf(flag);
  if (i !== -1 && argv[i + 1] !== undefined) {
    return argv.splice(i, 2)[1];
  }
  return undefined;
}
const nameFlag  = extractFlag(argsCopy, '--name');
const imageFlag = extractFlag(argsCopy, '--image');

const positional = argsCopy.filter(a => !a.startsWith('--'));
// positional[0] = conversationId in every mode
const CONVERSATION_ID = positional[0] ?? 'REPLACE_WITH_CONVERSATION_ID';
const SENDER_ID       = (CREATE_CONVERSATION || START_BOT) ? BOT_ID : (positional[1] ?? BOT_ID);
// member IDs: for --create-conversation everything after conv ID;
//             for --start-bot: [userId, BOT_ID] where userId = positional[1]
const MEMBER_IDS = CREATE_CONVERSATION
  ? positional.slice(1)
  : START_BOT
    ? [positional[1], BOT_ID].filter(Boolean)
    : [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function col(name) {
  return PREFIX ? `${PREFIX}-${name}` : name;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`
ERROR: Service account key not found at:
  ${SERVICE_ACCOUNT_PATH}

Steps to fix:
  1. Open Firebase Console → Project Settings → Service accounts
  2. Click "Generate new private key" and save the JSON as:
     packages/firebase-functions/service-account.json
  3. Re-run this script
`);
  process.exit(1);
}

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
const db = getFirestore();

// ─── Shared: create / ensure conversation doc ─────────────────────────────────

async function ensureConversation(convId, memberIds, name, image) {
  const conversationData = {
    members: memberIds,
    updatedAt: FieldValue.serverTimestamp(),
    typing: {},
    unRead: Object.fromEntries(memberIds.map(id => [id, 0])),
  };
  if (name)  conversationData.name  = name;
  if (image) conversationData.image = image;

  await db.collection(col('conversations')).doc(convId).set(conversationData, { merge: true });
  console.log(`\nConversation created/updated:`);
  console.log(`  ${col('conversations')}/${convId}`);
  console.log(`  members : [${memberIds.join(', ')}]`);
  if (name)  console.log(`  name    : ${name}`);
  if (image) console.log(`  image   : ${image}`);
}

// ─── Mode: --create-conversation ─────────────────────────────────────────────

if (CREATE_CONVERSATION) {
  if (CONVERSATION_ID === 'REPLACE_WITH_CONVERSATION_ID') {
    console.error('ERROR: No conversation ID provided.\nUsage: push-message --create-conversation <conversationId> <memberId1> [memberId2...]');
    process.exit(1);
  }
  if (MEMBER_IDS.length === 0) {
    console.error('ERROR: At least one member ID is required.\nUsage: push-message --create-conversation <conversationId> <memberId1> [memberId2...]');
    process.exit(1);
  }

  await ensureConversation(CONVERSATION_ID, MEMBER_IDS, nameFlag, imageFlag);
  console.log('\nDone.');
  process.exit(0);
}

// ─── Mode: --start-bot ───────────────────────────────────────────────────────
// Creates conversation + pushes the opening bot greeting with quick-reply chips.
// Use this as an alternative to Cloud Functions for local/manual testing.

if (START_BOT) {
  if (CONVERSATION_ID === 'REPLACE_WITH_CONVERSATION_ID') {
    console.error('ERROR: No conversation ID provided.\nUsage: push-message --start-bot <conversationId> <userId>');
    process.exit(1);
  }
  if (!positional[1]) {
    console.error('ERROR: userId is required.\nUsage: push-message --start-bot <conversationId> <userId>');
    process.exit(1);
  }

  await ensureConversation(CONVERSATION_ID, MEMBER_IDS, nameFlag, imageFlag);

  const greetingMessage = {
    text: "Hey there! 👋 How can I help you today?",
    senderId: BOT_ID,
    readBy: {},
    createdAt: FieldValue.serverTimestamp(),
    quickReplies: {
      type: 'radio',
      values: [
        { title: '📦 Order tracking', value: 'order tracking' },
        { title: '🛍️ Product info',   value: 'product info'  },
        { title: '🆘 Support',         value: 'support'       },
      ],
    },
  };

  const msgRef = await db
    .collection(col('conversations'))
    .doc(CONVERSATION_ID)
    .collection('messages')
    .add(greetingMessage);

  // Update latestMessage on the conversation
  await db.collection(col('conversations')).doc(CONVERSATION_ID).set(
    {
      latestMessage: {
        text: greetingMessage.text,
        senderId: BOT_ID,
        name: 'Bot',
        readBy: {},
        status: 0,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`\nBot greeting sent (${msgRef.id}):`);
  console.log(`  "${greetingMessage.text}"`);
  console.log('\nDone. Open the conversation in the app to start chatting with the bot.\n');
  process.exit(0);
}

// ─── Mode: push sample messages ───────────────────────────────────────────────

const sampleMessages = [
  {
    text: 'Hey! How can I help you today?',
    senderId: SENDER_ID,
    readBy: {},
    quickReplies: {
      type: 'radio',
      values: [
        { title: '📦 Order tracking', value: 'order tracking' },
        { title: '🛍️ Product info',   value: 'product info'  },
        { title: '🆘 Support',         value: 'support'       },
      ],
    },
  },
  {
    text: 'Which size do you want?',
    senderId: SENDER_ID,
    readBy: {},
    quickReplies: {
      type: 'radio',
      values: [
        { title: 'Small',  value: 'small'  },
        { title: 'Medium', value: 'medium' },
        { title: 'Large',  value: 'large'  },
      ],
    },
  },
  {
    text: 'Pick your toppings:',
    senderId: SENDER_ID,
    readBy: {},
    quickReplies: {
      type: 'checkbox',
      keepIt: true,
      values: [
        { title: 'Cheese',    value: 'cheese'    },
        { title: 'Pepperoni', value: 'pepperoni' },
        { title: 'Mushrooms', value: 'mushrooms' },
        { title: 'Olives',    value: 'olives'    },
      ],
    },
  },
];

if (CONVERSATION_ID === 'REPLACE_WITH_CONVERSATION_ID') {
  console.error(`
ERROR: No conversation ID provided.

Usage:
  push-message <conversationId> [senderId]

Tip: Find a conversation ID in Firebase Console → Firestore → conversations
`);
  process.exit(1);
}

const conversationDoc = db.collection(col('conversations')).doc(CONVERSATION_ID);

// Ensure the parent conversation document exists
const conversationSnap = await conversationDoc.get();
if (!conversationSnap.exists) {
  await conversationDoc.set({
    members: [SENDER_ID],
    updatedAt: FieldValue.serverTimestamp(),
    typing: {},
    unRead: { [SENDER_ID]: 0 },
  });
  console.log(`\nCreated missing conversation document: ${col('conversations')}/${CONVERSATION_ID}`);
}

console.log(`\nPushing ${sampleMessages.length} messages to:`);
console.log(`  ${col('conversations')}/${CONVERSATION_ID}/messages\n`);

const messagesRef = conversationDoc.collection('messages');
for (const msg of sampleMessages) {
  const doc = await messagesRef.add({ ...msg, createdAt: FieldValue.serverTimestamp() });
  console.log(`  ✓ ${doc.id}  "${msg.text}"`);
}

console.log('\nDone.');

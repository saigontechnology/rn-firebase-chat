/**
 * Rule-based chatbot logic.
 *
 * Extend the RULES map to add new conversation branches.
 * Each rule maps a user's incoming message text (lowercase) to a bot reply.
 * A reply may optionally include quick-reply chips for the next step.
 */

export interface QuickReplyValue {
  title: string;
  value: string;
}

export interface QuickReplies {
  type: 'radio' | 'checkbox';
  values: QuickReplyValue[];
  keepIt?: boolean;
}

export interface BotReply {
  text: string;
  quickReplies?: QuickReplies;
}

/** Keyword → reply mapping. Checked as a substring of the user message. */
const RULES: Array<{ match: RegExp; reply: BotReply }> = [
  // ── Greetings ────────────────────────────────────────────────────────────
  {
    match: /\b(hi|hello|hey|start)\b/i,
    reply: {
      text: "Hey there! 👋 How can I help you today?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '📦 Order tracking', value: 'order tracking' },
          { title: '🛍️ Product info',   value: 'product info'  },
          { title: '🆘 Support',         value: 'support'       },
        ],
      },
    },
  },

  // ── Order tracking ───────────────────────────────────────────────────────
  {
    match: /order.*(track|status|where)/i,
    reply: {
      text: "I can look up your order! Please share your order number and I'll check the status.",
    },
  },
  {
    match: /^order tracking$/i,
    reply: {
      text: "Sure! Which order would you like to track?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: 'Most recent order', value: 'most recent order' },
          { title: 'Enter order number', value: 'enter order number' },
        ],
      },
    },
  },
  {
    match: /most recent order/i,
    reply: {
      text: "Your most recent order (#ORD-4821) is out for delivery and should arrive today by 8 PM. 🚚",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '✅ Thanks!',         value: 'thanks'   },
          { title: '❌ That\'s wrong',   value: 'wrong order' },
        ],
      },
    },
  },
  {
    match: /enter order number/i,
    reply: { text: "Please type your order number (e.g. ORD-1234) and I'll look it up." },
  },

  // ── Product info ─────────────────────────────────────────────────────────
  {
    match: /^product info$/i,
    reply: {
      text: "Which category are you interested in?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '👕 Clothing',     value: 'clothing'     },
          { title: '💻 Electronics',  value: 'electronics'  },
          { title: '🏠 Home & Living', value: 'home living' },
        ],
      },
    },
  },
  {
    match: /\b(clothing|fashion|apparel)\b/i,
    reply: {
      text: "We have a great range of clothing! What size are you looking for?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: 'S', value: 'small'  },
          { title: 'M', value: 'medium' },
          { title: 'L', value: 'large'  },
          { title: 'XL', value: 'xlarge' },
        ],
      },
    },
  },
  {
    match: /\b(small|medium|large|xlarge)\b/i,
    reply: {
      text: "Perfect! I've found 12 items in your size. Would you like me to show the latest arrivals or sale items?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '✨ Latest arrivals', value: 'latest arrivals' },
          { title: '🏷️ Sale items',      value: 'sale items'     },
        ],
      },
    },
  },
  {
    match: /\b(electronics?|tech|gadget)\b/i,
    reply: {
      text: "Great choice! What type of electronics are you after?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '📱 Phones',    value: 'phones'   },
          { title: '💻 Laptops',   value: 'laptops'  },
          { title: '🎧 Audio',     value: 'audio'    },
        ],
      },
    },
  },
  {
    match: /home.*(liv|decor|furnit)/i,
    reply: {
      text: "Our Home & Living collection is stunning! Are you looking for furniture or décor?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '🛋️ Furniture', value: 'furniture' },
          { title: '🖼️ Décor',     value: 'decor'     },
        ],
      },
    },
  },

  // ── Support ──────────────────────────────────────────────────────────────
  {
    match: /^support$/i,
    reply: {
      text: "I'm sorry to hear you need help. What's the issue?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '🔄 Return / Refund', value: 'return refund'    },
          { title: '📦 Missing item',    value: 'missing item'     },
          { title: '🔧 Damaged item',    value: 'damaged item'     },
          { title: '💳 Payment issue',   value: 'payment issue'    },
        ],
      },
    },
  },
  {
    match: /return|refund/i,
    reply: {
      text: "To start a return, please confirm: did you receive the item and wish to return it, or did you never receive it?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: 'Received — want to return', value: 'received want return' },
          { title: 'Never received it',          value: 'never received'      },
        ],
      },
    },
  },
  {
    match: /missing.?item|never.?receiv/i,
    reply: {
      text: "I'm sorry about that! I've filed a missing-item claim for your most recent order. Our team will follow up within 24 hours. 🙏",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '✅ Thanks', value: 'thanks' },
          { title: '🔁 Start over', value: 'start' },
        ],
      },
    },
  },
  {
    match: /damaged/i,
    reply: {
      text: "I'm sorry to hear that! Could you describe the damage? You can also send a photo via the attachment button.",
    },
  },
  {
    match: /payment/i,
    reply: {
      text: "Payment issues are resolved within 3–5 business days. Which payment method did you use?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '💳 Credit / Debit', value: 'credit debit' },
          { title: '🏦 Bank transfer',   value: 'bank transfer' },
          { title: '📱 Digital wallet',  value: 'digital wallet' },
        ],
      },
    },
  },

  // ── Sign-offs ─────────────────────────────────────────────────────────────
  {
    match: /\b(thanks?|thank you|cheers|great|perfect)\b/i,
    reply: {
      text: "You're welcome! Is there anything else I can help you with?",
      quickReplies: {
        type: 'radio',
        values: [
          { title: '✅ No, all good!', value: 'no thanks'    },
          { title: '🔁 Start over',    value: 'start'        },
        ],
      },
    },
  },
  {
    match: /\b(no.?thanks?|all.?good|bye|goodbye|done)\b/i,
    reply: { text: "Great! Have a wonderful day. Feel free to chat again anytime. 😊" },
  },
];

/** Wrong-order branch */
const RULES_WRONG_ORDER: BotReply = {
  text: "I'm sorry about the confusion! Please provide your correct order number and I'll look it up right away.",
};

/** Fallback when no rule matches */
const FALLBACK: BotReply = {
  text: "I'm not sure I understood that. Could you pick one of the options or rephrase your question?",
  quickReplies: {
    type: 'radio',
    values: [
      { title: '📦 Order tracking', value: 'order tracking' },
      { title: '🛍️ Product info',   value: 'product info'  },
      { title: '🆘 Support',         value: 'support'       },
    ],
  },
};

/**
 * Given the text of a user's message, return the bot's reply.
 * Priority: first matching rule wins; falls back to FALLBACK.
 */
export function getBotReply(userText: string): BotReply {
  if (/wrong.?order/i.test(userText)) return RULES_WRONG_ORDER;

  for (const rule of RULES) {
    if (rule.match.test(userText)) return rule.reply;
  }
  return FALLBACK;
}

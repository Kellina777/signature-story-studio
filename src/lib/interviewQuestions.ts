// the eight core "signature story" questions, in order.
export const CORE_QUESTIONS: { id: string; prompt: string; hint?: string }[] = [
  {
    id: "origin",
    prompt: "where did this work actually begin for you — not the resume version, the real one?",
    hint: "the moment, the place, the person who set it off.",
  },
  {
    id: "turning_point",
    prompt: "what's the one moment that changed how you see what you do?",
    hint: "a before / after. something cracked open.",
  },
  {
    id: "belief",
    prompt: "what do you believe about your work that most people in your field would push back on?",
    hint: "the line you'll defend in a room full of disagreement.",
  },
  {
    id: "person",
    prompt: "who is the one person — client, friend, stranger — you most wish you could help right now, and why?",
    hint: "real human. real situation.",
  },
  {
    id: "transformation",
    prompt: "when your work lands, what changes in someone's life? describe it the way they would describe it.",
    hint: "their words, not yours.",
  },
  {
    id: "phrase",
    prompt: "is there a phrase, a metaphor, or a way of explaining your work that only you use?",
    hint: "the thing people quote back to you.",
  },
  {
    id: "fear",
    prompt: "what's the thing you've been avoiding saying out loud about your work?",
    hint: "the truer truth.",
  },
  {
    id: "why",
    prompt: "if you could only leave people with one idea, one feeling, one shift — what would it be?",
    hint: "your why, in one breath.",
  },
];

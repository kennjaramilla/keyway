/** Example questions per building, shown as one-click chips. */
const SUGGESTED_QUESTIONS: Record<string, readonly string[]> = {
  bld_harbor: [
    "How many dogs or cats can I keep?",
    "What are the quiet hours?",
    "Can I use a charcoal grill on my balcony?",
  ],
  bld_maple: [
    "How many dogs or cats can I keep?",
    "Can I install a washing machine in my apartment?",
    "Who do I call if there is no heat?",
  ],
  bld_linden: [
    "How many dogs or cats can I keep?",
    "How do I let a vendor in when I'm not home?",
    "Where are the EV charging stations?",
  ],
};

const DEFAULT_QUESTIONS = ["How many dogs or cats can I keep?", "What are the quiet hours?"];

export const suggestionsFor = (buildingId: string) =>
  SUGGESTED_QUESTIONS[buildingId] ?? DEFAULT_QUESTIONS;

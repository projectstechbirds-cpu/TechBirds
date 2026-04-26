export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: "How do you price an engagement?",
    answer:
      "Fixed price per milestone, after a paid one-week discovery. We don't sign anything we can't specify.",
  },
  {
    question: "Where are you based?",
    answer:
      "Hyderabad, India. The team works in person from our studio; we travel to clients for kick-off and major reviews.",
  },
  {
    question: "Do you take retainer work?",
    answer:
      "Yes, but only after a project ships with us. We don't sell hours in the abstract — we sell outcomes we know we can deliver.",
  },
  {
    question: "What stacks do you work in?",
    answer:
      "TypeScript + React on the front, Python or Go on the back. Postgres for data. We pick boring, proven tools.",
  },
  {
    question: "Can you sign an NDA?",
    answer:
      "Yes — share yours or use ours. We've signed NDAs with hospitals, banks, and labs. Default is mutual.",
  },
  {
    question: "What's the smallest engagement you take?",
    answer:
      "About four weeks of focused work. Smaller than that and the discovery overhead doesn't pay off for either side.",
  },
];

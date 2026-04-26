export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  org: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "They shipped what others kept slide-decking. Six months in, the system is the way the hospital actually runs.",
    author: "Dr. Anil Reddy",
    role: "Medical Director",
    org: "Hospverse pilot site",
  },
  {
    quote:
      "Most agencies disappear after launch. TechBirds was on a call with us at 11pm on a Sunday when the migration hit a snag.",
    author: "Aarti M.",
    role: "Head of Operations",
    org: "Common Delivery",
  },
  {
    quote:
      "We hired them for two weeks of consulting. Two years later they own three of our most critical systems.",
    author: "Vikram Iyer",
    role: "CTO",
    org: "Confidential — manufacturing",
  },
];

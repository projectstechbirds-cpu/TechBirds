export interface ProcessStep {
  number: string;
  title: string;
  body: string;
  duration: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    body: "We meet your team, walk the floor, read the data. We come back with a written brief.",
    duration: "Week 1",
  },
  {
    number: "02",
    title: "Define",
    body: "A scope, a milestone plan, a fixed price. No moving targets, no ambiguous line items.",
    duration: "Week 2",
  },
  {
    number: "03",
    title: "Design",
    body: "Wireframes first. Then high-fidelity. Engineers are in the room from day one.",
    duration: "Weeks 3–4",
  },
  {
    number: "04",
    title: "Build",
    body: "Two-week sprints. Friday demos. Production-grade code from the first commit.",
    duration: "Weeks 5–N",
  },
  {
    number: "05",
    title: "Ship",
    body: "We deploy, train your team, and stay on for thirty days of warranty. No drop-and-run.",
    duration: "Launch",
  },
  {
    number: "06",
    title: "Run",
    body: "Optional ongoing engagement — bug fixes, enhancements, scale. Or we hand it cleanly over.",
    duration: "Post-launch",
  },
];

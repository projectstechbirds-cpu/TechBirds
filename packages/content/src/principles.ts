export interface Principle {
  title: string;
  body: string;
}

export const principles: Principle[] = [
  {
    title: "Software, shipped.",
    body: "Demos are not products. We measure ourselves by what runs in production, with real users, on real data.",
  },
  {
    title: "Small teams, deep ownership.",
    body: "Two to four people on a project. The same engineers who designed it are on call when it breaks.",
  },
  {
    title: "Boring tech, sharp execution.",
    body: "We pick well-understood tools. We spend our novelty budget on the product, not the stack.",
  },
  {
    title: "Honest scopes, fixed prices.",
    body: "If it can be specified, it can be priced. We'd rather walk away than sign a vague engagement.",
  },
  {
    title: "Operability is a feature.",
    body: "Logs, metrics, runbooks — we treat ops like UX. Whoever runs it after us shouldn't suffer.",
  },
  {
    title: "Long horizons.",
    body: "Some clients have been with us for four years. Some products we built we still operate ourselves.",
  },
];

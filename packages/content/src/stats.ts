export interface StudioStat {
  value: string;
  label: string;
  caption?: string;
}

export const studioStats: StudioStat[] = [
  { value: "5+", label: "Years shipping", caption: "Founded in 2021 in Hyderabad." },
  { value: "30+", label: "Projects delivered", caption: "Across healthcare, commerce, and ops." },
  { value: "6", label: "Live ventures", caption: "Products we built and operate." },
  { value: "99.9%", label: "Uptime target", caption: "On systems we host and run." },
];

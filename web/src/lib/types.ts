export type SectionId = "ai" | "hot";

export type Repo = {
  full_name: string;
  url: string;
  description: string;
  summary: string;
  language: string;
  stars: number;
  stars_gained: number;
  gained_label: string;
  topics: string[];
};

export type Section = {
  id: SectionId;
  title: string;
  repos: Repo[];
};

export type Issue = {
  date: string; // YYYY-MM-DD
  generated_at: string;
  sections: Section[];
};

export type IndexEntry = {
  date: string;
  count: number;
  ai_count: number;
  lead: string | null;
  lead_gained: number;
};

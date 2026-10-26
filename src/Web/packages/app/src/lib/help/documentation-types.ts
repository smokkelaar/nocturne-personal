/** UI-only help structure. Reference values come from the generated API models. */
export type HelpVisualKind =
  | "trend"
  | "bars"
  | "spread"
  | "grid"
  | "scatter"
  | "stages"
  | "stairs"
  | "flow";
export interface HelpSection {
  id?: string;
  title: string;
  text: string;
  links?: HelpSource[];
}
export interface HelpSource {
  title: string;
  href: string;
}
export interface HelpArticle {
  href: string;
  title: string;
  introduction: string;
  sections: HelpSection[];
  related: string[];
  steps?: HelpSection[];
  sources?: HelpSource[];
  helpOnly?: boolean;
  reading?: HelpSection[];
  /** What the page shows and how to interpret it; shown open above the reading aid. */
  meaning?: HelpSection[];
  visual?: HelpVisualKind;
  settings?: string[];
  reference?: "glucose" | "google-health";
}

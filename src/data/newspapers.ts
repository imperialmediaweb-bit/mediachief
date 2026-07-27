export interface Newspaper {
  name: string;
  region: "Northeast" | "Midwest" | "South" | "West";
  type: "local" | "national" | "topical";
  state?: string;
  url?: string;
}

// NOTE: This list is used ONLY in the admin panel (protected)
// and for generating the PDF sent to clients who complete the lead form.
// It is NOT exposed on any public page indexable by Google.
export const NEWSPAPERS: Newspaper[] = [
  // Northeast (9)
  { name: "Daily Connecticut", region: "Northeast", type: "local", state: "Connecticut" },
  { name: "Daily Maine", region: "Northeast", type: "local", state: "Maine" },
  { name: "Daily Massachusetts", region: "Northeast", type: "local", state: "Massachusetts" },
  { name: "Daily New Hampshire", region: "Northeast", type: "local", state: "New Hampshire" },
  { name: "Daily Rhode Island", region: "Northeast", type: "local", state: "Rhode Island" },
  { name: "Daily Vermont", region: "Northeast", type: "local", state: "Vermont" },
  { name: "Daily New Jersey", region: "Northeast", type: "local", state: "New Jersey" },
  { name: "Daily New York", region: "Northeast", type: "local", state: "New York" },
  { name: "Daily Pennsylvania", region: "Northeast", type: "local", state: "Pennsylvania" },
  // Midwest (12)
  { name: "Daily Illinois", region: "Midwest", type: "local", state: "Illinois" },
  { name: "Daily Indiana", region: "Midwest", type: "local", state: "Indiana" },
  { name: "Daily Michigan", region: "Midwest", type: "local", state: "Michigan" },
  { name: "Daily Ohio", region: "Midwest", type: "local", state: "Ohio" },
  { name: "Daily Wisconsin", region: "Midwest", type: "local", state: "Wisconsin" },
  { name: "Daily Iowa", region: "Midwest", type: "local", state: "Iowa" },
  { name: "Daily Kansas", region: "Midwest", type: "local", state: "Kansas" },
  { name: "Daily Minnesota", region: "Midwest", type: "local", state: "Minnesota" },
  { name: "Daily Missouri", region: "Midwest", type: "local", state: "Missouri" },
  { name: "Daily Nebraska", region: "Midwest", type: "local", state: "Nebraska" },
  { name: "Daily North Dakota", region: "Midwest", type: "local", state: "North Dakota" },
  { name: "Daily South Dakota", region: "Midwest", type: "local", state: "South Dakota" },
  // South (16)
  { name: "Daily Delaware", region: "South", type: "local", state: "Delaware" },
  { name: "Daily Florida", region: "South", type: "local", state: "Florida" },
  { name: "Daily Georgia", region: "South", type: "local", state: "Georgia" },
  { name: "Daily Maryland", region: "South", type: "local", state: "Maryland" },
  { name: "Daily North Carolina", region: "South", type: "local", state: "North Carolina" },
  { name: "Daily South Carolina", region: "South", type: "local", state: "South Carolina" },
  { name: "Daily Virginia", region: "South", type: "local", state: "Virginia" },
  { name: "Daily West Virginia", region: "South", type: "local", state: "West Virginia" },
  { name: "Daily Alabama", region: "South", type: "local", state: "Alabama" },
  { name: "Daily Kentucky", region: "South", type: "local", state: "Kentucky" },
  { name: "Daily Mississippi", region: "South", type: "local", state: "Mississippi" },
  { name: "Daily Tennessee", region: "South", type: "local", state: "Tennessee" },
  { name: "Daily Arkansas", region: "South", type: "local", state: "Arkansas" },
  { name: "Daily Louisiana", region: "South", type: "local", state: "Louisiana" },
  { name: "Daily Oklahoma", region: "South", type: "local", state: "Oklahoma" },
  { name: "Daily Texas", region: "South", type: "local", state: "Texas" },
  // West (13)
  { name: "Daily Arizona", region: "West", type: "local", state: "Arizona" },
  { name: "Daily Colorado", region: "West", type: "local", state: "Colorado" },
  { name: "Daily Idaho", region: "West", type: "local", state: "Idaho" },
  { name: "Daily Montana", region: "West", type: "local", state: "Montana" },
  { name: "Daily Nevada", region: "West", type: "local", state: "Nevada" },
  { name: "Daily New Mexico", region: "West", type: "local", state: "New Mexico" },
  { name: "Daily Utah", region: "West", type: "local", state: "Utah" },
  { name: "Daily Wyoming", region: "West", type: "local", state: "Wyoming" },
  { name: "Daily Alaska", region: "West", type: "local", state: "Alaska" },
  { name: "Daily California", region: "West", type: "local", state: "California" },
  { name: "Daily Hawaii", region: "West", type: "local", state: "Hawaii" },
  { name: "Daily Oregon", region: "West", type: "local", state: "Oregon" },
  { name: "Daily Washington", region: "West", type: "local", state: "Washington" },
];

export const REGION_COUNTS = {
  Northeast: NEWSPAPERS.filter((n) => n.region === "Northeast").length,
  Midwest: NEWSPAPERS.filter((n) => n.region === "Midwest").length,
  South: NEWSPAPERS.filter((n) => n.region === "South").length,
  West: NEWSPAPERS.filter((n) => n.region === "West").length,
};

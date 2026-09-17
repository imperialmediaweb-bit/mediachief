// State names, their postal abbreviations, and the tile-grid layout the
// coverage map draws. Keeping the grid here means a page only has to hand the
// map a list of newspapers.

export const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
  Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

export const ABBR_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBR).map(([name, abbr]) => [abbr, name])
);

export function stateAbbr(state?: string): string {
  return (state && STATE_ABBR[state]) || "";
}

/**
 * The classic US tile grid: every state is one square, placed roughly where it
 * sits on the map. 12 columns by 8 rows, "" is an empty cell. Each state gets
 * the same area, so small Northeast states stay clickable — which a true
 * geographic map cannot do on a phone.
 */
export const US_TILE_GRID: string[][] = [
  ["AK", "",   "",   "",   "",   "",   "",   "",   "",   "",   "",   "ME"],
  ["",   "",   "",   "",   "",   "",   "",   "",   "",   "",   "VT", "NH"],
  ["",   "WA", "ID", "MT", "ND", "MN", "IL", "WI", "MI", "NY", "RI", "MA"],
  ["",   "OR", "NV", "WY", "SD", "IA", "IN", "OH", "PA", "NJ", "CT", ""  ],
  ["",   "CA", "UT", "CO", "NE", "MO", "KY", "WV", "VA", "MD", "DE", ""  ],
  ["",   "",   "AZ", "NM", "KS", "AR", "TN", "NC", "SC", "DC", "",   ""  ],
  ["",   "",   "",   "",   "OK", "LA", "MS", "AL", "GA", "",   "",   ""  ],
  ["HI", "",   "",   "",   "TX", "",   "",   "",   "",   "FL", "",   ""  ],
];

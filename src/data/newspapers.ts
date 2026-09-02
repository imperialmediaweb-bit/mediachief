export interface Newspaper {
  name: string;
  region: "Northeast" | "Midwest" | "South" | "West";
  type: "local" | "national" | "topical";
  state?: string;
  url?: string;
}

// The live network. Edit this file to add, remove or rename a paper — every
// page that shows the network reads from here.
//
// Illinois is the one state without a site yet. Add it below once the domain
// is live and it appears everywhere automatically.
export const NEWSPAPERS: Newspaper[] = [
  // ---------------- Northeast (9) ----------------
  { name: "Connecticut Express", region: "Northeast", type: "local", state: "Connecticut", url: "https://www.connecticut-express.com" },
  { name: "Maine Express", region: "Northeast", type: "local", state: "Maine", url: "https://www.maineeexpres.com" },
  { name: "Massachusetts Express", region: "Northeast", type: "local", state: "Massachusetts", url: "https://massachusettsexpress.com" },
  { name: "New Hampshire Express", region: "Northeast", type: "local", state: "New Hampshire", url: "https://newhampshire-express.com" },
  { name: "Rhode Island Express", region: "Northeast", type: "local", state: "Rhode Island", url: "https://rhodeisland-express.com" },
  { name: "Vermont Express", region: "Northeast", type: "local", state: "Vermont", url: "https://vermont-express.com" },
  { name: "New Jersey Express", region: "Northeast", type: "local", state: "New Jersey", url: "https://newjersey-express.com" },
  { name: "New York Express", region: "Northeast", type: "local", state: "New York", url: "https://newyork-express.com" },
  { name: "Pennsylvania Express", region: "Northeast", type: "local", state: "Pennsylvania", url: "https://www.pennsylvaniaexpres.com" },

  // ---------------- Midwest (11) ----------------
  { name: "Indiana Express", region: "Midwest", type: "local", state: "Indiana", url: "https://www.indianaexpres.com" },
  { name: "Michigan Express", region: "Midwest", type: "local", state: "Michigan", url: "https://michigan-express.com" },
  { name: "Ohio Express", region: "Midwest", type: "local", state: "Ohio", url: "https://www.ohioexpres.com" },
  { name: "Wisconsin Express", region: "Midwest", type: "local", state: "Wisconsin", url: "https://www.wisconsin-express.com" },
  { name: "Iowa Express", region: "Midwest", type: "local", state: "Iowa", url: "https://iowa-express.com" },
  { name: "Kansas Express", region: "Midwest", type: "local", state: "Kansas", url: "https://www.kansas-express.com" },
  { name: "Minnesota Express", region: "Midwest", type: "local", state: "Minnesota", url: "https://www.minnesota-express.com" },
  { name: "Missouri Express", region: "Midwest", type: "local", state: "Missouri", url: "https://missouri-express.com" },
  { name: "Nebraska Express", region: "Midwest", type: "local", state: "Nebraska", url: "https://nebraska-express.com" },
  { name: "North Dakota Express", region: "Midwest", type: "local", state: "North Dakota", url: "https://northdakota-express.com" },
  { name: "South Dakota Express", region: "Midwest", type: "local", state: "South Dakota", url: "https://southdakota-express.com" },

  // ---------------- South (16) ----------------
  { name: "Delaware Express", region: "South", type: "local", state: "Delaware", url: "https://delaware-express.com" },
  { name: "Florida Express", region: "South", type: "local", state: "Florida", url: "https://www.florida-expres.com" },
  { name: "Georgia Express", region: "South", type: "local", state: "Georgia", url: "https://www.georgia-express.com" },
  { name: "Maryland Express", region: "South", type: "local", state: "Maryland", url: "https://maryland-express.com" },
  { name: "North Carolina Express", region: "South", type: "local", state: "North Carolina", url: "https://www.northcarolinasexpress.com" },
  { name: "South Carolina Express", region: "South", type: "local", state: "South Carolina", url: "https://southcarolina-express.com" },
  { name: "Virginia Express", region: "South", type: "local", state: "Virginia", url: "https://www.virginiaexpres.com" },
  { name: "West Virginia Express", region: "South", type: "local", state: "West Virginia", url: "https://westvirginia-express.com" },
  { name: "Alabama Express", region: "South", type: "local", state: "Alabama", url: "https://alabama-express.com" },
  { name: "Kentucky Express", region: "South", type: "local", state: "Kentucky", url: "https://kentucky-express.com" },
  { name: "Mississippi Express", region: "South", type: "local", state: "Mississippi", url: "https://mississippi-express.com" },
  { name: "Tennessee Express", region: "South", type: "local", state: "Tennessee", url: "https://www.tennesseeexpres.com" },
  { name: "Arkansas Express", region: "South", type: "local", state: "Arkansas", url: "https://arkansas-expres.com" },
  { name: "Louisiana Express", region: "South", type: "local", state: "Louisiana", url: "https://louisiana-express.com" },
  { name: "Oklahoma Express", region: "South", type: "local", state: "Oklahoma", url: "https://oklahoma-express.com" },
  { name: "Texas Express", region: "South", type: "local", state: "Texas", url: "https://www.texasexpres.com" },

  // ---------------- West (13) ----------------
  { name: "Arizona Express", region: "West", type: "local", state: "Arizona", url: "https://arizona-express.com" },
  { name: "Colorado Express", region: "West", type: "local", state: "Colorado", url: "https://www.coloradoexpres.com" },
  { name: "Idaho Express", region: "West", type: "local", state: "Idaho", url: "https://www.idaho-express.com" },
  { name: "Montana Express", region: "West", type: "local", state: "Montana", url: "https://montana-express.com" },
  { name: "Nevada Express", region: "West", type: "local", state: "Nevada", url: "https://nevada-express.com" },
  { name: "New Mexico Express", region: "West", type: "local", state: "New Mexico", url: "https://www.newmexico-express.com" },
  { name: "Utah Express", region: "West", type: "local", state: "Utah", url: "https://utah-express.com" },
  { name: "Wyoming Express", region: "West", type: "local", state: "Wyoming", url: "https://wyoming-express.com" },
  { name: "Alaska Express", region: "West", type: "local", state: "Alaska", url: "https://www.alaskaexpres.com" },
  { name: "California Express", region: "West", type: "local", state: "California", url: "https://www.californiaexpres.com" },
  { name: "Hawaii Express", region: "West", type: "local", state: "Hawaii", url: "https://www.hawaiiexpres.com" },
  { name: "Oregon Express", region: "West", type: "local", state: "Oregon", url: "https://oregon-express.com" },
  { name: "Washington Express", region: "West", type: "local", state: "Washington", url: "https://washingtonexpres.com" },
];

export const REGION_COUNTS = {
  Northeast: NEWSPAPERS.filter((n) => n.region === "Northeast").length,
  Midwest: NEWSPAPERS.filter((n) => n.region === "Midwest").length,
  South: NEWSPAPERS.filter((n) => n.region === "South").length,
  West: NEWSPAPERS.filter((n) => n.region === "West").length,
};

export const TOTAL_NEWSPAPERS = NEWSPAPERS.length;

/** States with no site yet — shown as gaps rather than quietly omitted. */
export const UNCOVERED_STATES = ["Illinois"];

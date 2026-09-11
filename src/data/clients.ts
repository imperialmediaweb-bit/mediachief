/**
 * Clients who published through Media Chief and agreed to be shown.
 *
 * The logo strip answers the unspoken question of someone hesitating at
 * checkout: "has anyone serious bought this before?". Only list clients who
 * would be happy to be seen here. Remove a row and they are gone.
 *
 * Empty for now — the strip renders nothing until there is at least one
 * entry with a logo. Logo: a filename in public/clients/ (e.g. "acme.png")
 * or a full https:// URL.
 */
export interface ShownClient {
  name: string;
  logo?: string;
  site?: string;
  /** What they came for — one line, used as the tooltip. */
  note?: string;
  /** Logo drawn for dark backgrounds: give it a navy card so it looks intended. */
  darkCard?: boolean;
}

export const CLIENTS: ShownClient[] = [];

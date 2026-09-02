import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForPg = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
  __drizzleDb?: Db;
};

// `next build` imports modules that construct the NextAuth adapter without ever
// running a query. postgres-js connects lazily, so a placeholder URL lets the
// build finish, while a real deploy still fails loudly on a missing variable.
function buildTimePlaceholder(): string {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgres://build:build@127.0.0.1:5432/build";
  }
  throw new Error("DATABASE_URL is not set. Configure it in env.");
}

function getDbInternal(): Db {
  if (globalForPg.__drizzleDb) return globalForPg.__drizzleDb;
  const url = process.env.DATABASE_URL || buildTimePlaceholder();
  const client =
    globalForPg.__pgClient ??
    postgres(url, { max: 1, prepare: false });
  globalForPg.__pgClient = client;
  const db = drizzle(client, { schema });
  globalForPg.__drizzleDb = db;
  return db;
}

export function getDb(): Db {
  return getDbInternal();
}

// Lazy proxy: throws only when a method is actually called without DATABASE_URL.
// Safe to import from modules that may run in build-time contexts.
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDbInternal(), prop, receiver);
  },
});

export { schema };

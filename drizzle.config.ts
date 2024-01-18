import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  driver: 'pg',
  dbCredentials: {
    connectionString: 'postgres://docker:docker@localhost:5432/pizza_shop'
  }
} satisfies Config;

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "schema-core.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

import "dotenv/config";
import type { PrismaConfig } from "prisma";
import path from "node:path";

const config: PrismaConfig = {
  schema: path.join("prisma", "schema.prisma"),
};

export default config;
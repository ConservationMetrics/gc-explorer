import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

// Create connection for guardianconnector database (config)
const createConfigConnection = () => {
  const { configDatabase, dbHost, dbUser, dbPassword, dbPort, dbSsl } =
    useRuntimeConfig() as unknown as {
      configDatabase: string;
      dbHost: string;
      dbUser: string;
      dbPassword: string;
      dbPort: string;
      dbSsl: boolean;
    };

  if (!dbUser || !dbPassword || !dbHost || !dbPort || !configDatabase) {
    throw new Error(`Missing required database environment variables:
      NUXT_DB_USER: ${dbUser ? "✓" : "✗"}
      NUXT_DB_PASSWORD: ${dbPassword ? "✓" : "✗"}
      NUXT_DB_HOST: ${dbHost ? "✓" : "✗"}
      NUXT_DB_PORT: ${dbPort ? "✓" : "✗"}
      NUXT_CONFIG_DATABASE: ${configDatabase ? "✓" : "✗"}
    `);
  }

  // Construct connection string with URL encoding and SSL parameters (if needed)
  // Encoding is used to handle special characters in the database credentials and is necessary for the connection to work
  let connectionString = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${encodeURIComponent(configDatabase)}`;

  // Add SSL parameters to connection string if SSL is enabled
  if (dbSsl) {
    connectionString += "?sslmode=require";
  }

  const queryClient = postgres(connectionString, {
    prepare: false,
    ssl: dbSsl ? { rejectUnauthorized: false } : false,
  });

  return drizzle(queryClient, { schema });
};

// Create connection for warehouse database
const createWarehouseConnection = () => {
  const { dbHost, dbUser, dbPassword, dbPort, dbSsl } =
    useRuntimeConfig() as unknown as {
      dbHost: string;
      dbUser: string;
      dbPassword: string;
      dbPort: string;
      dbSsl: boolean;
    };

  // Use NUXT_DATABASE env var or default to "warehouse"
  const database = process.env.NUXT_DATABASE || "warehouse";

  // Construct connection string with URL encoding and SSL parameters (if needed)
  // Encoding is used to handle special characters in the database credentials and is necessary for the connection to work
  let connectionString = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${encodeURIComponent(database)}`;

  // Add SSL parameters to connection string if SSL is enabled
  if (dbSsl) {
    connectionString += "?sslmode=require";
  }

  const queryClient = postgres(connectionString, {
    prepare: false,
    ssl: dbSsl ? { rejectUnauthorized: false } : false,
  });

  return drizzle(queryClient, { schema });
};

export const configDb = createConfigConnection();
export const warehouseDb = createWarehouseConnection();

export { schema };

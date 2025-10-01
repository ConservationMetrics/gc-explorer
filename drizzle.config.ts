import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    host: process.env.NUXT_DB_HOST || 'localhost',
    port: parseInt(process.env.NUXT_DB_PORT || '5432'),
    user: process.env.NUXT_DB_USER || 'postgres',
    password: process.env.NUXT_DB_PASSWORD || '',
    database: process.env.NUXT_CONFIG_DATABASE || 'guardianconnector',
    ssl: process.env.NUXT_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
})

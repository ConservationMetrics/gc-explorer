import { pgTable, text } from 'drizzle-orm/pg-core'

// Guardian Connector view config table
export const viewConfig = pgTable('view_config', {
  tableName: text('table_name').primaryKey(),
  viewsConfig: text('views_config').notNull(),
})


export const schemas = {
  viewConfig,
}

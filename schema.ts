import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const weeks = sqliteTable('weeks', {
  id: text('id').primaryKey(),
  notes: text('notes').default(''),
  notesHeight: integer('notes_height').default(200),
});

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weekId: text('week_id').notNull(),
  date: text('date').notNull(),
  url: text('url').notNull(),
  decorationType: text('decoration_type').notNull(),
  rotation: integer('rotation').notNull(),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  keyword: text('keyword').notNull(),
});

import { pgTable, serial, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  workoutId: integer('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weightLbs: numeric('weight_lbs', { precision: 6, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workoutsRelations = relations(workouts, ({ many }) => ({
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [exercises.workoutId], references: [workouts.id] }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  exercise: one(exercises, { fields: [sets.exerciseId], references: [exercises.id] }),
}));

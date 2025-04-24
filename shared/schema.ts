import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("firstName"),
  lastName: text("lastName"),
  role: text("role").default("user").notNull(), // "user", "stationOwner", "admin"
  createdAt: timestamp("createdAt").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
});

// Charging Station schema
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  pricePerKwh: text("pricePerKwh"),
  powerKw: integer("powerKw"),
  connectorTypes: jsonb("connectorTypes").$type<string[]>(),
  description: text("description"),
  amenities: jsonb("amenities").$type<string[]>(),
  rating: text("rating"),
  reviewCount: integer("reviewCount"),
  distance: text("distance"), // For calculated distance
  ownerId: integer("ownerId"), // ID of the station owner user
});

export const insertStationSchema = createInsertSchema(stations).omit({
  id: true,
});

// Charging Port schema
export const ports = pgTable("ports", {
  id: serial("id").primaryKey(),
  stationId: integer("stationId").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  powerKw: integer("powerKw"),
  status: text("status").default("available"), // available, in-use, maintenance
});

export const insertPortSchema = createInsertSchema(ports).omit({
  id: true,
});

// Booking schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stationId: integer("stationId").notNull(),
  portId: integer("portId").notNull(),
  date: text("date").notNull(),
  startTime: text("startTime").notNull(),
  endTime: text("endTime").notNull(),
  duration: integer("duration").notNull(), // In minutes
  status: text("status").default("pending"), // pending, confirmed, completed, cancelled
  vehicleInfo: text("vehicleInfo"),
  specialRequests: text("specialRequests"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStation = z.infer<typeof insertStationSchema>;
export type Station = typeof stations.$inferSelect;

export type InsertPort = z.infer<typeof insertPortSchema>;
export type Port = typeof ports.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Custom schemas for frontend validations
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

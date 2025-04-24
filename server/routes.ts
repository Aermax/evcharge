import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertBookingSchema } from "@shared/schema";
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import stationRoutes from "./station";


export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes
  setupAuth(app);

  // API routes

  app.use("/api", stationRoutes); // your route is now: POST /api/stations
  // Get all stations
  app.get("/api/stations", async (req, res) => {
    try {
      const stations = await storage.getAllStations();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stations" });
    }
  });

  // Get a single station by ID
  app.get("/api/stations/:id", async (req, res) => {
    try {
      const stationId = parseInt(req.params.id);
      const station = await storage.getStation(stationId);
      
      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }
      
      res.json(station);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch station" });
    }
  });

  // Get ports for a station
  app.get("/api/stations/:id/ports", async (req, res) => {
    try {
      const stationId = parseInt(req.params.id);
      const ports = await storage.getPortsByStationId(stationId);
      res.json(ports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ports" });
    }
  });

  // Create a booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to make a booking" });
    }

    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user?.id
      });
      
      // Check if port is available
      const port = await storage.getPort(bookingData.portId);
      if (!port) {
        return res.status(404).json({ error: "Port not found" });
      }
      
      if (port.status !== "available") {
        return res.status(400).json({ error: "This port is not available for booking" });
      }
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid booking data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Get user's bookings
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to view bookings" });
    }

    try {
      const bookings = await storage.getBookingsByUserId(req.user?.id);
      
      // Enrich bookings with station information
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const station = await storage.getStation(booking.stationId);
          const port = await storage.getPort(booking.portId);
          return {
            ...booking,
            station,
            port
          };
        })
      );
      
      res.json(enrichedBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
  
  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // if (req.user.role !== "admin") {
    //   return res.status(403).json({ error: "Not authorized" });
    // }
    
    try {
      const users = await storage.getUsersByRole("user");
      // const stationOwners = await storage.getUsersByRole("stationOwner");
      // const admins = await storage.getUsersByRole("admin");
      
      // Return all users
      res.json([...users]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Get all bookings (admin only)
  app.get("/api/bookings/all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // if (req.user.role !== "admin") {
    //   return res.status(403).json({ error: "Not authorized" });
    // }
    
    try {
      // We would need to implement this in the storage interface
      // For now, let's just return an empty array
      const allBookings = [];
      for (let i = 1; i <= 4; i++) {
        const stationBookings = await storage.getBookingsByStationId(i);
        allBookings.push(...stationBookings);
      }
      
      res.json(allBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all bookings" });
    }
  });
  
  // Get stations by owner ID
  app.get("/api/stations/owner/:ownerId", async (req, res) => {
    try {
      const ownerId = parseInt(req.params.ownerId);
      const stations = await storage.getStationsByOwnerId(ownerId);
      res.json(stations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch owner stations" });
    }
  });
  
  // Get bookings for multiple stations
  app.get("/api/bookings/stations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { ids } = req.query;
      if (!ids) {
        return res.status(400).json({ error: "Station IDs are required" });
      }
      
      const stationIds = String(ids).split(",").map(id => parseInt(id));
      
      const allBookings = [];
      for (const stationId of stationIds) {
        const bookings = await storage.getBookingsByStationId(stationId);
        allBookings.push(...bookings);
      }
      
      res.json(allBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch station bookings" });
    }
  });

  // Update booking status
  app.patch("/api/bookings/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to update a booking" });
    }

    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Only the booking owner can update it
      if (booking.userId !== req.user?.id) {
        return res.status(403).json({ error: "You don't have permission to update this booking" });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });
  app.use(bodyParser.json());

  // Mock API route to simulate Ollama integration
  app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
  
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }
  
    try {
      const ollamaRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5-coder',
          messages: [{ role: 'user', content: message }],
          stream: false // use streaming if you want progressive response
        })
      });
  
      const data = await ollamaRes.json();
  
      // Extract the full message content
      const responseText = data.message?.content;
  
      if (!responseText) {
        return res.status(500).json({ error: 'No response from bot' });
      }
  
      return res.json({ response: responseText });
  
    } catch (error) {
      console.error('[OLLAMA ERROR]', error);
      return res.status(500).json({ error: 'Failed to get response from the bot' });
    }
  });



  const httpServer = createServer(app);
  return httpServer;

} 








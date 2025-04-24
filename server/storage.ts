import { 
  User, InsertUser, Station, InsertStation, 
  Port, InsertPort, Booking, InsertBooking 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { MongoClient } from "mongodb";

import dotenv from "dotenv"

dotenv.config()

const MemoryStore = createMemoryStore(session);

// MongoDB connection string - use a default for development
const MONGODB_URI = process.env.MONGODB_URI;

// Storage interface defines all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Station operations
  getAllStations(): Promise<Station[]>;
  getStation(id: number): Promise<Station | undefined>;
  createStation(station: InsertStation): Promise<Station>;
  getStationsByOwnerId(ownerId: number): Promise<Station[]>;
  
  // Port operations
  getPortsByStationId(stationId: number): Promise<Port[]>;
  getPort(id: number): Promise<Port | undefined>;
  createPort(port: InsertPort): Promise<Port>;
  updatePortStatus(id: number, status: string): Promise<Port>;
  
  // Booking operations
  getBookingsByUserId(userId: number): Promise<Booking[]>;
  getBookingsByStationId(stationId: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  
  // Payment operations
  processUpiPayment(bookingId: number, upiId: string, amount: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
  
  // MongoDB connection (optional - only set when using MongoDB)
  mongoClient?: MongoClient;
  db?: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stations: Map<number, Station>;
  private ports: Map<number, Port>;
  private bookings: Map<number, Booking>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentStationId: number;
  currentPortId: number;
  currentBookingId: number;

  constructor() {
    this.users = new Map();
    this.stations = new Map();
    this.ports = new Map();
    this.bookings = new Map();
    this.currentUserId = 1;
    this.currentStationId = 1;
    this.currentPortId = 1;
    this.currentBookingId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every day
    });
    
    // Add some initial stations for demo
    this.seedStations();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      role: insertUser.role || "user" // Default to "user" if not specified
    };
    this.users.set(id, user);
    return user;
  }
  
  // Get users by role
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role);
  }
  
  // Get stations by owner ID
  async getStationsByOwnerId(ownerId: number): Promise<Station[]> {
    return Array.from(this.stations.values())
      .filter(station => station.ownerId === ownerId);
  }

  // Station operations
  async getAllStations(): Promise<Station[]> {
    return Array.from(this.stations.values());
  }

  async getStation(id: number): Promise<Station | undefined> {
    return this.stations.get(id);
  }

  async createStation(insertStation: InsertStation): Promise<Station> {
    const id = this.currentStationId++;
    const station: Station = { ...insertStation, id };
    this.stations.set(id, station);
    return station;
  }

  // Port operations
  async getPortsByStationId(stationId: number): Promise<Port[]> {
    return Array.from(this.ports.values()).filter(
      (port) => port.stationId === stationId,
    );
  }

  async getPort(id: number): Promise<Port | undefined> {
    return this.ports.get(id);
  }

  async createPort(insertPort: InsertPort): Promise<Port> {
    const id = this.currentPortId++;
    const port: Port = { ...insertPort, id };
    this.ports.set(id, port);
    return port;
  }

  async updatePortStatus(id: number, status: string): Promise<Port> {
    const port = this.ports.get(id);
    if (!port) throw new Error("Port not found");
    
    const updatedPort = { ...port, status };
    this.ports.set(id, updatedPort);
    return updatedPort;
  }

  // Booking operations
  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId,
    );
  }

  async getBookingsByStationId(stationId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.stationId === stationId,
    );
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const createdAt = new Date();
    const booking: Booking = { ...insertBooking, id, createdAt };
    this.bookings.set(id, booking);
    
    // Update port status to in-use
    await this.updatePortStatus(insertBooking.portId, "in-use");
    
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    const booking = this.bookings.get(id);
    if (!booking) throw new Error("Booking not found");
    
    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    
    // If booking is cancelled or completed, update port status to available
    if (status === "cancelled" || status === "completed") {
      await this.updatePortStatus(booking.portId, "available");
    }
    
    return updatedBooking;
  }

  // Process UPI payment
  async processUpiPayment(bookingId: number, upiId: string, amount: number): Promise<boolean> {
    // Dummy implementation - in a real app this would integrate with a UPI payment gateway
    console.log(`Processing UPI payment of ₹${amount} from ${upiId} for booking #${bookingId}`);
    
    // Simulate payment processing with 90% success rate
    const isSuccess = Math.random() < 0.9;
    
    if (isSuccess) {
      const booking = this.bookings.get(bookingId);
      if (booking) {
        const updatedBooking = { ...booking, paymentStatus: "paid" };
        this.bookings.set(bookingId, updatedBooking);
      }
    }
    
    return isSuccess;
  }
  
  // Seed some initial data for demo purposes
  private seedStations() {
    // Lonavala Charging Hub
    const station1: Station = {
      id: this.currentStationId++,
      name: "Lonavala Central EV Hub",
      address: "Near Lonavala Railway Station, Lonavala",
      latitude: "18.7546",
      longitude: "73.4039",
      pricePerKwh: "12.50",
      powerKw: 50,
      connectorTypes: ["CCS", "CHAdeMO"],
      description: "Centrally located charging station near Lonavala railway station",
      amenities: ["Restrooms", "Cafe", "WiFi"],
      rating: "4.8",
      reviewCount: 36,
      distance: "0.8"
    };
    this.stations.set(station1.id, station1);
    
    // Add ports for station 1
    this.createPort({
      stationId: station1.id,
      name: "Port #1",
      type: "CCS Combo",
      powerKw: 50,
      status: "available"
    });
    
    this.createPort({
      stationId: station1.id,
      name: "Port #2",
      type: "CCS Combo",
      powerKw: 50,
      status: "available"
    });
    
    this.createPort({
      stationId: station1.id,
      name: "Port #3",
      type: "CHAdeMO",
      powerKw: 50,
      status: "available"
    });
    
    this.createPort({
      stationId: station1.id,
      name: "Port #4",
      type: "CHAdeMO",
      powerKw: 50,
      status: "in-use"
    });
    
    // Bushi Dam Charging Station
    const station2: Station = {
      id: this.currentStationId++,
      name: "Bushi Dam ECO Charging",
      address: "Near Bushi Dam, Lonavala",
      latitude: "18.7629",
      longitude: "73.4048",
      pricePerKwh: "11.75",
      powerKw: 22,
      connectorTypes: ["Type 2"],
      description: "Scenic charging location near Bushi Dam",
      amenities: ["Parking", "Restaurant", "Scenic View"],
      rating: "4.5",
      reviewCount: 24,
      distance: "1.3"
    };
    this.stations.set(station2.id, station2);
    
    // Add ports for station 2
    this.createPort({
      stationId: station2.id,
      name: "Port #1",
      type: "Type 2",
      powerKw: 22,
      status: "available"
    });
    
    this.createPort({
      stationId: station2.id,
      name: "Port #2",
      type: "Type 2",
      powerKw: 22,
      status: "in-use"
    });
    
    // Karla Caves Supercharger
    const station3: Station = {
      id: this.currentStationId++,
      name: "Karla Caves Supercharger",
      address: "NH4 Highway, Near Karla Caves",
      latitude: "18.7858",
      longitude: "73.4537",
      pricePerKwh: "13.25",
      powerKw: 150,
      connectorTypes: ["CCS", "CHAdeMO", "Tesla"],
      description: "Ultra-fast charging with 150kW capability near Karla Caves",
      amenities: ["Restrooms", "Shop", "Lounge", "WiFi"],
      rating: "4.9",
      reviewCount: 42,
      distance: "3.2"
    };
    this.stations.set(station3.id, station3);
    
    // Add ports for station 3
    this.createPort({
      stationId: station3.id,
      name: "Port #1",
      type: "CCS Combo",
      powerKw: 150,
      status: "available"
    });
    
    this.createPort({
      stationId: station3.id,
      name: "Port #2",
      type: "CCS Combo",
      powerKw: 150,
      status: "available"
    });
    
    this.createPort({
      stationId: station3.id,
      name: "Port #3",
      type: "CHAdeMO",
      powerKw: 100,
      status: "available"
    });
    
    this.createPort({
      stationId: station3.id,
      name: "Port #4",
      type: "Tesla",
      powerKw: 150,
      status: "available"
    });
    
    this.createPort({
      stationId: station3.id,
      name: "Port #5",
      type: "Tesla",
      powerKw: 150,
      status: "available"
    });
    
    // Tiger Point EV Station
    const station4: Station = {
      id: this.currentStationId++,
      name: "Tiger Point EV Station",
      address: "Tiger Point, Lonavala",
      latitude: "18.7122",
      longitude: "73.3882",
      pricePerKwh: "12.80",
      powerKw: 75,
      connectorTypes: ["CCS", "Type 2"],
      description: "Convenient charging near Tiger Point with valley views",
      amenities: ["Restrooms", "Coffee Shop", "Scenic View"],
      rating: "4.7",
      reviewCount: 28,
      distance: "1.9"
    };
    this.stations.set(station4.id, station4);
    
    // Add ports for station 4
    this.createPort({
      stationId: station4.id,
      name: "Port #1",
      type: "CCS Combo",
      powerKw: 75,
      status: "available"
    });
    
    this.createPort({
      stationId: station4.id,
      name: "Port #2",
      type: "Type 2",
      powerKw: 22,
      status: "in-use"
    });
  }
}

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  sessionStore: session.Store;
  mongoClient?: MongoClient;
  db?: any;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Connect to MongoDB asynchronously
    this.connect().catch(err => {
      console.error('Failed to connect to MongoDB:', err);
    });
  }
  
  // User role operations
  async getUsersByRole(role: string): Promise<User[]> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const users = await db?.collection('users').find().toArray();
    return users;
  }
  
  // Get stations by owner ID
  async getStationsByOwnerId(ownerId: number): Promise<Station[]> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const stations = await db?.collection('stations').find({ ownerId }).toArray();
    return stations || [];
  }
  
  private async connect() {
    try {
      this.mongoClient = new MongoClient(MONGODB_URI);
      await this.mongoClient.connect();
      console.log('Connected to MongoDB');
      
      const dbName = new URL(MONGODB_URI).pathname.substring(1) || 'chargepulse';
      const mongoDb = this.mongoClient.db(dbName);
      
      // Use MongoDB directly
      this.db = mongoDb;
      
      // Check if we have any users
      const usersCollection = mongoDb.collection('users');
      const userCount = await usersCollection.countDocuments();
      
      // Seed data if empty database
      if (userCount === 0) {
        await this.seedData(mongoDb);
      }
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
  
  private async seedData(mongoDb: any) {
    // Seed with memory storage implementation temporarily
    const memStorage = new MemStorage();
    
    // Create test user
    await mongoDb.collection('users').insertOne({
      id: 1,
      username: 'a',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'a'
      email: 'a@a.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date()
    });
    
    // Get stations from memory storage and insert to MongoDB
    const stations = await memStorage.getAllStations();
    if (stations.length > 0) {
      await mongoDb.collection('stations').insertMany(stations);
    }
    
    // For each station, get and insert ports
    for (const station of stations) {
      const ports = await memStorage.getPortsByStationId(station.id);
      if (ports.length > 0) {
        await mongoDb.collection('ports').insertMany(ports);
      }
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const user = await db?.collection('users').findOne({ id });
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const user = await db?.collection('users').findOne({ username });
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    // Get the next ID
    const maxUser = await db?.collection('users').find().sort({ id: -1 }).limit(1).toArray();
    const id = maxUser && maxUser.length > 0 ? maxUser[0].id + 1 : 1;
    
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    
    await db?.collection('users').insertOne(user);
    return user;
  }
  
  // Station operations
  async getAllStations(): Promise<Station[]> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    try {
      const stations = await db?.collection('stations').find().toArray();
      return stations || [];
    } catch (error) {
      console.error("Error getting stations:", error);
      return [];
    }
  }
  
  async getStation(id: number): Promise<Station | undefined> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const station = await db?.collection('stations').findOne({ id });
    return station || undefined;
  }
  
  async createStation(insertStation: InsertStation): Promise<Station> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    // Get the next ID
    const maxStation = await db?.collection('stations').find().sort({ id: -1 }).limit(1).toArray();
    const id = maxStation && maxStation.length > 0 ? maxStation[0].id + 1 : 1;
    
    const station: Station = { ...insertStation, id };
    
    await db?.collection('stations').insertOne(station);
    return station;
  }
  
  // Port operations
  async getPortsByStationId(stationId: number): Promise<Port[]> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const ports = await db?.collection('ports').find({ stationId }).toArray();
    return ports || [];
  }
  
  async getPort(id: number): Promise<Port | undefined> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const port = await db?.collection('ports').findOne({ id });
    return port || undefined;
  }
  
  async createPort(insertPort: InsertPort): Promise<Port> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    // Get the next ID
    const maxPort = await db?.collection('ports').find().sort({ id: -1 }).limit(1).toArray();
    const id = maxPort && maxPort.length > 0 ? maxPort[0].id + 1 : 1;
    
    const port: Port = { ...insertPort, id };
    
    await db?.collection('ports').insertOne(port);
    return port;
  }
  
  async updatePortStatus(id: number, status: string): Promise<Port> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    await db?.collection('ports').updateOne(
      { id },
      { $set: { status } }
    );
    
    const port = await this.getPort(id);
    if (!port) throw new Error("Port not found");
    
    return port;
  }
  
  // Booking operations
  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const bookings = await db?.collection('bookings').find({ userId }).toArray();
    return bookings || [];
  }
  
  async getBookingsByStationId(stationId: number): Promise<Booking[]> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const bookings = await db?.collection('bookings').find({ stationId }).toArray();
    return bookings || [];
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    const booking = await db?.collection('bookings').findOne({ id });
    return booking || undefined;
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    // Get the next ID
    const maxBooking = await db?.collection('bookings').find().sort({ id: -1 }).limit(1).toArray();
    const id = maxBooking && maxBooking.length > 0 ? maxBooking[0].id + 1 : 1;
    
    const createdAt = new Date();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt,
      status: insertBooking.status || "pending" 
    };
    
    await db?.collection('bookings').insertOne(booking);
    
    // Update port status
    await this.updatePortStatus(insertBooking.portId, "in-use");
    
    return booking;
  }
  
  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    await db?.collection('bookings').updateOne(
      { id },
      { $set: { status } }
    );
    
    const booking = await this.getBooking(id);
    if (!booking) throw new Error("Booking not found");
    
    // If booking is cancelled or completed, update port status
    if (status === "cancelled" || status === "completed") {
      await this.updatePortStatus(booking.portId, "available");
    }
    
    return booking;
  }
  
  // Payment operations
  async processUpiPayment(bookingId: number, upiId: string, amount: number): Promise<boolean> {
    if (!this.mongoClient) await this.connect();
    const db = this.mongoClient?.db();
    
    // Simulate UPI payment processing
    console.log(`Processing UPI payment of ₹${amount} from ${upiId} for booking #${bookingId}`);
    
    // Simulate payment success with 90% probability
    const success = Math.random() < 0.9;
    
    // Update booking payment status
    if (success) {
      await db?.collection('bookings').updateOne(
        { id: bookingId },
        { $set: { paymentStatus: "paid" } }
      );
    }
    
    return success;
  }
}

// Use memory storage for development
// `export const storage = new MemStorage();`

// Uncomment to use MongoDB storage with valid credentials
export const storage = new MongoStorage();
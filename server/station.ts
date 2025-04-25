import express from "express";
import { storage } from "./storage.ts";
import { InsertStation } from "@shared/schema.ts";

export interface ChargingStation {
    id: string;
    name: string;
    location: string;
    slots: number;
  }

const router = express.Router();


router.post("/stations", async (req, res) => {
  try {
    const { name, address,latitude, longitude, pricePerKwh, powerKw , connectorTypes, ownerId,vehicle} = req.body;

    if (!name || !address || !latitude || !longitude || !pricePerKwh || !powerKw || !ownerId) {
      return res.status(400).json({ error: "All fields are required" });
    }
      if ( !Array.isArray(connectorTypes)) {
        return res.status(400).json({ error: "connectorTypes should be an array of string" });
      }


    const station: InsertStation = { name, address,latitude, longitude, pricePerKwh, powerKw, ownerId};
    const result = await storage.createStation(station);

    res.status(201).json({ message: "Station created", stationId: result.id });
  } catch (err) {
    console.error("Error creating station:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import mongoose from "mongoose";
import { ENV } from "./env.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(ENV.DB_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    console.error("All MongoDB connection attempts failed. Exiting.");
    process.exit(1);
  }
};
import express from "express";
import 'dotenv/config'
import {Controller} from "./src/endpoints/controller/controller.js";
import session from 'express-session';
import { MemoryStore } from 'express-session'; 
import cors from 'cors';
import bodyParser from "body-parser";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
const sql = neon(process.env.DATABASE_URI);
const db = drizzle({ client: sql });
export const pingDatabase = async () => {
  try {
    // Execute a simple query (SELECT 1 is commonly used for health checks)
    const result = await db.select();
    return !!result; // Returns true if successful
  } catch (error) {
    console.error("Database ping failed:", error);
    return false;
  }
};
pingDatabase().then((isConnected) => {
  if (isConnected) {
    console.log("✅ Database connection is healthy");
  } else {
    console.error("❌ Database connection failed");
  }
});
let app = express();
let controller = new Controller(db);
app.set('trust proxy', 1); 
app.use(
  cors({
    origin: 'https://adams-aouc.vercel.app',
    credentials: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true })); // for parsing form data
app.use(bodyParser.json());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  proxy: true, 
  store: new MemoryStore(), 
  cookie: { 
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
app.post('/register', controller.postRegister);
app.post('/login', controller.postLogin);
app.post('/scanner-data', controller.postScannerData);
app.post('/record-journey', controller.postRecordJourney);
app.get('/scanner-data', controller.getScannerData);
app.get('/pollution-exposure', controller.getExposureDataById)
app.get('/get-heatmap', controller.calculateMap)
app.get('/gemini-explanation', controller.generateGemini)
app.get('/mission', controller.getMission);
app.post('/auth/mission', controller.postMission);
app.delete('/auth/mission', controller.deleteMission);
app.post('/logout', controller.postLogout);
app.post("/mission/progress", controller.postUserMissionProgress);
app.post('/google-signin', controller.postGoogleSignIn);
// Use PORT from env or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
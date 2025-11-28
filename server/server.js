import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest } from "./inngest/index.js";
import * as functions from "./inngest/functions/index.js";  // FIX

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// Test route
app.get("/", (req, res) => res.send("server is live!"));

// Correct Inngest route
app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server is running on ${PORT}`));

import express from "express";
import { serve } from "inngest/express";
import { inngest } from "../inngest/index.js";
import * as functions from "../inngest/functions/index.js";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import serverless from "serverless-http";

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("server is live!"));

// Inngest route
app.use("/api/inngest", serve({ client: inngest, functions }));

export default serverless(app); // IMPORTANT

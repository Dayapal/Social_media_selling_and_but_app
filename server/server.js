import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";

import { inngest, functions } from "../server/inngest/index.js";
import listingRouter from "./routes/listing.route.js";
import chatRouter from "./routes/chat.route.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("server is live!"));
app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("api/listing", listingRouter);
app.use("api/chat", chatRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server is running on ${PORT}`));

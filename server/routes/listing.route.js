import express from "express";
import {
  addListing,
  updateListing,
  getAllPublicListing,
  getAllUserListing,
  deleteUserListing,
  toggleStatus,
  addCredential,
  markFeatured,
  getAllUserOrders,   // corrected export name
  withdrawnAmount,
  purchaseAccount,
} from "../controllers/listing.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import upload from "../configs/multer.js";

const listingRouter = express.Router();

// CREATE LISTING
listingRouter.post("/", protect, upload.array("images", 5), addListing);

// UPDATE LISTING
listingRouter.put("/", protect, upload.array("images", 5), updateListing);

// PUBLIC LISTINGS
listingRouter.get("/public", getAllPublicListing);

// USER LISTINGS
listingRouter.get("/user", protect, getAllUserListing);

// TOGGLE STATUS
listingRouter.put("/:id/status", protect, toggleStatus);

// DELETE LISTING  (FIXED SPELLING)
listingRouter.delete("/:listingId", protect, deleteUserListing);

// ADD CREDENTIAL
listingRouter.post("/add-credential", protect, addCredential);

// FEATURED
listingRouter.put("/featured/:id", protect, markFeatured);

// USER ORDERS  (FIXED NAME)
listingRouter.get("/user-orders", protect, getAllUserOrders);

// WITHDRAW
listingRouter.post("/withdraw", protect, withdrawnAmount);

// PURCHASE ACCOUNT
listingRouter.post("/purchase-account/:listingId", protect, purchaseAccount);

export default listingRouter;

import express from "express";
import {
    addCredential,
  addListing,
  deleteUserListing,
  getAllPulicListing,
  getAllUserListing,
  getAllUserOders,
  markFeatured,
  purchaseAccount,
  toggleStatus,
  updateListing,
  withdrawnAmount,
} from "../controllers/listing.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import upload from "../configs/multer.js";

const listingRouter = express.Router();

listingRouter.post("/", upload.array("images", 5), protect, addListing);
listingRouter.put("/", upload.array("images", 5), protect, updateListing);
listingRouter.get("/public", getAllPulicListing);
listingRouter.get("/user", protect, getAllUserListing);
listingRouter.put("/:id/status", protect, toggleStatus);
listingRouter.delete("/:listtingId", protect, deleteUserListing);
listingRouter.post("/add-credential", protect, addCredential);
listingRouter.put("/featured/:id", protect, markFeatured);
listingRouter.get("/user-orders", protect, getAllUserOders);
listingRouter.post("/withdraw", protect, withdrawnAmount);
listingRouter.post("/purchase-account/:listingId", protect, purchaseAccount);

export default listingRouter;

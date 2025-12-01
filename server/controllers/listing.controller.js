// controllers/listing.controller.js
import imagekit from "../configs/imageKit.js";
import prisma from "../configs/prisma.js";
import fs from "fs/promises"; // use promise API
import path from "path";

/**
 * Helper utilities
 */
const safeString = (v) => (v === null || v === undefined ? "" : String(v));
const toNumberSafe = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const cleanupTempFiles = async (files = []) => {
  // files: array of { path }
  await Promise.all(
    files.map(async (f) => {
      try {
        if (f && f.path) await fs.unlink(f.path);
      } catch (err) {
        // ignore unlink errors (log server-side)
        console.warn(
          "Failed to delete temp file:",
          f?.path,
          err?.message || err
        );
      }
    })
  );
};

const uploadFilesToImageKit = async (files = []) => {
  if (!files.length) return [];

  const uploads = files.map(async (file) => {
    const uploaded = await imagekit.files.upload({
      file: file.buffer.toString("base64"),  // ⭐ convert buffer → base64
      fileName: `${Date.now()}-${file.originalname}`,
      folder: "Social_Media_Selling_App",
    });

    return uploaded.url;
  });

  return Promise.all(uploads);
};


/**
 * Add Listing
 */
export const addListing = async (req, res) => {
  try {
    const { userId } = await req.auth();
    // req.plan should be set by middleware (e.g. auth middleware). If not set, treat as non-premium.
    const plan = safeString(req.plan).toLowerCase();

    if (plan !== "premium") {
      const listingCount = await prisma.listing.count({
        where: { ownerId: userId },
      });
      if (listingCount >= 5) {
        // cleanup uploaded temp files before returning
        if (req.files && req.files.length) await cleanupTempFiles(req.files);
        return res.status(400).json({
          message:
            "You have reached the free listing limit (5). Upgrade to premium to add more.",
        });
      }
    }

    // Basic validation & parsing
    const accountDetailsRaw = req.body?.accountDetails;
    if (!accountDetailsRaw) {
      if (req.files && req.files.length) await cleanupTempFiles(req.files);
      return res
        .status(400)
        .json({ message: "Missing accountDetails in request body." });
    }

    const accountDetails = JSON.parse(accountDetailsRaw);

    // parse numeric fields safely
    accountDetails.followers_count = toNumberSafe(
      accountDetails.followers_count,
      0
    );
    accountDetails.engagement_rate = toNumberSafe(
      accountDetails.engagement_rate,
      0
    );
    accountDetails.monthly_views = toNumberSafe(
      accountDetails.monthly_views,
      0
    );
    accountDetails.price = toNumberSafe(accountDetails.price, 0);

    // sanitize strings
    accountDetails.platform = safeString(accountDetails.platform).toLowerCase();
    accountDetails.niche = safeString(accountDetails.niche).toLowerCase();
    accountDetails.title = safeString(accountDetails.title);
    accountDetails.username = safeString(accountDetails.username);

    if (accountDetails.username.startsWith("@")) {
      accountDetails.username = accountDetails.username.slice(1);
    }

    // images validation
    const incomingFiles = Array.isArray(req.files) ? req.files : [];
    if (incomingFiles.length > 5) {
      await cleanupTempFiles(incomingFiles);
      return res
        .status(400)
        .json({ message: "You can upload up to 5 images." });
    }

    // upload files (if any)
    let images = [];
    if (incomingFiles.length > 0) {
      try {
        images = await uploadFilesToImageKit(incomingFiles);
      } catch (uploadErr) {
        // cleanup temp files and return error
        await cleanupTempFiles(incomingFiles);
        console.error("Image upload error:", uploadErr);
        return res.status(500).json({ message: "Failed to upload images" });
      } finally {
        // always try to remove temp files
        await cleanupTempFiles(incomingFiles);
      }
    }

    // create listing
    const listing = await prisma.listing.create({
      data: {
        ownerId: userId,
        images,
        ...accountDetails,
      },
    });

    return res
      .status(201)
      .json({ message: "Account listed successfully", listing });
  } catch (error) {
    console.error("addListing error:", error);
    // try to cleanup any temp files if present
    if (req.files && req.files.length) await cleanupTempFiles(req.files);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Get all public listings
 */
export const getAllPublicListing = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "active" },
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ listings: listings ?? [] });
  } catch (error) {
    console.error("getAllPublicListing error:", error);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Get all user listings (with balance)
 */
export const getAllUserListing = async (req, res) => {
  try {
    const { userId } = await req.auth();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const listings = await prisma.listing.findMany({
      where: { ownerId: userId, status: { not: "deleted" } },
      orderBy: { createdAt: "desc" },
    });

    const balance = {
      earned: toNumberSafe(user.earned, 0),
      withdrawn: toNumberSafe(user.withdrawn, 0),
      available: toNumberSafe(user.earned, 0) - toNumberSafe(user.withdrawn, 0),
    };

    return res.json({ listings: listings ?? [], balance });
  } catch (error) {
    console.error("getAllUserListing error:", error);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Update a listing (single update, images merged)
 */
export const updateListing = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const rawDetails = req.body?.accountDetails;
    if (!rawDetails) {
      if (req.files && req.files.length) await cleanupTempFiles(req.files);
      return res.status(400).json({ message: "Missing accountDetails" });
    }

    const accountDetails = JSON.parse(rawDetails);

    // ensure id present
    const listingId = accountDetails?.id;
    if (!listingId) {
      if (req.files && req.files.length) await cleanupTempFiles(req.files);
      return res.status(400).json({ message: "Missing listing id" });
    }

    // get existing listing first
    const existing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!existing) {
      if (req.files && req.files.length) await cleanupTempFiles(req.files);
      return res.status(404).json({ message: "Listing not found" });
    }

    // ownership check
    if (existing.ownerId !== userId) {
      if (req.files && req.files.length) await cleanupTempFiles(req.files);
      return res
        .status(403)
        .json({ message: "You are not the owner of this listing" });
    }

    // cannot update sold listing
    if (existing.status === "sold") {
      if (req.files && req.files.length) await cleanupTempFiles(req.files);
      return res
        .status(400)
        .json({ message: "You can't update a sold listing" });
    }

    // images + validation
    const incomingFiles = Array.isArray(req.files) ? req.files : [];
    const existingImages = Array.isArray(accountDetails.images)
      ? accountDetails.images
      : existing.images ?? [];
    if (incomingFiles.length + existingImages.length > 5) {
      await cleanupTempFiles(incomingFiles);
      return res
        .status(400)
        .json({ message: "You can only upload up to 5 images total" });
    }

    // parse numeric fields safely and sanitize strings
    accountDetails.followers_count = toNumberSafe(
      accountDetails.followers_count,
      existing.followers_count ?? 0
    );
    accountDetails.engagement_rate = toNumberSafe(
      accountDetails.engagement_rate,
      existing.engagement_rate ?? 0
    );
    accountDetails.monthly_views = toNumberSafe(
      accountDetails.monthly_views,
      existing.monthly_views ?? 0
    );
    accountDetails.price = toNumberSafe(
      accountDetails.price,
      existing.price ?? 0
    );

    accountDetails.platform = safeString(
      accountDetails.platform || existing.platform
    ).toLowerCase();
    accountDetails.niche = safeString(
      accountDetails.niche || existing.niche
    ).toLowerCase();
    accountDetails.title = safeString(accountDetails.title || existing.title);
    accountDetails.username = safeString(
      accountDetails.username || existing.username
    );
    if (accountDetails.username.startsWith("@"))
      accountDetails.username = accountDetails.username.slice(1);

    // upload new images (if any)
    let newImageUrls = [];
    if (incomingFiles.length > 0) {
      try {
        newImageUrls = await uploadFilesToImageKit(incomingFiles);
      } catch (uploadErr) {
        await cleanupTempFiles(incomingFiles);
        console.error("Image upload error:", uploadErr);
        return res.status(500).json({ message: "Failed to upload images" });
      } finally {
        await cleanupTempFiles(incomingFiles);
      }
    }

    const finalImages = [...existingImages, ...newImageUrls];

    // prepare data to update (don't accidentally overwrite fields that are undefined)
    const dataToUpdate = {
      ...accountDetails,
      images: finalImages,
    };

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: dataToUpdate,
    });

    return res.json({
      message: "Account updated successfully",
      listing: updated,
    });
  } catch (error) {
    console.error("updateListing error:", error);
    if (req.files && req.files.length) await cleanupTempFiles(req.files);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Toggle status (active <-> inactive) — owner only
 */
export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = await req.auth();

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Listing not found" });

    if (existing.ownerId !== userId)
      return res.status(403).json({ message: "Not the owner" });

    if (existing.status === "ban")
      return res.status(400).json({ message: "Your listing is banned" });
    if (existing.status === "sold")
      return res.status(400).json({ message: "Your listing is sold" });

    const newStatus = existing.status === "active" ? "inactive" : "active";
    await prisma.listing.update({ where: { id }, data: { status: newStatus } });

    const updated = await prisma.listing.findUnique({ where: { id } });
    return res.json({
      message: "Listing status updated successfully",
      listing: updated,
    });
  } catch (error) {
    console.error("toggleStatus error:", error);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Soft-delete user listing (sets status = deleted). Owner only.
 */
export const deleteUserListing = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { listingId } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.ownerId !== userId)
      return res.status(403).json({ message: "Not the owner" });

    if (listing.status === "sold")
      return res.status(400).json({ message: "Sold listing can't be deleted" });

    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "deleted" },
    });

    return res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("deleteUserListing error:", error);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Add credential for a listing (owner only)
 */
export const addCredential = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { listingId, credential } = req.body;

    // 1️⃣ Validate basic fields
    if (!listingId || !credential || !Array.isArray(credential)) {
      return res.status(400).json({ message: "Invalid credential format" });
    }

    // 2️⃣ Validate each credential field
    for (const c of credential) {
      if (!c.name || !c.value) {
        return res
          .status(400)
          .json({ message: `Missing name/value for a credential field` });
      }
    }

    // 3️⃣ Validate listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.ownerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 4️⃣ Save JSON directly (THIS FIXES YOUR ERROR)
    await prisma.credential.create({
      data: {
        listingId,
        originalCredential: credential, // <-- JSON array, correct format
      },
    });

    // 5️⃣ Mark listing updated
    await prisma.listing.update({
      where: { id: listingId },
      data: { isCredentialSubmitted: true },
    });

    return res.json({ message: "Credential added successfully" });
  } catch (error) {
    console.error("addCredential error:", error);
    return res.status(500).json({
      message: error?.message || "Internal server error",
    });
  }
};




/**
 * Mark listing as featured (premium only, owner only)
 */
export const markFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = await req.auth();

    // plan check - middleware should set req.plan (string). Treat undefined as non-premium.
    const plan = safeString(req.plan).toLowerCase();
    if (plan !== "premium")
      return res.status(403).json({ message: "Premium plan required" });

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.ownerId !== userId)
      return res.status(403).json({ message: "Not the owner" });

    // Unset other featured listings for this owner then set this one
    await prisma.listing.updateMany({
      where: { ownerId: userId },
      data: { featured: false },
    });
    await prisma.listing.update({ where: { id }, data: { featured: true } });

    const updated = await prisma.listing.findUnique({ where: { id } });
    return res.json({
      message: "Listing marked as featured",
      listing: updated,
    });
  } catch (error) {
    console.error("markFeatured error:", error);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Get all user orders (renamed from Oders)
 */
export const getAllUserOrders = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const orders = await prisma.transaction.findMany({
      where: { userId, isPaid: true },
      include: { listing: true },
    });

    if (!orders || orders.length === 0) return res.json({ orders: [] });

    const credentials = await prisma.credential.findMany({
      where: { listingId: { in: orders.map((o) => o.listingId) } },
    });

    const ordersWithCredentials = orders.map((order) => {
      const cred = credentials.find((c) => c.listingId === order.listingId);
      return { ...order, credential: cred ?? null };
    });

    return res.json({ orders: ordersWithCredentials });
  } catch (error) {
    console.error("getAllUserOrders error:", error);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * Withdrawn amount (keeps same logic, added validation)
 */
export const withdrawnAmount = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { amount, account } = req.body;

    const amt = toNumberSafe(amount, 0);
    if (amt <= 0) return res.status(400).json({ message: "Invalid amount" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const balance =
      toNumberSafe(user.earned, 0) - toNumberSafe(user.withdrawn, 0);
    if (amt > balance)
      return res.status(400).json({ message: "Insufficient balance" });

    const withdrawal = await prisma.withdrawal.create({
      data: { userId, amount: amt, account },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { withdrawn: { increment: amt } },
    });

    return res.json({ message: "Applied for withdrawal", withdrawal });
  } catch (error) {
    console.error("withdrawnAmount error:", error);
    return res
      .status(500)
      .json({
        message: error?.code || error?.message || "Internal server error",
      });
  }
};

/**
 * purchaseAccount (placeholder) - implement your payment flow here
 */
export const purchaseAccount = async (req, res) => {
  // NOTE: Implement your payment/provider integration here (Stripe, PayPal, Razorpay etc.)
  // Validate listing, ensure buyer is not owner, create transaction record, capture payment, mark isPaid, send credentials to buyer, etc.
  return res
    .status(501)
    .json({
      message: "purchaseAccount not implemented. Implement payment flow here.",
    });
};

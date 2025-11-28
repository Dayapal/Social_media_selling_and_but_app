import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create Inngest Client
export const inngest = new Inngest({ id: "earn-dedicated" });

/* -----------------------------------------------
   USER CREATED
------------------------------------------------ */
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-created" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { data } = event;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { id: data.id },
    });

    const email = data?.email_addresses?.[0]?.email_address;
    const name = `${data?.first_name || ""} ${data?.last_name || ""}`.trim();

    if (user) {
      // Update if exists
      await prisma.user.update({
        where: { id: data.id },
        data: { email, name, image: data?.image_url },
      });
      return;
    }

    // Create user
    await prisma.user.create({
      data: {
        id: data.id,
        email,
        name,
        image: data?.image_url,
      },
    });
  }
);

/* -----------------------------------------------
   USER DELETED
------------------------------------------------ */
export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-deleted" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data } = event;

    const listings = await prisma.listing.findMany({
      where: { ownerId: data.id },
    });

    const chats = await prisma.chat.findMany({
      where: { OR: [{ ownerUserId: data.id }, { chatUserId: data.id }] },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId: data.id },
    });

    // If user has no important links → delete user
    if (
      listings.length === 0 &&
      chats.length === 0 &&
      transactions.length === 0
    ) {
      await prisma.user.delete({ where: { id: data.id } });
    } else {
      // Otherwise deactivate listings
      await prisma.listing.updateMany({
        where: { ownerId: data.id },
        data: { status: "inactive" },
      });
    }
  }
);

/* -----------------------------------------------
   USER UPDATED
------------------------------------------------ */
export const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-updated" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { data } = event;

    const email = data?.email_addresses?.[0]?.email_address;
    const name = `${data?.first_name || ""} ${data?.last_name || ""}`.trim();

    await prisma.user.update({
      where: { id: data.id },
      data: {
        email,
        name,
        image: data?.image_url,
      },
    });
  }
);

/* -----------------------------------------------
   EXPORT ALL FUNCTIONS TO SERVER
------------------------------------------------ */
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
];

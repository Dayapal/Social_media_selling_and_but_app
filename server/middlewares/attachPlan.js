import prisma from "../configs/prisma.js";

export const attachPlan = async (req, res, next) => {
  try {
    const { userId } = await req.auth();

    if (!userId) {
      req.plan = "free";
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    req.plan = user?.plan || "free";

    next();
  } catch (err) {
    console.error("attachPlan error:", err);
    req.plan = "free";
    next();
  }
};

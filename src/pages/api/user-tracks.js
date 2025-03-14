import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const tracks = await prisma.track.findMany({
      where: { user: session.user.name },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(tracks);
  } catch (error) {
    console.error("Database fetch error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

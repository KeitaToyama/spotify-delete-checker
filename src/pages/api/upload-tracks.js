import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]"; // NextAuthの設定をインポート
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const tracks = req.body;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    await prisma.track.createMany({
      data: tracks.map((track) => ({
        user: session.user.name, // Spotifyのユーザー名
        name: track.name,
        artist: track.artist,
        album: track.album,
        url: track.url,
        playlistId: track.playlistId,
        isPlayable: track.isPlayable,
        image_url: track.image_url,
      })),
      skipDuplicates: true, // 既存のデータをスキップ
    });

    return res.status(200).json({ message: "Tracks successfully uploaded" });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

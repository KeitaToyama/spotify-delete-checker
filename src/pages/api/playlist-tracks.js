import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session || !session.user.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { playlistId } = req.query;
  if (!playlistId) {
    return res.status(400).json({ error: "Missing playlist ID" });
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=JP`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch playlist tracks");
    }

    // is_playable が false のトラックのみを抽出
    const unplayableTracks = data.items.filter(
      (item) => item.track && item.track.is_playable === false
    );

    console.log("再生不可のトラック:", unplayableTracks);

    res.status(200).json(unplayableTracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

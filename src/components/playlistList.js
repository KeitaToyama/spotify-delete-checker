import { useEffect, useState } from "react";
import { UnplayableTrackList } from "./UnplayableTrackList";

export default function PlaylistList() {
  const [unplayableTracks, setUnplayableTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    fetch("/api/playlists")
      .then((res) => res.json())
      .then((data) => setPlaylists(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    console.log("現在のunplayableTracks状態:", unplayableTracks);
    if (unplayableTracks.length > 0) {
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1000); // 1秒後にハイライトを解除
    }
  }, [unplayableTracks]);

  const handleCheck = async (playlistId) => {
    const response = await fetch(
      `/api/playlist-tracks?playlistId=${playlistId}`
    );
    const data = await response.json();
    if (Array.isArray(data)) {
      setUnplayableTracks((prevTracks) => [
        ...prevTracks,
        ...data.map((track) => ({
          id: track.track.id,
          name: track.track.name,
          artist: track.track.artists.map((artist) => artist.name),
          album: track.track.album.name,
          url: track.track.external_urls.spotify,
          playlistId,
          isPlayable: track.track.is_playable,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      ]);
    }
    // console.log("プレイリストのトラックデータ:", data);
  };

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>エラー: {error}</p>;
  if (!playlists.length) return <p>プレイリストがありません。</p>;

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          maxHeight: "80vh",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <h2>プレイリスト一覧</h2>
        {playlists.map((playlist) => (
          <div key={playlist.id}>
            <h3>{playlist.name}</h3>
            <button onClick={() => handleCheck(playlist.id)}>チェック</button>
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          maxHeight: "80vh",
          border: "1px solid #ccc",
          padding: "10px",
          transition: "background-color 0.5s ease",
          backgroundColor: highlight ? "#000080" : "transparent",
        }}
      >
        <UnplayableTrackList tracks={unplayableTracks} />
      </div>
    </div>
  );
}

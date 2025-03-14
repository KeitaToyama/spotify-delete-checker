import { useEffect, useState } from "react";
import { UnplayableTrackList } from "./UnplayableTrackList";
import { getSession } from "next-auth/react";

export default function PlaylistList() {
  const [unplayableTracks, setUnplayableTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [userTracks, setUserTracks] = useState([]);

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

  useEffect(() => {
    const fetchUserTracks = async () => {
      const response = await fetch("/api/user-tracks");
      const data = await response.json();
      if (Array.isArray(data)) {
        setUserTracks(data);
      }
    };
    fetchUserTracks();
  }, []);

  const handleCheck = async (playlistId) => {
    const response = await fetch(
      `/api/playlist-tracks?playlistId=${playlistId}`
    );
    const data = await response.json();
    if (Array.isArray(data)) {
      setUnplayableTracks((prevTracks) => {
        const newTracks = data.map((track) => ({
          id: track.track.id,
          name: track.track.name,
          artist: track.track.artists.map((artist) => artist.name),
          album: track.track.album.name,
          url: track.track.external_urls.spotify,
          playlistId,
          isPlayable: track.track.is_playable,
          image_url: track.track.album.images[0].url,
        }));

        // 重複を除外して追加
        const uniqueTracks = [...prevTracks, ...newTracks].filter(
          (track, index, self) =>
            index === self.findIndex((t) => t.id === track.id)
        );

        return uniqueTracks;
      });
    }
    // console.log("プレイリストのトラックデータ:", data);
  };

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>エラー: {error}</p>;
  if (!playlists.length) return <p>プレイリストがありません。</p>;

  const handleUpload = async () => {
    const session = await getSession();
    if (!session || !session.user) {
      console.error("ユーザー情報が取得できませんでした。");
      return;
    }
    const registeredUrls = new Set(userTracks.map((track) => track.url));

    const tracksToUpload = unplayableTracks
      .filter((track) => !registeredUrls.has(track.url))
      .map((track) => ({
        user: session.user.name, // Spotifyのユーザー名
        name: track.name,
        artist: track.artist,
        album: track.album,
        url: track.url,
        playlistId: track.playlistId,
        isPlayable: track.isPlayable,
        image_url: track.image_url,
      }));

    if (tracksToUpload.length === 0) {
      console.log(
        "全てのトラックがすでに登録されています。アップロードをスキップします。"
      );
      return;
    }

    const response = await fetch("/api/upload-tracks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tracksToUpload),
    });

    if (response.ok) {
      console.log("データベースに登録されました。");

      // サーバーから新しいデータを取得し、即時反映
      const updatedTracks = await fetch("/api/user-tracks").then((res) =>
        res.json()
      );
      setUserTracks(updatedTracks);

      // unplayableTracks もリセット
      setUnplayableTracks([]);
    } else {
      console.error("登録に失敗しました。", await response.text());
    }
  };

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
        }}
      >
        <UserTracks tracks={userTracks} />
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
        {unplayableTracks.length > 0 && (
          <button onClick={handleUpload}>データベースに登録</button>
        )}
      </div>
    </div>
  );
}

function UserTracks({ tracks }) {
  const sortedTracks = [...tracks].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return (
    <div>
      <h2>登録済みの再生不可トラック</h2>
      {tracks.length === 0 ? (
        <p>登録されたトラックはありません。</p>
      ) : (
        <ul>
          {sortedTracks.map((track) => (
            <li
              key={track.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              {track.image_url && (
                <img
                  src={track.image_url}
                  alt={track.name}
                  style={{
                    width: "50px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "5px",
                  }}
                />
              )}
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "blue",
                  fontWeight: "bold",
                }}
              >
                {track.name}
              </a>{" "}
              - {track.artist.join(", ")} - {track.artist.join(", ")} (
              {new Date(track.createdAt).toLocaleString()})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

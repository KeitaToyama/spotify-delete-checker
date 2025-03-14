import { useEffect, useState } from "react";

export default function PlaylistList() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/playlists")
      .then((res) => res.json())
      .then((data) => setPlaylists(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCheck = async (playlistId) => {
    try {
      const response = await fetch(
        `/api/playlist-tracks?playlistId=${playlistId}`
      );
      const data = await response.json();
      console.log("プレイリストのトラックデータ:", data);
    } catch (error) {
      console.error("エラー: プレイリストのトラック取得に失敗しました", error);
    }
  };

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>エラー: {error}</p>;
  if (!playlists.length) return <p>プレイリストがありません。</p>;

  return (
    <div>
      <h2>あなたのプレイリスト</h2>
      <ul>
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            {playlist.name}
            <button onClick={() => handleCheck(playlist.id)}>チェック</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

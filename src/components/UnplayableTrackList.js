export function UnplayableTrackList({ tracks }) {
  //   console.log(tracks);
  return (
    <div>
      <h2>検出済み</h2>
      <ul>
        {tracks.map((track) => (
          <li key={track.id}>
            {track.name} - {track.artist.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

import TimelineEntry from "../TimelineEntry/TimelineEntry";

function TimelineList({ timeline = [] }) {
  if (timeline.length === 0) {
    return <p>Henüz kayıt yok.</p>;
  }

  return (
    <ul className="timeline-list">
      {[...timeline]
        .reverse()
        .map((entry) => (
          <TimelineEntry
            key={entry.id}
            entry={entry}
          />
        ))}
    </ul>
  );
}

export default TimelineList;
import { formatDate } from "../../../../systems/Time";
import { resolveTimelineMessage } from "../../../../systems/Timeline";

function TimelineEntry({ entry }) {
  return (
    <li className="timeline-entry">
      <div className="timeline-date">
        {formatDate(entry.date)}
      </div>

      <div className="timeline-message">
        {resolveTimelineMessage(entry)}
      </div>
    </li>
  );
}

export default TimelineEntry;
import { StatusBadge } from "./StatusBadge";

export type TimelineItem = {
  time: string;
  title: string;
  description: string;
  status: string;
  tone?: "safe" | "warn" | "danger" | "neutral";
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="timeline">
      {items.map((item) => (
        <div className="timeline-item" key={`${item.time}-${item.title}`}>
          <div className="timeline-time">{item.time}</div>
          <div className="card" style={{ boxShadow: "none", padding: 16 }}>
            <div className="row">
              <h3><span className="timeline-dot" />{item.title}</h3>
              <StatusBadge label={item.status} tone={item.tone} />
            </div>
            <p>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { StatusBadge } from "./StatusBadge";

export type ActionItem = {
  title: string;
  description: string;
  owner: string;
  due: string;
  status: string;
  tone?: "safe" | "warn" | "danger" | "neutral";
};

export function ActionList({ items }: { items: ActionItem[] }) {
  return (
    <div className="stack">
      {items.map((item) => (
        <div className="card action-card" key={`${item.title}-${item.owner}`}>
          <div className="row">
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <StatusBadge label={item.status} tone={item.tone} />
          </div>
          <div className="meta-row">
            <span>담당: {item.owner}</span>
            <span>기한: {item.due}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

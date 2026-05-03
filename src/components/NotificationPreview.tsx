import { notificationPreview } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function NotificationPreview() {
  return (
    <div className="stack">
      {notificationPreview.map((item) => (
        <div className="message" key={`${item.channel}-${item.title}`}>
          <div className="row">
            <StatusBadge label={item.channel} tone={item.channel === "알림톡" ? "warn" : "neutral"} />
            <small>템플릿 미리보기</small>
          </div>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </div>
      ))}
    </div>
  );
}

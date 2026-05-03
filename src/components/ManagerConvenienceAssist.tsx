import { documentRequests, hospitalConvenienceGuide, prepPackItems } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function ManagerConvenienceAssist() {
  const managerPrep = prepPackItems.filter((item) => item.source === "manager" || item.category === "arrival");
  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>현장 편의 도우미</h2>
          <p>매니저가 현장에서 보호자에게 다시 전화하지 않도록 동선·서류·준비물을 한 화면에 모았습니다.</p>
        </div>
        <StatusBadge label="전화 감소" tone="safe" />
      </div>
      <div className="grid two">
        <div className="report-section highlight">
          <h3>먼저 확인할 동선</h3>
          <ul>
            <li>하차: {hospitalConvenienceGuide.taxiDropoff}</li>
            <li>접수: {hospitalConvenienceGuide.checkinFloor}</li>
            <li>휠체어: {hospitalConvenienceGuide.wheelchairDesk}</li>
            <li>귀가 대기: {hospitalConvenienceGuide.pickupReturnSpot}</li>
          </ul>
        </div>
        <div className="report-section">
          <h3>요청 서류</h3>
          <ul>{documentRequests.map((doc) => <li key={doc.id}>{doc.title} · {doc.status}</li>)}</ul>
        </div>
      </div>
      <div className="grid two compact-grid">
        {managerPrep.map((item) => (
          <div className="mini-card" key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
            <small>{item.due}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

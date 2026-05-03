import { hospitalConvenienceGuide } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function HospitalGuideCard() {
  const guide = hospitalConvenienceGuide;
  return (
    <section className="convenience-panel stack">
      <div className="row wrap">
        <div>
          <h2>병원 동선 가이드</h2>
          <p>매번 전화로 묻는 접수층, 택시 하차, 휠체어, 약국, 화장실 위치를 일정에 붙여둡니다.</p>
        </div>
        <StatusBadge label={guide.estimatedStay} tone="warn" />
      </div>

      <div className="wayfinding-grid">
        <div className="mini-card"><strong>주소</strong><span>{guide.address}</span></div>
        <div className="mini-card"><strong>정문/접수</strong><span>{guide.mainEntrance} · {guide.checkinFloor}</span></div>
        <div className="mini-card"><strong>택시 하차</strong><span>{guide.taxiDropoff}</span></div>
        <div className="mini-card"><strong>귀가 대기</strong><span>{guide.pickupReturnSpot}</span></div>
        <div className="mini-card"><strong>휠체어</strong><span>{guide.wheelchairDesk}</span></div>
        <div className="mini-card"><strong>화장실</strong><span>{guide.restroomHint}</span></div>
        <div className="mini-card"><strong>약국</strong><span>{guide.pharmacyHint}</span></div>
        <div className="mini-card"><strong>주차</strong><span>{guide.parkingHint}</span></div>
      </div>

      <div className="grid two">
        <div className="report-section highlight">
          <h3>부모님 편의 팁</h3>
          <ul>{guide.accessibilityTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        </div>
        <div className="report-section">
          <h3>매니저 현장 팁</h3>
          <ul>{guide.managerTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

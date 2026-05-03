import { StatusBadge } from "./StatusBadge";

export function PaymentSummary() {
  return (
    <div className="card stack">
      <div className="row">
        <h3>비용·영수증</h3>
        <StatusBadge label="결제 연동 예정" tone="neutral" />
      </div>
      <div className="cost-row"><span>병원동행 기본</span><strong>78,000원</strong></div>
      <div className="cost-row"><span>택시비</span><strong>실비 별도</strong></div>
      <div className="cost-row"><span>약국/수납</span><strong>보호자 확인 필요</strong></div>
      <p>매니저 개인차량 유상운송 비용은 기본 청구 항목에 넣지 않습니다.</p>
    </div>
  );
}

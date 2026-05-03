export function ConsentCard() {
  return (
    <div className="card stack">
      <h3>병원동행 동의</h3>
      <p>오늘 동행 매니저가 진료 접수, 병원 내 이동 보조, 보호자 리포트 작성을 도와드립니다.</p>
      <label className="row" style={{ justifyContent: "flex-start" }}>
        <input type="checkbox" />
        <strong>동의합니다</strong>
      </label>
      <button type="button" className="button">동의 저장</button>
    </div>
  );
}

export function ComfortCard() {
  return (
    <div className="card stack comfort-card">
      <h3>편하게 쓰는 기능</h3>
      <div className="grid two compact-grid">
        <button type="button" className="large-choice">글씨 크게</button>
        <button type="button" className="large-choice">음성으로 듣기</button>
        <button type="button" className="large-choice">자녀에게 전화</button>
        <button type="button" className="large-choice">매니저에게 말하기</button>
      </div>
      <p>부모님앱은 읽기보다 누르기 쉬워야 합니다. 모든 중요 행동은 큰 버튼, 짧은 문장, 반복 확인으로 설계합니다.</p>
    </div>
  );
}

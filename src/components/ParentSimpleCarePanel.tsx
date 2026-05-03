export function ParentSimpleCarePanel() {
  return (
    <section className="parent-simple-panel parent-mode stack" aria-labelledby="parent-simple-title">
      <div>
        <div className="kicker">부모님 큰 글씨 화면</div>
        <h2 id="parent-simple-title" className="big-text">오늘은 도움 받는 날이에요.</h2>
        <p>부모님에게는 관리받는 느낌이 아니라, 편하게 도움 받는 느낌만 줍니다.</p>
      </div>
      <div className="grid two">
        <div className="card passcode-card stack">
          <span className="badge warn">만남 암호</span>
          <strong>4821</strong>
          <p>김안심 매니저에게 이 번호를 보여주세요.</p>
        </div>
        <div className="card stack">
          <span className="badge">오늘 확인</span>
          <button className="large-choice">점심 먹었어요</button>
          <button className="large-choice">약 먹었어요</button>
          <button className="danger-choice">도움이 필요해요</button>
        </div>
      </div>
      <div className="parent-quick-actions">
        <a className="big-call-button" href="tel:01000000000">자녀에게 전화</a>
        <a className="big-call-button danger" href="tel:119">긴급 도움</a>
      </div>
    </section>
  );
}

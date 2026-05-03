import { assistedIntakeModes } from "@/lib/demo-data";

export function AssistedIntakeModes() {
  return (
    <section className="panel stack" aria-labelledby="assisted-intake-title">
      <div>
        <div className="kicker">앱을 못 써도 쓸 수 있게</div>
        <h2 id="assisted-intake-title">입력 부담을 운영실이 대신 줄입니다.</h2>
        <p>40대 이상 사용자는 긴 폼을 만나면 쉽게 이탈합니다. 그래서 모든 핵심 접수는 전화·카톡·사진·직접입력으로 열어둡니다.</p>
      </div>
      <div className="intake-mode-grid">
        {assistedIntakeModes.map((mode) => (
          <article className="intake-mode-card" key={mode.code}>
            <strong>{mode.title}</strong>
            <p>{mode.description}</p>
            <small>추천: {mode.bestFor}</small>
            <span className="badge">결과: {mode.result}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

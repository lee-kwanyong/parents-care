import { StatusBadge } from "./StatusBadge";

export function PwaInstallGuide() {
  return (
    <div className="card stack install-card">
      <div className="row wrap">
        <h3>어머니 폰 설치 안내</h3>
        <StatusBadge label="PWA" tone="safe" />
      </div>
      <ol className="large-list">
        <li>자녀가 부모님앱 링크를 문자/카톡으로 전송</li>
        <li>어머니 폰에서 열기</li>
        <li>브라우저 메뉴에서 “홈 화면에 추가” 선택</li>
        <li>앱처럼 실행 후 오늘 일정과 긴급 버튼만 노출</li>
      </ol>
      <p>부모님 화면은 큰 글씨, 짧은 문장, 큰 버튼, 만남 암호 중심으로 유지합니다.</p>
    </div>
  );
}

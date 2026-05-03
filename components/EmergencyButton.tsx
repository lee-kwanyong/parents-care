"use client";

export function EmergencyButton() {
  return (
    <button
      type="button"
      className="emergency"
      onClick={() => {
        window.alert("긴급 연락 요청이 자녀와 운영실에 전달되는 플로우를 연결하세요.");
      }}
    >
      긴급 연락하기
    </button>
  );
}

export type ActionResult = {
  status: "idle" | "success" | "error";
  message: string;
  payload?: Record<string, unknown>;
};

export const idleActionState: ActionResult = {
  status: "idle",
  message: "입력 후 저장하면 Supabase에 연결됩니다. 환경변수가 없으면 데모 화면으로만 확인하세요."
};

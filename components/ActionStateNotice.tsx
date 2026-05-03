import type { ActionResult } from "@/lib/action-state";

export function ActionStateNotice({ state }: { state: ActionResult }) {
  if (state.status === "idle") return <p className="helper-text">{state.message}</p>;
  return <div className={`notice ${state.status === "success" ? "success" : "danger"}`}>{state.message}</div>;
}

import { consentScopes } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";

export function ConsentMatrix() {
  return (
    <div className="consent-grid">
      {consentScopes.map((scope) => (
        <label className="consent-tile" key={scope.code}>
          <input type="checkbox" name="shareScopes" value={scope.code} defaultChecked={scope.recommended} />
          <span>
            <strong>{scope.label}</strong>
            <small>{scope.description}</small>
          </span>
          <StatusBadge label={scope.sensitive ? "민감" : "기본"} tone={scope.sensitive ? "warn" : "safe"} />
        </label>
      ))}
    </div>
  );
}

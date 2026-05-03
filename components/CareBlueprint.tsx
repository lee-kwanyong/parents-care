import { serviceBlueprint } from "@/lib/demo-data";

export function CareBlueprint() {
  return (
    <div className="blueprint">
      {serviceBlueprint.map(([title, description], index) => (
        <div className="blueprint-step" key={title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
      ))}
    </div>
  );
}

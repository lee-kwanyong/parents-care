import Link from "next/link";

type RoleCardProps = {
  href: string;
  title: string;
  description: string;
  badge: string;
};

export function RoleCard({ href, title, description, badge }: RoleCardProps) {
  return (
    <Link href={href} className="card role-card">
      <span className="badge neutral">{badge}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </Link>
  );
}

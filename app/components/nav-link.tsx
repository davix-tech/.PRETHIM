import Link from "next/link";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ href, children, className = "" }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`text-ink-secondary hover:text-ink-primary transition-colors duration-200 ${className}`}
    >
      {children}
    </Link>
  );
}
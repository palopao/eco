import type { ReactNode } from "react";
import { UniversalHeader } from "./UniversalHeader";
import { Icon } from "./Icon";

export function AppHeader({
  title,
  onBack,
  onHome,
  onLogo,
  action,
  className = "",
  showSearch = false,
}: {
  title?: string;
  onBack?: () => void;
  onHome?: () => void;
  onLogo?: () => void;
  action?: ReactNode;
  className?: string;
  showSearch?: boolean;
}) {
  const rightAction = showSearch
    ? <button className="header-icon-button" onClick={onHome ?? onLogo} aria-label="Search"><Icon name="search" size={19} /></button>
    : action;

  return (
    <UniversalHeader
      className={className}
      onBack={onBack}
      onLogo={onHome ?? onLogo}
      title={title}
      action={rightAction}
    />
  );
}

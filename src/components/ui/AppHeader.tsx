import type { ReactNode } from "react";
import { UniversalHeader } from "./UniversalHeader";
import { Icon } from "./Icon";

export function AppHeader({
  title,
  onBack,
  onHome,
  action,
  showSearch = false,
}: {
  title?: string;
  onBack?: () => void;
  onHome?: () => void;
  action?: ReactNode;
  showSearch?: boolean;
}) {
  const rightAction = showSearch
    ? <button className="header-icon-button" onClick={onHome} aria-label="Search"><Icon name="search" size={19} /></button>
    : action;

  return (
    <UniversalHeader
      onBack={onBack}
      onLogo={onHome}
      title={title}
      action={rightAction}
    />
  );
}

import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function UniversalHeader({ action, onLogo, onBack, title, className = "" }: { action?: ReactNode; onLogo?: () => void; onBack?: () => void; title?: string; className?: string }) {
  return <header className={`universal-header ${className}`}>
    <div className="universal-header-row">
      {onBack ? <button type="button" className="wordmark universal-wordmark back-button" onClick={onBack} aria-label="Back"><Icon name="chevron" size={17} /> <span>Back</span></button> : <button type="button" className="wordmark universal-wordmark" onClick={onLogo} aria-label="Eco home">ec<span>o</span></button>}
      {title && <div className="header-title">{title}</div>}
      <div className="universal-action">{action}</div>
    </div>
  </header>;
}

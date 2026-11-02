import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function SectionTitle({ children, action }: { children: ReactNode; action?: string }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action && <button>{action} <Icon name="chevron" size={15} /></button>}
    </div>
  );
}

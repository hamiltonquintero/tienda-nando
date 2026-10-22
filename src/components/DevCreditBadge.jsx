import React from 'react';
import { Sparkles, Code2 } from 'lucide-react';

export default function DevCreditBadge({ isCatalog = false }) {
  return (
    <div 
      className={`dev-credit-floating-badge ${isCatalog ? 'in-catalog' : 'in-admin'}`}
      title="Sistema desarrollado a medida por Hamilton Q."
    >
      <div className="dev-credit-inner">
        <span className="dev-credit-sparkle">
          <Sparkles size={14} className="sparkle-icon" />
        </span>
        <span className="dev-credit-label">Desarrollado por</span>
        <strong className="dev-credit-name">Hamilton Q.</strong>
      </div>
    </div>
  );
}

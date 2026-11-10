import React, { useState } from 'react';
import './Fold.css';

interface FoldProps {
  title: string;
  /** Short summary shown beside the title while closed or open. */
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A tap-to-expand card: keeps a screen short while the detail stays one tap away. */
export default function Fold({ title, hint, defaultOpen = false, children }: FoldProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`fold ${open ? 'is-open' : ''}`}>
      <button className="fold-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="fold-title">{title}</span>
        {hint && <span className="fold-hint">{hint}</span>}
        <span className="fold-arrow" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="fold-body">{children}</div>}
    </div>
  );
}

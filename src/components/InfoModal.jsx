import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Reusable accessible modal for explaining Passport section rules (Medal Wall, Regions, Trophies).
 */
export default function InfoModal({ open, title, icon, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="info-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="info-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-head">
          <div className="info-modal-title">
            {icon && <span className="info-modal-icon">{icon}</span>}
            <h3>{title}</h3>
          </div>
          <button
            type="button"
            className="info-modal-close"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>
        <div className="info-modal-body">{children}</div>
      </div>
    </div>
  );
}

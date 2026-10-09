// =============================================
// components/Toast.jsx - Component 8/10
// Popup notification using Bootstrap Icons
// =============================================

import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer); // Cleanup on unmount
  }, [onClose]);

  // Map type to Bootstrap Icon class
  const iconMap = {
    success: 'bi-check-circle-fill',  // Checkmark for success
    error: 'bi-x-circle-fill',        // X circle for errors
    info: 'bi-info-circle-fill',      // Info icon
  };

  return (
    <div className={`rf-toast rf-toast-${type}`}>
      {/* Icon based on type */}
      <i className={`bi ${iconMap[type]} rf-toast-icon`}></i>

      {/* Message text */}
      <span className="rf-toast-msg">{message}</span>

      {/* Close button with X icon */}
      <button className="rf-toast-close" onClick={onClose} aria-label="Close">
        <i className="bi bi-x-lg"></i>
      </button>
    </div>
  );
};

export default Toast;
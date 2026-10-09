// =============================================
// components/LoadingSpinner.jsx - Component 7/10
// Custom animated spinner using CSS
// =============================================

import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="rf-spinner-wrapper">
      {/* Custom spinning circle (defined in index.css) */}
      <div className="rf-spinner"></div>
      <p className="text-muted fw-semibold">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
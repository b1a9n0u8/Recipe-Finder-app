// =============================================
// components/RecipeGrid.jsx - Component 6/10
// Bootstrap grid layout displaying recipe cards
// =============================================

import React from 'react';
import RecipeCard from './RecipeCard';

const RecipeGrid = ({ recipes, onSave, savedIds = [] }) => {

  // Show "no results" state if empty
  if (!recipes || recipes.length === 0) {
    return (
      <div className="no-results-box">
        <div className="no-results-icon">
          {/* Search icon for no results */}
          <i className="bi bi-search"></i>
        </div>
        <h4 className="fw-bold mb-2">No recipes found</h4>
        <p className="text-muted">Try again or be the first to add a recipe!</p>
      </div>
    );
  }

  return (
    // Bootstrap responsive grid: 1 col on mobile, 2 on tablet, 3 on desktop
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      {recipes.map((recipe) => (
        // key= is required when rendering a list in React
        <div className="col" key={recipe._id}>
          <RecipeCard
            recipe={recipe}
            onSave={onSave}
            savedIds={savedIds}
          />
        </div>
      ))}
    </div>
  );
};

export default RecipeGrid;
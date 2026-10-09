// =============================================
// components/CategoryFilter.jsx - Component 4/10
// Horizontal scrollable category pills with Bootstrap Icons
// =============================================

import React from 'react';

// Each category has a Bootstrap Icon class name and a label
const CATEGORIES = [
  { label: 'All',       icon: 'bi-grid-fill' },
  { label: 'Breakfast', icon: 'bi-sun-fill' },
  { label: 'Lunch',     icon: 'bi-brightness-high-fill' },
  { label: 'Dinner',    icon: 'bi-moon-stars-fill' },
  { label: 'Snack',     icon: 'bi-bag-fill' },
  { label: 'Dessert',   icon: 'bi-cake2-fill' },
  { label: 'Drink',     icon: 'bi-cup-straw' },
];

const CategoryFilter = ({ activeCategory = 'All', onSelect }) => {
  return (
    <div className="category-filters mb-2 d-flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          // 'active' class applies orange pill styling
          className={`category-pill ${activeCategory === cat.label ? 'active' : ''}`}
          onClick={() => onSelect(cat.label === 'All' ? '' : cat.label)}
        >
          {/* Bootstrap Icon - icon class name from the array above */}
          <i className={`bi ${cat.icon}`}></i>
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
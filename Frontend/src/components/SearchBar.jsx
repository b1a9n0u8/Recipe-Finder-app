// =============================================
// components/SearchBar.jsx
// General search | Ingredient tag search | Sort: date/A-Z/Z-A
// =============================================

import React, { useState } from 'react';

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest First',  icon: 'bi-calendar-check' },
  { value: 'oldest',  label: 'Oldest First',  icon: 'bi-calendar2' },
  { value: 'az',      label: 'A → Z',          icon: 'bi-sort-alpha-down' },
  { value: 'za',      label: 'Z → A',          icon: 'bi-sort-alpha-up-alt' },
  { value: 'top',     label: 'Top Rated',      icon: 'bi-star-fill' },
];

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm]           = useState('');
  const [category, setCategory]               = useState('');
  const [difficulty, setDifficulty]           = useState('');
  const [sortBy, setSortBy]                   = useState('newest');
  const [mode, setMode]                       = useState('general');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientTags, setIngredientTags]   = useState([]);

  const buildPayload = (overrides = {}) => ({
    search:      searchTerm,
    ingredients: mode === 'ingredients' ? ingredientTags.join(',') : '',
    category,
    difficulty,
    sortBy,
    ...overrides,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const all = [...ingredientTags];
    const extra = ingredientInput.trim();
    if (mode === 'ingredients' && extra) {
      all.push(extra); setIngredientInput(''); setIngredientTags(all);
    }
    onSearch(buildPayload(mode === 'ingredients' ? { ingredients: all.join(','), search: '' } : {}));
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    onSearch(buildPayload({ sortBy: val }));
  };

  const handleClear = () => {
    setSearchTerm(''); setCategory(''); setDifficulty('');
    setIngredientTags([]); setIngredientInput(''); setSortBy('newest');
    onSearch({ search: '', category: '', difficulty: '', ingredients: '', sortBy: 'newest' });
  };

  const addIngredientTag = (value) => {
    const trimmed = value.trim().replace(/,+$/, '');
    if (trimmed && !ingredientTags.includes(trimmed))
      setIngredientTags(prev => [...prev, trimmed]);
    setIngredientInput('');
  };

  const handleIngredientKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); addIngredientTag(ingredientInput);
    } else if (e.key === 'Backspace' && !ingredientInput && ingredientTags.length) {
      setIngredientTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tag) => setIngredientTags(prev => prev.filter(t => t !== tag));

  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortBy);

  return (
    <div className="search-section">

      {/* ── Mode Toggle ── */}
      <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
        <button type="button"
          className={`btn btn-sm rounded-pill px-3 ${mode === 'general' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => { setMode('general'); setIngredientTags([]); setIngredientInput(''); }}>
          <i className="bi bi-search me-1"></i> General Search
        </button>
        <button type="button"
          className={`btn btn-sm rounded-pill px-3 ${mode === 'ingredients' ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => { setMode('ingredients'); setSearchTerm(''); }}>
          <i className="bi bi-basket2 me-1"></i> By Ingredients
        </button>
        {mode === 'ingredients' && (
          <span className="text-muted small">
            Type &amp; press <kbd>Enter</kbd> or <kbd>,</kbd> to add each ingredient
          </span>
        )}
      </div>

      <form onSubmit={handleSearch}>
        <div className="row g-3 align-items-end search-input-group">

          {/* ── Search / Ingredient Input ── */}
          <div className="col-lg-4 col-md-12">
            <label className="form-label fw-semibold small text-muted mb-1">
              <i className={`bi ${mode === 'ingredients' ? 'bi-basket2' : 'bi-search'} me-1`}></i>
              {mode === 'ingredients' ? 'Add Ingredients' : 'Search Recipes'}
            </label>

            {mode === 'general' ? (
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"
                  style={{ borderRadius: '10px 0 0 10px', border: '2px solid #e9ecef' }}>
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input type="text" className="form-control border-start-0 ps-0"
                  placeholder="e.g. pasta, chicken, soup..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: '0 10px 10px 0', border: '2px solid #e9ecef', borderLeft: 'none' }} />
              </div>
            ) : (
              <div className="form-control d-flex flex-wrap gap-1 align-items-center"
                style={{ minHeight: '42px', cursor: 'text', border: '2px solid #e9ecef', borderRadius: '10px', padding: '5px 10px' }}
                onClick={() => document.getElementById('ingredient-input').focus()}>
                {ingredientTags.map(tag => (
                  <span key={tag} className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
                    style={{ background: '#dc3545', fontSize: '0.78rem', borderRadius: '20px' }}>
                    <i className="bi bi-basket2-fill" style={{ fontSize: '0.65rem' }}></i>
                    {tag}
                    <button type="button" className="btn-close btn-close-white"
                      style={{ fontSize: '0.5rem' }} onClick={() => removeTag(tag)} />
                  </span>
                ))}
                <input id="ingredient-input" type="text"
                  className="border-0 flex-grow-1"
                  style={{ minWidth: '100px', outline: 'none', fontSize: '0.9rem' }}
                  placeholder={ingredientTags.length ? 'Add more...' : 'tomato, garlic, onion...'}
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={handleIngredientKeyDown}
                  onBlur={() => { if (ingredientInput.trim()) addIngredientTag(ingredientInput); }} />
              </div>
            )}
          </div>

          {/* ── Category ── */}
          <div className="col-lg-2 col-md-4 col-6">
            <label className="form-label fw-semibold small text-muted mb-1">
              <i className="bi bi-tag me-1"></i> Category
            </label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
              <option>Snack</option><option>Dessert</option><option>Drink</option>
            </select>
          </div>

          {/* ── Difficulty ── */}
          <div className="col-lg-2 col-md-4 col-6">
            <label className="form-label fw-semibold small text-muted mb-1">
              <i className="bi bi-bar-chart me-1"></i> Level
            </label>
            <select className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">All Levels</option>
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>

          {/* ── Sort By ── */}
          <div className="col-lg-2 col-md-4 col-12">
            <label className="form-label fw-semibold small text-muted mb-1">
              <i className="bi bi-sort-down me-1"></i> Sort By
            </label>
            <div className="dropdown w-100">
              <button type="button"
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-between gap-1"
                style={{ borderRadius: 8 }}
                data-bs-toggle="dropdown" aria-expanded="false">
                <span className="d-flex align-items-center gap-1">
                  <i className={`bi ${activeSortLabel?.icon} text-danger`} style={{ fontSize: '0.85rem' }}></i>
                  <span className="small">{activeSortLabel?.label}</span>
                </span>
                <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}></i>
              </button>
              <ul className="dropdown-menu shadow-sm border-0 rounded-3 w-100" style={{ minWidth: 0 }}>
                {SORT_OPTIONS.map(opt => (
                  <li key={opt.value}>
                    <button type="button"
                      className={`dropdown-item d-flex align-items-center gap-2 small py-2 ${sortBy === opt.value ? 'text-danger fw-semibold' : ''}`}
                      onClick={() => handleSortChange(opt.value)}>
                      <i className={`bi ${opt.icon}`}></i> {opt.label}
                      {sortBy === opt.value && <i className="bi bi-check-lg ms-auto text-danger"></i>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Buttons ── */}
          <div className="col-lg-2 col-md-12 d-flex gap-2">
            <button type="submit" className="btn btn-brand flex-grow-1 d-flex align-items-center justify-content-center gap-1">
              <i className="bi bi-search"></i> Search
            </button>
            <button type="button" onClick={handleClear}
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center" title="Clear all filters">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {(category || difficulty || sortBy !== 'newest' || ingredientTags.length > 0) && (
          <div className="d-flex flex-wrap gap-2 mt-3 align-items-center">
            <span className="text-muted small"><i className="bi bi-funnel-fill me-1"></i>Active:</span>
            {sortBy !== 'newest' && (
              <span className="badge border text-dark d-inline-flex align-items-center gap-1 px-2 py-1" style={{ borderRadius: 20, fontSize: '0.76rem' }}>
                <i className={`bi ${activeSortLabel?.icon} text-danger`}></i> {activeSortLabel?.label}
                <button type="button" className="btn-close ms-1" style={{ fontSize: '0.45rem' }} onClick={() => handleSortChange('newest')} />
              </span>
            )}
            {category && (
              <span className="badge border text-dark d-inline-flex align-items-center gap-1 px-2 py-1" style={{ borderRadius: 20, fontSize: '0.76rem' }}>
                <i className="bi bi-tag text-danger"></i> {category}
                <button type="button" className="btn-close ms-1" style={{ fontSize: '0.45rem' }}
                  onClick={() => { setCategory(''); onSearch(buildPayload({ category: '' })); }} />
              </span>
            )}
            {difficulty && (
              <span className="badge border text-dark d-inline-flex align-items-center gap-1 px-2 py-1" style={{ borderRadius: 20, fontSize: '0.76rem' }}>
                <i className="bi bi-bar-chart text-danger"></i> {difficulty}
                <button type="button" className="btn-close ms-1" style={{ fontSize: '0.45rem' }}
                  onClick={() => { setDifficulty(''); onSearch(buildPayload({ difficulty: '' })); }} />
              </span>
            )}
            {ingredientTags.map(t => (
              <span key={t} className="badge border text-dark d-inline-flex align-items-center gap-1 px-2 py-1" style={{ borderRadius: 20, fontSize: '0.76rem' }}>
                <i className="bi bi-basket2-fill text-danger"></i> {t}
                <button type="button" className="btn-close ms-1" style={{ fontSize: '0.45rem' }} onClick={() => removeTag(t)} />
              </span>
            ))}
          </div>
        )}

        {/* ── Ingredient hint ── */}
        {mode === 'ingredients' && ingredientTags.length > 0 && (
          <div className="mt-2 text-muted small">
            <i className="bi bi-info-circle me-1 text-danger"></i>
            Searching recipes containing <strong>all</strong> of:&nbsp;
            {ingredientTags.map((t, i) => (
              <span key={t}>
                <span className="text-danger fw-semibold">{t}</span>
                {i < ingredientTags.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
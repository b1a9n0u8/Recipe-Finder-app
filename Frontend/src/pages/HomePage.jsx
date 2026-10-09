import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../data/api';
import HeroBanner from '../components/HeroBanner';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import RecipeGrid from '../components/RecipeGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import Pagination from '@mui/material/Pagination';

const LoginPrompt = () => (
  <div className="text-center py-5 my-4">
    <div
      className="d-inline-flex flex-column align-items-center gap-3 p-5 rounded-4 shadow-sm"
      style={{ background: 'rgba(220,53,69,0.05)', border: '2px dashed rgba(220,53,69,0.25)', maxWidth: 480 }}
    >
      <i className="bi bi-lock-fill text-danger" style={{ fontSize: '3rem' }}></i>
      <div>
        <h4 className="fw-bold mb-1">Recipes are waiting for you!</h4>
        <p className="text-muted mb-0">
          Login or create a free account to explore hundreds of delicious recipes.
        </p>
      </div>
      <div className="d-flex gap-3 flex-wrap justify-content-center">
        <Link to="/login" className="btn btn-danger rounded-pill px-4 fw-semibold">
          <i className="bi bi-box-arrow-in-right me-1"></i> Login
        </Link>
        <Link to="/signup" className="btn btn-outline-danger rounded-pill px-4 fw-semibold">
          <i className="bi bi-person-plus me-1"></i> Sign Up
        </Link>
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const { isLoggedIn } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  // ── store active filters so pagination re-uses them ──────────
  const [activeFilters, setActiveFilters] = useState({});
  const [toast, setToast] = useState(null);
  const [savedIds, setSavedIds] = useState(
    JSON.parse(localStorage.getItem('savedIds') || '[]')
  );

  const fetchRecipes = async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)       params.append('search',       filters.search);
      if (filters.ingredients)  params.append('ingredients',  filters.ingredients);
      if (filters.category)     params.append('category',     filters.category);
      if (filters.difficulty)   params.append('difficulty',   filters.difficulty);
      params.append('page',  page);
      params.append('limit', 6);

      const response = await api.get(`/recipes?${params.toString()}`);
      setRecipes(response.data.recipes);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
    } catch {
      setToast({ message: 'Failed to load recipes. Is the server running?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Only re-fetch when page changes — use stored filters
  useEffect(() => {
    if (isLoggedIn) {
      fetchRecipes(activeFilters, currentPage);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (recipeId) => {
    try {
      const response = await api.post(`/recipes/${recipeId}/save`);
      const { saved } = response.data;
      const newIds = saved
        ? [...savedIds, recipeId]
        : savedIds.filter((id) => id !== recipeId);
      setSavedIds(newIds);
      localStorage.setItem('savedIds', JSON.stringify(newIds));
      setToast({ message: saved ? 'Recipe saved!' : 'Recipe unsaved', type: saved ? 'success' : 'info' });
    } catch {
      setToast({ message: 'Failed to save recipe', type: 'error' });
    }
  };

  const handleCategorySelect = (category) => {
    const filters = category ? { category } : {};
    setActiveCategory(category || 'All');
    setActiveFilters(filters);
    setCurrentPage(1);
    fetchRecipes(filters, 1);
  };

  const handleSearch = (filters) => {
    setActiveCategory(filters.category || 'All');
    setActiveFilters(filters);
    setCurrentPage(1);
    fetchRecipes(filters, 1);
  };

  return (
    <div>
    
      <HeroBanner isLoggedIn={isLoggedIn} />

      <div className="container py-4">
        {!isLoggedIn ? (
          <LoginPrompt />
        ) : (
          <>
            <SearchBar onSearch={handleSearch} />
            <CategoryFilter activeCategory={activeCategory} onSelect={handleCategorySelect} />

            {!loading && (
              <p className="results-label mb-3 d-flex align-items-center gap-1">
                <i className="bi bi-collection text-danger"></i>
                Found <strong className="mx-1">{recipes.length}</strong>
                recipe{recipes.length !== 1 ? 's' : ''}
              </p>
            )}

            {loading ? (
              <LoadingSpinner message="Loading delicious recipes..." />
            ) : (
              <>
                <RecipeGrid
                  recipes={recipes}
                  onSave={handleSave}
                  savedIds={savedIds}
                />
                
                <div className="d-flex justify-content-center mt-4">
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                    shape="rounded"
                    sx={{
                      '& .MuiPaginationItem-root.Mui-selected': {
                        backgroundColor: '#dc3545',
                        color: 'white',
                      },
                      '& .MuiPaginationItem-root.Mui-selected:hover': {
                        backgroundColor: '#bb2d3b',
                      },
                      '& .MuiPaginationItem-root:hover': {
                        backgroundColor: 'rgba(220,53,69,0.1)',
                      },
                    }}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default HomePage;
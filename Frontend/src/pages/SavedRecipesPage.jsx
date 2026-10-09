import React, { useState, useEffect } from 'react';
import api from '../data/api';
import RecipeGrid from '../components/RecipeGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const SavedRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [savedIds, setSavedIds] = useState(
    JSON.parse(localStorage.getItem('savedIds') || '[]')
  );

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const response = await api.get('/recipes/saved');
        setRecipes(response.data);
        const ids = response.data.map((r) => r._id);
        setSavedIds(ids);
        localStorage.setItem('savedIds', JSON.stringify(ids));
      } 
      catch {
        setToast({ message: 'Failed to load saved recipes', type: 'error' });
      } 
      finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleUnsave = async (recipeId) => {
    try {
      await api.post(`/recipes/${recipeId}/save`);
      const newIds = savedIds.filter((id) => id !== recipeId);
      setSavedIds(newIds);
      localStorage.setItem('savedIds', JSON.stringify(newIds));
      setRecipes((prev) => prev.filter((r) => r._id !== recipeId));
      setToast({ message: 'Recipe removed from saved', type: 'info' });
    } 
    catch {
      setToast({ message: 'Failed to unsave recipe', type: 'error' });
    }
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.8rem' }}>
          
          <i className="bi bi-heart-fill text-danger"></i>
          My Saved Recipes
        </h1>
        <p className="text-muted">
          {recipes.length} saved recipe{recipes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading
        ? <LoadingSpinner message="Loading your saved recipes..." />
        : <RecipeGrid recipes={recipes} onSave={handleUnsave} savedIds={savedIds} />
      }

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SavedRecipesPage;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../data/api';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import RecipeForm from '../components/RecipeForm';

const EditRecipePage = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [recipe,    setRecipe]  = useState(null);
  const [loading,   setLoading] = useState(true);
  const [saving,    setSaving]  = useState(false);
  const [toast,     setToast]   = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await api.get(`/recipes/${id}`);
        const data = res.data;

        // Convert arrays to string format that RecipeForm expects for tags
        setRecipe({
          ...data,
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
        });
      } catch {
        setToast({ message: 'Failed to load recipe', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      await api.put(`/recipes/${id}`, formData);
      setToast({ message: 'Recipe updated! Pending admin approval.', type: 'success' });
      setTimeout(() => navigate('/my-recipes'), 1800);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update recipe', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading recipe..." />;
  if (!recipe) return <div className="container py-5 text-center text-danger">Recipe not found!</div>;

  return (
    <div className="container py-4">
      <Link to="/my-recipes" className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1">
        <i className="bi bi-arrow-left"></i> Back to My Recipes
      </Link>

      <div className="mb-4">
        <h1 className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.8rem' }}>
          <i className="bi bi-pencil-square text-danger"></i> Edit Recipe
        </h1>
        <p className="text-muted">
          After editing, your recipe will go back to <strong>Pending Approval</strong> status.
        </p>
      </div>

      <RecipeForm onSubmit={handleSubmit} initialData={recipe} loading={saving} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EditRecipePage;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipeForm from '../components/RecipeForm';
import api from '../data/api';
import Toast from '../components/Toast';

const CreateRecipePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // formData is now a FormData object (multipart) built inside RecipeForm
  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await api.post('/recipes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToast({ message: 'Recipe created successfully!', type: 'success' });
      setTimeout(() => navigate(`/recipe/${response.data.recipe._id}`), 1500);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create recipe', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Page title bar */}
      <div className="mb-4">
        <h1 className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.8rem' }}>
          <i className="bi bi-plus-circle-fill text-danger"></i>
          Create New Recipe
        </h1>
        <p className="text-muted">Share your delicious recipe with the community!</p>
      </div>

      <RecipeForm onSubmit={handleSubmit} loading={loading} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CreateRecipePage;
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Helper — works for both local /uploads/... and full https://... URLs
const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;           // Cloudinary or external
  return `http://localhost:5000${image}`;               // Local uploads
};

const RecipeCard = ({ recipe, onSave, savedIds = [] }) => {
  const { isLoggedIn } = useAuth();
  const isSaved = savedIds.includes(recipe._id);

  const isNew = (() => {
    const date = recipe.updatedAt || recipe.createdAt;
    if (!date) return false;
    return Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000;
  })();

  const difficultyClass = {
    Easy: 'difficulty-easy',
    Medium: 'difficulty-medium',
    Hard: 'difficulty-hard',
  }[recipe.difficulty] || 'difficulty-easy';

  const fallback    = 'https://placehold.co/400x250/f8f5f2/e8470a?text=No+Image';
  const imageUrl    = getImageUrl(recipe.image) || fallback;
  const likesCount  = recipe.likes?.length || 0;
  const reviewCount = recipe.reviews?.length || 0;
  const avgRating   = recipe.averageRating || 0;

  return (
    <div className="recipe-card card h-100">

      {/* Image */}
      <div className="recipe-card-img-wrapper">
        <img
          src={imageUrl}
          alt={recipe.title}
          onError={(e) => { e.target.src = fallback; }}
        />
        <span className="card-category-badge">{recipe.category}</span>
        {isNew && (
          <span className="card-new-badge">
            <i className="bi bi-stars me-1"></i>NEW
          </span>
        )}
        {isLoggedIn && onSave && (
          <button
            className={`card-save-btn ${isSaved ? 'saved' : ''}`}
            onClick={(e) => { e.preventDefault(); onSave(recipe._id); }}
            title={isSaved ? 'Remove from saved' : 'Save recipe'}
          >
            <i className={`bi ${isSaved ? 'bi-heart-fill text-danger' : 'bi-heart text-secondary'}`}></i>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{recipe.title}</h5>
        <p className="card-text">{recipe.description}</p>

        <div className="card-meta-row">
          <span><i className="bi bi-clock text-danger"></i> {recipe.cookTime} min</span>
          <span><i className="bi bi-people text-danger"></i> {recipe.servings} servings</span>
          <span className={`difficulty-pill ${difficultyClass}`}>{recipe.difficulty}</span>
        </div>

        {/* Likes · Rating · Reviews */}
        <div className="d-flex align-items-center gap-3 my-2" style={{ fontSize: '0.82rem' }}>
          <span className="d-flex align-items-center gap-1 text-danger fw-semibold">
            <i className="bi bi-heart-fill"></i>
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </span>
          {avgRating > 0 && (
            <span className="d-flex align-items-center gap-1 text-warning fw-semibold">
              <i className="bi bi-star-fill"></i> {avgRating}
            </span>
          )}
          {reviewCount > 0 && (
            <span className="d-flex align-items-center gap-1 text-muted">
              <i className="bi bi-chat-left-text"></i> {reviewCount}
            </span>
          )}
        </div>

        <p className="text-muted small mb-3 d-flex align-items-center gap-1">
          <i className="bi bi-person-circle text-danger"></i>
          by {recipe.createdBy?.name || 'Unknown'}
        </p>

        <Link
          to={`/recipe/${recipe._id}`}
          className="btn btn-brand mt-auto d-flex align-items-center justify-content-center gap-2"
        >
          View Recipe <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
};

export default RecipeCard;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../data/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

// Helper — local or cloudinary
const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return `http://localhost:5000${image}`;
};

// Star rating
const StarRating = ({ value, onChange, readOnly = false }) => (
  <div className="d-flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className={`bi ${star <= value ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
        style={{ fontSize: '1.1rem', cursor: readOnly ? 'default' : 'pointer' }}
        onClick={() => !readOnly && onChange && onChange(star)}
      />
    ))}
  </div>
);

const RecipeDetailPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [recipe,      setRecipe]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);
  const [liked,       setLiked]       = useState(false);
  const [likesCount,  setLikesCount]  = useState(0);
  const [newRating,   setNewRating]   = useState(0);
  const [newComment,  setNewComment]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [ratingError, setRatingError] = useState(false);
  const [submitted,   setSubmitted]   = useState(false); // hides form after submit
  const [fetchError,   setFetchError]   = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await api.get(`/recipes/${id}`);
        const data = response.data;
        setRecipe(data);
        setLikesCount(data.likes?.length || 0);
        if (user) setLiked(data.likes?.map(String).includes(String(user.id)));
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setFetchError('Recipe not found!');
        } else {
          setFetchError('Failed to load recipe. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleLike = async () => {
    if (!user) return setToast({ message: 'Please login to like recipes', type: 'error' });
    try {
      const res = await api.post(`/recipes/${id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch {
      setToast({ message: 'Failed to like recipe', type: 'error' });
    }
  };

  const handleReviewSubmit = async () => {
    if (newRating === 0) { setRatingError(true); return setToast({ message: 'Please select a star rating', type: 'error' }); }
    if (!newComment.trim()) return setToast({ message: 'Please write a comment', type: 'error' });
    setRatingError(false);
    setSubmitting(true);
    try {
      const res = await api.post(`/recipes/${id}/reviews`, { rating: newRating, comment: newComment });
      setRecipe(prev => ({ ...prev, reviews: res.data.reviews, averageRating: res.data.averageRating }));
      setNewComment(''); setNewRating(0);
      setSubmitted(true);
      setToast({ message: 'Review submitted! It will appear after admin approval.', type: 'info' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to submit review', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/recipes/${id}/reviews/${reviewId}`);
      setRecipe(prev => ({ ...prev, reviews: prev.reviews.filter(r => r._id !== reviewId) }));
      setToast({ message: 'Review deleted', type: 'success' });
    } catch { setToast({ message: 'Failed to delete review', type: 'error' }); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await api.delete(`/recipes/${id}`);
      setToast({ message: 'Recipe deleted!', type: 'success' });
      setTimeout(() => navigate('/my-recipes'), 1500);
    } catch { setToast({ message: 'Failed to delete recipe', type: 'error' }); }
  };

  const isOwner     = user && recipe?.createdBy?._id === user.id;
  const hasReviewed = user && recipe?.reviews?.some(
    r => String(r.user) === String(user.id) || String(r.user?._id) === String(user.id)
  );
  // Owner cannot rate/comment on their own recipe
  const canReview = user && !isOwner && !hasReviewed && !submitted;

  const difficultyClass = { Easy: 'difficulty-easy', Medium: 'difficulty-medium', Hard: 'difficulty-hard' }[recipe?.difficulty] || 'difficulty-easy';
  const fallbackDetail  = 'https://placehold.co/800x400/f8f5f2/e8470a?text=No+Image';
  const imageUrl        = getImageUrl(recipe?.image) || fallbackDetail;

  if (loading)  return <LoadingSpinner message="Loading recipe..." />;
  if (fetchError) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-circle-fill text-danger" style={{ fontSize: '3rem' }}></i>
      <h4 className="mt-3 text-danger">{fetchError}</h4>
      <button className="btn btn-outline-danger mt-3" onClick={() => navigate('/')}>
        <i className="bi bi-arrow-left me-2"></i>Back to Home
      </button>
    </div>
  );
  if (!recipe) return null;

  return (
    <div className="container py-4">

      <Link to="/" className="btn btn-outline-secondary btn-sm mb-4 d-inline-flex align-items-center gap-1">
        <i className="bi bi-arrow-left"></i> Back to Recipes
      </Link>

      {/* Top section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="recipe-detail-hero">
            <img
              src={imageUrl}
              alt={recipe.title}
              onError={(e) => { e.target.src = fallbackDetail; }}
            />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="detail-info-card h-100">
            <span className="badge mb-3 px-3 py-2" style={{ background: 'var(--brand-primary)', fontSize: '0.8rem' }}>
              {recipe.category}
            </span>
            <h1 className="fw-bold mb-3" style={{ fontSize: '1.9rem' }}>{recipe.title}</h1>
            <p className="text-muted mb-4">{recipe.description}</p>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="detail-meta-badge"><i className="bi bi-clock-fill text-danger"></i> {recipe.cookTime} minutes</span>
              <span className="detail-meta-badge"><i className="bi bi-people-fill text-danger"></i> {recipe.servings} servings</span>
              <span className={`detail-meta-badge difficulty-pill ${difficultyClass}`}>
                <i className="bi bi-bar-chart-fill"></i> {recipe.difficulty}
              </span>
            </div>

            <p className="text-muted small d-flex align-items-center gap-1 mb-3">
              <i className="bi bi-person-circle text-danger"></i>
              Recipe by <strong className="ms-1">{recipe.createdBy?.name}</strong>
            </p>

            <div className="d-flex align-items-center gap-2 mb-3">
              <StarRating value={Math.round(recipe.averageRating || 0)} readOnly />
              <span className="text-muted small">
                {recipe.averageRating > 0 ? `${recipe.averageRating} / 5` : 'No ratings yet'}
                &nbsp;({recipe.reviews?.length || 0} reviews)
              </span>
            </div>

            {recipe.tags?.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-4">
                {recipe.tags.map(tag => (
                  <span key={tag} className="tag-pill"><i className="bi bi-hash small"></i>{tag}</span>
                ))}
              </div>
            )}

            <div className="d-flex align-items-center gap-3 mb-3">
              <button
                className={`btn btn-sm d-flex align-items-center gap-2 ${liked ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={handleLike}
              >
                <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                {liked ? 'Liked' : 'Like'} &nbsp;·&nbsp; {likesCount}
              </button>
            </div>

            {isOwner && (
              <div className="d-flex gap-2">
                <Link to={`/edit-recipe/${recipe._id}`} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                  <i className="bi bi-pencil-fill"></i> Edit
                </Link>
                <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2" onClick={handleDelete}>
                  <i className="bi bi-trash3-fill"></i> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ingredients + Steps */}
      <div className="row g-4 mb-5">
        <div className="col-lg-4">
          <div className="detail-section-card">
            <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-basket-fill text-danger"></i> Ingredients
            </h4>
            <ul className="list-unstyled mb-0">
              {recipe.ingredients.map((item, i) => (
                <li key={i} className="ingredient-item">
                  <span className="ingredient-dot"></span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="detail-section-card">
            <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-list-ol text-danger"></i> Instructions
            </h4>
            {recipe.steps.map((step, i) => (
              <div key={i} className="step-item">
                <span className="step-number">{i + 1}</span>
                <p className="mb-0 pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="row">
        <div className="col-12">
          <div className="detail-section-card">
            <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-chat-quote-fill text-danger"></i>
              Reviews &amp; Ratings
              <span className="badge bg-light text-dark border ms-2">{recipe.reviews?.length || 0}</span>
            </h4>

            {user && !canReview && !hasReviewed && !submitted && isOwner && (
              <div className="alert alert-light border mb-4 py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                <i className="bi bi-info-circle-fill text-warning"></i>
                You cannot rate or comment on your own recipe.
              </div>
            )}

            {canReview && (
              <div className="card border-0 bg-light rounded-4 p-3 mb-4">
                <h6 className="fw-bold mb-3">Write a Review</h6>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Your Rating <span className="text-danger">*</span></label>
                  <div className="d-flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <i key={star}
                        className={`bi ${star <= newRating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
                        style={{ fontSize: '1.4rem', cursor: 'pointer' }}
                        onClick={() => { setNewRating(star); setRatingError(false); }}
                      />
                    ))}
                  </div>
                  {ratingError && <small className="text-danger">Please select a rating</small>}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Your Comment</label>
                  <textarea className="form-control" rows={3} value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience with this recipe..." />
                </div>
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-2"
                  onClick={handleReviewSubmit} disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-border spinner-border-sm"></span> Submitting...</>
                    : <><i className="bi bi-send-fill"></i> Submit Review</>}
                </button>
              </div>
            )}

            {!user && (
              <div className="alert alert-light border mb-4 py-2" style={{ fontSize: '0.88rem' }}>
                <Link to="/login">Login</Link> to leave a review.
              </div>
            )}

            {(hasReviewed || submitted) && (
              <div className="alert alert-info py-2 mb-4" style={{ fontSize: '0.88rem' }}>
                <i className="bi bi-hourglass-split me-1"></i>
                {submitted && !hasReviewed
                  ? 'Your review is pending admin approval and will appear once approved.'
                  : 'You have already reviewed this recipe.'}
              </div>
            )}

            {recipe.reviews?.length === 0 ? (
              <p className="text-muted text-center py-3">
                <i className="bi bi-chat-left-text me-2"></i>No reviews yet. Be the first!
              </p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {recipe.reviews.map(review => {
                  const isMyReview = user && (
                    String(review.user) === String(user.id) ||
                    String(review.user?._id) === String(user.id)
                  );
                  return (
                    <div key={review._id} className="card border-0 rounded-4 shadow-sm p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="fw-bold mb-1 d-flex align-items-center gap-2">
                            <i className="bi bi-person-circle text-danger"></i>
                            {review.name}
                            {isMyReview && <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>You</span>}
                          </p>
                          <StarRating value={review.rating} readOnly />
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          {isMyReview && (
                            <button className="btn btn-link btn-sm text-danger p-0"
                              onClick={() => handleDeleteReview(review._id)}>
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 mb-0 text-muted" style={{ fontSize: '0.9rem' }}>{review.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RecipeDetailPage;
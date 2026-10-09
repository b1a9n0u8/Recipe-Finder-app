const mongoose = require('mongoose');

// ── Review sub-document ──────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:    { type: String, required: true },          // denormalised for speed
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    // 'pending' → waiting for admin approval, 'approved' → visible to all
    status:  { type: String, enum: ['pending', 'approved'], default: 'pending' },
  },
  { timestamps: true }
);

// ── Main Recipe schema ───────────────────────────────────────────
const recipeSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image:       { type: String, default: 'https://via.placeholder.com/400x300?text=No+Image' },
    category: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drink'],
      required: true,
    },
    cookTime:    { type: Number, required: true },
    servings:    { type: Number, required: true },
    difficulty:  { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    ingredients: [{ type: String, required: true }],
    steps:       [{ type: String, required: true }],
    tags:        [String],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Approval workflow ──────────────────────────────────────
    // 'requested'  → user submitted, waiting for admin
    // 'approved'   → admin approved, visible to everyone
    // 'modified'   → admin modified & approved
    status: {
      type: String,
      enum: ['requested', 'approved', 'modified'],
      default: 'requested',
    },
    approvalDate: { type: Date, default: null },

    // ── Likes (array of user IDs) ──────────────────────────────
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Reviews (rating + comment) ─────────────────────────────
    reviews: [reviewSchema],

    // ── View count (for trending) ──────────────────────────────
    viewCount: { type: Number, default: 0 },

    // ── Trending: daily view snapshot ─────────────────────────
    viewedToday: { type: Number, default: 0 },
    viewDate:    { type: String, default: '' }, // YYYY-MM-DD
  },
  { timestamps: true }
);

// Virtual: average rating (only approved reviews)
recipeSchema.virtual('averageRating').get(function () {
  const approved = this.reviews.filter(r => r.status === 'approved');
  if (!approved.length) return 0;
  const sum = approved.reduce((acc, r) => acc + r.rating, 0);
  return (sum / approved.length).toFixed(1);
});

recipeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);
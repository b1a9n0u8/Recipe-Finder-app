const express = require('express');
const User    = require('../models/User');
const Recipe  = require('../models/Recipe');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// ── GET dashboard stats ──────────────────────────────────────────
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, totalRecipes, pendingCount, monthlyUploads, recentUsers, recentRecipes] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
      Recipe.countDocuments({ status: 'requested' }),
      Recipe.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.find({}, '-password').sort({ createdAt: -1 }).limit(5),
      Recipe.find().populate('createdBy', 'name').sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({ totalUsers, totalRecipes, pendingCount, monthlyUploads, recentUsers, recentRecipes });
  } catch {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// ── GET all users ────────────────────────────────────────────────
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ── DELETE a user (and their recipes) ───────────────────────────
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Recipe.deleteMany({ createdBy: req.params.id }),
    ]);
    res.json({ message: 'User and their recipes deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// ── GET all recipes (all statuses, with date + user filters) ────
router.get('/recipes', adminAuth, async (req, res) => {
  try {
    const { status, userId, dateFrom, dateTo } = req.query;
    const filter = {};

    if (status) filter.status = status;

    // User-wise filter: show only recipes by a specific user
    if (userId) filter.createdBy = userId;

    // Date-wise filter: createdAt between dateFrom and dateTo
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);          // include the full end day
        filter.createdAt.$lte = end;
      }
    }

    const recipes = await Recipe.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch {
    res.status(500).json({ message: 'Error fetching recipes' });
  }
});

// ── POST create recipe (admin) → directly approved ──────────────
router.post('/recipes', adminAuth, async (req, res) => {
  try {
    const { title, description, image, category, cookTime, servings, difficulty, ingredients, steps, tags } = req.body;

    if (!title || !description || !category || !ingredients || !steps) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const newRecipe = new Recipe({
      title, description, image, category,
      cookTime: Number(cookTime),
      servings: Number(servings),
      difficulty,
      ingredients,
      steps,
      tags: tags || [],
      createdBy: req.user.userId,
      status: 'approved',             // admin creates → instantly approved
      approvalDate: new Date(),
    });

    await newRecipe.save();
    res.status(201).json({ message: 'Recipe created!', recipe: newRecipe });
  } catch (err) {
    res.status(500).json({ message: 'Error creating recipe' });
  }
});

// ── PUT update any recipe (admin) ───────────────────────────────
router.put('/recipes/:id', adminAuth, async (req, res) => {
  try {
    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Recipe not found' });
    res.json({ message: 'Recipe updated', recipe: updated });
  } catch {
    res.status(500).json({ message: 'Error updating recipe' });
  }
});

// ── PATCH update approval status only ───────────────────────────
router.patch('/recipes/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'approved') {
      return res.status(400).json({ message: 'Only "approved" status is allowed.' });
    }

    const updated = await Recipe.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvalDate: new Date() },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!updated) return res.status(404).json({ message: 'Recipe not found' });

    // ── Award 10 credit points to the recipe creator ──────────
    await User.findByIdAndUpdate(updated.createdBy._id, { $inc: { creditPoints: 10 } });

    res.json({ message: 'Recipe approved! Creator awarded 10 credit points.', recipe: updated });
  } catch {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// ── DELETE any recipe ────────────────────────────────────────────
router.delete('/recipes/:id', adminAuth, async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting recipe' });
  }
});

// ── GET all pending reviews (across all recipes) ─────────────────
router.get('/reviews/pending', adminAuth, async (req, res) => {
  try {
    const recipes = await Recipe.find({ 'reviews.status': 'pending' })
      .populate('createdBy', 'name')
      .select('title reviews');
    // Flatten to a list of pending reviews with recipe context
    const pending = [];
    recipes.forEach(recipe => {
      recipe.reviews
        .filter(r => r.status === 'pending')
        .forEach(r => {
          pending.push({
            recipeId:    recipe._id,
            recipeTitle: recipe.title,
            reviewId:    r._id,
            name:        r.name,
            rating:      r.rating,
            comment:     r.comment,
            createdAt:   r.createdAt,
          });
        });
    });
    res.json(pending);
  } catch {
    res.status(500).json({ message: 'Error fetching pending reviews' });
  }
});

// ── PATCH approve a review ────────────────────────────────────────
router.patch('/reviews/:recipeId/:reviewId/approve', adminAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    const review = recipe.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.status = 'approved';
    await recipe.save();
    res.json({ message: 'Review approved' });
  } catch {
    res.status(500).json({ message: 'Error approving review' });
  }
});

// ── DELETE reject a review ────────────────────────────────────────
router.delete('/reviews/:recipeId/:reviewId/reject', adminAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    recipe.reviews.pull({ _id: req.params.reviewId });
    await recipe.save();
    res.json({ message: 'Review rejected and removed' });
  } catch {
    res.status(500).json({ message: 'Error rejecting review' });
  }
});

// ── GET trending recipes ─────────────────────────────────────────
// Most viewed today + most liked + most viewed overall
router.get('/trending', adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [trendingToday, mostViewed, mostLiked] = await Promise.all([
      Recipe.find({ status: 'approved', viewDate: today })
        .sort({ viewedToday: -1 })
        .limit(5)
        .populate('createdBy', 'name')
        .select('title image viewedToday viewCount likes category averageRating'),
      Recipe.find({ status: 'approved' })
        .sort({ viewCount: -1 })
        .limit(5)
        .populate('createdBy', 'name')
        .select('title image viewCount likes category averageRating'),
      Recipe.find({ status: 'approved' })
        .sort({ 'likes': -1 })
        .limit(5)
        .populate('createdBy', 'name')
        .select('title image viewCount likes category averageRating'),
    ]);
    res.json({ trendingToday, mostViewed, mostLiked });
  } catch {
    res.status(500).json({ message: 'Error fetching trending data' });
  }
});

// ── GET top-rated recipes ─────────────────────────────────────────
router.get('/top-rated', adminAuth, async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: 'approved', 'reviews.0': { $exists: true } })
      .populate('createdBy', 'name')
      .select('title image reviews likes viewCount category createdBy');
    // Sort by average approved rating
    const withRating = recipes
      .map(r => {
        const approved = r.reviews.filter(rv => rv.status === 'approved');
        const avg = approved.length
          ? (approved.reduce((a, rv) => a + rv.rating, 0) / approved.length).toFixed(1)
          : 0;
        return { ...r.toJSON(), computedAvg: parseFloat(avg), approvedReviewCount: approved.length };
      })
      .filter(r => r.approvedReviewCount > 0)
      .sort((a, b) => b.computedAvg - a.computedAvg)
      .slice(0, 10);
    res.json(withRating);
  } catch {
    res.status(500).json({ message: 'Error fetching top-rated recipes' });
  }
});

// ── GET analytics data ───────────────────────────────────────────
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    // Monthly uploads for last 6 months
    const monthlyUploads = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await Recipe.countDocuments({ createdAt: { $gte: d, $lt: end } });
      monthlyUploads.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        count,
      });
    }

    // Most searched ingredients (based on recipe ingredient frequency)
    const ingAgg = await Recipe.aggregate([
      { $match: { status: 'approved' } },
      { $unwind: '$ingredients' },
      { $group: { _id: { $toLower: '$ingredients' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // User registrations per month (last 6 months)
    const userActivity = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await User.countDocuments({ createdAt: { $gte: d, $lt: end } });
      userActivity.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        count,
      });
    }

    // Category distribution
    const categoryStats = await Recipe.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top contributors by credit points
    const topContributors = await User.find({ role: 'user', creditPoints: { $gt: 0 } })
      .sort({ creditPoints: -1 })
      .limit(5)
      .select('name creditPoints');

    res.json({
      monthlyUploads,
      mostSearchedIngredients: ingAgg.map(i => ({ ingredient: i._id, count: i.count })),
      userActivity,
      categoryStats: categoryStats.map(c => ({ category: c._id, count: c.count })),
      topContributors,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytics', error: err.message });
  }
});

// ── GET user credit points leaderboard ───────────────────────────
router.get('/credits', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .sort({ creditPoints: -1 })
      .limit(20)
      .select('name email creditPoints createdAt');
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error fetching credit data' });
  }
});

module.exports = router;
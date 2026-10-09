const express        = require('express');
const path           = require('path');
const fs             = require('fs');
const multer         = require('multer');
const Recipe         = require('../models/Recipe');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── Multer setup ──────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'recipes');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext    = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});
const fileFilter = (_req, file, cb) =>
  file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only'), false);

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helper: parse a field that may be a JSON string or plain array ─
const parseField = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
  } catch (_) {}
  return [String(val).trim()].filter(Boolean);
};

const deleteOldImage = (imgPath) => {
  if (!imgPath || imgPath.startsWith('http')) return;
  const abs = path.join(__dirname, '..', imgPath.replace(/^\//, ''));
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
};

// ── GET all approved recipes ──────────────────────────────────────
// FIX: /saved and /my MUST be declared BEFORE /:id to avoid "Recipe not found"
router.get('/', async (req, res) => {
  try {
    const { search, category, difficulty, ingredients, sortBy } = req.query;
    const filter = { status: 'approved' };

    // Multi-ingredient search: ?ingredients=tomato,garlic,onion
    if (ingredients) {
      const ingList = ingredients.split(',').map(s => s.trim()).filter(Boolean);
      if (ingList.length > 0) {
        filter.ingredients = { $all: ingList.map(i => new RegExp(i, 'i')) };
      }
    }

    // General search: title, tags, OR single ingredient
    if (search) {
      const searchOr = [
        { title:       { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
        { ingredients: { $regex: search, $options: 'i' } },
      ];
      if (filter.ingredients) {
        filter.$and = [{ ingredients: filter.ingredients }, { $or: searchOr.slice(0, 2) }];
        delete filter.ingredients;
      } else {
        filter.$or = searchOr;
      }
    }

    if (category)   filter.category   = category;
    if (difficulty) filter.difficulty = difficulty;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt:  1 },
      az:     { title:      1 },
      za:     { title:     -1 },
      top:    { averageRating: -1, createdAt: -1 },
    };
    const sortQuery = sortMap[sortBy] || { createdAt: -1 };

    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 6;
    const skip  = (page - 1) * limit;

    if (sortBy === 'top') {
      const allRecipes = await Recipe.find(filter).populate('createdBy', 'name');
      allRecipes.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));
      const total   = allRecipes.length;
      const recipes = allRecipes.slice(skip, skip + limit);
      return res.json({ recipes, currentPage: page, totalPages: Math.ceil(total / limit), totalRecipes: total });
    }

    const [recipes, totalRecipes] = await Promise.all([
      Recipe.find(filter).populate('createdBy', 'name').sort(sortQuery).skip(skip).limit(limit),
      Recipe.countDocuments(filter),
    ]);
    res.json({ recipes, currentPage: page, totalPages: Math.ceil(totalRecipes / limit), totalRecipes });
  } catch (err) { res.status(500).json({ message: 'Error fetching recipes', error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
//  IMPORTANT: /saved and /my MUST come BEFORE /:id
//  Otherwise Express matches "saved" as an :id param → 404
// ════════════════════════════════════════════════════════════════

// ── GET saved recipes ─────────────────────────────────────────────
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId).populate({
      path: 'savedRecipes',
      populate: { path: 'createdBy', select: 'name' },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.savedRecipes);
  } catch { res.status(500).json({ message: 'Error fetching saved recipes' }); }
});

// ── GET my recipes ────────────────────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find({ createdBy: req.user.userId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch { res.status(500).json({ message: 'Error fetching your recipes' }); }
});

// ── GET trending recipes (public) ────────────────────────────────
router.get('/trending', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [trendingToday, mostViewed, mostLiked] = await Promise.all([
      Recipe.find({ status: 'approved', viewDate: today })
        .sort({ viewedToday: -1 }).limit(6)
        .populate('createdBy', 'name')
        .select('title image viewedToday viewCount likes category'),
      Recipe.find({ status: 'approved' })
        .sort({ viewCount: -1 }).limit(6)
        .populate('createdBy', 'name')
        .select('title image viewCount likes category'),
      Recipe.find({ status: 'approved' })
        .sort({ 'likes': -1 }).limit(6)
        .populate('createdBy', 'name')
        .select('title image viewCount likes category'),
    ]);
    res.json({ trendingToday, mostViewed, mostLiked });
  } catch { res.status(500).json({ message: 'Error fetching trending' }); }
});

// ── GET top-rated recipes (public) ───────────────────────────────
router.get('/top-rated', async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: 'approved', 'reviews.0': { $exists: true } })
      .populate('createdBy', 'name')
      .select('title image reviews likes viewCount category createdBy');

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
  } catch { res.status(500).json({ message: 'Error fetching top-rated' }); }
});

// ── GET single recipe ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    // 1. Fetch the recipe first
    const recipe = await Recipe.findById(req.params.id).populate('createdBy', 'name email');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // 2. Check owner via token (optional auth)
    let requestingUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        requestingUserId = decoded.userId;
      } catch (_) {}
    }

    const isOwner = requestingUserId &&
      String(recipe.createdBy?._id || recipe.createdBy) === String(requestingUserId);

    // 3. Non-approved → only owner can view
    if (recipe.status !== 'approved' && !isOwner) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // 4. Update view count in background (don't await — never block the response)
    const today = new Date().toISOString().slice(0, 10);
    const sameDay = recipe.viewDate === today;
    const viewUpdate = sameDay
      ? { $inc: { viewCount: 1, viewedToday: 1 } }
      : { $inc: { viewCount: 1 }, $set: { viewDate: today, viewedToday: 1 } };
    Recipe.findByIdAndUpdate(req.params.id, viewUpdate).catch(() => {});

    // 5. Return recipe with only approved reviews
    const recipeObj = recipe.toJSON();
    recipeObj.reviews = (recipeObj.reviews || []).filter(r => r.status === 'approved');
    res.json(recipeObj);
  } catch (err) {
    console.error('GET /recipes/:id error:', err.message);
    res.status(500).json({ message: 'Error fetching recipe', error: err.message });
  }
});

// ── POST create recipe ────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, cookTime, servings, difficulty } = req.body;
    const ingredients = parseField(req.body.ingredients);
    const steps       = parseField(req.body.steps);
    const tags        = parseField(req.body.tags);

    if (!title || !description || !category || !ingredients.length || !steps.length) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const image = req.file ? `/uploads/recipes/${req.file.filename}` : '';

    const newRecipe = new Recipe({
      title, description, image, category,
      cookTime:    Number(cookTime),
      servings:    Number(servings),
      difficulty:  difficulty || 'Easy',
      ingredients, steps, tags,
      createdBy:   req.user.userId,
      status:      'requested',
      approvalDate: null,
    });

    await newRecipe.save();
    res.status(201).json({ message: 'Recipe submitted for approval!', recipe: newRecipe });
  } catch (err) {
    res.status(500).json({ message: 'Error creating recipe', error: err.message });
  }
});

// ── PUT update OWN recipe ─────────────────────────────────────────
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (recipe.createdBy.toString() !== req.user.userId)
      return res.status(403).json({ message: 'You can only edit your own recipes' });

    const { title, description, category, cookTime, servings, difficulty, existingImage } = req.body;
    const ingredients = parseField(req.body.ingredients);
    const steps       = parseField(req.body.steps);
    const tags        = parseField(req.body.tags);

    let image = recipe.image;
    if (req.file) {
      deleteOldImage(recipe.image);
      image = `/uploads/recipes/${req.file.filename}`;
    } else if (existingImage !== undefined) {
      image = existingImage;
    }

    const updated = await Recipe.findByIdAndUpdate(req.params.id, {
      title, description, image, category,
      cookTime: Number(cookTime), servings: Number(servings),
      difficulty: difficulty || 'Easy',
      ingredients, steps, tags,
      status: 'requested', approvalDate: null,
    }, { new: true });

    res.json({ message: 'Recipe updated! Pending admin approval again.', recipe: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating recipe', error: err.message });
  }
});

// ── DELETE own recipe ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    if (recipe.createdBy.toString() !== req.user.userId)
      return res.status(403).json({ message: 'You can only delete your own recipes' });
    deleteOldImage(recipe.image);
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted successfully' });
  } catch { res.status(500).json({ message: 'Error deleting recipe' }); }
});

// ── POST save / unsave ────────────────────────────────────────────
router.post('/:id/save', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    const alreadySaved = user.savedRecipes.includes(req.params.id);
    if (alreadySaved) {
      await User.findByIdAndUpdate(req.user.userId, { $pull: { savedRecipes: req.params.id } });
      res.json({ message: 'Recipe unsaved', saved: false });
    } else {
      await User.findByIdAndUpdate(req.user.userId, { $addToSet: { savedRecipes: req.params.id } });
      res.json({ message: 'Recipe saved!', saved: true });
    }
  } catch { res.status(500).json({ message: 'Error saving recipe' }); }
});

// ── POST like / unlike ────────────────────────────────────────────
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    const uid    = req.user.userId;
    const liked  = recipe.likes.map(String).includes(uid);
    const update = liked ? { $pull: { likes: uid } } : { $addToSet: { likes: uid } };
    const updated = await Recipe.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ liked: !liked, likesCount: updated.likes.length });
  } catch { res.status(500).json({ message: 'Error liking recipe' }); }
});

// ── POST add review ───────────────────────────────────────────────
router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required' });
    const recipe = await Recipe.findById(req.params.id).populate('reviews.user', 'name');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (recipe.createdBy.toString() === req.user.userId) {
      return res.status(403).json({ message: 'You cannot rate or comment on your own recipe' });
    }

    const alreadyReviewed = recipe.reviews.some(r => r.user._id?.toString() === req.user.userId);
    if (alreadyReviewed) return res.status(400).json({ message: 'You have already reviewed this recipe' });

    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    recipe.reviews.push({ user: req.user.userId, name: user.name, rating: Number(rating), comment, status: 'pending' });
    await recipe.save();
    const approvedReviews = recipe.reviews.filter(r => r.status === 'approved');
    res.status(201).json({
      message: 'Review submitted! It will appear after admin approval.',
      reviews: approvedReviews,
      averageRating: recipe.averageRating,
    });
  } catch { res.status(500).json({ message: 'Error adding review' }); }
});

// ── DELETE review (owner OR admin) ───────────────────────────────
router.delete('/:id/reviews/:reviewId', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    const review = recipe.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = review.user.toString() === req.user.userId;
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorised to delete this review' });

    recipe.reviews.pull({ _id: req.params.reviewId });
    await recipe.save();
    res.json({ message: 'Review deleted' });
  } catch { res.status(500).json({ message: 'Error deleting review' }); }
});

module.exports = router;
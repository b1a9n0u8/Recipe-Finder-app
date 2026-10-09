// =============================================
// seed.js - Populate DB with DummyJSON recipes
// =============================================
// Run this ONCE with: node seed.js
// Make sure your backend server is NOT running when you seed

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Recipe = require('./models/Recipe');
const User = require('./models/User');

// DummyJSON mealType → your app's category
const mapCategory = (mealTypes) => {
  if (!mealTypes || mealTypes.length === 0) return 'Dinner';
  const meal = mealTypes[0].toLowerCase();
  if (meal.includes('breakfast')) return 'Breakfast';
  if (meal.includes('lunch'))     return 'Lunch';
  if (meal.includes('dinner'))    return 'Dinner';
  if (meal.includes('snack'))     return 'Snack';
  if (meal.includes('dessert'))   return 'Dessert';
  if (meal.includes('drink'))     return 'Drink';
  return 'Dinner'; // default fallback
};

// DummyJSON difficulty → your app's difficulty
const mapDifficulty = (difficulty) => {
  if (!difficulty) return 'Easy';
  const d = difficulty.toLowerCase();
  if (d === 'easy')   return 'Easy';
  if (d === 'medium') return 'Medium';
  if (d === 'hard')   return 'Hard';
  return 'Easy';
};

const seed = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 2. Find a user to assign as recipe creator
    const user = await User.findOne();
    if (!user) {
      console.log(' No users found!');
      console.log(' Please signup for the recipe');
      process.exit(1);
    }
    console.log(`👤 Using user: ${user.name} (${user.email})`);

    // 3. Fetch recipes from DummyJSON (all 50 recipes)
    console.log('🌐 Fetching recipes from dummyjson.com...');
    const response = await fetch('https://dummyjson.com/recipes?limit=50');
    const data = await response.json();
    const dummyRecipes = data.recipes;
    console.log(` Fetched ${dummyRecipes.length} recipes`);

    // 4. Clear existing recipes
    await Recipe.deleteMany({});
    console.log('🗑️ Cleared existing recipes');

    // 5. Map DummyJSON fields → your Recipe schema fields
    const recipes = dummyRecipes.map((r) => ({
      title:       r.name,
      description: `A delicious ${r.cuisine || ''} recipe. ${r.rating ? `Rated ${r.rating}/5 by ${r.reviewCount} people.` : ''}`.trim(),
      image:       r.image,
      category:    mapCategory(r.mealType),
      cookTime:    (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0),
      servings:    r.servings || 2,
      difficulty:  mapDifficulty(r.difficulty),
      ingredients: r.ingredients || [],
      steps:       r.instructions || [],
      tags:        r.tags || [],
      createdBy:   user._id,
      status:      'approved',
      approvalDate: new Date(),
    }));

    // 6. Insert all recipes into MongoDB
    await Recipe.insertMany(recipes);
    console.log(` Successfully added ${recipes.length} recipes to your database!`);
    console.log(' Now start your server and go to http://localhost:3000');

  } catch (error) {
    console.error(' Fetching data failed:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

seed();
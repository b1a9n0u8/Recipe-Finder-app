import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import EditRecipePage from './pages/EditRecipePage';       // ← NEW
import SavedRecipesPage from './pages/SavedRecipesPage';
import MyRecipesPage from './pages/MyRecipesPage';
import AdminPage from './pages/AdminPage';
import Footer from './components/Footer';

// ProtectedRoute: redirects to /login if not logged in
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// AdminRoute: must be logged in AND be admin
const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/" replace />;
  return children;
};

// GuestRoute: redirect to home if already logged in
const GuestRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="main-content">
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />

            {/* Guest only */}
            <Route path="/login"  element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

            {/* Login required */}
            <Route path="/recipes/:id"     element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />
            <Route path="/recipe/:id"      element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />
            <Route path="/create-recipe"   element={<ProtectedRoute><CreateRecipePage /></ProtectedRoute>} />
           <Route path="/edit-recipe/:id" element={<ProtectedRoute><EditRecipePage /></ProtectedRoute>} />
            <Route path="/saved-recipes"   element={<ProtectedRoute><SavedRecipesPage /></ProtectedRoute>} />
            <Route path="/my-recipes"      element={<ProtectedRoute><MyRecipesPage /></ProtectedRoute>} />

            {/* Admin only */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import api from '../data/api';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async ({ name, email, password }) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthForm mode="signup" onSubmit={handleSignup} loading={loading} error={error} />;
};

export default SignupPage;
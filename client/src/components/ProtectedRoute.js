// src/components/ProtectedRoute.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check for the token in our Redux store
  const { token } = useSelector((state) => state.auth);

  // If we have a token, show the child page (Outlet).
  // Otherwise, redirect to the /login page.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
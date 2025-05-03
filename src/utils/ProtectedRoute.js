import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { auth } = useAuth();

  if (!auth.user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <div>Unauthorized</div>;
  }

  return children;
};

export default ProtectedRoute;

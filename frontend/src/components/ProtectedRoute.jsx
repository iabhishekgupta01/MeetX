import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div>Loading...</div>; // You can replace this with a spinner component
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return element;
};

export default ProtectedRoute;

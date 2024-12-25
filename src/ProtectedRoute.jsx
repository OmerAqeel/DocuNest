import React from "react";
import { Navigate } from "react-router-dom";


const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("authToken");
  const user = localStorage.getItem("persist:root");

  // Parse the outer JSON
  const parsedUser = JSON.parse(user);

  // Parse the nested userData JSON string
  const userData = parsedUser?.userData ? JSON.parse(parsedUser.userData) : null;

  // Check if the user is authenticated
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if(userData?.assistants?.length === 0) {
    return <Navigate to="/chat" replace />;
  }

  return children;
};

export default ProtectedRoute;

import React from 'react';
import { Outlet } from 'react-router-dom';

// AUTH BYPASSED FOR TESTING
const ProtectedRoute = () => <Outlet />;

export default ProtectedRoute;

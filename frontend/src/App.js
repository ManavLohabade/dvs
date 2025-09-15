import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminDaylight from './pages/admin/AdminDaylight';
import AdminGoodTimings from './pages/admin/AdminGoodTimings';
import AdminCategories from './pages/admin/AdminCategories';
import AdminNewsletter from './pages/admin/AdminNewsletter';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* User routes */}
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              
              {/* Admin routes */}
              <Route path="admin/calendar" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminCalendar />
                </ProtectedRoute>
              } />
              <Route path="admin/daylight" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDaylight />
                </ProtectedRoute>
              } />
              <Route path="admin/good-timings" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminGoodTimings />
                </ProtectedRoute>
              } />
              <Route path="admin/categories" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminCategories />
                </ProtectedRoute>
              } />
              <Route path="admin/newsletter" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminNewsletter />
                </ProtectedRoute>
              } />
              <Route path="admin" element={<Navigate to="/" replace />} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

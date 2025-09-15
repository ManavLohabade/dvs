import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Settings, Sun, Clock, Users, LogOut, Menu, X, Home, Mail } from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <div className="grid grid-cols-3 items-center w-full">
            <div className="flex justify-start">
              <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
                <div className="nav-logo">
                  <Calendar className="nav-logo-icon" />
                </div>
                <span className="nav-brand-text">DVS</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 justify-center">
              {user && (
                <>
                  <Link 
                    to="/" 
                    className={`nav-link ${isActive('/') ? 'active' : ''}`}
                  >
                    <Home size={16} />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link 
                    to="/calendar" 
                    className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}
                  >
                    <Calendar size={16} />
                    <span>Calendar</span>
                  </Link>
                  
                  {isAdmin() && (
                    <>
                      <Link 
                        to="/admin/daylight" 
                        className={`nav-link ${isActive('/admin/daylight') ? 'active' : ''}`}
                      >
                        <Sun size={16} />
                        <span>Daylight</span>
                      </Link>
                      
                      <Link 
                        to="/admin/good-timings" 
                        className={`nav-link ${isActive('/admin/good-timings') ? 'active' : ''}`}
                      >
                        <Clock size={16} />
                        <span>Good Timings</span>
                      </Link>
                      
                      <Link 
                        to="/admin/categories" 
                        className={`nav-link ${isActive('/admin/categories') ? 'active' : ''}`}
                      >
                        <Users size={16} />
                        <span>Categories</span>
                      </Link>
                      
                      <Link 
                        to="/admin/newsletter" 
                        className={`nav-link ${isActive('/admin/newsletter') ? 'active' : ''}`}
                      >
                        <Mail size={16} />
                        <span>Newsletter</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
            
            <div className="flex justify-end">
              {user && (
                <div className="flex items-center gap-4 ml-4 pl-4">
                  <div className="nav-profile-photo">
                    <span className="nav-profile-initial">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>

          {/* Mobile Navigation Menu */}
          {user && mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Home size={20} />
                  <span>Dashboard</span>
                </Link>
                
                <Link 
                  to="/calendar" 
                  className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Calendar size={20} />
                  <span>Calendar</span>
                </Link>
                
                {isAdmin() && (
                  <>
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Admin Panel
                      </p>
                    </div>
                    
                    <Link 
                      to="/admin/daylight" 
                      className={`nav-link ${isActive('/admin/daylight') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      <Sun size={20} />
                      <span>Daylight</span>
                    </Link>
                    
                    <Link 
                      to="/admin/good-timings" 
                      className={`nav-link ${isActive('/admin/good-timings') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      <Clock size={20} />
                      <span>Good Timings</span>
                    </Link>
                    
                    <Link 
                      to="/admin/categories" 
                      className={`nav-link ${isActive('/admin/categories') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      <Users size={20} />
                      <span>Categories</span>
                    </Link>
                    
                    <Link 
                      to="/admin/newsletter" 
                      className={`nav-link ${isActive('/admin/newsletter') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      <Mail size={20} />
                      <span>Newsletter</span>
                    </Link>
                  </>
                )}
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="btn btn-secondary w-full"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="container-full">
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-form">
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Side - Login Form */}
            <div className="auth-form-side">
              <div className="text-center mb-5">
                <img src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/lotus.webp"
                  style={{width: '185px'}} alt="logo" />
                <h4 className="mt-1 mb-5 pb-1 auth-team-name">We are The Lotus Team</h4>
              </div>

              <p className="text-gray-600 mb-4">Please login to your account</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="auth-input-group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="auth-input"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="auth-input-group">
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="auth-input pr-12"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-center pt-1 mb-5 pb-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-btn"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      'LOG IN'
                    )}
                  </button>
                  <Link to="/forgot-password" className="text-muted text-sm">
                    Forgot password?
                  </Link>
                </div>

                <div className="d-flex flex-row align-items-center justify-content-center pb-4 mb-4">
                  <p className="mb-0 text-gray-600">Don't have an account?</p>
                  <Link to="/register" className="auth-btn-outline mx-2">
                    CREATE NEW
                  </Link>
                </div>
              </form>

              {/* Demo Credentials */}
              <div className="demo-credentials">
                <h4>Demo Credentials:</h4>
                <p><strong>Admin:</strong> admin@dvs.com / admin123</p>
                <p><strong>User:</strong> user@dvs.com / user123</p>
              </div>
            </div>

            {/* Right Side - Hero Section */}
            <div className="auth-hero-side gradient-custom-2">
              <div className="px-3 py-4 p-md-5 mx-md-4">
                <h4 className="mb-4 text-xl font-semibold">We are more than just a company</h4>
                <p className="small mb-0 text-sm opacity-90">
                  DVS (Daily Good Timings) is your comprehensive solution for managing and optimizing 
                  your daily schedule. Track the best times for different activities, monitor daylight 
                  patterns, and maximize your productivity with our intelligent scheduling system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

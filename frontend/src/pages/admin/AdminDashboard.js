import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Sun, Users, Plus, Eye, Settings, BarChart3, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  // Sample data for demonstration
  const stats = {
    totalGoodTimings: 12,
    totalTimeSlots: 45,
    totalCategories: 5,
    daylightEntries: 30
  };

  const recentTimings = [
    { id: 1, day: 'Monday', time_slots: 3, created_at: '2024-01-15' },
    { id: 2, day: 'Tuesday', time_slots: 2, created_at: '2024-01-14' },
    { id: 3, day: 'Wednesday', time_slots: 4, created_at: '2024-01-13' },
    { id: 4, day: 'Thursday', time_slots: 1, created_at: '2024-01-12' },
    { id: 5, day: 'Friday', time_slots: 3, created_at: '2024-01-11' },
  ];

  const categories = [
    { id: 1, name: 'Work', color_token: 'blue', is_active: true, count: 15 },
    { id: 2, name: 'Personal', color_token: 'green', is_active: true, count: 12 },
    { id: 3, name: 'Health', color_token: 'teal', is_active: true, count: 8 },
    { id: 4, name: 'Learning', color_token: 'amber', is_active: true, count: 6 },
    { id: 5, name: 'Emergency', color_token: 'red', is_active: true, count: 4 },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage your daily good timings system
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalGoodTimings}</h3>
              <p className="text-sm text-gray-600">Good Timings</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalTimeSlots}</h3>
              <p className="text-sm text-gray-600">Time Slots</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalCategories}</h3>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sun className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stats.daylightEntries}</h3>
              <p className="text-sm text-gray-600">Daylight Entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/admin/good-timings" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Plus className="text-accent" size={24} />
            <div>
              <h3 className="font-semibold">Manage Good Timings</h3>
              <p className="text-sm text-gray-600">Create and edit time slots</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/daylight" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Sun className="text-amber-500" size={24} />
            <div>
              <h3 className="font-semibold">Manage Daylight</h3>
              <p className="text-sm text-gray-600">Set sunrise/sunset times</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/categories" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Users className="text-purple-500" size={24} />
            <div>
              <h3 className="font-semibold">Manage Categories</h3>
              <p className="text-sm text-gray-600">Organize timing categories</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/calendar" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={24} />
            <div>
              <h3 className="font-semibold">Admin Calendar</h3>
              <p className="text-sm text-gray-600">View and edit calendar</p>
            </div>
          </div>
        </Link>

        <Link to="/calendar" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Eye className="text-blue-500" size={24} />
            <div>
              <h3 className="font-semibold">View User Calendar</h3>
              <p className="text-sm text-gray-600">See how users view the calendar</p>
            </div>
          </div>
        </Link>

        <Link to="/" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Settings className="text-gray-500" size={24} />
            <div>
              <h3 className="font-semibold">User Dashboard</h3>
              <p className="text-sm text-gray-600">Return to main dashboard</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Good Timings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Good Timings</h2>
            <Link to="/admin/good-timings" className="btn btn-primary btn-sm">
              <Plus size={16} />
              Add New
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentTimings.map((timing) => (
              <div key={timing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{timing.day}</div>
                  <div className="text-sm text-gray-600">
                    {timing.time_slots} time slot{timing.time_slots !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {timing.created_at}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Categories Overview</h2>
            <Link to="/admin/categories" className="btn btn-primary btn-sm">
              <Settings size={16} />
              Manage
            </Link>
          </div>
          
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-4 h-4 rounded ${
                      category.color_token === 'blue' ? 'bg-blue-500' :
                      category.color_token === 'green' ? 'bg-green-500' :
                      category.color_token === 'teal' ? 'bg-teal-500' :
                      category.color_token === 'amber' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-600">
                      {category.count} timing{category.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded ${
                  category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={16} />
            </div>
            <div>
              <div className="font-medium text-green-900">Database</div>
              <div className="text-sm text-green-700">Connected</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="text-green-600" size={16} />
            </div>
            <div>
              <div className="font-medium text-green-900">API</div>
              <div className="text-sm text-green-700">Operational</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Settings className="text-green-600" size={16} />
            </div>
            <div>
              <div className="font-medium text-green-900">System</div>
              <div className="text-sm text-green-700">Healthy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
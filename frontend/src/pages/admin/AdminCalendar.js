import React from 'react';
import { Calendar, Plus } from 'lucide-react';

const AdminCalendar = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Calendar</h1>
          <p className="text-gray-600 mt-1">Manage and view all good timings with daylight data</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          Add Good Timing
        </button>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Calendar View</h3>
          <p className="text-gray-600 mb-4">
            This will show the full calendar with admin controls for managing good timings and daylight data.
          </p>
          <p className="text-sm text-gray-500">
            Coming in the next development phase...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;

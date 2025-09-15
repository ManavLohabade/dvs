import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import TouchOptimized from './TouchOptimized';

const MobileCalendar = ({ 
  goodTimings = [], 
  daylight = [], 
  onDateSelect, 
  selectedDate,
  isAdmin = false 
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [swipeStart, setSwipeStart] = useState(null);

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - date.getDay() + 1 + i); // Start from Monday
    return {
      day: format(date, 'EEEE'),
      date: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'dd'),
      fullDate: date
    };
  });

  // Generate month dates
  const monthDates = () => {
    const start = startOfWeek(new Date(currentWeek.getFullYear(), currentWeek.getMonth(), 1), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0), { weekStartsOn: 1 });
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push({
        day: format(d, 'EEEE'),
        date: format(d, 'yyyy-MM-dd'),
        displayDate: format(d, 'dd'),
        fullDate: new Date(d),
        isCurrentMonth: d.getMonth() === currentWeek.getMonth()
      });
    }
    
    return dates;
  };

  const navigateWeek = (direction) => {
    setCurrentWeek(addWeeks(currentWeek, direction));
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const getDayTimings = (day) => {
    return goodTimings.filter(timing => 
      timing.day === day
    );
  };

  const getDaylightForDate = (date) => {
    return daylight.find(d => d.date === date);
  };

  const handleSwipeLeft = () => {
    if (viewMode === 'week') {
      navigateWeek(1);
    } else {
      navigateMonth(1);
    }
  };

  const handleSwipeRight = () => {
    if (viewMode === 'week') {
      navigateWeek(-1);
    } else {
      navigateMonth(-1);
    }
  };

  const handleDateTap = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const renderWeekView = () => (
    <div className="space-y-3">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <TouchOptimized onTap={() => navigateWeek(-1)}>
          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
            <ChevronLeft size={20} />
          </button>
        </TouchOptimized>
        
        <div className="text-center">
          <h3 className="font-semibold text-gray-900">
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
          </h3>
        </div>
        
        <TouchOptimized onTap={() => navigateWeek(1)}>
          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
            <ChevronRight size={20} />
          </button>
        </TouchOptimized>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map(({ day, date, displayDate, fullDate }) => {
          const dayTimings = getDayTimings(day);
          const dayDaylight = getDaylightForDate(date);
          const isCurrentDay = isToday(fullDate);
          const isSelected = selectedDate && isSameDay(fullDate, new Date(selectedDate));

          return (
            <TouchOptimized
              key={day}
              onTap={() => handleDateTap(fullDate)}
              className={`p-2 border rounded-lg text-center min-h-[80px] ${
                isCurrentDay ? 'bg-blue-50 border-blue-200' : 
                isSelected ? 'bg-primary border-primary' : 
                'bg-white border-gray-200'
              } ${isCurrentDay || isSelected ? 'text-white' : 'text-gray-900'}`}
            >
              <div className="text-xs font-medium mb-1">
                {day.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm font-bold mb-1">
                {displayDate}
              </div>
              
              {isAdmin && dayDaylight && (
                <div className="text-xs opacity-75 mb-1">
                  <div className="truncate">
                    {dayDaylight.sunrise_time} - {dayDaylight.sunset_time}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {dayTimings.length > 0 ? (
                  dayTimings.slice(0, 2).map((timing) => (
                    <div key={timing.id}>
                      {timing.time_slots && timing.time_slots.length > 0 ? (
                        timing.time_slots.slice(0, 1).map((slot) => (
                          <div
                            key={slot.id}
                            className={`text-xs p-1 rounded ${
                              slot.category_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              slot.category_color === 'green' ? 'bg-green-100 text-green-800' :
                              slot.category_color === 'teal' ? 'bg-teal-100 text-teal-800' :
                              slot.category_color === 'amber' ? 'bg-amber-100 text-amber-800' :
                              slot.category_color === 'red' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="truncate">
                              {slot.start_time} - {slot.end_time}
                            </div>
                          </div>
                        ))
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-xs opacity-50">No timings</div>
                )}
                
                {dayTimings.length > 2 && (
                  <div className="text-xs opacity-75">
                    +{dayTimings.length - 2}
                  </div>
                )}
              </div>
            </TouchOptimized>
          );
        })}
      </div>
    </div>
  );

  const renderMonthView = () => {
    const dates = monthDates();
    const weeks = [];
    
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }

    return (
      <div className="space-y-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <TouchOptimized onTap={() => navigateMonth(-1)}>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <ChevronLeft size={20} />
            </button>
          </TouchOptimized>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">
              {format(currentWeek, 'MMMM yyyy')}
            </h3>
          </div>
          
          <TouchOptimized onTap={() => navigateMonth(1)}>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <ChevronRight size={20} />
            </button>
          </TouchOptimized>
        </div>

        {/* Month Grid */}
        <div className="space-y-1">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar weeks */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map(({ day, date, displayDate, fullDate, isCurrentMonth }) => {
                const dayTimings = getDayTimings(day);
                const isCurrentDay = isToday(fullDate);
                const isSelected = selectedDate && isSameDay(fullDate, new Date(selectedDate));

                return (
                  <TouchOptimized
                    key={date}
                    onTap={() => handleDateTap(fullDate)}
                    className={`p-2 border rounded-lg text-center min-h-[60px] ${
                      !isCurrentMonth ? 'opacity-30' : ''
                    } ${
                      isCurrentDay ? 'bg-blue-50 border-blue-200' : 
                      isSelected ? 'bg-primary border-primary text-white' : 
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {displayDate}
                    </div>
                    
                    <div className="space-y-1">
                      {dayTimings.length > 0 && isCurrentMonth ? (
                        <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                      ) : null}
                    </div>
                  </TouchOptimized>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <TouchOptimized
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      className="bg-white rounded-lg shadow-sm border p-4"
    >
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'week' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'month' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month
          </button>
        </div>
        
        <TouchOptimized onTap={goToToday}>
          <button className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
            <CalendarIcon size={16} />
            Today
          </button>
        </TouchOptimized>
      </div>

      {/* Calendar Content */}
      {viewMode === 'week' ? renderWeekView() : renderMonthView()}
    </TouchOptimized>
  );
};

export default MobileCalendar;

import React from 'react';
import { X, Clock, Sun, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';

const DateModal = ({ isOpen, onClose, selectedDate, events, daylightData, onEventClick }) => {
  // Force re-render when events change
  React.useEffect(() => {
    console.log('DateModal: Events updated', events.length);
    console.log('DateModal: Events data:', events);
  }, [events]);

  // Force re-render when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('DateModal: Modal opened, refreshing events...');
    }
  }, [isOpen]);

  if (!isOpen || !selectedDate) return null;

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  const getCategoryColor = (color) => {
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      teal: '#14b8a6',
      amber: '#f59e0b',
      red: '#ef4444',
      yellow: '#eab308',
      orange: '#f97316',
      purple: '#8b5cf6'
    };
    return colors[color] || colors.blue;
  };

  const getEventsForDate = () => {
    if (!events || !selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    console.log('DateModal Debug:');
    console.log('Selected Date:', selectedDate);
    console.log('Date String:', dateStr);
    console.log('All Events:', events);
    
    // Debug calendar events specifically
    const calendarEvents = events.filter(e => e.title && e.start_date);
    console.log('Calendar Events:', calendarEvents);
    
    // Debug each calendar event's dates
    calendarEvents.forEach((event, index) => {
      console.log(`Calendar Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        start_time: event.start_time,
        end_time: event.end_time
      });
    });
    
    // Debug: Check if any events have September 4th dates
    const sept4Events = calendarEvents.filter(event => {
      if (event.start_date) {
        const eventDate = event.start_date.includes('T') 
          ? event.start_date.split('T')[0] 
          : event.start_date;
        return eventDate === '2025-09-04';
      }
      return false;
    });
    console.log('Events for September 4th:', sept4Events);
    
    // Debug all event types
    const hardcodedEvents = events.filter(e => e.type === 'hardcoded' || (e.id && typeof e.id === 'string' && e.id.startsWith('event-')));
    const goodTimingsEvents = events.filter(e => e.time_slots);
    console.log('Hardcoded Events:', hardcodedEvents);
    console.log('Good Timings Events:', goodTimingsEvents);
    
    const filteredEvents = events.filter(event => {
      // Check if event has a direct date match (for hardcoded events)
      if (event.date === dateStr) {
        console.log('Direct date match:', event);
        return true;
      }
      
      // Check if event has start_date/end_date range (for API events and calendar events)
      if (event.start_date && event.end_date) {
        // Handle both ISO datetime strings and simple date strings
        let eventStart, eventEnd;
        
        if (event.start_date.includes('T')) {
          // ISO datetime string - extract just the date part
          eventStart = new Date(event.start_date.split('T')[0]);
        } else {
          // Simple date string
          eventStart = new Date(event.start_date);
        }
        
        if (event.end_date.includes('T')) {
          // ISO datetime string - extract just the date part
          eventEnd = new Date(event.end_date.split('T')[0]);
        } else {
          // Simple date string
          eventEnd = new Date(event.end_date);
        }
        
        const selectedDateObj = new Date(dateStr);
        
        // Debug the date comparison
        const eventStartStr = eventStart.toISOString().split('T')[0];
        const eventEndStr = eventEnd.toISOString().split('T')[0];
        const selectedDateStr = selectedDateObj.toISOString().split('T')[0];
        
        console.log(`Checking event ${event.id || 'unknown'} (${event.title || 'untitled'}):`, {
          eventStart: eventStartStr,
          eventEnd: eventEndStr,
          selectedDate: selectedDateStr,
          dateStr: dateStr,
          startDate: event.start_date,
          endDate: event.end_date,
          isExactMatch: eventStartStr === dateStr || eventEndStr === dateStr,
          isRangeMatch: selectedDateStr >= eventStartStr && selectedDateStr <= eventEndStr
        });
        
        // Check if the selected date falls within the event's date range
        // Use the already calculated strings from above
        
        // For single-day events, check exact date match
        if (eventStartStr === eventEndStr) {
          if (eventStartStr === dateStr) {
            console.log('Single-day exact match:', event);
            return true;
          }
        } else {
          // For multi-day events, check if selected date falls within range
          if (selectedDateStr >= eventStartStr && selectedDateStr <= eventEndStr) {
            console.log('Multi-day range match:', event);
            return true;
          }
        }
        
        // Additional fallback: check if any part of the event date matches
        if (eventStartStr === dateStr || eventEndStr === dateStr) {
          console.log('Fallback exact match:', event);
          return true;
        }
      }
      
      // Check if event has time_slots with matching dates (for good timings)
      if (event.time_slots) {
        const hasMatchingSlot = event.time_slots.some(slot => 
          slot.start_date === dateStr || slot.end_date === dateStr
        );
        if (hasMatchingSlot) {
          console.log('Time slot match:', event);
        }
        return hasMatchingSlot;
      }
      return false;
    });
    
    console.log('Filtered Events for', dateStr, ':', filteredEvents);
    return filteredEvents;
  };

  const dayEvents = getEventsForDate();
  const dayDaylight = daylightData?.find(d => d.date === format(selectedDate, 'yyyy-MM-dd'));

  // Additional safety check
  if (!selectedDate || isNaN(selectedDate.getTime())) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="date-modal" onClick={(e) => e.stopPropagation()}>
        <div className="date-modal-header">
          <div className="date-modal-title">
            <Calendar className="date-modal-icon" size={24} />
            <h2>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>
          </div>
          <button className="date-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="date-modal-content">
          {/* Daylight Information */}
          {dayDaylight && (
            <div className="date-modal-section">
              <div className="date-modal-section-header">
                <Sun className="date-modal-section-icon" size={20} />
                <h3>Daylight Information</h3>
              </div>
              <div className="date-modal-daylight">
                <div className="daylight-item">
                  <div className="daylight-dot sunrise-dot"></div>
                  <span className="daylight-label">Sunrise:</span>
                  <span className="daylight-time">{dayDaylight.sunrise_time}</span>
                </div>
                <div className="daylight-item">
                  <div className="daylight-dot sunset-dot"></div>
                  <span className="daylight-label">Sunset:</span>
                  <span className="daylight-time">{dayDaylight.sunset_time}</span>
                </div>
                {dayDaylight.timezone && (
                  <div className="daylight-item">
                    <span className="daylight-label">Timezone:</span>
                    <span className="daylight-time">{dayDaylight.timezone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events Section */}
          <div className="date-modal-section">
            <div className="date-modal-section-header">
              <Clock className="date-modal-section-icon" size={20} />
              <h3>Events & Timings</h3>
            </div>
            
            {dayEvents.length > 0 ? (
              <div className="date-modal-events">
                {dayEvents.map((event) => {
                  // Handle hardcoded events (direct structure)
                  if (event.type === 'hardcoded' || (event.id && typeof event.id === 'string' && event.id.startsWith('event-'))) {
                    return (
                      <div 
                        key={event.id} 
                        className="date-modal-event-item"
                        onClick={() => onEventClick && onEventClick(event)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="event-time">
                          {event.start_time && event.end_time ? 
                            `${formatTime(event.start_time)} - ${formatTime(event.end_time)}` :
                            event.start_time || 'All Day'
                          }
                        </div>
                        <div className="event-content">
                          <div className="event-title">
                            {event.description || event.title}
                            <Star className="hardcoded-star" size={16} />
                          </div>
                          {event.category_name && (
                            <div 
                              className="event-category"
                              style={{ 
                                backgroundColor: getCategoryColor(event.category_color),
                                color: 'white'
                              }}
                            >
                              {event.category_name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle calendar events (user-created events)
                  if (event.title && (event.start_time || event.is_all_day)) {
                    return (
                      <div 
                        key={event.id} 
                        className="date-modal-event-item"
                        onClick={() => onEventClick && onEventClick(event)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="event-time">
                          {event.is_all_day ? 'All Day' :
                           event.start_time && event.end_time ? 
                            `${formatTime(event.start_time)} - ${formatTime(event.end_time)}` :
                            event.start_time || 'All Day'
                          }
                        </div>
                        <div className="event-content">
                          <div className="event-title">
                            {event.title}
                          </div>
                          {event.description && (
                            <div className="event-description">
                              {event.description}
                            </div>
                          )}
                          {event.category_name && (
                            <div 
                              className="event-category"
                              style={{ 
                                backgroundColor: getCategoryColor(event.category_color),
                                color: 'white'
                              }}
                            >
                              {event.category_name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle API events (with time_slots)
                  return (
                    <div key={event.id} className="date-modal-event">
                      {event.time_slots?.map((slot) => (
                        <div 
                          key={slot.id} 
                          className="date-modal-event-item"
                          onClick={() => onEventClick && onEventClick(slot)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="event-time">
                            {slot.start_time && slot.end_time ? 
                              `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}` :
                              slot.start_time || 'All Day'
                            }
                          </div>
                          <div className="event-content">
                            <div className="event-title">
                              {slot.description || slot.category_name}
                            </div>
                            {slot.category_name && (
                              <div 
                                className="event-category"
                                style={{ 
                                  backgroundColor: getCategoryColor(slot.category_color),
                                  color: 'white'
                                }}
                              >
                                {slot.category_name}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="date-modal-no-events">
                <Calendar className="no-events-icon" size={48} />
                <p>No events scheduled for this day</p>
                <p className="no-events-subtitle">Check back later or add new events</p>
              </div>
            )}
          </div>
        </div>

        <div className="date-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateModal;

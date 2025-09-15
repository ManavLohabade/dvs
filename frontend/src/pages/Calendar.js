import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sun,
  Plus,
  Clock,
} from "lucide-react";
import DateModal from "../components/DateModal";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  isSameDay,
  isSameWeek,
  getDay,
  addHours,
  subDays,
} from "date-fns";
import { goodTimingsAPI, daylightAPI, weatherAPI, calendarAPI } from "../services/api";
import EventModal from "../components/EventModal";
import EventDetailsModal from "../components/EventDetailsModal";

const Calendar = () => {
  const { isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // 'month', 'week', or 'day'
  const [goodTimings, setGoodTimings] = useState([]);
  const [daylightData, setDaylightData] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [hardcodedEvents, setHardcodedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [filters, setFilters] = useState({
    workOrders: true,
    moveIns: true,
    moveOuts: true,
    notes: true
  });

  // Generate hardcoded events with Indian good timings
  const generateHardcodedEvents = () => {
    const today = new Date();
    const events = [
      // September 10, 2025 events (for testing)
      {
        id: "event-sep10-1",
        title: "Vehicle Purchase - Shubh Muhurat",
        description: "Auspicious time for buying new vehicle (car/bike)",
        start_time: "10:30",
        end_time: "12:00",
        date: "2025-09-10",
        category_color: "green",
        category_name: "Vehicle",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-sep10-2",
        title: "Business Investment",
        description: "Favorable time for new business investments",
        start_time: "14:00",
        end_time: "15:30",
        date: "2025-09-10",
        category_color: "yellow",
        category_name: "Business",
        type: "hardcoded",
        isAllDay: false,
      },
      // Today's auspicious events
      {
        id: "event-1",
        title: "Vehicle Purchase - Shubh Muhurat",
        description: "Auspicious time for buying new vehicle (car/bike)",
        start_time: "10:30",
        end_time: "12:00",
        date: format(today, "yyyy-MM-dd"),
        category_color: "green",
        category_name: "Vehicle",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-2",
        title: "Business Investment",
        description: "Favorable time for new business investments",
        start_time: "14:00",
        end_time: "15:30",
        date: format(today, "yyyy-MM-dd"),
        category_color: "blue",
        category_name: "Business",
        type: "hardcoded",
        isAllDay: false,
      },
      // Tomorrow's events
      {
        id: "event-3",
        title: "Marriage Muhurat",
        description: "Auspicious time for marriage ceremonies",
        start_time: "07:00",
        end_time: "09:00",
        date: format(addDays(today, 1), "yyyy-MM-dd"),
        category_color: "pink",
        category_name: "Marriage",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-4",
        title: "Griha Pravesh (House Warming)",
        description: "Auspicious time for house warming ceremony",
        date: format(addDays(today, 1), "yyyy-MM-dd"),
        category_color: "amber",
        category_name: "House",
        type: "hardcoded",
        isAllDay: true,
      },
      // Next week events
      {
        id: "event-5",
        title: "Gold Purchase - Shubh Time",
        description: "Auspicious time for buying gold and jewelry",
        start_time: "11:00",
        end_time: "12:30",
        date: format(addDays(today, 7), "yyyy-MM-dd"),
        category_color: "yellow",
        category_name: "Gold",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-6",
        title: "New Job Start",
        description: "Favorable time to start new job or career",
        start_time: "09:00",
        end_time: "10:00",
        date: format(addDays(today, 8), "yyyy-MM-dd"),
        category_color: "blue",
        category_name: "Career",
        type: "hardcoded",
        isAllDay: false,
      },
      // Weekend events
      {
        id: "event-7",
        title: "Temple Visit - Puja Time",
        description: "Auspicious time for temple visit and prayers",
        start_time: "18:00",
        end_time: "19:00",
        date: format(addDays(today, 6), "yyyy-MM-dd"),
        category_color: "purple",
        category_name: "Spiritual",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-8",
        title: "Festival Celebration",
        description: "Auspicious time for festival celebrations",
        date: format(addDays(today, 13), "yyyy-MM-dd"),
        category_color: "red",
        category_name: "Festival",
        type: "hardcoded",
        isAllDay: true,
      },
      // Monthly recurring events
      {
        id: "event-9",
        title: "Property Investment",
        description: "Favorable time for property purchase",
        start_time: "15:00",
        end_time: "16:30",
        date: format(addDays(today, 14), "yyyy-MM-dd"),
        category_color: "green",
        category_name: "Property",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-10",
        title: "Child Naming Ceremony",
        description: "Auspicious time for child naming ceremony",
        start_time: "16:00",
        end_time: "17:30",
        date: format(addDays(today, 21), "yyyy-MM-dd"),
        category_color: "pink",
        category_name: "Ceremony",
        type: "hardcoded",
        isAllDay: false,
      },
      // Additional Indian good timings
      {
        id: "event-11",
        title: "Wedding Ring Purchase",
        description: "Auspicious time for buying wedding rings",
        start_time: "10:00",
        end_time: "11:30",
        date: format(addDays(today, 3), "yyyy-MM-dd"),
        category_color: "purple",
        category_name: "Jewelry",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-12",
        title: "New Business Launch",
        description: "Favorable time for launching new business",
        start_time: "09:30",
        end_time: "11:00",
        date: format(addDays(today, 5), "yyyy-MM-dd"),
        category_color: "blue",
        category_name: "Business",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-13",
        title: "Education Start",
        description: "Auspicious time for starting new education",
        start_time: "08:00",
        end_time: "09:00",
        date: format(addDays(today, 10), "yyyy-MM-dd"),
        category_color: "teal",
        category_name: "Education",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-14",
        title: "Health Treatment",
        description: "Favorable time for starting health treatments",
        start_time: "07:30",
        end_time: "08:30",
        date: format(addDays(today, 12), "yyyy-MM-dd"),
        category_color: "green",
        category_name: "Health",
        type: "hardcoded",
        isAllDay: false,
      },
      {
        id: "event-15",
        title: "Travel - Shubh Yatra",
        description: "Auspicious time for starting journey",
        date: format(addDays(today, 15), "yyyy-MM-dd"),
        category_color: "orange",
        category_name: "Travel",
        type: "hardcoded",
        isAllDay: true,
      },
    ];

    return events;
  };

  // Initialize hardcoded events
  useEffect(() => {
    setHardcodedEvents(generateHardcodedEvents());
  }, []);

  // Ensure currentDate is always valid
  useEffect(() => {
    if (!currentDate || isNaN(currentDate.getTime())) {
      console.warn("Invalid currentDate detected, resetting to today");
      setCurrentDate(new Date());
    }
  }, [currentDate]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".calendar-mini-selector-container")) {
        setShowMonthDropdown(false);
        setShowYearDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Navigation functions
  const navigateDate = (direction) => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, direction));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, direction));
    } else if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, direction));
    }
  };

  const handleMiniCalendarDateClick = (date) => {
    try {
      // Convert to Date object if it's a string
      const dateObj = typeof date === "string" ? new Date(date) : date;

      // Validate the date before setting it
      if (dateObj && dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        setCurrentDate(dateObj);
      } else {
        console.error(
          "Invalid date provided to handleMiniCalendarDateClick:",
          date,
          "converted to:",
          dateObj
        );
      }
    } catch (error) {
      console.error(
        "Error in handleMiniCalendarDateClick:",
        error,
        "date:",
        date
      );
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month and year selection functions
  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      monthIndex,
      currentDate.getDate()
    );
    setCurrentDate(newDate);
    setShowMonthDropdown(false);
  };

  const handleYearSelect = (year) => {
    const newDate = new Date(
      year,
      currentDate.getMonth(),
      currentDate.getDate()
    );
    setCurrentDate(newDate);
    setShowYearDropdown(false);
  };

  const handleDateClick = (date) => {
    // Ensure we have a valid Date object
    const validDate = date instanceof Date ? date : new Date(date);
    if (isNaN(validDate.getTime())) {
      console.error("Invalid date provided to handleDateClick:", date);
      return;
    }
    console.log('Date clicked:', validDate);
    setSelectedDate(validDate);
    setIsModalOpen(true);
    
    // Don't refresh data on date click - just open modal with existing data
    // This provides better UX without loading screen
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleEventDetailsClick = (event) => {
    setSelectedEventDetails(event);
    setIsEventDetailsModalOpen(true);
  };

  const closeEventDetailsModal = () => {
    setIsEventDetailsModalOpen(false);
    setSelectedEventDetails(null);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventSaved = () => {
    console.log('Event saved, refreshing calendar data...');
    // Force refresh the calendar data
    setCalendarEvents([]); // Clear current events
    fetchCalendarData();
  };

  const handleEventDeleted = () => {
    fetchCalendarData();
  };

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Generate month and year options
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Generate data based on view mode
  const getViewData = () => {
    if (viewMode === "month") {
      return generateMonthView();
    } else if (viewMode === "week") {
      return generateWeekView();
    } else {
      return generateDayView();
    }
  };

  // Generate month view data
  const generateMonthView = () => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

      const monthDays = [];
      let day = startDate;

      while (day <= endDate) {
        const dayData = {
          date: format(day, "yyyy-MM-dd"),
          displayDate: format(day, "d"),
          isToday: isToday(day),
          isCurrentMonth: isSameMonth(day, currentDate),
          dayName: format(day, "EEEE"),
        };
        monthDays.push(dayData);
        
        
        day = addDays(day, 1);
      }

      // Group days into weeks
      const weeks = [];
      for (let i = 0; i < monthDays.length; i += 7) {
        weeks.push(monthDays.slice(i, i + 7));
      }

      return { weeks, type: "month" };
    } catch (error) {
      console.error(
        "Error generating month view:",
        error,
        "currentDate:",
        currentDate
      );
      // Return empty weeks array as fallback
      return { weeks: [], type: "month" };
    }
  };

  // Generate week view data
  const generateWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      weekDays.push({
        date: format(day, "yyyy-MM-dd"),
        displayDate: format(day, "d"),
        isToday: isToday(day),
        isCurrentWeek: isSameWeek(day, currentDate),
        dayName: format(day, "EEEE"),
        shortDayName: format(day, "EEE"),
      });
    }

    return { weekDays, type: "week" };
  };

  // Generate day view data
  const generateDayView = () => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);

    // Generate hourly slots
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = addHours(dayStart, i);
      hours.push({
        time: format(hour, "HH:mm"),
        hour: i,
        displayTime: format(hour, "h a"),
      });
    }

    return {
      day: {
        date: format(currentDate, "yyyy-MM-dd"),
        displayDate: format(currentDate, "d"),
        dayName: format(currentDate, "EEEE"),
        monthYear: format(currentDate, "MMMM yyyy"),
        isToday: isToday(currentDate),
      },
      hours,
      type: "day",
    };
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);

      let startDate, endDate;
      const viewData = getViewData();

      if (viewMode === "month") {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        startDate = format(
          startOfWeek(monthStart, { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
        endDate = format(
          endOfWeek(monthEnd, { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
      } else if (viewMode === "week") {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        startDate = format(weekStart, "yyyy-MM-dd");
        endDate = format(weekEnd, "yyyy-MM-dd");
      } else {
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);
        startDate = format(dayStart, "yyyy-MM-dd");
        endDate = format(dayEnd, "yyyy-MM-dd");
      }

      console.log("Fetching calendar data for:", {
        startDate,
        endDate,
        currentDate: format(currentDate, "yyyy-MM-dd"),
        currentDateRaw: currentDate,
        viewMode,
      });

      // Fetch calendar events
      try {
        const eventsResponse = await calendarAPI.getAll({
          start_date: startDate,
          end_date: endDate,
        });
        console.log("Calendar events response:", eventsResponse.data);
        console.log("Setting calendar events:", eventsResponse.data.events || []);
        console.log("Setting calendar events:", eventsResponse.data.events?.length || 0, "events");
        setCalendarEvents(eventsResponse.data.events || []);
      } catch (eventsError) {
        console.warn("Failed to fetch calendar events:", eventsError);
        setCalendarEvents([]);
      }

      // Fetch good timings
      const timingsResponse = await goodTimingsAPI.getAll({
        start_date: startDate,
        end_date: endDate,
      });
      console.log("Good timings response:", timingsResponse.data);
      setGoodTimings(timingsResponse.data.good_timings || []);

      // Fetch real-time daylight data for all users
      try {
        const daylightResponse = await weatherAPI.getDaylightRange(
          startDate,
          endDate
        );
        console.log("Real-time daylight response:", daylightResponse.data);
        setDaylightData(daylightResponse.data.data || []);
      } catch (daylightError) {
        console.warn(
          "Failed to fetch real-time daylight data, using fallback:",
          daylightError
        );
        // Fallback to stored daylight data
        try {
          const fallbackResponse = await daylightAPI.getAll({
            start_date: startDate,
            end_date: endDate,
          });
          console.log("Fallback daylight response:", fallbackResponse.data);
          setDaylightData(fallbackResponse.data.daylight || []);
        } catch (fallbackError) {
          console.warn("Fallback daylight data also failed:", fallbackError);
          setDaylightData([]);
        }
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewMode]);

  const getDayTimings = (date) => {
    
    // Get good timings from API
    const dayTimings = goodTimings.filter((timing) => {
      // Check if the date falls within the timing's date range
      const timingStart = new Date(timing.start_date);
      const timingEnd = new Date(timing.end_date);
      const checkDate = new Date(date);

      return checkDate >= timingStart && checkDate <= timingEnd;
    });

    // Get calendar events for the same date
    const dayCalendarEvents = calendarEvents.filter((event) => {
      // Skip events with invalid dates
      if (!event.start_date || !event.end_date) {
        console.log(`Skipping event ${event.id} (${event.title}) - invalid dates:`, {
          startDate: event.start_date,
          endDate: event.end_date
        });
        return false;
      }

      // Parse dates - handle both date strings and ISO datetime strings
      let eventStart, eventEnd;
      
      // Check if the date is already a full ISO datetime string
      if (event.start_date.includes('T')) {
        eventStart = new Date(event.start_date);
      } else {
        eventStart = new Date(event.start_date + 'T00:00:00');
      }
      
      if (event.end_date.includes('T')) {
        eventEnd = new Date(event.end_date);
      } else {
        eventEnd = new Date(event.end_date + 'T23:59:59');
      }
      
      const checkDate = new Date(date + 'T00:00:00');

      // Check if dates are valid
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime()) || isNaN(checkDate.getTime())) {
        console.log(`Skipping event ${event.id} (${event.title}) - invalid date parsing:`, {
          eventStart: eventStart,
          eventEnd: eventEnd,
          checkDate: checkDate,
          startDate: event.start_date,
          endDate: event.end_date,
          date: date
        });
        return false;
      }

      console.log(`Checking event ${event.id} (${event.title}):`, {
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        checkDate: checkDate.toISOString(),
        startDate: event.start_date,
        endDate: event.end_date,
        date: date,
        matches: checkDate >= eventStart && checkDate <= eventEnd
      });

      return checkDate >= eventStart && checkDate <= eventEnd;
    });

    // Get hardcoded events for the same date
    const dayHardcodedEvents = hardcodedEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const checkDate = new Date(date);
      return isSameDay(eventDate, checkDate);
    });

    console.log(`Processing ${dayCalendarEvents.length} calendar events for ${date}:`, dayCalendarEvents);

    // Convert calendar events to match the timing structure
    const convertedCalendarEvents = dayCalendarEvents.map((event) => ({
      id: `calendar-${event.id}`,
      day: format(new Date(event.start_date), "EEEE"),
      start_date: event.start_date,
      end_date: event.end_date,
      created_by: event.created_by,
      created_by_name: event.created_by_name,
      time_slots: [
        {
          id: `calendar-${event.id}-slot`,
          start_time: event.start_time || "00:00",
          end_time: event.end_time || "23:59",
          category_id: event.category_id,
          category_name: event.category_name || 'Event',
          category_color: event.color || 'blue',
          description: event.description || event.title,
          isAllDay: event.is_all_day || false,
          isCalendarEvent: true,
        },
      ],
    }));

    // Convert hardcoded events to match the timing structure
    const convertedHardcodedEvents = dayHardcodedEvents.map((event) => ({
      id: event.id,
      day: format(new Date(event.date), "EEEE"),
      start_date: event.date,
      end_date: event.date,
      created_by: 1, // System user
      created_by_name: "System",
      time_slots: [
        {
          id: event.id + "-slot",
          start_time: event.start_time || "00:00",
          end_time: event.end_time || "23:59",
          category_id: 1,
          category_name: event.category_name,
          category_color: event.category_color,
          description: event.description || event.title,
          isAllDay: event.isAllDay || false,
        },
      ],
    }));

    // Combine all events
    const allTimings = [...dayTimings, ...convertedCalendarEvents, ...convertedHardcodedEvents];

    if (allTimings.length > 0) {
      console.log(
        `Found ${allTimings.length} timings for ${date}:`,
        allTimings
      );
    }

    return allTimings;
  };

  const getDaylightForDate = (date) => {
    return daylightData.find((d) => d.date === date);
  };

  // Get display title based on view mode
  const getDisplayTitle = () => {
    try {
      if (viewMode === "month") {
        return format(currentDate, "MMMM yyyy");
      } else if (viewMode === "week") {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, "MMM d")} - ${format(
          weekEnd,
          "MMM d, yyyy"
        )}`;
      } else {
        return format(currentDate, "EEEE, MMMM d, yyyy");
      }
    } catch (error) {
      console.error(
        "Error formatting date in getDisplayTitle:",
        error,
        "currentDate:",
        currentDate
      );
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="calendar-bg-animation">
          <div className="calendar-bg-orb calendar-bg-orb-1"></div>
          <div className="calendar-bg-orb calendar-bg-orb-2"></div>
          <div className="calendar-bg-orb calendar-bg-orb-3"></div>
        </div>
        <div className="px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Calendar
            </h1>
            <div className="text-lg text-gray-600">
              Loading calendar data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const viewData = getViewData();

  return (
    <div className="calendar-app">
      {/* Header */}
      <div className="calendar-app-header">
        <div className="calendar-app-title">Calendar</div>
        <div className="calendar-app-controls">
          <div className="calendar-view-tabs">
            <button
              onClick={() => setViewMode("day")}
              className={`calendar-tab ${viewMode === "day" ? "active" : ""}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`calendar-tab ${viewMode === "week" ? "active" : ""}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`calendar-tab ${viewMode === "month" ? "active" : ""}`}
            >
              Month
            </button>
          </div>
          {isAdmin() && (
            <button className="calendar-add-btn" onClick={handleAddEvent}>
              <Plus size={16} />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="calendar-app-content">
        {/* Sidebar */}
        <div className="calendar-sidebar">
          <div className="calendar-filters">
            <h3 className="calendar-filters-title">Filters</h3>
            <div className="calendar-filter-list">
              <label className="calendar-filter-item">
                <input 
                  type="checkbox" 
                  checked={filters.workOrders}
                  onChange={() => handleFilterChange('workOrders')}
                />
                <span className="calendar-filter-icon work"></span>
                <span className="calendar-filter-label">Work-Orders</span>
              </label>
              <label className="calendar-filter-item">
                <input 
                  type="checkbox" 
                  checked={filters.moveIns}
                  onChange={() => handleFilterChange('moveIns')}
                />
                <span className="calendar-filter-icon move-in"></span>
                <span className="calendar-filter-label">Move-Ins</span>
              </label>
              <label className="calendar-filter-item">
                <input 
                  type="checkbox" 
                  checked={filters.moveOuts}
                  onChange={() => handleFilterChange('moveOuts')}
                />
                <span className="calendar-filter-icon move-out"></span>
                <span className="calendar-filter-label">Move-Outs</span>
              </label>
              <label className="calendar-filter-item">
                <input 
                  type="checkbox" 
                  checked={filters.notes}
                  onChange={() => handleFilterChange('notes')}
                />
                <span className="calendar-filter-icon notes"></span>
                <span className="calendar-filter-label">Notes & Reminders</span>
              </label>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="calendar-mini">
            <div className="calendar-mini-header">
              <button
                className="calendar-mini-nav-btn"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                ‹
              </button>
              <div className="calendar-mini-title">
                <div className="calendar-mini-selectors">
                  <div className="calendar-mini-selector-container">
                    <button
                      className="calendar-mini-selector"
                      onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                    >
                      {(() => {
                        try {
                          return format(currentDate, "MMMM");
                        } catch (error) {
                          return "Invalid";
                        }
                      })()}
                    </button>
                    {showMonthDropdown && (
                      <div className="calendar-mini-dropdown">
                        {months.map((month, index) => (
                          <button
                            key={month}
                            className={`calendar-mini-dropdown-item ${
                              index === currentDate.getMonth() ? "selected" : ""
                            }`}
                            onClick={() => handleMonthSelect(index)}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="calendar-mini-selector-container">
                    <button
                      className="calendar-mini-selector"
                      onClick={() => setShowYearDropdown(!showYearDropdown)}
                    >
                      {(() => {
                        try {
                          return format(currentDate, "yyyy");
                        } catch (error) {
                          return "Invalid";
                        }
                      })()}
                    </button>
                    {showYearDropdown && (
                      <div className="calendar-mini-dropdown">
                        {years.map((year) => (
                          <button
                            key={year}
                            className={`calendar-mini-dropdown-item ${
                              year === currentDate.getFullYear()
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => handleYearSelect(year)}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="calendar-mini-nav-btn"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                ›
              </button>
            </div>
            <div className="calendar-mini-grid">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={`${day}-${index}`} className="calendar-mini-day-header">
                  {day}
                </div>
              ))}
              {generateMonthView()
                .weeks.flat()
                .map((day, index) => {
                  const dayDate = new Date(day.date); // Convert string to Date object
                  const isSelected = isSameDay(dayDate, currentDate);
                  return (
                    <div
                      key={index}
                      className={`calendar-mini-day ${
                        day.isToday ? "today" : ""
                      } ${isSelected ? "selected" : ""} ${
                        !day.isCurrentMonth ? "other-month" : ""
                      }`}
                      onClick={() => handleMiniCalendarDateClick(dayDate)}
                    >
                      {day.displayDate}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Calendar Main */}
        <div className="calendar-main">
          {/* Calendar Header */}
          <div className="calendar-main-header">
            <div className="calendar-nav">
              <button
                onClick={() => navigateDate(-1)}
                className="calendar-nav-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="calendar-current-month">{getDisplayTitle()}</div>
              <button
                onClick={() => navigateDate(1)}
                className="calendar-nav-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Content */}
          {viewMode === "month" && (
            <div className="calendar-grid-container">
              {/* Week header */}
              <div className="calendar-weekdays">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, index) => (
                    <div key={`${day}-${index}`} className="calendar-weekday">
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Month Grid */}
              <div className="calendar-month-grid">
                {viewData.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="calendar-week-row">
                    {week.map((day) => {
                      const dayTimings = getDayTimings(day.date);
                      const isToday = day.isToday;

                      return (
                        <div
                          key={day.date}
                          className={`calendar-day-cell ${
                            isToday ? "today" : ""
                          } ${!day.isCurrentMonth ? "other-month" : ""}`}
                          onClick={() => handleDateClick(day.date)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="calendar-day-number">
                            {day.displayDate}
                          </div>
                          <div className="calendar-day-events">
                            {dayTimings.length > 0
                              ? dayTimings.slice(0, 3).map((timing, timingIndex) => (
                                  <div
                                    key={`timing-${timing.id}-${timingIndex}`}
                                  >
                                    {timing.time_slots?.map(
                                      (slot, slotIndex) => (
                                        <div
                                          key={`slot-${slot.id}-${slotIndex}-${timing.id}`}
                                          className={`calendar-event-card ${
                                            slot.category_color || "work"
                                          } ${
                                            timing.id.startsWith("event-")
                                              ? "hardcoded"
                                              : ""
                                          } ${slot.isAllDay ? "all-day" : ""} ${
                                            slot.isCalendarEvent ? "calendar-event" : ""
                                          }`}
                                          onClick={(e) => {
                                            // Don't prevent event bubbling - let the date box handle the click
                                            // This allows clicking anywhere in the date box to open the main modal
                                          }}
                                          style={{ cursor: slot.isCalendarEvent ? 'pointer' : 'default' }}
                                        >
                                          <div className="calendar-event-content">
                                            <div className="calendar-event-title">
                                              {slot.description ||
                                                slot.category_name}
                                            </div>
                                            {slot.start_time && (
                                              <div className="calendar-event-time">
                                                {slot.start_time}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ))
                              : null}
                            {dayTimings.length > 3 && (
                              <div 
                                className="calendar-more-events"
                                onClick={(e) => {
                                  // Don't prevent event bubbling - let the date box handle the click
                                  // This allows clicking anywhere in the date box to open the main modal
                                }}
                              >
                                +{dayTimings.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "week" && (
            <div className="calendar-week-container">
              {/* Week header */}
              <div className="calendar-week-header">
                {viewData.weekDays.map((day) => (
                  <div
                    key={day.date}
                    className={`calendar-week-day ${
                      day.isToday ? "today" : ""
                    }`}
                  >
                    <div className="calendar-week-day-name">
                      {day.shortDayName}
                    </div>
                    <div className="calendar-week-day-number">
                      {day.displayDate}
                    </div>
                  </div>
                ))}
              </div>

              {/* Week Grid */}
              <div className="calendar-week-grid">
                {viewData.weekDays.map((day) => {
                  const dayTimings = getDayTimings(day.date);
                  const isToday = day.isToday;

                  return (
                    <div
                      key={day.date}
                      className={`calendar-week-day-cell ${
                        isToday ? "today" : ""
                      }`}
                      onClick={() => handleDateClick(day.date)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className={`calendar-week-day-header ${
                          isToday ? "today" : ""
                        }`}
                      >
                        {/* Date and day are already shown in the week header above */}
                      </div>
                      <div className="calendar-week-day-events">
                        {dayTimings.length > 0 ? (
                          <>
                            {dayTimings.slice(0, 4).map((timing, timingIndex) => (
                              <div
                                key={`week-timing-${timing.id}-${timingIndex}`}
                              >
                                {timing.time_slots?.map((slot, slotIndex) => (
                                  <div
                                    key={`week-slot-${slot.id}-${slotIndex}-${timing.id}`}
                                    className={`calendar-event-card ${
                                      slot.category_color || "work"
                                    } ${
                                      timing.id.startsWith("event-")
                                        ? "hardcoded"
                                        : ""
                                    } ${slot.isAllDay ? "all-day" : ""} ${
                                      slot.isCalendarEvent ? "calendar-event" : ""
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Don't prevent event bubbling - let the date box handle the click
                                      // This allows clicking anywhere in the date box to open the main modal
                                    }}
                                    style={{ cursor: slot.isCalendarEvent ? 'pointer' : 'default' }}
                                  >
                                    <div className="calendar-event-content">
                                      <div className="calendar-event-title">
                                        {slot.description || slot.category_name}
                                      </div>
                                      {slot.start_time && (
                                        <div className="calendar-event-time">
                                          {slot.start_time}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                            {dayTimings.length > 4 && (
                              <div 
                                className="calendar-more-events"
                                onClick={(e) => {
                                  // Don't prevent event bubbling - let the date box handle the click
                                  // This allows clicking anywhere in the date box to open the main modal
                                }}
                              >
                                +{dayTimings.length - 4} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="calendar-no-events">No events</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "day" && (
            <div className="calendar-day-container">
              {/* Day header */}
              <div className="calendar-day-header">
                <div className="calendar-day-title">
                  <div className="calendar-day-name">
                    {viewData.day.dayName}
                  </div>
                  <div className="calendar-day-date">
                    {viewData.day.monthYear}
                  </div>
                </div>
              </div>

              {/* Day Timeline */}
              <div className="calendar-day-timeline">
                {viewData.hours.map((hour) => {
                  const hourTimings = getDayTimings(viewData.day.date).filter(
                    (timing) =>
                      timing.time_slots?.some((slot) =>
                        slot.start_time.startsWith(hour.time.substring(0, 2))
                      )
                  );

                  return (
                    <div key={hour.hour} className="calendar-hour-row">
                      <div className="calendar-hour-label">
                        {hour.displayTime}
                      </div>
                      <div className="calendar-hour-content">
                        {hourTimings.length > 0
                          ? hourTimings.map((timing, timingIndex) => (
                              <div
                                key={`hour-timing-${timing.id}-${timingIndex}`}
                              >
                                {timing.time_slots?.map((slot, slotIndex) => (
                                  <div
                                    key={`hour-slot-${slot.id}-${slotIndex}-${timing.id}`}
                                    className={`calendar-event-card ${
                                      slot.category_color || "work"
                                    } ${
                                      timing.id.startsWith("event-")
                                        ? "hardcoded"
                                        : ""
                                    } ${slot.isAllDay ? "all-day" : ""} ${
                                      slot.isCalendarEvent ? "calendar-event" : ""
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Don't prevent event bubbling - let the date box handle the click
                                      // This allows clicking anywhere in the date box to open the main modal
                                    }}
                                    style={{ cursor: slot.isCalendarEvent ? 'pointer' : 'default' }}
                                  >
                                    <div className="calendar-event-content">
                                      <div className="calendar-event-title">
                                        {slot.description || slot.category_name}
                                      </div>
                                      <div className="calendar-event-time">
                                        {slot.start_time} - {slot.end_time}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))
                          : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Modal */}
      <DateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedDate={selectedDate}
        events={(() => {
          const allEvents = [...goodTimings, ...hardcodedEvents, ...calendarEvents];
          console.log('Passing events to DateModal:', allEvents.length, 'total events');
          console.log('Calendar events count:', calendarEvents.length);
          console.log('Calendar events data:', calendarEvents);
          return allEvents;
        })()}
        daylightData={daylightData}
        onEventClick={handleEventDetailsClick}
      />

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        selectedDate={selectedDate}
        event={selectedEvent}
        onEventSaved={handleEventSaved}
        onEventDeleted={handleEventDeleted}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isEventDetailsModalOpen}
        onClose={closeEventDetailsModal}
        event={selectedEventDetails}
      />
    </div>
  );
};

export default Calendar;

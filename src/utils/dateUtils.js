/**
 * Date Utilities
 * Functions for date manipulation and calculations
 */

/**
 * Format date as MM/DD/YYYY
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return '';
  
  // Ensure we're working with a copy of the date to avoid mutation issues
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format date with time as MM/DD/YYYY HH:MM
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string with time
 */
export const formatDateWithTime = (date) => {
  if (!date || !(date instanceof Date)) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Add working days to a date (skipping weekends)
 * @param {Date} date - Starting date
 * @param {number} days - Number of working days to add
 * @returns {Date} New date after adding working days
 */
export const addWorkingDays = (date, days) => {
  const newDate = new Date(date.getTime());
  let daysToAdd = days;
  
  while (daysToAdd > 0) {
    // Add one day at a time
    newDate.setDate(newDate.getDate() + 1);
    
    // Skip weekends
    if (newDate.getDay() !== 0 && newDate.getDay() !== 6) {
      daysToAdd--;
    }
  }
  
  return newDate;
};

/**
 * Calculate number of working days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of working days
 */
export const getWorkingDaysBetweenDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize dates to avoid partial day issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Ensure start date is before end date
  if (start > end) return 0;
  
  let count = 0;
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    // Only count weekdays (Monday to Friday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

/**
 * Calculate number of sprints between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} sprintDurationDays - Duration of a sprint in days
 * @returns {number} Number of sprints (can be fractional)
 */
export const getSprintsBetweenDates = (startDate, endDate, sprintDurationDays) => {
  // Calculate working days between dates
  const workingDays = getWorkingDaysBetweenDates(startDate, endDate);
  
  // Convert to sprints
  return workingDays / sprintDurationDays;
};

/**
 * Calculate sprint end date given a start date and sprint duration
 * @param {Date} startDate - Sprint start date
 * @param {number} sprintDurationDays - Sprint duration in working days
 * @returns {Date} Sprint end date
 */
export const getSprintEndDate = (startDate, sprintDurationDays) => {
  return addWorkingDays(startDate, sprintDurationDays);
};

/**
 * Calculate all sprint boundary dates for a project
 * @param {Date} projectStartDate - Project start date
 * @param {number} totalSprints - Total number of sprints
 * @param {number} sprintDurationDays - Sprint duration in working days
 * @returns {Array} Array of sprint boundary objects with start and end dates
 */
export const calculateSprintBoundaries = (projectStartDate, totalSprints, sprintDurationDays) => {
  const sprintBoundaries = [];
  let currentStartDate = new Date(projectStartDate);
  
  for (let i = 1; i <= totalSprints; i++) {
    const endDate = getSprintEndDate(currentStartDate, sprintDurationDays);
    
    sprintBoundaries.push({
      sprintNumber: i,
      startDate: new Date(currentStartDate),
      endDate: new Date(endDate)
    });
    
    // Start date of next sprint is the day after the end date of the current sprint
    currentStartDate = new Date(endDate);
    currentStartDate.setDate(currentStartDate.getDate() + 1);
    
    // Skip weekends for the next start date
    while (currentStartDate.getDay() === 0 || currentStartDate.getDay() === 6) {
      currentStartDate.setDate(currentStartDate.getDate() + 1);
    }
  }
  
  return sprintBoundaries;
};

/**
 * Get the sprint number for a given date
 * @param {Date} date - Date to check
 * @param {Array} sprintBoundaries - Array of sprint boundary objects
 * @returns {number|null} Sprint number or null if date is outside project
 */
export const getSprintForDate = (date, sprintBoundaries) => {
  for (const sprint of sprintBoundaries) {
    if (date >= sprint.startDate && date <= sprint.endDate) {
      return sprint.sprintNumber;
    }
  }
  
  // If date is before first sprint
  if (date < sprintBoundaries[0].startDate) {
    return null;
  }
  
  // If date is after last sprint
  if (date > sprintBoundaries[sprintBoundaries.length - 1].endDate) {
    return null;
  }
  
  return null;
};

/**
 * Check if two dates are on the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are on the same day
 */
export const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Format date relative to today (e.g., "Today", "Yesterday", "5 days ago")
 * @param {Date} date - Date to format
 * @returns {string} Formatted relative date string
 */
export const formatRelativeDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - dateToCheck.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return formatDate(date);
  }
};
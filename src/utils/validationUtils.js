/**
 * Validation Utilities
 * Functions for validating user inputs
 */

/**
 * Validate numeric input
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} [options.min] - Minimum allowed value
 * @param {number} [options.max] - Maximum allowed value
 * @param {boolean} [options.allowZero=true] - Whether zero is allowed
 * @param {boolean} [options.allowNegative=false] - Whether negative values are allowed
 * @param {boolean} [options.allowDecimals=true] - Whether decimal values are allowed
 * @returns {Object} Validation result with isValid and errorMessage
 */
export const validateNumeric = (value, options = {}) => {
  const { 
    min, 
    max, 
    allowZero = true, 
    allowNegative = false, 
    allowDecimals = true 
  } = options;
  
  // Convert to number
  const numValue = Number(value);
  
  // Check if value is a number
  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid number'
    };
  }
  
  // Check if decimals are allowed
  if (!allowDecimals && !Number.isInteger(numValue)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a whole number'
    };
  }
  
  // Check if negative values are allowed
  if (!allowNegative && numValue < 0) {
    return {
      isValid: false,
      errorMessage: 'Please enter a positive number'
    };
  }
  
  // Check if zero is allowed
  if (!allowZero && numValue === 0) {
    return {
      isValid: false,
      errorMessage: 'Value cannot be zero'
    };
  }
  
  // Check minimum value
  if (min !== undefined && numValue < min) {
    return {
      isValid: false,
      errorMessage: `Value must be at least ${min}`
    };
  }
  
  // Check maximum value
  if (max !== undefined && numValue > max) {
    return {
      isValid: false,
      errorMessage: `Value must be at most ${max}`
    };
  }
  
  // All checks passed
  return {
    isValid: true,
    errorMessage: ''
  };
};

/**
 * Validate date input
 * @param {any} value - Date value to validate
 * @param {Object} options - Validation options
 * @param {Date} [options.minDate] - Minimum allowed date
 * @param {Date} [options.maxDate] - Maximum allowed date
 * @param {boolean} [options.allowWeekends=true] - Whether weekend dates are allowed
 * @returns {Object} Validation result with isValid and errorMessage
 */
export const validateDate = (value, options = {}) => {
  const { minDate, maxDate, allowWeekends = true } = options;
  
  // Handle empty input
  if (!value) {
    return {
      isValid: false,
      errorMessage: 'Please enter a date'
    };
  }
  
  // Convert to Date object
  const dateValue = new Date(value);
  
  // Check if valid date
  if (isNaN(dateValue.getTime())) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid date'
    };
  }
  
  // Check minimum date
  if (minDate && dateValue < minDate) {
    return {
      isValid: false,
      errorMessage: `Date must be on or after ${minDate.toLocaleDateString()}`
    };
  }
  
  // Check maximum date
  if (maxDate && dateValue > maxDate) {
    return {
      isValid: false,
      errorMessage: `Date must be on or before ${maxDate.toLocaleDateString()}`
    };
  }
  
  // Check weekends
  if (!allowWeekends) {
    const day = dateValue.getDay();
    if (day === 0 || day === 6) { // 0 = Sunday, 6 = Saturday
      return {
        isValid: false,
        errorMessage: 'Weekend dates are not allowed'
      };
    }
  }
  
  // All checks passed
  return {
    isValid: true,
    errorMessage: ''
  };
};

/**
 * Validate CR inputs
 * @param {Array} crInputs - Array of CR input objects
 * @returns {Object} Validation result with isValid, errorMessage, and invalid CRs
 */
export const validateCRInputs = (crInputs) => {
  if (!crInputs || !Array.isArray(crInputs) || crInputs.length === 0) {
    return {
      isValid: false,
      errorMessage: 'No change requests to validate',
      invalidCRs: []
    };
  }
  
  const invalidCRs = [];
  
  // Validate each CR
  for (const cr of crInputs) {
    const errors = [];
    
    // Validate name
    if (!cr.name || cr.name.trim() === '') {
      errors.push('CR name cannot be empty');
    }
    
    // Validate hours
    const baHoursValidation = validateNumeric(cr.BAHours, { min: 0 });
    const configHoursValidation = validateNumeric(cr.ConfigHours, { min: 0 });
    const qaHoursValidation = validateNumeric(cr.QAHours, { min: 0 });
    
    if (!baHoursValidation.isValid) {
      errors.push(`BA Hours: ${baHoursValidation.errorMessage}`);
    }
    
    if (!configHoursValidation.isValid) {
      errors.push(`Config Hours: ${configHoursValidation.errorMessage}`);
    }
    
    if (!qaHoursValidation.isValid) {
      errors.push(`QA Hours: ${qaHoursValidation.errorMessage}`);
    }
    
    // Check if at least one team has hours
    if (cr.BAHours === 0 && cr.ConfigHours === 0 && cr.QAHours === 0) {
      errors.push('At least one team must have hours allocated');
    }
    
    // Add to invalid CRs if any errors
    if (errors.length > 0) {
      invalidCRs.push({
        id: cr.id,
        name: cr.name,
        errors
      });
    }
  }
  
  return {
    isValid: invalidCRs.length === 0,
    errorMessage: invalidCRs.length > 0 ? `${invalidCRs.length} CRs have validation errors` : '',
    invalidCRs
  };
};

/**
 * Validate project parameters
 * @param {Object} projectParams - Project parameters object
 * @returns {Object} Validation result with isValid and errors
 */
export const validateProjectParams = (projectParams) => {
  const errors = {};
  
  // Validate total sprints
  const totalSprintsValidation = validateNumeric(projectParams.totalSprints, { 
    min: 1, 
    allowDecimals: false 
  });
  
  if (!totalSprintsValidation.isValid) {
    errors.totalSprints = totalSprintsValidation.errorMessage;
  }
  
  // Validate current sprint
  const currentSprintValidation = validateNumeric(projectParams.currentSprint, { 
    min: 1, 
    max: projectParams.totalSprints,
    allowDecimals: false 
  });
  
  if (!currentSprintValidation.isValid) {
    errors.currentSprint = currentSprintValidation.errorMessage;
  }
  
  // Validate baseline sprint
  const baselineSprintValidation = validateNumeric(projectParams.baselineSprint, { 
    min: 1, 
    max: projectParams.totalSprints,
    allowDecimals: false 
  });
  
  if (!baselineSprintValidation.isValid) {
    errors.baselineSprint = baselineSprintValidation.errorMessage;
  }
  
  // Validate sprint duration
  const sprintDurationValidation = validateNumeric(projectParams.sprintDurationDays, { 
    min: 1,
    max: 60,
    allowDecimals: false 
  });
  
  if (!sprintDurationValidation.isValid) {
    errors.sprintDurationDays = sprintDurationValidation.errorMessage;
  }
  
  // Validate deadline
  const deadlineValidation = validateDate(projectParams.deadline);
  
  if (!deadlineValidation.isValid) {
    errors.deadline = deadlineValidation.errorMessage;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate team resources
 * @param {Object} teamResources - Team resources object
 * @returns {Object} Validation result with isValid and errors
 */
export const validateTeamResources = (teamResources) => {
  const errors = {};
  
  // Validate BA team size
  const baValidation = validateNumeric(teamResources.BA, { 
    min: 1, 
    allowDecimals: false 
  });
  
  if (!baValidation.isValid) {
    errors.BA = baValidation.errorMessage;
  }
  
  // Validate Config team size
  const configValidation = validateNumeric(teamResources.Config, { 
    min: 1, 
    allowDecimals: false 
  });
  
  if (!configValidation.isValid) {
    errors.Config = configValidation.errorMessage;
  }
  
  // Validate QA team size
  const qaValidation = validateNumeric(teamResources.QA, { 
    min: 1, 
    allowDecimals: false 
  });
  
  if (!qaValidation.isValid) {
    errors.QA = qaValidation.errorMessage;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
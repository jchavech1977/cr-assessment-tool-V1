/**
 * Utility functions for calculations
 */

// Constants for hours per story calculations
export const HOURS_PER_STORY = {
  BA: 19,    // 19 hours per BA story
  Config: 31, // 31 hours per Config story
  QA: 24      // 24 hours per QA story
};

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
 * Calculate the impact of CRs on project timeline and team capacity
 * @param {Array} crInputs - Array of CR input objects
 * @param {Object} projectParams - Project parameters
 * @param {Array} sprintCapacities - Array of sprint capacity objects
 * @returns {Object} Impact calculation results
 */
export const calculateImpact = (crInputs, projectParams, sprintCapacities) => {
  // Get baseline sprint details
  const baselineSprint = projectParams.baselineSprint;
  const baselineCapacity = getSprintCapacity(baselineSprint, sprintCapacities);
  const remainingCapacity = getRemainingCapacity(projectParams, sprintCapacities);
  
  // Get total hours needed per team for all CRs
  const totalBAHours = crInputs.reduce((sum, cr) => sum + Number(cr.BAHours || 0), 0);
  const totalConfigHours = crInputs.reduce((sum, cr) => sum + Number(cr.ConfigHours || 0), 0);
  const totalQAHours = crInputs.reduce((sum, cr) => sum + Number(cr.QAHours || 0), 0);
  
  // Convert hours to stories
  const totalBAStories = totalBAHours / HOURS_PER_STORY.BA;
  const totalConfigStories = totalConfigHours / HOURS_PER_STORY.Config;
  const totalQAStories = totalQAHours / HOURS_PER_STORY.QA;
  
  // Get baseline sprint resources
  const baselineSprData = sprintCapacities.find(s => s.sprintNumber === baselineSprint) || 
    { resources: { BA: 0, Config: 0, QA: 0 }, capacity: { BA: 0, Config: 0, QA: 0 } };
  
  // Calculate capacity impact in stories per resource
  const baCapacityImpact = baselineSprData.resources.BA > 0 ? 
    totalBAStories / baselineSprData.resources.BA : 0;
  const configCapacityImpact = baselineSprData.resources.Config > 0 ? 
    totalConfigStories / baselineSprData.resources.Config : 0;
  const qaCapacityImpact = baselineSprData.resources.QA > 0 ? 
    totalQAStories / baselineSprData.resources.QA : 0;

  // Impact on baseline sprint's available capacity
  const baselineSprintImpact = {
    BA: baselineCapacity.available.BA > 0 ? 
      (totalBAStories / baselineCapacity.available.BA) * 100 : 
      100 + (totalBAStories / (baselineSprData.capacity.BA || 0.001)) * 100,
    Config: baselineCapacity.available.Config > 0 ? 
      (totalConfigStories / baselineCapacity.available.Config) * 100 : 
      100 + (totalConfigStories / (baselineSprData.capacity.Config || 0.001)) * 100,
    QA: baselineCapacity.available.QA > 0 ? 
      (totalQAStories / baselineCapacity.available.QA) * 100 : 
      100 + (totalQAStories / (baselineSprData.capacity.QA || 0.001)) * 100
  };

  // Impact on total remaining project capacity
  const totalProjectImpact = {
    BA: remainingCapacity.BA > 0 ? 
      (totalBAStories / remainingCapacity.BA) * 100 : 
      100 + (totalBAStories / (baselineSprData.capacity.BA || 0.001)) * 100,
    Config: remainingCapacity.Config > 0 ? 
      (totalConfigStories / remainingCapacity.Config) * 100 : 
      100 + (totalConfigStories / (baselineSprData.capacity.Config || 0.001)) * 100,
    QA: remainingCapacity.QA > 0 ? 
      (totalQAStories / remainingCapacity.QA) * 100 : 
      100 + (totalQAStories / (baselineSprData.capacity.QA || 0.001)) * 100
  };

  // Calculate additional sprints needed based on stories exceeding capacity
  const additionalSprintsNeeded = {
    BA: baselineCapacity.available.BA <= 0 ? 
      totalBAStories / (baselineSprData.capacity.BA || 1) : 
      Math.max(0, (totalBAStories - baselineCapacity.available.BA) / (baselineSprData.capacity.BA || 1)),
    Config: baselineCapacity.available.Config <= 0 ? 
      totalConfigStories / (baselineSprData.capacity.Config || 1) : 
      Math.max(0, (totalConfigStories - baselineCapacity.available.Config) / (baselineSprData.capacity.Config || 1)),
    QA: baselineCapacity.available.QA <= 0 ? 
      totalQAStories / (baselineSprData.capacity.QA || 1) : 
      Math.max(0, (totalQAStories - baselineCapacity.available.QA) / (baselineSprData.capacity.QA || 1))
  };

  // Determine critical path (team with highest impact)
  const maxAdditionalSprints = Math.max(
    additionalSprintsNeeded.BA, 
    additionalSprintsNeeded.Config, 
    additionalSprintsNeeded.QA
  );
  
  let criticalPath;
  if (maxAdditionalSprints === additionalSprintsNeeded.BA) criticalPath = "Business Analysts";
  else if (maxAdditionalSprints === additionalSprintsNeeded.Config) criticalPath = "Configurators";
  else criticalPath = "QA Team";

  // Calculate additional days based on sprint duration
  const additionalDays = maxAdditionalSprints * projectParams.sprintDurationDays;
  
  // Calculate new deadline based on the original deadline
  const newDeadline = calculateNewDeadline(projectParams.deadline, additionalDays);

  return {
    additionalSprints: maxAdditionalSprints,
    additionalDays: additionalDays,
    newDeadline: newDeadline,
    criticalPath,
    teamImpacts: {
      BA: { 
        currentSprint: parseFloat(baselineSprintImpact.BA.toFixed(1)), 
        total: parseFloat(totalProjectImpact.BA.toFixed(1)) 
      },
      Config: { 
        currentSprint: parseFloat(baselineSprintImpact.Config.toFixed(1)), 
        total: parseFloat(totalProjectImpact.Config.toFixed(1)) 
      },
      QA: { 
        currentSprint: parseFloat(baselineSprintImpact.QA.toFixed(1)), 
        total: parseFloat(totalProjectImpact.QA.toFixed(1)) 
      }
    },
    capacityDetails: {
      capacity: baselineCapacity.capacity,
      allocated: baselineCapacity.allocated,
      available: baselineCapacity.available,
      utilization: baselineCapacity.utilization
    },
    storiesToCapacity: {
      BA: {
        hours: totalBAHours,
        stories: totalBAStories,
        capacityImpact: baCapacityImpact
      },
      Config: {
        hours: totalConfigHours,
        stories: totalConfigStories,
        capacityImpact: configCapacityImpact
      },
      QA: {
        hours: totalQAHours,
        stories: totalQAStories,
        capacityImpact: qaCapacityImpact
      }
    }
  };
};

/**
 * Calculate a new deadline based on additional days, accounting for weekends
 * @param {Date} originalDeadline - Original project deadline
 * @param {number} additionalDays - Number of additional days needed
 * @returns {Date} New calculated deadline
 */
export const calculateNewDeadline = (originalDeadline, additionalDays) => {
  // Create a new date object with noon time to avoid timezone issues
  const newDeadline = new Date(originalDeadline.getTime());
  let daysToAdd = additionalDays;
  
  while (daysToAdd > 0) {
    // Add one day at a time, accounting for fractional days
    const wholeDaysToAdd = Math.min(1, daysToAdd);
    daysToAdd -= wholeDaysToAdd;
    
    newDeadline.setDate(newDeadline.getDate() + wholeDaysToAdd);
    // Skip weekends for whole day additions (0 = Sunday, 6 = Saturday)
    if (wholeDaysToAdd === 1 && (newDeadline.getDay() === 0 || newDeadline.getDay() === 6)) {
      // If it's a weekend, move to Monday
      if (newDeadline.getDay() === 0) {
        newDeadline.setDate(newDeadline.getDate() + 1); // Move to Monday
      } else {
        newDeadline.setDate(newDeadline.getDate() + 2); // Move to Monday
      }
    }
  }
  
  return newDeadline;
};

/**
 * Get theoretical and available capacity for a specific sprint in user stories
 * @param {number} sprintNumber - Sprint number to get capacity for
 * @param {Array} sprintCapacities - Array of sprint capacity objects
 * @returns {Object} Capacity details for the sprint
 */
export const getSprintCapacity = (sprintNumber, sprintCapacities) => {
  const sprintData = sprintCapacities.find(s => s.sprintNumber === sprintNumber);
  if (!sprintData) return { 
    capacity: { BA: 0, Config: 0, QA: 0 }, 
    allocated: { BA: 0, Config: 0, QA: 0 }, 
    available: { BA: 0, Config: 0, QA: 0 }, 
    utilization: { BA: 0, Config: 0, QA: 0 } 
  };
  
  // Get capacity and allocated values
  const capacity = sprintData.capacity;
  const allocated = sprintData.allocated;
  
  // Calculate available capacity (unused)
  const available = {
    BA: capacity.BA - allocated.BA,
    Config: capacity.Config - allocated.Config,
    QA: capacity.QA - allocated.QA
  };
  
  // Calculate utilization as a percentage
  const utilization = {
    BA: (allocated.BA / Math.max(0.001, capacity.BA)) * 100,
    Config: (allocated.Config / Math.max(0.001, capacity.Config)) * 100,
    QA: (allocated.QA / Math.max(0.001, capacity.QA)) * 100
  };
  
  return {
    capacity,
    allocated,
    available,
    utilization
  };
};

/**
 * Get total remaining capacity from baseline sprint to end (in user stories)
 * @param {Object} projectParams - Project parameters
 * @param {Array} sprintCapacities - Array of sprint capacity objects
 * @returns {Object} Total available capacity remaining
 */
export const getRemainingCapacity = (projectParams, sprintCapacities) => {
  let totalAvailable = { BA: 0, Config: 0, QA: 0 };
  
  // Calculate from baseline sprint to end
  for (let sprint = projectParams.baselineSprint; sprint <= projectParams.totalSprints; sprint++) {
    const capacity = getSprintCapacity(sprint, sprintCapacities);
    totalAvailable.BA += capacity.available.BA;
    totalAvailable.Config += capacity.available.Config;
    totalAvailable.QA += capacity.available.QA;
  }
  
  return totalAvailable;
};
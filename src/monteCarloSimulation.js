// monteCarloSimulation.js

// Monte Carlo simulation for timeline forecasting
export const runMonteCarloSimulation = (crInputs, projectParams, sprintCapacities, iterations = 10000) => {
  const results = {
    deadlineDates: [],
    additionalSprints: [],
    additionalDays: [],
    criticalPaths: {},
    teamUtilizations: {
      BA: [],
      Config: [],
      QA: []
    }
  };
  
  // Create a deep copy of the baseline sprint capacity for simulations
  const baselineSprintData = { ...sprintCapacities.find(s => s.sprintNumber === projectParams.baselineSprint) };
  
  // Run the specified number of simulations
  for (let i = 0; i < iterations; i++) {
    // For each CR, sample from its effort distribution
    const simulatedCRs = crInputs.map(cr => {
      // Create uncertainty ranges based on CR size
      const baHoursVariance = calculateVariance(cr.BAHours);
      const configHoursVariance = calculateVariance(cr.ConfigHours);
      const qaHoursVariance = calculateVariance(cr.QAHours);
      
      return {
        ...cr,
        BAHours: sampleFromDistribution(cr.BAHours, baHoursVariance),
        ConfigHours: sampleFromDistribution(cr.ConfigHours, configHoursVariance),
        QAHours: sampleFromDistribution(cr.QAHours, qaHoursVariance)
      };
    });
    
    // Sample team capacity (with some variance to account for productivity fluctuations)
    const simulatedCapacity = {
      BA: sampleFromDistribution(baselineSprintData.capacity.BA, baselineSprintData.capacity.BA * 0.1),
      Config: sampleFromDistribution(baselineSprintData.capacity.Config, baselineSprintData.capacity.Config * 0.1),
      QA: sampleFromDistribution(baselineSprintData.capacity.QA, baselineSprintData.capacity.QA * 0.1)
    };
    
    // Calculate impact with simulated values
    const impact = calculateImpactForSimulation(simulatedCRs, projectParams, simulatedCapacity);
    
    // Store results
    results.deadlineDates.push(impact.newDeadline);
    results.additionalSprints.push(impact.additionalSprints);
    results.additionalDays.push(impact.additionalDays);
    
    // Track which team was the critical path
    const criticalPath = impact.criticalPath;
    results.criticalPaths[criticalPath] = (results.criticalPaths[criticalPath] || 0) + 1;
    
    // Track team utilization data
    results.teamUtilizations.BA.push(impact.teamImpacts.BA.currentSprint);
    results.teamUtilizations.Config.push(impact.teamImpacts.Config.currentSprint);
    results.teamUtilizations.QA.push(impact.teamImpacts.QA.currentSprint);
  }
  
  // Analyze and summarize results
  return analyzeMonteCarloResults(results, iterations, projectParams);
};

// Calculate variance based on effort size
const calculateVariance = (hours) => {
  // Larger estimates have higher uncertainty percentage
  if (hours <= 20) return hours * 0.2;      // 20% variance for small CRs
  if (hours <= 80) return hours * 0.3;      // 30% variance for medium CRs
  return hours * 0.4;                        // 40% variance for large CRs
};

// Sample from a normal distribution
const sampleFromDistribution = (mean, variance) => {
  // Box-Muller transform for normal distribution sampling
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  // Apply to our mean and standard deviation
  const stdDev = Math.sqrt(variance);
  let sample = mean + z0 * stdDev;
  
  // Ensure we don't get negative hours
  return Math.max(0, sample);
};

// Calculate impact for a single simulation run
const calculateImpactForSimulation = (simulatedCRs, projectParams, simulatedCapacity) => {
  const baselineSprint = projectParams.baselineSprint;
  const hoursPerStory = {
    BA: 19,
    Config: 31,
    QA: 24
  };
  
  // Get total hours needed per team for all CRs
  const totalBAHours = simulatedCRs.reduce((sum, cr) => sum + cr.BAHours, 0);
  const totalConfigHours = simulatedCRs.reduce((sum, cr) => sum + cr.ConfigHours, 0);
  const totalQAHours = simulatedCRs.reduce((sum, cr) => sum + cr.QAHours, 0);
  
  // Convert hours to stories
  const totalBAStories = totalBAHours / hoursPerStory.BA;
  const totalConfigStories = totalConfigHours / hoursPerStory.Config;
  const totalQAStories = totalQAHours / hoursPerStory.QA;
  
  // Calculate available capacity
  const baselineAvailableCapacity = {
    BA: simulatedCapacity.BA * 0.1,      // Assume 10% of capacity is available (90% allocated)
    Config: simulatedCapacity.Config * 0.2, // Assume 20% of capacity is available (80% allocated)
    QA: simulatedCapacity.QA * 0.2       // Assume 20% of capacity is available (80% allocated)
  };
  
  // Calculate additional sprints needed
  const additionalSprintsNeeded = {
    BA: baselineAvailableCapacity.BA <= 0 ? 
      totalBAStories / simulatedCapacity.BA : 
      Math.max(0, (totalBAStories - baselineAvailableCapacity.BA) / simulatedCapacity.BA),
    Config: baselineAvailableCapacity.Config <= 0 ? 
      totalConfigStories / simulatedCapacity.Config : 
      Math.max(0, (totalConfigStories - baselineAvailableCapacity.Config) / simulatedCapacity.Config),
    QA: baselineAvailableCapacity.QA <= 0 ? 
      totalQAStories / simulatedCapacity.QA : 
      Math.max(0, (totalQAStories - baselineAvailableCapacity.QA) / simulatedCapacity.QA)
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
  
  // Calculate additional days and new deadline
  const additionalDays = maxAdditionalSprints * projectParams.sprintDurationDays;
  const newDeadline = calculateNewDeadline(projectParams.deadline, additionalDays);
  
  // Calculate team impacts
  const teamImpacts = {
    BA: {
      currentSprint: baselineAvailableCapacity.BA > 0 ? 
        (totalBAStories / baselineAvailableCapacity.BA) * 100 : 
        (totalBAStories / (simulatedCapacity.BA * 0.001)) * 100
    },
    Config: {
      currentSprint: baselineAvailableCapacity.Config > 0 ? 
        (totalConfigStories / baselineAvailableCapacity.Config) * 100 : 
        (totalConfigStories / (simulatedCapacity.Config * 0.001)) * 100
    },
    QA: {
      currentSprint: baselineAvailableCapacity.QA > 0 ? 
        (totalQAStories / baselineAvailableCapacity.QA) * 100 : 
        (totalQAStories / (simulatedCapacity.QA * 0.001)) * 100
    }
  };
  
  return {
    additionalSprints: maxAdditionalSprints,
    additionalDays: additionalDays,
    newDeadline: newDeadline,
    criticalPath: criticalPath,
    teamImpacts: teamImpacts
  };
};

// Calculate new deadline accounting for weekends
const calculateNewDeadline = (baseDate, additionalDays) => {
  const newDeadline = new Date(baseDate.getTime());
  let daysToAdd = additionalDays;
  
  while (daysToAdd > 0) {
    // Add one day at a time
    const wholeDaysToAdd = Math.min(1, daysToAdd);
    daysToAdd -= wholeDaysToAdd;
    
    newDeadline.setDate(newDeadline.getDate() + wholeDaysToAdd);
    // Skip weekends
    if (newDeadline.getDay() === 0) { // Sunday
      newDeadline.setDate(newDeadline.getDate() + 1);
    } else if (newDeadline.getDay() === 6) { // Saturday
      newDeadline.setDate(newDeadline.getDate() + 2);
    }
  }
  
  return newDeadline;
};

// Analyze the Monte Carlo simulation results
const analyzeMonteCarloResults = (results, iterations, projectParams) => {
  // Sort deadline dates chronologically
  results.deadlineDates.sort((a, b) => a - b);
  
  // Calculate percentiles for deadline dates
  const deadlinePercentiles = {
    p10: results.deadlineDates[Math.floor(iterations * 0.1)],
    p25: results.deadlineDates[Math.floor(iterations * 0.25)],
    p50: results.deadlineDates[Math.floor(iterations * 0.5)],  // Median
    p75: results.deadlineDates[Math.floor(iterations * 0.75)],
    p90: results.deadlineDates[Math.floor(iterations * 0.9)]
  };
  
  // Calculate mean and standard deviation for additional sprints
  const sprintsMean = results.additionalSprints.reduce((sum, val) => sum + val, 0) / iterations;
  const sprintsStdDev = Math.sqrt(
    results.additionalSprints.reduce((sum, val) => sum + Math.pow(val - sprintsMean, 2), 0) / iterations
  );
  
  // Calculate mean and standard deviation for additional days
  const daysMean = results.additionalDays.reduce((sum, val) => sum + val, 0) / iterations;
  const daysStdDev = Math.sqrt(
    results.additionalDays.reduce((sum, val) => sum + Math.pow(val - daysMean, 2), 0) / iterations
  );
  
  // Calculate probability of mee
/**
 * Risk Assessment Utility Functions
 * 
 * Provides functions to evaluate various risk factors of change requests
 */

// Define the main risk dimensions to assess
const riskDimensions = {
  capacityRisk: {
    description: "Risk due to high team utilization",
    weight: 0.30, // 30% of overall risk score
  },
  estimationRisk: {
    description: "Risk due to estimation uncertainty",
    weight: 0.25, // 25% of overall risk score
  },
  complexityRisk: {
    description: "Risk due to CR technical complexity",
    weight: 0.20, // 20% of overall risk score
  },
  dependencyRisk: {
    description: "Risk due to external dependencies",
    weight: 0.15, // 15% of overall risk score
  },
  resourceRisk: {
    description: "Risk due to resource availability constraints",
    weight: 0.10, // 10% of overall risk score
  },
};

// Define risk level thresholds
const riskLevels = {
  Low: { threshold: 0.25, color: '#4CAF50', description: "Minimal impact expected" },
  Medium: { threshold: 0.50, color: '#FFC107', description: "Moderate impact possible" },
  High: { threshold: 0.75, color: '#FF9800', description: "Significant impact likely" },
  Critical: { threshold: 1.00, color: '#F44336', description: "Major impact expected" }
};

// Map numerical risk scores to levels
export const getRiskLevel = (score) => {
  if (score < riskLevels.Low.threshold) return 'Low';
  if (score < riskLevels.Medium.threshold) return 'Medium';
  if (score < riskLevels.High.threshold) return 'High';
  return 'Critical';
};

// Get color for risk level
export const getRiskColor = (level) => {
  return riskLevels[level]?.color || '#757575';
};

/**
 * Main risk assessment function
 * @param {Array} crInputs - Array of CR input objects
 * @param {Object} projectParams - Project parameters
 * @param {Array} sprintCapacities - Array of sprint capacity objects
 * @param {Object} teamResources - Team resource numbers
 * @returns {Object} Complete risk assessment results
 */
export const assessCRRisk = (crInputs, projectParams, sprintCapacities, teamResources) => {
  // Calculate capacity risk
  const capacityRisk = assessCapacityRisk(crInputs, projectParams, sprintCapacities);
  
  // Calculate estimation risk
  const estimationRisk = assessEstimationRisk(crInputs);
  
  // Calculate complexity risk
  const complexityRisk = assessComplexityRisk(crInputs);
  
  // Calculate dependency risk
  const dependencyRisk = assessDependencyRisk(crInputs);
  
  // Calculate resource risk
  const resourceRisk = assessResourceRisk(teamResources, projectParams);
  
  // Calculate weighted composite risk score
  const overallRiskScore = calculateOverallRiskScore({
    capacityRisk,
    estimationRisk,
    complexityRisk,
    dependencyRisk,
    resourceRisk
  });
  
  // Determine risk level
  const riskLevel = getRiskLevel(overallRiskScore.score);
  
  // Generate mitigation suggestions
  const mitigationSuggestions = generateMitigationSuggestions({
    capacityRisk,
    estimationRisk,
    complexityRisk,
    dependencyRisk,
    resourceRisk
  });
  
  return {
    overallRiskScore,
    riskLevel,
    riskComponents: {
      capacityRisk,
      estimationRisk,
      complexityRisk,
      dependencyRisk,
      resourceRisk
    },
    mitigationSuggestions
  };
};

/**
 * Assess capacity risk based on team utilization
 */
const assessCapacityRisk = (crInputs, projectParams, sprintCapacities) => {
  // Get baseline sprint capacity details
  const baselineSprint = projectParams.baselineSprint;
  const baselineSprintData = sprintCapacities.find(s => s.sprintNumber === baselineSprint);
  
  if (!baselineSprintData) {
    return { score: 0.8, level: 'High', details: 'Baseline sprint data not available' };
  }
  
  // Calculate total CR hours per team
  const totalHours = {
    BA: crInputs.reduce((sum, cr) => sum + Number(cr.BAHours || 0), 0),
    Config: crInputs.reduce((sum, cr) => sum + Number(cr.ConfigHours || 0), 0),
    QA: crInputs.reduce((sum, cr) => sum + Number(cr.QAHours || 0), 0)
  };
  
  // Convert hours to stories
  const hoursPerStory = {
    BA: 19,
    Config: 31,
    QA: 24
  };
  
  const storiesNeeded = {
    BA: totalHours.BA / hoursPerStory.BA,
    Config: totalHours.Config / hoursPerStory.Config,
    QA: totalHours.QA / hoursPerStory.QA
  };
  
  // Calculate available capacity in baseline sprint
  const availableCapacity = {
    BA: baselineSprintData.capacity.BA - baselineSprintData.allocated.BA,
    Config: baselineSprintData.capacity.Config - baselineSprintData.allocated.Config,
    QA: baselineSprintData.capacity.QA - baselineSprintData.allocated.QA
  };
  
  // Calculate capacity utilization with new CRs
  const utilization = {
    BA: availableCapacity.BA > 0 ? storiesNeeded.BA / availableCapacity.BA : 2.0,
    Config: availableCapacity.Config > 0 ? storiesNeeded.Config / availableCapacity.Config : 2.0,
    QA: availableCapacity.QA > 0 ? storiesNeeded.QA / availableCapacity.QA : 2.0
  };
  
  // Calculate risk scores per team (utilization over 75% starts to add risk)
  const teamRiskScores = {
    BA: Math.min(1.0, Math.max(0, (utilization.BA - 0.75) * 4)),
    Config: Math.min(1.0, Math.max(0, (utilization.Config - 0.75) * 4)),
    QA: Math.min(1.0, Math.max(0, (utilization.QA - 0.75) * 4))
  };
  
  // Identify most constrained team
  const maxRiskTeam = Object.entries(teamRiskScores).reduce(
    (max, [team, score]) => score > max.score ? { team, score } : max,
    { team: null, score: 0 }
  );
  
  // Overall capacity risk is driven by most constrained team
  const overallScore = maxRiskTeam.score;
  
  return {
    score: overallScore,
    level: getRiskLevel(overallScore),
    details: {
      teamUtilization: utilization,
      teamRiskScores,
      criticalTeam: maxRiskTeam.team,
      availableCapacity,
      storiesNeeded
    }
  };
};

/**
 * Assess risk due to estimation uncertainty
 */
const assessEstimationRisk = (crInputs) => {
  if (!crInputs || crInputs.length === 0) {
    return {
      score: 0,
      level: 'Low',
      details: {
        riskFactors: { largeSize: 0, missingDetails: 0, unbalancedEffort: 0 },
        largeCRs: [],
        incompleteCRs: [],
        unbalancedCRs: []
      }
    };
  }
  
  // Factors that increase estimation risk
  const riskFactors = {
    largeSize: 0, // CRs with large hour estimates
    missingDetails: 0, // CRs with missing or incomplete details
    unbalancedEffort: 0, // CRs with unusual distribution of effort across teams
    newCrType: 0 // CRs of types not frequently implemented
  };
  
  // Check for large CRs (e.g., any team effort > 100 hours)
  const largeCRs = crInputs.filter(cr => 
    cr.BAHours > 100 || cr.ConfigHours > 100 || cr.QAHours > 100
  );
  riskFactors.largeSize = Math.min(1.0, largeCRs.length / Math.max(1, crInputs.length));
  
  // Check for potentially missing details (e.g., any team with zero hours)
  const potentiallyIncompleteCRs = crInputs.filter(cr => 
    cr.BAHours === 0 || cr.ConfigHours === 0 || cr.QAHours === 0
  );
  riskFactors.missingDetails = Math.min(1.0, potentiallyIncompleteCRs.length / Math.max(1, crInputs.length));
  
  // Check for unbalanced effort distribution
  const idealRatios = {
    BA_Config: 19/31, // BA to Config hours ratio (based on story conversion)
    BA_QA: 19/24, // BA to QA hours ratio
    Config_QA: 31/24 // Config to QA hours ratio
  };
  
  const unbalancedCRs = crInputs.filter(cr => {
    if (cr.BAHours === 0 || cr.ConfigHours === 0 || cr.QAHours === 0) return false;
    
    const actualRatios = {
      BA_Config: cr.BAHours / cr.ConfigHours,
      BA_QA: cr.BAHours / cr.QAHours,
      Config_QA: cr.ConfigHours / cr.QAHours
    };
    
    // Check if any ratio deviates by more than 50% from ideal
    return Object.entries(idealRatios).some(([ratio, idealValue]) => {
      const actualValue = actualRatios[ratio];
      const deviation = Math.abs((actualValue - idealValue) / idealValue);
      return deviation > 0.5;
    });
  });
  
  riskFactors.unbalancedEffort = Math.min(1.0, unbalancedCRs.length / Math.max(1, crInputs.length));
  
  // Calculate weighted risk score (could be refined based on historical data)
  const weights = {
    largeSize: 0.4,
    missingDetails: 0.3,
    unbalancedEffort: 0.3,
    newCrType: 0.0 // Not implemented without historical data
  };
  
  const overallScore = Object.entries(riskFactors).reduce(
    (sum, [factor, score]) => sum + score * weights[factor],
    0
  );
  
  return {
    score: overallScore,
    level: getRiskLevel(overallScore),
    details: {
      riskFactors,
      largeCRs: largeCRs.map(cr => cr.id),
      incompleteCRs: potentiallyIncompleteCRs.map(cr => cr.id),
      unbalancedCRs: unbalancedCRs.map(cr => cr.id)
    }
  };
};

/**
 * Assess risk due to technical complexity
 */
const assessComplexityRisk = (crInputs) => {
  if (!crInputs || crInputs.length === 0) {
    return {
      score: 0,
      level: 'Low',
      details: {
        totalEffort: 0,
        sizeComplexityScore: 0,
        integrationComplexityScore: 0,
        coordinationComplexityScore: 0,
        crCount: 0
      }
    };
  }
  
  // 1. Total size as proxy for complexity
  const totalEffort = crInputs.reduce((sum, cr) => 
    sum + Number(cr.BAHours || 0) + Number(cr.ConfigHours || 0) + Number(cr.QAHours || 0), 0);
  
  // Define thresholds for complexity based on total hours
  const complexityThresholds = {
    low: 100,    // Less than 100 hours total
    medium: 300,  // Between 100 and 300 hours
    high: 600     // Between 300 and 600 hours
    // Over 600 hours is considered very high complexity
  };
  
  let sizeComplexityScore;
  if (totalEffort < complexityThresholds.low) {
    sizeComplexityScore = 0.2;
  } else if (totalEffort < complexityThresholds.medium) {
    sizeComplexityScore = 0.4;
  } else if (totalEffort < complexityThresholds.high) {
    sizeComplexityScore = 0.7;
  } else {
    sizeComplexityScore = 0.9;
  }
  
  // 2. Effort distribution as proxy for integration complexity
  const configToTotalRatio = totalEffort > 0 ? 
    crInputs.reduce((sum, cr) => sum + Number(cr.ConfigHours || 0), 0) / totalEffort : 0;
  
  // Higher Config work often indicates more complex integration
  const integrationComplexityScore = Math.min(1.0, configToTotalRatio * 1.5);
  
  // 3. Number of CRs as proxy for coordination complexity
  const coordinationComplexityScore = Math.min(1.0, crInputs.length / 10);
  
  // Weighted complexity score
  const overallScore = (
    sizeComplexityScore * 0.5 +
    integrationComplexityScore * 0.3 +
    coordinationComplexityScore * 0.2
  );
  
  return {
    score: overallScore,
    level: getRiskLevel(overallScore),
    details: {
      totalEffort,
      sizeComplexityScore,
      integrationComplexityScore,
      coordinationComplexityScore,
      crCount: crInputs.length
    }
  };
};

/**
 * Assess risk due to dependencies between CRs
 */
const assessDependencyRisk = (crInputs) => {
  if (!crInputs || crInputs.length === 0) {
    return {
      score: 0,
      level: 'Low',
      details: {
        crCount: 0,
        crCountRisk: 0,
        defaultRisk: 0
      }
    };
  }
  
  // Estimate interdependency risk based on number of CRs
  // More CRs generally means more potential dependencies
  const crCountRisk = Math.min(1.0, crInputs.length / 15);
  
  // For now, assign a medium risk score due to lack of dependency data
  const defaultDependencyRisk = 0.5;
  
  // Future enhancement: Parse CR names/descriptions for dependency keywords
  // Future enhancement: Allow explicit marking of dependencies between CRs
  
  const overallScore = (crCountRisk * 0.3) + (defaultDependencyRisk * 0.7);
  
  return {
    score: overallScore,
    level: getRiskLevel(overallScore),
    details: {
      crCount: crInputs.length,
      crCountRisk,
      defaultRisk: defaultDependencyRisk,
      // This would list actual dependencies when that data is available
      knownDependencies: 'Not available - dependency tracking not implemented'
    }
  };
};

/**
 * Assess risk due to resource constraints
 */
const assessResourceRisk = (teamResources, projectParams) => {
  if (!teamResources) {
    return {
      score: 0.5,
      level: 'Medium',
      details: {
        teamSizeRisk: { BA: 0.5, Config: 0.5, QA: 0.5 },
        teamSizes: { BA: 0, Config: 0, QA: 0 },
        minimumViableTeam: { BA: 7, Config: 15, QA: 13 },
        projectCompletionRatio: 0.5,
        lateProjectRisk: 0.5
      }
    };
  }
  
  // Assess risk based on team size (smaller teams = higher risk)
  // Define minimum viable team sizes
  const minimumViableTeam = {
    BA: 7,
    Config: 15,
    QA: 13
  };
  
  // Calculate risk based on how close each team is to minimum viable size
  const teamSizeRisk = {
    BA: Math.max(0, Math.min(1.0, (minimumViableTeam.BA / teamResources.BA) - 0.5)),
    Config: Math.max(0, Math.min(1.0, (minimumViableTeam.Config / teamResources.Config) - 0.5)),
    QA: Math.max(0, Math.min(1.0, (minimumViableTeam.QA / teamResources.QA) - 0.5))
  };
  
  // Assess risk based on how late in the project we are (later = higher risk)
  const projectCompletionRatio = projectParams.currentSprint / projectParams.totalSprints;
  const lateProjectRisk = Math.min(1.0, projectCompletionRatio * 1.5); // Increases toward end
  
  // Weighted overall resource risk
  const overallScore = (
    teamSizeRisk.BA * 0.2 +
    teamSizeRisk.Config * 0.3 +
    teamSizeRisk.QA * 0.2 +
    lateProjectRisk * 0.3
  );
  
  return {
    score: overallScore,
    level: getRiskLevel(overallScore),
    details: {
      teamSizeRisk,
      teamSizes: teamResources,
      minimumViableTeam,
      projectCompletionRatio,
      lateProjectRisk
    }
  };
};

/**
 * Calculate overall risk score from components
 */
const calculateOverallRiskScore = (riskComponents) => {
  // Apply weights from risk dimensions to each component
  const weightedScores = Object.entries(riskComponents).map(([component, assessment]) => {
    const dimensionKey = component;
    const weight = riskDimensions[dimensionKey]?.weight || 0.2; // Default weight if not found
    return {
      component,
      weightedScore: assessment.score * weight,
      weight,
      originalScore: assessment.score,
      level: assessment.level
    };
  });
  
  // Calculate overall weighted score
  const totalScore = weightedScores.reduce((sum, item) => sum + item.weightedScore, 0);
  
  // Determine primary risk driver
  const primaryDriver = weightedScores.reduce(
    (max, current) => current.weightedScore > max.weightedScore ? current : max,
    { component: null, weightedScore: 0 }
  );
  
  return {
    score: totalScore,
    level: getRiskLevel(totalScore),
    components: weightedScores,
    primaryRiskDriver: primaryDriver.component ? primaryDriver.component.replace('Risk', '') : 'Unknown'
  };
};

/**
 * Generate mitigation suggestions
 */
const generateMitigationSuggestions = (riskComponents) => {
  const suggestions = [];
  
  // Capacity risk mitigations
  if (riskComponents.capacityRisk.score > 0.5) {
    const criticalTeam = riskComponents.capacityRisk.details.criticalTeam;
    suggestions.push({
      category: 'Capacity',
      risk: riskComponents.capacityRisk.level,
      suggestion: `Consider increasing ${criticalTeam} team size or extending the timeline.`,
      priority: riskComponents.capacityRisk.score > 0.75 ? 'High' : 'Medium'
    });
    
    suggestions.push({
      category: 'Capacity',
      risk: riskComponents.capacityRisk.level,
      suggestion: 'Review and potentially reduce scope of other stories in affected sprints.',
      priority: riskComponents.capacityRisk.score > 0.75 ? 'High' : 'Medium'
    });
  }
  
  // Estimation risk mitigations
  if (riskComponents.estimationRisk.score > 0.5) {
    if (riskComponents.estimationRisk.details.riskFactors.largeSize > 0.3) {
      suggestions.push({
        category: 'Estimation',
        risk: riskComponents.estimationRisk.level,
        suggestion: 'Break down large CRs into smaller, more manageable pieces.',
        priority: 'High'
      });
    }
    
    if (riskComponents.estimationRisk.details.riskFactors.missingDetails > 0.3) {
      suggestions.push({
        category: 'Estimation',
        risk: riskComponents.estimationRisk.level,
        suggestion: 'Review CRs with missing effort estimates for specific teams.',
        priority: 'High'
      });
    }
    
    if (riskComponents.estimationRisk.details.riskFactors.unbalancedEffort > 0.3) {
      suggestions.push({
        category: 'Estimation',
        risk: riskComponents.estimationRisk.level,
        suggestion: 'Review CRs with unusual effort distribution across teams.',
        priority: 'Medium'
      });
    }
  }
  
  // Complexity risk mitigations
  if (riskComponents.complexityRisk.score > 0.6) {
    suggestions.push({
      category: 'Complexity',
      risk: riskComponents.complexityRisk.level,
      suggestion: 'Consider implementing CRs in phases rather than all at once.',
      priority: riskComponents.complexityRisk.score > 0.8 ? 'High' : 'Medium'
    });
    
    suggestions.push({
      category: 'Complexity',
      risk: riskComponents.complexityRisk.level,
      suggestion: 'Schedule additional design and architecture reviews.',
      priority: 'Medium'
    });
  }
  
  // Dependency risk mitigations
  if (riskComponents.dependencyRisk.score > 0.5) {
    suggestions.push({
      category: 'Dependencies',
      risk: riskComponents.dependencyRisk.level,
      suggestion: 'Map out CR dependencies and sequence implementation accordingly.',
      priority: 'Medium'
    });
  }
  
  // Resource risk mitigations
  if (riskComponents.resourceRisk.score > 0.5) {
    const riskTeams = [];
    if (riskComponents.resourceRisk.details.teamSizeRisk.BA > 0.5) riskTeams.push('BA');
    if (riskComponents.resourceRisk.details.teamSizeRisk.Config > 0.5) riskTeams.push('Config');
    if (riskComponents.resourceRisk.details.teamSizeRisk.QA > 0.5) riskTeams.push('QA');
    
    if (riskTeams.length > 0) {
      suggestions.push({
        category: 'Resources',
        risk: riskComponents.resourceRisk.level,
        suggestion: `Consider temporarily augmenting the ${riskTeams.join(', ')} team(s).`,
        priority: riskComponents.resourceRisk.score > 0.75 ? 'High' : 'Medium'
      });
    }
    
    if (riskComponents.resourceRisk.details.lateProjectRisk > 0.7) {
      suggestions.push({
        category: 'Project Timing',
        risk: riskComponents.resourceRisk.level,
        suggestion: 'Late-project changes are high risk. Consider deferring to next release.',
        priority: 'High'
      });
    }
  }
  
  return suggestions;
};
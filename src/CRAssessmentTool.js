import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell, 
  PieChart, Pie, ComposedChart
} from 'recharts';

// Add these Monte Carlo imports
import { runMonteCarloSimulation } from './monteCarloUtils';
import MonteCarloVisualization from './MonteCarloVisualization';
import MonteCarloSummary from './MonteCarloSummary';


// Risk assessment constants and helper functions
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
const getRiskLevel = (score) => {
  if (score < riskLevels.Low.threshold) return 'Low';
  if (score < riskLevels.Medium.threshold) return 'Medium';
  if (score < riskLevels.High.threshold) return 'High';
  return 'Critical';
};

// Risk Assessment Functions
const assessCapacityRisk = (crInputs, projectParams, sprintCapacities) => {
  // Get baseline sprint capacity details
  const baselineSprint = projectParams.baselineSprint;
  const baselineSprintData = sprintCapacities.find(s => s.sprintNumber === baselineSprint);
  
  if (!baselineSprintData) {
    return { score: 0.8, level: 'High', details: 'Baseline sprint data not available' };
  }
  
  // Calculate total CR hours per team
  const totalHours = {
    BA: crInputs.reduce((sum, cr) => sum + Number(cr.BAHours), 0),
    Config: crInputs.reduce((sum, cr) => sum + Number(cr.ConfigHours), 0),
    QA: crInputs.reduce((sum, cr) => sum + Number(cr.QAHours), 0)
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

const assessEstimationRisk = (crInputs) => {
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

const assessComplexityRisk = (crInputs) => {
  // Without detailed complexity metadata, we can use proxy indicators:
  
  // 1. Total size as proxy for complexity
  const totalEffort = crInputs.reduce((sum, cr) => 
    sum + cr.BAHours + cr.ConfigHours + cr.QAHours, 0);
  
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
    crInputs.reduce((sum, cr) => sum + cr.ConfigHours, 0) / totalEffort : 0;
  
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

const assessDependencyRisk = (crInputs) => {
  // Without explicit dependency data, we can use estimates:
  
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

const assessResourceRisk = (teamResources, projectParams) => {
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
    primaryRiskDriver: primaryDriver.component?.replace('Risk', '')
  };
};

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

// Main risk assessment function
const assessCRRisk = (crInputs, projectParams, sprintCapacities, teamResources) => {
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

// Main component
const CRAssessmentTool = () => {
  // Data persistence
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [currentConfigId, setCurrentConfigId] = useState(null);
  const [currentConfigName, setCurrentConfigName] = useState("Untitled Configuration");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Project parameters
  const [projectParams, setProjectParams] = useState({
    totalSprints: 22,
    currentSprint: 11,
    baselineSprint: 11,
    deadline: new Date('2026-04-17T12:00:00'),
    sprintDurationDays: 20,
  });

  // Team capacity per resource per sprint (in user stories)
  const [resourceCapacity, setResourceCapacity] = useState({
    BA: 5,
    Config: 3,
    QA: 4,
  });

  // Team resources (number of people per team)
  const [teamResources, setTeamResources] = useState({
    BA: 7,
    Config: 16,
    QA: 13,
  });
  
  // Sprint capacity management
  const [sprintCapacities, setSprintCapacities] = useState([]);
  
  // CR inputs - using hours
  const [crInputs, setCrInputs] = useState([
    { id: 1, name: "CR 1", BAHours: 0, ConfigHours: 0, QAHours: 0 }
  ]);

  // Active visualization tab
  const [activeVisTab, setActiveVisTab] = useState('capacity');

	// Monte Carlo simulation state
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [simulationIterations, setSimulationIterations] = useState(5000);
  
  // Run Monte Carlo simulation
  const runMonteCarlo = async () => {
    setIsRunningSimulation(true);
    
    // Use setTimeout to allow UI to update before starting computation
    setTimeout(() => {
      try {
        const results = runMonteCarloSimulation(crInputs, projectParams, sprintCapacities, simulationIterations);
        setMonteCarloResults(results);
      } catch (error) {
        console.error("Error running Monte Carlo simulation:", error);
        // Optionally show an error message to the user
      } finally {
        setIsRunningSimulation(false);
      }
    }, 100);
  };

  // Results
  const [results, setResults] = useState({
    additionalSprints: 0,
    additionalDays: 0,
    newDeadline: new Date('2026-04-17T12:00:00'),
    criticalPath: "",
    teamImpacts: { 
      BA: { currentSprint: 0, total: 0 },
      Config: { currentSprint: 0, total: 0 },
      QA: { currentSprint: 0, total: 0 }
    },
    capacityDetails: {
      capacity: { BA: 0, Config: 0, QA: 0 },
      allocated: { BA: 0, Config: 0, QA: 0 },
      available: { BA: 0, Config: 0, QA: 0 },
      utilization: { BA: 0, Config: 0, QA: 0 }
    },
    storiesToCapacity: {
      BA: { hours: 0, stories: 0, capacityImpact: 0 },
      Config: { hours: 0, stories: 0, capacityImpact: 0 },
      QA: { hours: 0, stories: 0, capacityImpact: 0 }
    }
  });

  // Risk assessment state
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);

  // Initialize sprint capacities
  useEffect(() => {
    if (sprintCapacities.length === 0) {
      initializeSprintCapacities();
    }
  }, [sprintCapacities.length, projectParams.totalSprints]);
  
  // Load saved configurations on initial render
  useEffect(() => {
    loadSavedConfigurations();
  }, []);
  
  // Update results when inputs change
  useEffect(() => {
    if (sprintCapacities.length > 0) {
      calculateImpact();
      setHasUnsavedChanges(true);
    }
  }, [crInputs, projectParams, sprintCapacities]);
  
  // Calculate risk assessment when inputs change
  useEffect(() => {
    if (sprintCapacities.length > 0 && crInputs.length > 0) {
      const assessment = assessCRRisk(crInputs, projectParams, sprintCapacities, teamResources);
      setRiskAssessment(assessment);
      
      // Add to history when significant changes occur
      if (!riskHistory.length || 
          Math.abs(assessment.overallRiskScore.score - (riskHistory[riskHistory.length-1]?.overallScore || 0)) > 0.05) {
        const timestamp = new Date();
        setRiskHistory(prev => [...prev, {
          timestamp,
          overallScore: assessment.overallRiskScore.score,
          riskLevel: assessment.riskLevel,
          componentScores: {
            capacity: assessment.riskComponents.capacityRisk.score,
            estimation: assessment.riskComponents.estimationRisk.score,
            complexity: assessment.riskComponents.complexityRisk.score,
            dependency: assessment.riskComponents.dependencyRisk.score,
            resource: assessment.riskComponents.resourceRisk.score
          }
        }]);
      }
    }
  }, [crInputs, projectParams, sprintCapacities, teamResources]);
  
  // Generate a UUID for saving configurations
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  // Functions for data persistence
  const loadSavedConfigurations = () => {
    try {
      const savedConfigsString = localStorage.getItem('crAssessmentConfigs');
      if (savedConfigsString) {
        const configs = JSON.parse(savedConfigsString);
        setSavedConfigs(configs);
      }
    } catch (error) {
      console.error("Error loading saved configurations:", error);
    }
  };
  
  const getCurrentState = () => {
	  return {
		projectParams: {
		  ...projectParams,
		  deadline: projectParams.deadline.toISOString() // Convert Date to string for storage
		},
		resourceCapacity,
		teamResources,
		sprintCapacities,
		crInputs,
		// Add risk data
		riskData: riskAssessment ? {
		  assessment: riskAssessment,
		  history: riskHistory
		} : null,
		// Add Monte Carlo results
		monteCarloData: monteCarloResults
	  };
	};
  
  const saveCurrentConfiguration = (name) => {
    try {
      const configId = currentConfigId || generateUUID();
      const currentState = getCurrentState();
      const timestamp = new Date().toISOString();
      
      // Create or update configuration
      const newConfig = {
        id: configId,
        name: name || currentConfigName,
        state: currentState,
        createdAt: currentConfigId ? undefined : timestamp,
        lastModified: timestamp
      };
      
      // Update saved configs array
      let updatedConfigs = [...savedConfigs];
      const existingIndex = updatedConfigs.findIndex(c => c.id === configId);
      
      if (existingIndex >= 0) {
        // Update existing config
        updatedConfigs[existingIndex] = {
          ...updatedConfigs[existingIndex],
          name: name || updatedConfigs[existingIndex].name,
          state: currentState,
          lastModified: timestamp
        };
      } else {
        // Add new config
        updatedConfigs.push(newConfig);
      }
      
      // Save to localStorage
      localStorage.setItem('crAssessmentConfigs', JSON.stringify(updatedConfigs));
      
      // Update state
      setSavedConfigs(updatedConfigs);
      setCurrentConfigId(configId);
      if (name) setCurrentConfigName(name);
      setHasUnsavedChanges(false);
      
      return true;
    } catch (error) {
      console.error("Error saving configuration:", error);
      return false;
    }
  };
  
  const loadConfiguration = (configId) => {
	  try {
		const config = savedConfigs.find(c => c.id === configId);
		if (!config) return false;
		
		const { state } = config;
		
		// Restore all state
		setProjectParams({
		  ...state.projectParams,
		  deadline: new Date(state.projectParams.deadline) // Convert string back to Date
		});
		setResourceCapacity(state.resourceCapacity);
		setTeamResources(state.teamResources);
		setSprintCapacities(state.sprintCapacities);
		setCrInputs(state.crInputs);
		
		// Restore risk data if available
		if (state.riskData) {
		  setRiskAssessment(state.riskData.assessment);
		  setRiskHistory(state.riskData.history || []);
		}
		
		// Restore Monte Carlo results if available
		if (state.monteCarloData) {
		  setMonteCarloResults(state.monteCarloData);
		}
		
		// Update current config info
		setCurrentConfigId(configId);
		setCurrentConfigName(config.name);
		setHasUnsavedChanges(false);
		
		return true;
	  } catch (error) {
		console.error("Error loading configuration:", error);
		return false;
	  }
	};
  
  const deleteConfiguration = (configId) => {
    try {
      const updatedConfigs = savedConfigs.filter(c => c.id !== configId);
      localStorage.setItem('crAssessmentConfigs', JSON.stringify(updatedConfigs));
      setSavedConfigs(updatedConfigs);
      
      // Reset current config if we deleted the active one
      if (currentConfigId === configId) {
        setCurrentConfigId(null);
        setCurrentConfigName("Untitled Configuration");
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting configuration:", error);
      return false;
    }
  };
  
  const createNewConfiguration = () => {
  // Check for unsaved changes
	  if (hasUnsavedChanges && currentConfigId) {
		if (window.confirm("You have unsaved changes. Do you want to save before creating a new configuration?")) {
		  saveCurrentConfiguration();
		}
	  }
	  
	  // Reset to default state
	  setProjectParams({
		totalSprints: 22,
		currentSprint: 11,
		baselineSprint: 11,
		deadline: new Date('2026-04-17T12:00:00'),
		sprintDurationDays: 20,
	  });
	  setResourceCapacity({
		BA: 5,
		Config: 3,
		QA: 4,
	  });
	  setTeamResources({
		BA: 7,
		Config: 16,
		QA: 13,
	  });
	  setSprintCapacities([]);
	  setCrInputs([{ id: 1, name: "CR 1", BAHours: 0, ConfigHours: 0, QAHours: 0 }]);
	  
	  // Reset risk data
	  setRiskAssessment(null);
	  setRiskHistory([]);
	  
	  // Reset Monte Carlo data
	  setMonteCarloResults(null);
	  
	  // Reset config tracking
	  setCurrentConfigId(null);
	  setCurrentConfigName("Untitled Configuration");
	  setHasUnsavedChanges(false);
	  
	  // Initialize sprint capacities
	  initializeSprintCapacities();
	};
  
  // Initialize sprint capacities from current configuration
  const initializeSprintCapacities = () => {
    let newSprintCapacities = [];
    for (let sprint = 1; sprint <= projectParams.totalSprints; sprint++) {
      // Calculate team capacity in user stories
      const baCapacity = teamResources.BA * resourceCapacity.BA;
      const configCapacity = teamResources.Config * resourceCapacity.Config;
      const qaCapacity = teamResources.QA * resourceCapacity.QA;
      
      // Set default allocation to match typical utilization
      newSprintCapacities.push({
        sprintNumber: sprint,
        resources: { ...teamResources },
        capacity: {
          BA: baCapacity,
          Config: configCapacity,
          QA: qaCapacity
        },
        allocated: {
          BA: Math.round(baCapacity * 0.9), // Default 90% allocation
          Config: Math.round(configCapacity * 0.8),
          QA: Math.round(qaCapacity * 0.8)
        },
        isEditable: false
      });
    }
    setSprintCapacities(newSprintCapacities);
  };
  
  // Toggle sprint editability
  const toggleSprintEdit = (sprintNumber) => {
    setSprintCapacities(sprintCapacities.map(sprint => 
      sprint.sprintNumber === sprintNumber 
        ? { ...sprint, isEditable: !sprint.isEditable } 
        : sprint
    ));
  };
  
  // Update sprint capacity
  const updateSprintCapacity = (sprintNumber, team, field, value) => {
    setSprintCapacities(sprintCapacities.map(sprint => {
      if (sprint.sprintNumber !== sprintNumber) return sprint;
      
      // If updating resources, we need to recalculate capacity
      if (field === 'resources') {
        const newResources = { ...sprint.resources, [team]: value };
        const newCapacity = { ...sprint.capacity };
        newCapacity[team] = newResources[team] * resourceCapacity[team];
        
        return {
          ...sprint,
          resources: newResources,
          capacity: newCapacity
        };
      }
      
      // If updating allocated stories
      if (field === 'allocated') {
        return {
          ...sprint,
          allocated: {
            ...sprint.allocated,
            [team]: value
          }
        };
      }
      
      // For any other field (like isEditable)
      return {
        ...sprint,
        [field]: {
          ...sprint[field],
          [team]: value
        }
      };
    }));
  };

  // Get theoretical and available capacity for a specific sprint in user stories
  const getSprintCapacity = (sprintNumber) => {
    const sprintData = sprintCapacities.find(s => s.sprintNumber === sprintNumber);
    if (!sprintData) return { capacity: {}, allocated: {}, available: {}, utilization: {} };
    
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
      BA: (allocated.BA / capacity.BA) * 100,
      Config: (allocated.Config / capacity.Config) * 100,
      QA: (allocated.QA / capacity.QA) * 100
    };
    
    return {
      capacity,
      allocated,
      available,
      utilization
    };
  };
  
  // Get total remaining capacity from baseline sprint to end (in user stories)
  const getRemainingCapacity = () => {
    let totalAvailable = { BA: 0, Config: 0, QA: 0 };
    
    // Calculate from baseline sprint to end
    for (let sprint = projectParams.baselineSprint; sprint <= projectParams.totalSprints; sprint++) {
      const capacity = getSprintCapacity(sprint);
      totalAvailable.BA += capacity.available.BA;
      totalAvailable.Config += capacity.available.Config;
      totalAvailable.QA += capacity.available.QA;
    }
    
    return totalAvailable;
  };

  // Calculate impact
  const calculateImpact = () => {
    // Get baseline sprint details
    const baselineSprint = projectParams.baselineSprint;
    const baselineCapacity = getSprintCapacity(baselineSprint);
    const remainingCapacity = getRemainingCapacity();
    
    // Hours per story for each team
    const hoursPerStory = {
	  BA: 19, // Updated from 8 to 19 hours per story
	  Config: 31, // Updated from 6 to 31 hours per story
	  QA: 24  // Updated from 4 to 24 hours per story
	};
    
    // Get total hours needed per team for all CRs
    const totalBAHours = crInputs.reduce((sum, cr) => sum + Number(cr.BAHours), 0);
    const totalConfigHours = crInputs.reduce((sum, cr) => sum + Number(cr.ConfigHours), 0);
    const totalQAHours = crInputs.reduce((sum, cr) => sum + Number(cr.QAHours), 0);
    
    // Convert hours to stories
    const totalBAStories = totalBAHours / hoursPerStory.BA;
    const totalConfigStories = totalConfigHours / hoursPerStory.Config;
    const totalQAStories = totalQAHours / hoursPerStory.QA;
    
    // Get baseline sprint resources
    const baselineSprData = sprintCapacities.find(s => s.sprintNumber === baselineSprint) || 
      { resources: teamResources };
    
    // Calculate capacity impact in stories per resource
    const baCapacityImpact = totalBAStories / baselineSprData.resources.BA;
    const configCapacityImpact = totalConfigStories / baselineSprData.resources.Config;
    const qaCapacityImpact = totalQAStories / baselineSprData.resources.QA;

    // Impact on baseline sprint's available capacity
    const baselineSprintImpact = {
      BA: baselineCapacity.available.BA > 0 ? (totalBAStories / baselineCapacity.available.BA) * 100 : 100 + (totalBAStories / (baselineSprData.capacity.BA || 0.001)) * 100,
      Config: baselineCapacity.available.Config > 0 ? (totalConfigStories / baselineCapacity.available.Config) * 100 : 100 + (totalConfigStories / (baselineSprData.capacity.Config || 0.001)) * 100,
      QA: baselineCapacity.available.QA > 0 ? (totalQAStories / baselineCapacity.available.QA) * 100 : 100 + (totalQAStories / (baselineSprData.capacity.QA || 0.001)) * 100
    };

    // Impact on total remaining project capacity
    const totalProjectImpact = {
      BA: remainingCapacity.BA > 0 ? (totalBAStories / remainingCapacity.BA) * 100 : 100 + (totalBAStories / (baselineSprData.capacity.BA || 0.001)) * 100,
      Config: remainingCapacity.Config > 0 ? (totalConfigStories / remainingCapacity.Config) * 100 : 100 + (totalConfigStories / (baselineSprData.capacity.Config || 0.001)) * 100,
      QA: remainingCapacity.QA > 0 ? (totalQAStories / remainingCapacity.QA) * 100 : 100 + (totalQAStories / (baselineSprData.capacity.QA || 0.001)) * 100
    };

    // Calculate additional sprints needed based on stories exceeding capacity
    // If a team has no available capacity, we need to calculate how many sprints of work this represents
    const additionalSprintsNeeded = {
      BA: baselineCapacity.available.BA <= 0 ? totalBAStories / baselineSprData.capacity.BA : 0,
      Config: baselineCapacity.available.Config <= 0 ? totalConfigStories / baselineSprData.capacity.Config : 0,
      QA: baselineCapacity.available.QA <= 0 ? totalQAStories / baselineSprData.capacity.QA : 0
    };

    // Determine critical path (team with highest impact)
    const maxAdditionalSprints = Math.max(additionalSprintsNeeded.BA, additionalSprintsNeeded.Config, additionalSprintsNeeded.QA);
    let criticalPath;
    if (maxAdditionalSprints === additionalSprintsNeeded.BA) criticalPath = "Business Analysts";
    else if (maxAdditionalSprints === additionalSprintsNeeded.Config) criticalPath = "Configurators";
    else criticalPath = "QA Team";

    // Calculate additional days based on sprint duration
    const additionalDays = maxAdditionalSprints * projectParams.sprintDurationDays;
    
    // Calculate new deadline based on the original deadline
    // Create a new date object with noon time to avoid timezone issues
    const newDeadline = new Date(projectParams.deadline.getTime());
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

    // Set results
    setResults({
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
    });
  };

  // Add a new CR input row
  const addCR = () => {
    const newId = crInputs.length > 0 ? Math.max(...crInputs.map(cr => cr.id)) + 1 : 1;
    setCrInputs([...crInputs, { id: newId, name: `CR ${newId}`, BAHours: 0, ConfigHours: 0, QAHours: 0 }]);
  };

  // Remove a CR input row
  const removeCR = (id) => {
    setCrInputs(crInputs.filter(cr => cr.id !== id));
  };

  // Handle CR input changes
  const handleCRChange = (id, field, value) => {
    setCrInputs(crInputs.map(cr => 
      cr.id === id ? { ...cr, [field]: value } : cr
    ));
  };

  // Format date as MM/DD/YYYY
  const formatDate = (date) => {
    // Ensure we're working with a copy of the date to avoid mutation issues
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Prepare data for visualizations
  const prepareTeamImpactData = () => {
    return [
      { team: 'Business Analysts', sprintImpact: results.teamImpacts.BA.currentSprint, totalImpact: results.teamImpacts.BA.total },
      { team: 'Configurators', sprintImpact: results.teamImpacts.Config.currentSprint, totalImpact: results.teamImpacts.Config.total },
      { team: 'QA Team', sprintImpact: results.teamImpacts.QA.currentSprint, totalImpact: results.teamImpacts.QA.total }
    ];
  };

  const prepareEffortDistributionData = () => {
    const totalHours = results.storiesToCapacity.BA.hours + 
                      results.storiesToCapacity.Config.hours + 
                      results.storiesToCapacity.QA.hours;
    
    if (totalHours === 0) return [];
    
    return [
      { name: 'Business Analysts', value: results.storiesToCapacity.BA.hours, percentage: (results.storiesToCapacity.BA.hours / totalHours * 100).toFixed(1) },
      { name: 'Configurators', value: results.storiesToCapacity.Config.hours, percentage: (results.storiesToCapacity.Config.hours / totalHours * 100).toFixed(1) },
      { name: 'QA Team', value: results.storiesToCapacity.QA.hours, percentage: (results.storiesToCapacity.QA.hours / totalHours * 100).toFixed(1) }
    ];
  };

  const prepareSprintCapacityData = () => {
    // Prepare data for all sprints starting from baseline
    return sprintCapacities
      .filter(sprint => sprint.sprintNumber >= projectParams.baselineSprint)
      .map(sprint => {
        const capacity = getSprintCapacity(sprint.sprintNumber);
        return {
          sprint: `Sprint ${sprint.sprintNumber}`,
          sprintNumber: sprint.sprintNumber,
          BACapacity: capacity.capacity.BA,
          BAAllocated: capacity.allocated.BA,
          BAAvailable: capacity.available.BA,
          ConfigCapacity: capacity.capacity.Config,
          ConfigAllocated: capacity.allocated.Config, 
          ConfigAvailable: capacity.available.Config,
          QACapacity: capacity.capacity.QA,
          QAAllocated: capacity.allocated.QA,
          QAAvailable: capacity.available.QA,
          BAUtilization: capacity.utilization.BA,
          ConfigUtilization: capacity.utilization.Config,
          QAUtilization: capacity.utilization.QA
        };
      });
  };

  const prepareProjectTimelineData = () => {
    // Calculate timeline with and without CR impact
    const originalEndSprint = projectParams.totalSprints;
    const extendedEndSprint = originalEndSprint + results.additionalSprints;
    
    return [
      { name: 'Original Timeline', start: 1, end: originalEndSprint, current: projectParams.currentSprint, baseline: projectParams.baselineSprint },
      { name: 'Extended Timeline', start: 1, end: extendedEndSprint, current: projectParams.currentSprint, baseline: projectParams.baselineSprint }
    ];
  };
  
  // Custom tooltip for capacity charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Color scheme for visualizations
  const COLORS = {
    BA: '#0088FE',
    Config: '#00C49F', 
    QA: '#FFBB28',
    available: '#82ca9d',
    allocated: '#8884d8',
    capacity: '#ffc658',
    overCapacity: '#ff8042',
    timeline: '#8884d8',
    extension: '#ff8042',
    baseline: '#82ca9d'
  };

  // Render team capacity visualization
  const renderTeamCapacityVis = () => {
    const data = prepareSprintCapacityData();
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Team Capacity Across Sprints</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-2 bg-white rounded shadow">
            <h4 className="text-sm font-medium mb-2">Business Analysts - Capacity vs. Allocation</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'User Stories', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="BACapacity" name="Capacity" fill={COLORS.capacity} />
                <Bar dataKey="BAAllocated" name="Allocated" fill={COLORS.allocated} />
                <ReferenceLine y={0} stroke="#000" />
                {results.storiesToCapacity.BA.stories > 0 && (
                  <ReferenceLine 
                    y={results.storiesToCapacity.BA.stories} 
                    stroke="red" 
                    strokeDasharray="3 3" 
                    label={{ value: 'CR Impact', position: 'top', fill: 'red', fontSize: 12 }} 
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="p-2 bg-white rounded shadow">
            <h4 className="text-sm font-medium mb-2">Configurators - Capacity vs. Allocation</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'User Stories', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ConfigCapacity" name="Capacity" fill={COLORS.capacity} />
                <Bar dataKey="ConfigAllocated" name="Allocated" fill={COLORS.allocated} />
                <ReferenceLine y={0} stroke="#000" />
                {results.storiesToCapacity.Config.stories > 0 && (
                  <ReferenceLine 
                    y={results.storiesToCapacity.Config.stories} 
                    stroke="red" 
                    strokeDasharray="3 3" 
                    label={{ value: 'CR Impact', position: 'top', fill: 'red', fontSize: 12 }} 
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="p-2 bg-white rounded shadow">
            <h4 className="text-sm font-medium mb-2">QA Team - Capacity vs. Allocation</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'User Stories', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="QACapacity" name="Capacity" fill={COLORS.capacity} />
                <Bar dataKey="QAAllocated" name="Allocated" fill={COLORS.allocated} />
                <ReferenceLine y={0} stroke="#000" />
                {results.storiesToCapacity.QA.stories > 0 && (
                  <ReferenceLine 
                    y={results.storiesToCapacity.QA.stories} 
                    stroke="red" 
                    strokeDasharray="3 3" 
                    label={{ value: 'CR Impact', position: 'top', fill: 'red', fontSize: 12 }} 
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Render team impact visualization
  const renderTeamImpactVis = () => {
    const data = prepareTeamImpactData();
    
    // Custom label for bars
    const renderCustomBarLabel = ({ x, y, width, height, value }) => {
      return (
        <text 
          x={x + width / 2} 
          y={y + height / 2} 
          fill="#fff" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontSize={12}
        >
          {value.toFixed(1)}%
        </text>
      );
    };
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Team Impact Analysis</h3>
        <div className="p-2 bg-white rounded shadow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="team" tick={{ fontSize: 12 }} width={120} />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="sprintImpact" 
                name="Baseline Sprint Impact %" 
                fill={COLORS.BA}
                label={renderCustomBarLabel}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`sprint-cell-${index}`} 
                    fill={entry.sprintImpact > 100 ? '#ff0000' : COLORS.BA} 
                  />
                ))}
              </Bar>
              <Bar 
                dataKey="totalImpact" 
                name="Total Project Impact %" 
                fill={COLORS.Config}
                label={renderCustomBarLabel}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`total-cell-${index}`} 
                    fill={entry.totalImpact > 100 ? '#ff6b6b' : COLORS.Config} 
                  />
                ))}
              </Bar>
              <ReferenceLine x={100} stroke="red" strokeDasharray="3 3" label={{ value: 'Capacity Limit', position: 'top', fill: 'red' }} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-600">
            <p>* Values over 100% indicate required capacity exceeds available capacity</p>
            <p>* Baseline Sprint Impact: Impact on capacity in the baseline sprint</p>
            <p>* Total Project Impact: Impact on remaining project capacity</p>
          </div>
        </div>
      </div>
    );
  };

  // Render CR effort distribution visualization
  const renderEffortDistributionVis = () => {
    const data = prepareEffortDistributionData();
    
    // If no CR effort, show placeholder
    if (data.length === 0 || data.every(item => item.value === 0)) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">CR Effort Distribution</h3>
          <div className="p-6 bg-white rounded shadow text-center text-gray-500">
            Add CR effort in hours to see distribution
          </div>
        </div>
      );
    }
    
    // Custom label for pie chart sections
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
      const RADIAN = Math.PI / 180;
      const radius = outerRadius * 1.1;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
      return (
        <text 
          x={x} 
          y={y} 
          fill="#000" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize={12}
        >
          {name}: {(percent * 100).toFixed(1)}% ({value} hrs)
        </text>
      );
    };
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">CR Effort Distribution</h3>
        <div className="p-2 bg-white rounded shadow">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={renderCustomizedLabel}
                labelLine={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} hours`, 'Effort']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="text-sm">
                <div className="flex items-center justify-center">
                  <div 
                    className="w-3 h-3 mr-1" 
                    style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }} 
                  />
                  <span>{entry.name}</span>
                </div>
                <div>{entry.value} hours ({entry.percentage}%)</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render timeline impact visualization
  const renderTimelineVis = () => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Project Timeline Impact</h3>
        <div className="p-2 bg-white rounded shadow">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Original Deadline: {formatDate(projectParams.deadline)}</div>
            <div className="text-sm font-medium">New Deadline: {formatDate(results.newDeadline)}</div>
          </div>
          
          <div className="relative h-24 bg-gray-100 rounded mb-4">
            {/* Base timeline bar */}
            <div className="absolute top-4 left-0 right-0 h-8 flex">
              <div 
                className="bg-gray-300 h-full rounded-l" 
                style={{ width: `${(projectParams.baselineSprint - 1) / projectParams.totalSprints * 100}%` }}
              />
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${1 / projectParams.totalSprints * 100}%` }}
              >
                <div className="text-xs text-white text-center leading-8">
                  Current
                </div>
              </div>
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${(projectParams.totalSprints - projectParams.baselineSprint) / projectParams.totalSprints * 100}%` }}
              >
                <div className="text-xs text-white text-center leading-8">
                  Remaining
                </div>
              </div>
            </div>
            
            {/* Timeline extension */}
            {results.additionalSprints > 0 && (
              <div className="absolute top-4 right-0 h-8 flex">
                <div 
                  className="bg-red-500 h-full rounded-r" 
                  style={{ 
                    width: `${results.additionalSprints / projectParams.totalSprints * 100}%`,
                    marginLeft: `${100}%` 
                  }}
                >
                  <div className="text-xs text-white text-center leading-8">
                    Extension
                  </div>
                </div>
              </div>
            )}
            
            {/* Timeline markers */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs">
              <div>Sprint 1</div>
              <div>Sprint {projectParams.baselineSprint} (Baseline)</div>
              <div>Sprint {projectParams.totalSprints}</div>
              {results.additionalSprints > 0 && (
                <div>Sprint {projectParams.totalSprints + Math.ceil(results.additionalSprints)}</div>
              )}
            </div>
          </div>
          
          <div className="mt-3 p-2 border border-gray-200 bg-gray-50 rounded">
            <div className="font-medium">Impact Summary:</div>
            <div className="text-sm">
              <div>Additional Sprints: {results.additionalSprints.toFixed(2)}</div>
              <div>Additional Working Days: {results.additionalDays.toFixed(1)}</div>
              <div>Critical Path Team: {results.criticalPath}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Risk Assessment Panel Component
  const RiskAssessmentPanel = ({ riskAssessment }) => {
    if (!riskAssessment) return <div>Loading risk assessment...</div>;
    
    const { overallRiskScore, riskLevel, riskComponents, mitigationSuggestions } = riskAssessment;
    
    // Get color for the risk level
    const getRiskColor = (level) => riskLevels[level]?.color || '#757575';
    
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">CR Risk Assessment</h3>
        
        {/* Overall Risk Score */}
        <div className="mb-6 text-center">
          <div className="inline-block w-32 h-32 rounded-full border-8" 
               style={{ borderColor: getRiskColor(riskLevel) }}>
            <div className="flex items-center justify-center h-full">
              <div>
                <div className="text-3xl font-bold">{Math.round(overallRiskScore.score * 100)}</div>
                <div className="text-sm font-medium" style={{ color: getRiskColor(riskLevel) }}>
                  {riskLevel} Risk
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Primary Risk Driver: {overallRiskScore.primaryRiskDriver?.replace('Risk', '')}
          </div>
        </div>
        
        {/* Risk Component Breakdown */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-2">Risk Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(riskComponents).map(([component, details]) => (
              <div key={component} className="flex items-center">
                <div className="w-32 text-sm">
                  {component.replace('Risk', '')}:
                </div>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${details.score * 100}%`, 
                      backgroundColor: getRiskColor(details.level) 
                    }}
                  ></div>
                </div>
                <div className="w-24 text-right text-sm">
                  {details.level} ({Math.round(details.score * 100)})
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Risk Mitigation Suggestions */}
        {mitigationSuggestions && mitigationSuggestions.length > 0 && (
          <div>
            <h4 className="text-lg font-medium mb-2">Mitigation Suggestions</h4>
            <div className="space-y-3">
              {mitigationSuggestions.map((suggestion, index) => (
                <div key={index} className="p-2 border-l-4 bg-gray-50" 
                     style={{ borderColor: getRiskColor(suggestion.risk) }}>
                  <div className="flex items-start">
                    <span className="w-20 text-xs font-medium px-2 py-1 rounded mr-2"
                          style={{ 
                            backgroundColor: getRiskColor(suggestion.risk),
                            color: '#fff'
                          }}>
                      {suggestion.category}
                    </span>
                    <span className="flex-1 text-sm">{suggestion.suggestion}</span>
                    <span className="text-xs font-medium px-2 py-1 rounded ml-2 bg-gray-200">
                      {suggestion.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Risk Trend Chart Component
  const RiskTrendChart = ({ riskHistory }) => {
    if (!riskHistory || riskHistory.length < 2) return null;
    
    const data = riskHistory.map((record, index) => ({
      index,
      timestamp: new Date(record.timestamp).toLocaleTimeString(),
      overallRisk: record.overallScore * 100,
      capacity: record.componentScores.capacity * 100,
      estimation: record.componentScores.estimation * 100,
      complexity: record.componentScores.complexity * 100,
      dependency: record.componentScores.dependency * 100,
      resource: record.componentScores.resource * 100
    }));
    
    return (
      <div className="p-2 bg-white rounded shadow mt-6">
        <h4 className="text-sm font-medium mb-2">Risk Score Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
            <YAxis label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="overallRisk" name="Overall Risk" stroke="#8884d8" />
            <Line type="monotone" dataKey="capacity" name="Capacity Risk" stroke="#0088FE" />
            <Line type="monotone" dataKey="complexity" name="Complexity Risk" stroke="#00C49F" />
            <ReferenceLine y={75} stroke="red" strokeDasharray="3 3" label={{ value: 'High Risk', position: 'right', fill: 'red' }} />
            <ReferenceLine y={50} stroke="orange" strokeDasharray="3 3" label={{ value: 'Medium Risk', position: 'right', fill: 'orange' }} />
            <ReferenceLine y={25} stroke="green" strokeDasharray="3 3" label={{ value: 'Low Risk', position: 'right', fill: 'green' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render risk assessment visualization
  const renderRiskAssessmentVis = () => {
    return (
      <div className="mb-6">
        {riskAssessment ? (
          <>
            <RiskAssessmentPanel riskAssessment={riskAssessment} />
            
            {riskHistory.length > 1 && (
              <RiskTrendChart riskHistory={riskHistory} />
            )}
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Add CR efforts to see risk assessment
          </div>
        )}
      </div>
    );
  };

  // Save Modal Component
  const SaveConfigModal = () => {
    const [configName, setConfigName] = useState(currentConfigName);
    
    const handleSave = () => {
      if (saveCurrentConfiguration(configName)) {
        setShowSaveModal(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Save Configuration</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Load Modal Component
  const LoadConfigModal = () => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString();
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
          <h3 className="text-xl font-bold mb-4">Load Configuration</h3>
          
          {savedConfigs.length === 0 ? (
            <p className="text-gray-500 my-4">No saved configurations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b">Name</th>
                    <th className="px-4 py-2 border-b">Created</th>
                    <th className="px-4 py-2 border-b">Last Modified</th>
                    <th className="px-4 py-2 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedConfigs.map(config => (
                    <tr key={config.id} className={config.id === currentConfigId ? "bg-blue-50" : ""}>
                      <td className="px-4 py-2 border-b font-medium">{config.name}</td>
                      <td className="px-4 py-2 border-b">{formatDate(config.createdAt)}</td>
                      <td className="px-4 py-2 border-b">{formatDate(config.lastModified)}</td>
                      <td className="px-4 py-2 border-b">
                        <div className="flex space-x-2">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            onClick={() => {
                              loadConfiguration(config.id);
                              setShowLoadModal(false);
                            }}
                          >
                            Load
                          </button>
                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${config.name}"?`)) {
                                deleteConfiguration(config.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              onClick={() => setShowLoadModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow">
      {/* Modals */}
      {showSaveModal && <SaveConfigModal />}
      {showLoadModal && <LoadConfigModal />}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Change Request Impact Assessment Tool</h1>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">
              {currentConfigId ? currentConfigName + (hasUnsavedChanges ? " *" : "") : "Untitled Configuration *"}
            </span>
          </div>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            onClick={() => setShowSaveModal(true)}
          >
            Save
          </button>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            onClick={() => setShowLoadModal(true)}
          >
            Load
          </button>
          <button
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            onClick={createNewConfiguration}
          >
            New
          </button>
        </div>
      </div>
      
      {/* Project Parameters */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Project Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Sprints</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={projectParams.totalSprints}
              onChange={(e) => {
                const newTotal = Number(e.target.value);
                setProjectParams({...projectParams, totalSprints: newTotal});
                
                // Add new sprints if needed
                if (newTotal > sprintCapacities.length) {
                  const newSprintCapacities = [...sprintCapacities];
                  for (let i = sprintCapacities.length + 1; i <= newTotal; i++) {
                    newSprintCapacities.push({
                      sprintNumber: i,
                      resources: { ...teamResources },
                      capacity: {
                        BA: teamResources.BA * resourceCapacity.BA,
                        Config: teamResources.Config * resourceCapacity.Config,
                        QA: teamResources.QA * resourceCapacity.QA
                      },
                      allocated: {
                        BA: Math.round(teamResources.BA * resourceCapacity.BA * 0.9),
                        Config: Math.round(teamResources.Config * resourceCapacity.Config * 0.8),
                        QA: Math.round(teamResources.QA * resourceCapacity.QA * 0.8)
                      },
                      isEditable: false
                    });
                  }
                  setSprintCapacities(newSprintCapacities);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Sprint</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={projectParams.currentSprint}
              onChange={(e) => setProjectParams({...projectParams, currentSprint: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baseline Sprint</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={projectParams.baselineSprint}
              onChange={(e) => setProjectParams({...projectParams, baselineSprint: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Duration (days)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={projectParams.sprintDurationDays}
              onChange={(e) => setProjectParams({...projectParams, sprintDurationDays: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={projectParams.deadline.toISOString().split('T')[0]}
              onChange={(e) => setProjectParams({...projectParams, deadline: new Date(e.target.value + 'T12:00:00')})}
            />
          </div>
        </div>
      </div>
      
      {/* Default Team Resources */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Default Team Resources & Capacity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Analysts (# People)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={teamResources.BA}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setTeamResources({...teamResources, BA: newValue});
                
                // Update all non-edited sprints with this value
                setSprintCapacities(sprintCapacities.map(sprint => {
                  if (sprint.isEditable) return sprint;
                  
                  // Calculate new capacity based on resource change
                  const newCapacity = newValue * resourceCapacity.BA;
                  return {
                    ...sprint,
                    resources: { ...sprint.resources, BA: newValue },
                    capacity: { ...sprint.capacity, BA: newCapacity }
                  };
                }));
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Configurators (# People)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={teamResources.Config}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setTeamResources({...teamResources, Config: newValue});
                
                // Update all non-edited sprints with this value
                setSprintCapacities(sprintCapacities.map(sprint => {
                  if (sprint.isEditable) return sprint;
                  
                  // Calculate new capacity based on resource change
                  const newCapacity = newValue * resourceCapacity.Config;
                  return {
                    ...sprint,
                    resources: { ...sprint.resources, Config: newValue },
                    capacity: { ...sprint.capacity, Config: newCapacity }
                  };
                }));
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QA Team (# People)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={teamResources.QA}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setTeamResources({...teamResources, QA: newValue});
                
                // Update all non-edited sprints with this value
                setSprintCapacities(sprintCapacities.map(sprint => {
                  if (sprint.isEditable) return sprint;
                  
                  // Calculate new capacity based on resource change
                  const newCapacity = newValue * resourceCapacity.QA;
                  return {
                    ...sprint,
                    resources: { ...sprint.resources, QA: newValue },
                    capacity: { ...sprint.capacity, QA: newCapacity }
                  };
                }));
              }}
            />
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BA Capacity (Stories per Person)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={resourceCapacity.BA}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setResourceCapacity({...resourceCapacity, BA: newValue});
                
                // Update all non-edited sprints with this value
                setSprintCapacities(sprintCapacities.map(sprint => {
                  if (sprint.isEditable) return sprint;
                  
                  // Calculate new capacity based on per-person capacity change
                  const newCapacity = sprint.resources.BA * newValue;
                  return {
                    ...sprint,
                    capacity: { ...sprint.capacity, BA: newCapacity }
                  };
                }));
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Config Capacity (Stories per Person)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={resourceCapacity.Config}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setResourceCapacity({...resourceCapacity, Config: newValue});
                
                // Update all non-edited sprints with this value
                setSprintCapacities(sprintCapacities.map(sprint => {
                  if (sprint.isEditable) return sprint;
                  
                  // Calculate new capacity based on per-person capacity change
                  const newCapacity = sprint.resources.Config * newValue;
                  return {
                    ...sprint,
                    capacity: { ...sprint.capacity, Config: newCapacity }
                  };
                }));
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QA Capacity (Stories per Person)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={resourceCapacity.QA}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setResourceCapacity({...resourceCapacity, QA: newValue});
                
                // Update all non-edited sprints with this value
                setSprintCapacities(sprintCapacities.map(sprint => {
                  if (sprint.isEditable) return sprint;
                  
                  // Calculate new capacity based on per-person capacity change
                  const newCapacity = sprint.resources.QA * newValue;
                  return {
                    ...sprint,
                    capacity: { ...sprint.capacity, QA: newCapacity }
                  };
                }));
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Sprint Capacity Management */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Sprint-by-Sprint Capacity Management</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-2 py-2 border-b">Sprint</th>
                <th className="px-2 py-2 border-b" colSpan="4">BAs</th>
                <th className="px-2 py-2 border-b" colSpan="4">Configurators</th>
                <th className="px-2 py-2 border-b" colSpan="4">QA Team</th>
                <th className="px-2 py-2 border-b">Actions</th>
              </tr>
              <tr>
                <th className="px-2 py-1 border-b"></th>
                <th className="px-2 py-1 border-b text-xs">Resources</th>
                <th className="px-2 py-1 border-b text-xs">Capacity</th>
                <th className="px-2 py-1 border-b text-xs">Allocated</th>
                <th className="px-2 py-1 border-b text-xs bg-blue-50">Utilization</th>
                <th className="px-2 py-1 border-b text-xs">Resources</th>
                <th className="px-2 py-1 border-b text-xs">Capacity</th>
                <th className="px-2 py-1 border-b text-xs">Allocated</th>
                <th className="px-2 py-1 border-b text-xs bg-blue-50">Utilization</th>
                <th className="px-2 py-1 border-b text-xs">Resources</th>
                <th className="px-2 py-1 border-b text-xs">Capacity</th>
                <th className="px-2 py-1 border-b text-xs">Allocated</th>
                <th className="px-2 py-1 border-b text-xs bg-blue-50">Utilization</th>
                <th className="px-2 py-1 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {sprintCapacities.map(sprint => (
                <tr key={sprint.sprintNumber} className={sprint.sprintNumber === projectParams.baselineSprint ? "bg-blue-50" : ""}>
                  <td className="px-2 py-1 border-b font-medium">
                    {sprint.sprintNumber === projectParams.baselineSprint ? 
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Sprint {sprint.sprintNumber} (Baseline)
                      </span> : 
                      `Sprint ${sprint.sprintNumber}`
                    }
                  </td>
                  
                  {/* BA resources, capacity and allocation */}
                  <td className="px-2 py-1 border-b">
                    {sprint.isEditable ? (
                      <input
                        type="number"
                        className="w-12 p-1 border rounded"
                        value={sprint.resources.BA}
                        onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'BA', 'resources', Number(e.target.value))}
                      />
                    ) : sprint.resources.BA}
                  </td>
                  <td className="px-2 py-1 border-b">
                    {sprint.capacity.BA}
                  </td>
                  <td className="px-2 py-1 border-b">
                    {sprint.isEditable ? (
                      <input
                        type="number"
                        className="w-16 p-1 border rounded"
                        value={sprint.allocated.BA}
                        onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'BA', 'allocated', Number(e.target.value))}
                      />
                    ) : sprint.allocated.BA}
                  </td>
                  <td className={`px-2 py-1 border-b ${
                    (sprint.allocated.BA / sprint.capacity.BA) * 100 > 100 ? 'bg-red-100 text-red-800 font-semibold' : 'bg-blue-50'
                  }`}>
                    {((sprint.allocated.BA / sprint.capacity.BA) * 100).toFixed(1)}%
                  </td>
                  
                  {/* Configurator resources, capacity and allocation */}
                  <td className="px-2 py-1 border-b">
                    {sprint.isEditable ? (
                      <input
                        type="number"
                        className="w-12 p-1 border rounded"
                        value={sprint.resources.Config}
                        onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'Config', 'resources', Number(e.target.value))}
                      />
                    ) : sprint.resources.Config}
                  </td>
                  <td className="px-2 py-1 border-b">
                    {sprint.capacity.Config}
                  </td>
                  <td className="px-2 py-1 border-b">
                    {sprint.isEditable ? (
                      <input
                        type="number"
                        className="w-16 p-1 border rounded"
                        value={sprint.allocated.Config}
                        onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'Config', 'allocated', Number(e.target.value))}
                      />
                    ) : sprint.allocated.Config}
                  </td>
                  <td className={`px-2 py-1 border-b ${
                    (sprint.allocated.Config / sprint.capacity.Config) * 100 > 100 ? 'bg-red-100 text-red-800 font-semibold' : 'bg-blue-50'
                  }`}>
                    {((sprint.allocated.Config / sprint.capacity.Config) * 100).toFixed(1)}%
                  </td>
                  
                  {/* QA resources, capacity and allocation */}
                  <td className="px-2 py-1 border-b">
                    {sprint.isEditable ? (
                      <input
                        type="number"
                        className="w-12 p-1 border rounded"
                        value={sprint.resources.QA}
                        onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'QA', 'resources', Number(e.target.value))}
                      />
                    ) : sprint.resources.QA}
                  </td>
                  <td className="px-2 py-1 border-b">
                    {sprint.capacity.QA}
                  </td>
                  <td className="px-2 py-1 border-b">
                    {sprint.isEditable ? (
                      <input
                        type="number"
                        className="w-16 p-1 border rounded"
                        value={sprint.allocated.QA}
                        onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'QA', 'allocated', Number(e.target.value))}
                      />
                    ) : sprint.allocated.QA}
                  </td>
                  <td className={`px-2 py-1 border-b ${
                    (sprint.allocated.QA / sprint.capacity.QA) * 100 > 100 ? 'bg-red-100 text-red-800 font-semibold' : 'bg-blue-50'
                  }`}>
                    {((sprint.allocated.QA / sprint.capacity.QA) * 100).toFixed(1)}%
                  </td>
                  
                  {/* Actions */}
                  <td className="px-2 py-1 border-b">
                    <button
                      className={`px-2 py-1 text-xs rounded ${sprint.isEditable ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
                      onClick={() => toggleSprintEdit(sprint.sprintNumber)}
                    >
                      {sprint.isEditable ? 'Save' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Baseline Sprint (Sprint {projectParams.baselineSprint}) Capacity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-1">Business Analysts</h4>
                <div className="text-sm text-gray-700">
                  <div>Capacity: {results.capacityDetails?.capacity?.BA?.toFixed(1) || 0} user stories</div>
                  <div>Allocated: {results.capacityDetails?.allocated?.BA?.toFixed(1) || 0} user stories</div>
                  <div>Available: {results.capacityDetails?.available?.BA?.toFixed(1) || 0} user stories</div>
                  <div>Utilization: {results.capacityDetails?.utilization?.BA?.toFixed(1) || 0}%</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Configurators</h4>
                <div className="text-sm text-gray-700">
                  <div>Capacity: {results.capacityDetails?.capacity?.Config?.toFixed(1) || 0} user stories</div>
                  <div>Allocated: {results.capacityDetails?.allocated?.Config?.toFixed(1) || 0} user stories</div>
                  <div>Available: {results.capacityDetails?.available?.Config?.toFixed(1) || 0} user stories</div>
                  <div>Utilization: {results.capacityDetails?.utilization?.Config?.toFixed(1) || 0}%</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">QA Team</h4>
                <div className="text-sm text-gray-700">
                  <div>Capacity: {results.capacityDetails?.capacity?.QA?.toFixed(1) || 0} user stories</div>
                  <div>Allocated: {results.capacityDetails?.allocated?.QA?.toFixed(1) || 0} user stories</div>
                  <div>Available: {results.capacityDetails?.available?.QA?.toFixed(1) || 0} user stories</div>
                  <div>Utilization: {results.capacityDetails?.utilization?.QA?.toFixed(1) || 0}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Change Requests */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Change Requests</h2>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={addCR}
          >
            Add CR
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">CR Name</th>
                <th className="px-4 py-2 border-b">BA Hours</th>
                <th className="px-4 py-2 border-b">Config Hours</th>
                <th className="px-4 py-2 border-b">QA Hours</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {crInputs.map(cr => (
                <tr key={cr.id}>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={cr.name}
                      onChange={(e) => handleCRChange(cr.id, 'name', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      step="0.5"
                      className="w-full p-1 border rounded"
                      value={cr.BAHours}
                      onChange={(e) => handleCRChange(cr.id, 'BAHours', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      step="0.5"
                      className="w-full p-1 border rounded"
                      value={cr.ConfigHours}
                      onChange={(e) => handleCRChange(cr.id, 'ConfigHours', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      step="0.5"
                      className="w-full p-1 border rounded"
                      value={cr.QAHours}
                      onChange={(e) => handleCRChange(cr.id, 'QAHours', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => removeCR(cr.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Visualization Tabs */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Impact Visualizations</h2>
        
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveVisTab('capacity')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeVisTab === 'capacity'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Capacity
              </button>
              <button
                onClick={() => setActiveVisTab('impact')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeVisTab === 'impact'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Impact
              </button>
              <button
                onClick={() => setActiveVisTab('distribution')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeVisTab === 'distribution'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                CR Effort Distribution
              </button>
              <button
                onClick={() => setActiveVisTab('timeline')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeVisTab === 'timeline'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Timeline Impact
              </button>
              <button
                onClick={() => setActiveVisTab('risk')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeVisTab === 'risk'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Risk Assessment
              </button>
			  <button
				  onClick={() => setActiveVisTab('monteCarlo')}
				  className={`py-2 px-4 text-sm font-medium ${
					activeVisTab === 'monteCarlo'
					  ? 'border-b-2 border-blue-500 text-blue-600'
					  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
				  }`}
				>
				  Monte Carlo
				</button>
            </nav>
          </div>
        </div>
        
        {/* Active visualization content */}
        <div className="p-4 bg-white rounded shadow">
          {activeVisTab === 'capacity' && renderTeamCapacityVis()}
          {activeVisTab === 'impact' && renderTeamImpactVis()}
          {activeVisTab === 'distribution' && renderEffortDistributionVis()}
          {activeVisTab === 'timeline' && renderTimelineVis()}
          {activeVisTab === 'risk' && renderRiskAssessmentVis()}
		  
		  {activeVisTab === 'monteCarlo' && (
		  <div>
			<div className="flex justify-between items-center mb-4">
			  <h3 className="text-lg font-medium">Monte Carlo Timeline Simulation</h3>
			  <div className="flex items-center space-x-4">
				<div className="flex items-center">
				  <label className="text-sm mr-2">Iterations:</label>
				  <select 
					className="p-1 border rounded"
					value={simulationIterations}
					onChange={(e) => setSimulationIterations(Number(e.target.value))}
					disabled={isRunningSimulation}
				  >
					<option value={1000}>1,000</option>
					<option value={5000}>5,000</option>
					<option value={10000}>10,000</option>
				  </select>
				</div>
				<button
				  className={`px-4 py-2 ${isRunningSimulation ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded`}
				  onClick={runMonteCarlo}
				  disabled={isRunningSimulation}
				>
				  {isRunningSimulation ? 'Running Simulation...' : 'Run Monte Carlo Simulation'}
				</button>
			  </div>
			</div>
			
			{isRunningSimulation ? (
			  <div className="p-6 text-center">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
				<p>Running simulation with {simulationIterations.toLocaleString()} iterations...</p>
				<p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
			  </div>
			) : (
			  <MonteCarloVisualization monteCarloResults={monteCarloResults} projectParams={projectParams} />
			)}
		  </div>
		)}
		  
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Impact Assessment Results</h2>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Hours to Stories Conversion Table */}
          <div>
            <h3 className="text-lg font-medium mb-2">Hours to User Stories Conversion</h3>
            <div className="bg-white p-3 rounded shadow mb-6">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1">Team</th>
                    <th className="text-left px-2 py-1">Hours Required</th>
                    <th className="text-left px-2 py-1">Stories Equivalent</th>
                    <th className="text-left px-2 py-1">Per-Resource Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1">Business Analysts</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.BA?.hours?.toFixed(1) || 0}</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.BA?.stories?.toFixed(2) || 0}</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.BA?.capacityImpact?.toFixed(2) || 0} stories per person</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Configurators</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.Config?.hours?.toFixed(1) || 0}</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.Config?.stories?.toFixed(2) || 0}</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.Config?.capacityImpact?.toFixed(2) || 0} stories per person</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">QA Team</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.QA?.hours?.toFixed(1) || 0}</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.QA?.stories?.toFixed(2) || 0}</td>
                    <td className="px-2 py-1">{results.storiesToCapacity?.QA?.capacityImpact?.toFixed(2) || 0} stories per person</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 text-xs text-gray-500">
                <span>* Hours converted to stories using standard ratios (BA: 19hrs/story, Config: 31hrs/story, QA: 24hrs/story)</span>
              </div>
              <div className="text-xs text-gray-500">
                <span>* Per-Resource Impact shows the workload per person in the team</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Timeline Impact</h3>
              <div className="bg-white p-3 rounded shadow">
                <div className="mb-2">
                  <span className="font-medium">Additional Sprints Required:</span> {results.additionalSprints.toFixed(2)} sprints
                </div>
                <div className="mb-2">
                  <span className="font-medium">Additional Days Required:</span> {results.additionalDays.toFixed(1)} days
                </div>
                <div className="mb-2">
                  <span className="font-medium">Original Deadline:</span> {formatDate(projectParams.deadline)}
                </div>
                <div>
                  <span className="font-medium">New Projected Deadline:</span> {formatDate(results.newDeadline)}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Team Workload Impact</h3>
              <div className="bg-white p-3 rounded shadow">
                <div className="mb-3">
                  <span className="font-medium">Critical Path Team:</span> {results.criticalPath}
                </div>
                
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-2 py-1">Team</th>
                      <th className="text-left px-2 py-1">Baseline Sprint Impact</th>
                      <th className="text-left px-2 py-1">Total Project Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1">Business Analysts</td>
                      <td className={`px-2 py-1 ${results.teamImpacts.BA.currentSprint > 100 ? 'text-red-600 font-semibold' : ''}`}>
                        {results.teamImpacts.BA.currentSprint.toFixed(1)}%
                      </td>
                      <td className="px-2 py-1">{results.teamImpacts.BA.total.toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1">Configurators</td>
                      <td className={`px-2 py-1 ${results.teamImpacts.Config.currentSprint > 100 ? 'text-red-600 font-semibold' : ''}`}>
                        {results.teamImpacts.Config.currentSprint.toFixed(1)}%
                      </td>
                      <td className="px-2 py-1">{results.teamImpacts.Config.total.toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1">QA Team</td>
                      <td className={`px-2 py-1 ${results.teamImpacts.QA.currentSprint > 100 ? 'text-red-600 font-semibold' : ''}`}>
                        {results.teamImpacts.QA.currentSprint.toFixed(1)}%
                      </td>
                      <td className="px-2 py-1">{results.teamImpacts.QA.total.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-gray-500">
                  <span>* Values over 100% indicate required capacity exceeds available capacity</span>
                </div>
              </div>
            </div>
            
            {/* Risk Summary Section */}
            {riskAssessment && (
              <div>
                <h3 className="text-lg font-medium mb-2">Risk Summary</h3>
                <div className="bg-white p-3 rounded shadow">
                  <div className="flex items-center mb-2">
                    <span className="font-medium mr-2">Overall Risk:</span>
                    <span 
                      className="px-2 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: riskLevels[riskAssessment.riskLevel]?.color || '#757575' }}
                    >
                      {riskAssessment.riskLevel} ({Math.round(riskAssessment.overallRiskScore.score * 100)}%)
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <div className="mb-1">Primary Risk Driver: {riskAssessment.overallRiskScore.primaryRiskDriver}</div>
                    {riskAssessment.mitigationSuggestions && riskAssessment.mitigationSuggestions.length > 0 && (
                      <div>
                        <div className="font-medium mt-2 mb-1">Top Mitigation:</div>
                        <div className="italic">{riskAssessment.mitigationSuggestions[0].suggestion}</div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    className="w-full mt-3 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    onClick={() => {
                      setActiveVisTab('risk'); 
                      window.scrollTo({ top: document.querySelector('.mb-8.p-4.bg-blue-50').offsetTop, behavior: 'smooth' });
                    }}
                  >
                    View Full Risk Assessment
                  </button>
                </div>
              </div>
            )}
			
			{/* Monte Carlo Summary in Results Section */}
			{monteCarloResults && (
			  <div>
				<h3 className="text-lg font-medium mb-2">Probabilistic Timeline Forecast</h3>
				<div className="bg-white p-3 rounded shadow">
				  <div className="grid grid-cols-2 gap-2 mb-2">
					<div>
					  <div className="text-sm font-medium">Deadline (50% Confidence):</div>
					  <div className="text-lg">{formatDate(monteCarloResults.deadlinePercentiles.p50)}</div>
					</div>
					<div>
					  <div className="text-sm font-medium">Deadline (90% Confidence):</div>
					  <div className="text-lg">{formatDate(monteCarloResults.deadlinePercentiles.p90)}</div>
					</div>
				  </div>
				  
				  <div className="h-14 bg-gray-100 rounded mt-3 relative">
					<div 
					  className="absolute inset-y-0 left-0 bg-green-500 rounded-l" 
					  style={{ width: `${monteCarloResults.meetOriginalDeadlineProbability}%` }}
					>
					  <div className="h-full flex items-center justify-center text-white text-xs px-2">
						{monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}%
					  </div>
					</div>
					<div className="absolute inset-0 flex items-center justify-center text-sm">
					  Probability of Meeting Original Deadline
					</div>
				  </div>
				  
				  <div className="mt-2 text-xs text-gray-600">
					<p>* Based on {monteCarloResults.rawDeadlines.length.toLocaleString()} simulations</p>
					<p>* Most likely critical path: {Object.entries(monteCarloResults.criticalPathProbabilities).sort((a, b) => b[1] - a[1])[0][0]} ({Object.entries(monteCarloResults.criticalPathProbabilities).sort((a, b) => b[1] - a[1])[0][1].toFixed(1)}%)</p>
				  </div>
				  
				  <button 
					className="w-full mt-3 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
					onClick={() => {
					  setActiveVisTab('monteCarlo'); 
					  window.scrollTo({ 
						top: document.querySelector('.mb-8.p-4.bg-blue-50').offsetTop, 
						behavior: 'smooth' 
					  });
					}}
				  >
					View Full Monte Carlo Analysis
				  </button>
				</div>
			  </div>
			)}
			
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRAssessmentTool;
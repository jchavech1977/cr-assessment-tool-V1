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
const getRiskLevel = (score) => {
  if (score < riskLevels.Low.threshold) return 'Low';
  if (score < riskLevels.Medium.threshold) return 'Medium';
  if (score < riskLevels.High.threshold) return 'High';
  return 'Critical';
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
  riskFactors.largeSize = Math.min(1.0, largeCRs.length / crInputs.length);
  
  // Check for potentially missing details (e.g., any team with zero hours)
  const potentiallyIncompleteCRs = crInputs.filter(cr => 
    cr.BAHours === 0 || cr.ConfigHours === 0 || cr.QAHours === 0
  );
  riskFactors.missingDetails = Math.min(1.0, potentiallyIncompleteCRs.length / crInputs.length);
  
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
  
  riskFactors.unbalancedEffort = Math.min(1.0, unbalancedCRs.length / crInputs.length);
  
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
  const configToTotalRatio = crInputs.reduce((sum, cr) => sum + cr.ConfigHours, 0) / totalEffort;
  
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

// This would be more useful with dependency data in the CR inputs
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
    const dimensionKey = component.replace('Risk', 'Risk');
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
    primaryRiskDriver: primaryDriver.component
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

const RiskAssessmentPanel = ({ crInputs, projectParams, sprintCapacities, teamResources }) => {
  // Perform risk assessment
  const riskAssessment = assessCRRisk(crInputs, projectParams, sprintCapacities, teamResources);
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
      <div>
        <h4 className="text-lg font-medium mb-2">Mitigation Suggestions</h4>
        {mitigationSuggestions.length === 0 ? (
          <p className="text-sm text-gray-600">No critical risks identified that require mitigation.</p>
        ) : (
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
        )}
      </div>
      
      {/* Risk Details Button */}
      <div className="mt-4 text-center">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          View Detailed Risk Analysis
        </button>
      </div>
    </div>
  );
};

// Risk Details Modal Component (opened from the button above)
const RiskDetailsModal = ({ riskAssessment, onClose }) => {
  // Implementation details for the drill-down view...
};

// Risk history tracking
const [riskHistory, setRiskHistory] = useState([]);

// Update risk history when assessment changes
useEffect(() => {
  if (riskAssessment) {
    const timestamp = new Date();
    setRiskHistory(prev => [...prev, {
      timestamp,
      overallScore: riskAssessment.overallRiskScore.score,
      riskLevel: riskAssessment.riskLevel,
      componentScores: {
        capacity: riskAssessment.riskComponents.capacityRisk.score,
        estimation: riskAssessment.riskComponents.estimationRisk.score,
        complexity: riskAssessment.riskComponents.complexityRisk.score,
        dependency: riskAssessment.riskComponents.dependencyRisk.score,
        resource: riskAssessment.riskComponents.resourceRisk.score
      }
    }]);
  }
}, [riskAssessment]);

// Risk Trend Visualization Component
const RiskTrendChart = ({ riskHistory }) => {
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
    <div className="p-2 bg-white rounded shadow">
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



/**
 * Risk Assessment Constants
 * Defines constants used in risk assessment calculations
 */

// Risk dimensions and their weights
export const RISK_DIMENSIONS = {
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

// Risk level thresholds and descriptions
export const RISK_LEVELS = {
  Low: { 
    threshold: 0.25, 
    color: '#4CAF50', 
    description: "Minimal impact expected" 
  },
  Medium: { 
    threshold: 0.50, 
    color: '#FFC107', 
    description: "Moderate impact possible" 
  },
  High: { 
    threshold: 0.75, 
    color: '#FF9800', 
    description: "Significant impact likely" 
  },
  Critical: { 
    threshold: 1.00, 
    color: '#F44336', 
    description: "Major impact expected" 
  }
};

// Thresholds for complexity assessment based on total hours
export const COMPLEXITY_THRESHOLDS = {
  low: 100,     // Less than 100 hours total
  medium: 300,  // Between 100 and 300 hours
  high: 600     // Between 300 and 600 hours
  // Over 600 hours is considered very high complexity
};

// Ideal ratios between team hours for balanced effort estimation
export const IDEAL_TEAM_RATIOS = {
  BA_Config: 19/31, // BA to Config hours ratio (based on story conversion)
  BA_QA: 19/24,     // BA to QA hours ratio
  Config_QA: 31/24  // Config to QA hours ratio
};

// Minimum viable team sizes for resource risk assessment
export const MINIMUM_VIABLE_TEAM_SIZES = {
  BA: 7,
  Config: 15,
  QA: 13
};

// Weights for estimation risk factors
export const ESTIMATION_RISK_WEIGHTS = {
  largeSize: 0.4,       // Large CRs are harder to estimate
  missingDetails: 0.3,  // Missing details increase estimation risk
  unbalancedEffort: 0.3, // Unusual effort distribution suggests estimation issues
  newCrType: 0.0        // Not implemented without historical data
};
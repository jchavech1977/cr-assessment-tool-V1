/**
 * Conversion Constants
 * Defines standard conversion rates and constants used throughout the application
 */

// Hours per user story by team
export const HOURS_PER_STORY = {
  BA: 19,     // 19 hours per BA story
  Config: 31, // 31 hours per Config story
  QA: 24      // 24 hours per QA story
};

// Default team capacity percentages (stories per person)
export const DEFAULT_CAPACITY_PER_PERSON = {
  BA: 5,     // BA can handle 5 stories per sprint
  Config: 3, // Config can handle 3 stories per sprint
  QA: 4      // QA can handle 4 stories per sprint
};

// Default allocation percentages
export const DEFAULT_ALLOCATION_PERCENTAGES = {
  BA: 0.9,     // 90% of BA capacity is pre-allocated
  Config: 0.8, // 80% of Config capacity is pre-allocated
  QA: 0.8      // 80% of QA capacity is pre-allocated
};

// Default sprint duration in days
export const DEFAULT_SPRINT_DURATION = 20; // 20 working days

// Default estimation variance percentages for Monte Carlo
export const ESTIMATION_VARIANCE = {
  small: 0.2,  // 20% variance for small CRs (<=20 hours)
  medium: 0.3, // 30% variance for medium CRs (<=80 hours)
  large: 0.4   // 40% variance for large CRs (>80 hours)
};

// Ideal team composition percentages
export const IDEAL_TEAM_COMPOSITION = {
  BA: 0.22,    // 22% of team should be Business Analysts
  Config: 0.45, // 45% of team should be Configurators
  QA: 0.33     // 33% of team should be QA
};

// Default capacity utilization thresholds
export const CAPACITY_UTILIZATION_THRESHOLDS = {
  healthy: 0.75,    // Up to 75% utilization is healthy
  warning: 0.9,     // 75-90% utilization is a warning zone
  overAllocated: 1.0 // Over 100% is over-allocated
};
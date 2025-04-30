/**
 * Color Constants
 * Defines colors used in visualizations throughout the application
 */

// Main color palette for teams
export const TEAM_COLORS = {
  BA: '#0088FE',      // Blue for Business Analysts
  Config: '#00C49F',  // Teal for Configurators
  QA: '#FFBB28'       // Yellow/Orange for QA Team
};

// Extended team colors with human-readable names
export const TEAM_COLORS_NAMED = {
  'Business Analysts': '#0088FE',
  'Configurators': '#00C49F',
  'QA Team': '#FFBB28'
};

// Color palette for capacity visualization
export const CAPACITY_COLORS = {
  available: '#82ca9d',   // Light green for available capacity
  allocated: '#8884d8',   // Purple for allocated capacity
  capacity: '#ffc658',    // Yellow for total capacity
  overCapacity: '#ff8042', // Orange for over-allocation
};

// Timeline visualization colors
export const TIMELINE_COLORS = {
  timeline: '#8884d8',    // Purple for base timeline
  extension: '#ff8042',   // Orange for extension
  baseline: '#82ca9d',    // Green for baseline
  current: '#4299e1',     // Blue for current sprint
  pastSprints: '#CBD5E0',  // Gray for past sprints
  futureSprints: '#68D391' // Green for future sprints
};

// Impact visualization colors
export const IMPACT_COLORS = {
  sprintImpact: '#7371FC',  // Blue-ish for current sprint impact
  totalImpact: '#14B8A6',   // Teal for total project impact
  overCapacity: '#FF0000'   // Red for over-capacity indicators
};

// Risk level colors (matching riskConstants.js)
export const RISK_COLORS = {
  Low: '#4CAF50',      // Green for low risk
  Medium: '#FFC107',   // Yellow for medium risk
  High: '#FF9800',     // Orange for high risk
  Critical: '#F44336'  // Red for critical risk
};

// Monte Carlo visualization colors
export const MONTE_CARLO_COLORS = {
  p10: '#B7F4B7',      // Light green for p10 (optimistic)
  p50: '#59A96A',      // Medium green for p50 (median)
  p90: '#386641',      // Dark green for p90 (conservative)
  originalDeadline: '#FF6B6B', // Red for original deadline
  distribution: '#4361EE'  // Blue for distribution
};

// Chart series colors for consistent multi-series charts
export const CHART_SERIES_COLORS = [
  '#8884d8', // Purple
  '#82ca9d', // Green
  '#ffc658', // Yellow
  '#ff8042', // Orange
  '#0088FE', // Blue
  '#00C49F', // Teal
  '#FFBB28', // Amber
  '#FF8042', // Light orange
  '#A569BD', // Purple
  '#45B39D'  // Teal
];
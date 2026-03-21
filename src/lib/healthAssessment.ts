/**
 * Health Assessment Questionnaire
 * Comprehensive questions to understand user's health status and needs
 */

export interface HealthAssessment {
  // Lifestyle
  smoking: "never" | "former" | "current";
  alcohol: "never" | "occasional" | "regular";
  exerciseFrequency: "never" | "1-2_per_week" | "3-4_per_week" | "5+_per_week";
  diet: "poor" | "average" | "good" | "excellent";

  // Health Status
  chronicallyIll: boolean;
  chronicConditions: string[]; // Diabetes, hypertension, etc.
  recentHospitalization: boolean;
  hospitalReason: string;
  ongoingMedication: boolean;
  medicationDuration: string;

  // Family History
  familyHistoryDisease: boolean;
  familyDiseases: string[]; // Cancer, heart disease, diabetes, etc.

  // Stress & Mental Health
  stressLevel: "low" | "moderate" | "high" | "very_high"; // 1-4
  mentalHealthConcerns: boolean;
  mentalHealthDetails: string;

  // Allergies & Other
  knownAllergies: string[];
  previousSurgeries: boolean;
  surgeryDetails: string;

  // Insurance Priorities
  priorityCoverage: string[]; // What matters most to them
  estimatedAnnualHealthExpense: string;
  hasExistingInsurance: boolean;

  // Risk Assessment
  travelFrequency: "rarely" | "monthly" | "quarterly" | "frequently";
  occupationalHazards: boolean;
  hazardDetails: string;
}

export const CHRONIC_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Thyroid Disorder",
  "Kidney Disease",
  "Liver Disease",
  "Cancer (History)",
  "COPD",
  "Arthritis",
  "Migraine",
  "Other",
];

export const FAMILY_DISEASE_OPTIONS = [
  "Cancer",
  "Heart Disease",
  "Diabetes",
  "Stroke",
  "High Blood Pressure",
  "Mental Illness",
  "Kidney Disease",
  "Asthma",
  "Obesity",
  "None Known",
];

export const PRIORITY_COVERAGE_OPTIONS = [
  "Comprehensive medical coverage",
  "Maternity & child care",
  "Mental health support",
  "Critical illness protection",
  "Accidental injury coverage",
  "Dental & vision",
  "Wellness programs",
  "Affordable premiums",
];

export const HEALTH_ASSESSMENT_QUESTIONS = [
  {
    id: "smoking",
    title: "Do you smoke?",
    type: "radio",
    options: [
      { value: "never", label: "Never smoked", desc: "Great for your health!" },
      { value: "former", label: "Former smoker", desc: "Quit more than 1 year ago" },
      { value: "current", label: "Currently smoking", desc: "How many cigarettes/day?" },
    ],
  },
  {
    id: "alcohol",
    title: "How often do you consume alcohol?",
    type: "radio",
    options: [
      { value: "never", label: "Never", desc: "" },
      { value: "occasional", label: "Occasionally", desc: "A few times per month" },
      { value: "regular", label: "Regularly", desc: "Weekly or more" },
    ],
  },
  {
    id: "exerciseFrequency",
    title: "How often do you exercise?",
    type: "radio",
    options: [
      { value: "never", label: "Never", desc: "Sedentary lifestyle" },
      { value: "1-2_per_week", label: "1-2 times per week", desc: "Some activity" },
      { value: "3-4_per_week", label: "3-4 times per week", desc: "Regular exercise" },
      { value: "5+_per_week", label: "5 or more times per week", desc: "Very active" },
    ],
  },
  {
    id: "diet",
    title: "How would you rate your diet?",
    type: "radio",
    options: [
      { value: "poor", label: "Poor", desc: "Mostly processed & junk food" },
      { value: "average", label: "Average", desc: "Mixed diet" },
      { value: "good", label: "Good", desc: "Mostly healthy" },
      { value: "excellent", label: "Excellent", desc: "Balanced & nutritious" },
    ],
  },
  {
    id: "chronicallyIll",
    title: "Do you have any chronic (long-term) health conditions?",
    type: "checkbox",
    label: "Yes, I have one or more chronic conditions",
  },
  {
    id: "chronicallyIllDetails",
    title: "Which conditions do you have? (Select all that apply)",
    type: "multi-checkbox",
    options: CHRONIC_CONDITIONS,
    conditional: "chronicallyIll",
  },
  {
    id: "recentHospitalization",
    title: "Have you been hospitalized in the last 2 years?",
    type: "checkbox",
    label: "Yes, I have been hospitalized",
  },
  {
    id: "stressLevel",
    title: "How would you rate your stress level?",
    type: "radio",
    options: [
      { value: "low", label: "Low 😊", desc: "Mostly calm & relaxed" },
      { value: "moderate", label: "Moderate 😐", desc: "Normal daily stress" },
      { value: "high", label: "High 😟", desc: "Frequently stressed" },
      { value: "very_high", label: "Very High 😰", desc: "Constant stress" },
    ],
  },
  {
    id: "familyHistoryDisease",
    title: "Do you have a family history of serious illnesses?",
    type: "checkbox",
    label: "Yes, there is family history of serious diseases",
  },
  {
    id: "familyDiseases",
    title: "Which diseases run in your family? (Select all that apply)",
    type: "multi-checkbox",
    options: FAMILY_DISEASE_OPTIONS,
    conditional: "familyHistoryDisease",
  },
  {
    id: "priorityCoverage",
    title: "What coverage matters most to you? (Select up to 3)",
    type: "multi-checkbox",
    options: PRIORITY_COVERAGE_OPTIONS,
    maxSelect: 3,
  },
  {
    id: "occupationalHazards",
    title: "Does your job have health risks?",
    type: "checkbox",
    label: "Yes, my job has occupational hazards",
  },
  {
    id: "travelFrequency",
    title: "How often do you travel?",
    type: "radio",
    options: [
      { value: "rarely", label: "Rarely", desc: "Few times a year or less" },
      { value: "monthly", label: "Monthly", desc: "Regular local travel" },
      { value: "quarterly", label: "Quarterly", desc: "Regular long trips" },
      { value: "frequently", label: "Frequently", desc: "Constant travel" },
    ],
  },
];

/**
 * Calculate health risk score based on assessment (0-100)
 * Higher score = higher risk
 */
export function calculateHealthRiskScore(assessment: Partial<HealthAssessment>): number {
  let score = 0;
  const maxScore = 100;

  // Smoking (25 points max for high risk)
  if (assessment.smoking === "current") score += 20;
  else if (assessment.smoking === "former") score += 5;

  // Alcohol (15 points)
  if (assessment.alcohol === "regular") score += 15;
  else if (assessment.alcohol === "occasional") score += 5;

  // Exercise (20 points)
  if (assessment.exerciseFrequency === "never") score += 20;
  else if (assessment.exerciseFrequency === "1-2_per_week") score += 10;
  else if (assessment.exerciseFrequency === "3-4_per_week") score += 5;

  // Diet (15 points)
  if (assessment.diet === "poor") score += 15;
  else if (assessment.diet === "average") score += 8;
  else if (assessment.diet === "good") score += 3;

  // Chronic conditions (10 points per condition, max 25)
  if (assessment.chronicConditions?.length) {
    score += Math.min(assessment.chronicConditions.length * 10, 25);
  }

  // Stress (15 points)
  if (assessment.stressLevel === "very_high") score += 15;
  else if (assessment.stressLevel === "high") score += 10;
  else if (assessment.stressLevel === "moderate") score += 5;

  // Family history (15 points)
  if (assessment.familyDiseases?.length) {
    score += Math.min(assessment.familyDiseases.length * 5, 15);
  }

  // Occupational hazards (10 points)
  if (assessment.occupationalHazards) score += 10;

  // Recent hospitalization (10 points)
  if (assessment.recentHospitalization) score += 10;

  // Travel frequency (5 points)
  if (assessment.travelFrequency === "frequently") score += 5;

  return Math.min(score, maxScore);
}

/**
 * Get health risk category
 */
export function getRiskCategory(score: number): {
  category: string;
  color: string;
  description: string;
  recommendations: string[];
} {
  if (score <= 20) {
    return {
      category: "Low Risk",
      color: "success",
      description: "You maintain a healthy lifestyle with minimal health risks.",
      recommendations: [
        "Continue your healthy habits",
        "Regular annual check-ups",
        "Start a basic health insurance plan",
      ],
    };
  } else if (score <= 40) {
    return {
      category: "Moderate Risk",
      color: "warning",
      description: "Some lifestyle factors may increase health risks. Consider improvements.",
      recommendations: [
        "Address lifestyle factors (exercise, diet, stress)",
        "Regular health check-ups every 6 months",
        "Comprehensive health insurance recommended",
        "Focus on preventive care",
      ],
    };
  } else if (score <= 65) {
    return {
      category: "High Risk",
      color: "destructive",
      description: "Multiple risk factors detected. Medical attention recommended.",
      recommendations: [
        "Consult with a healthcare provider",
        "Regular monitoring of key health metrics",
        "Premium comprehensive health insurance plan",
        "Wellness programs and preventive care",
        "Consider specialist consultations",
      ],
    };
  } else {
    return {
      category: "Very High Risk",
      color: "destructive",
      description: "Significant health concerns detected. Medical evaluation needed.",
      recommendations: [
        "Immediate consultation with healthcare provider",
        "Comprehensive health assessment",
        "High-coverage insurance plan with critical illness rider",
        "Regular medical monitoring and follow-ups",
        "Wellness program enrollment",
        "Consider emergency health fund",
      ],
    };
  }
}

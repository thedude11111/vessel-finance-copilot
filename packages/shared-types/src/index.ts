export interface User {
  id: string;
  email: string;
  name?: string;
  googleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VesselParameter {
  id: string;
  key: string;
  value: string;
  type: string;
  analysisId: string;
}

export interface AnalysisResult {
  id: string;
  calculatedAt: Date;
  cashFlowProjections: { year: number; cashFlow: number }[];
  profitabilityMetrics: { npv: number; irr: number; paybackPeriod: number };
  chartData: { name: string; value: number }[];
  analysisId: string;
}

export interface VesselAnalysis {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  parameters: VesselParameter[];
  results?: AnalysisResult;
}

export interface AuthState {
  token: string | null;
  user: { name: string; email: string; } | null;
}

export interface ExtractedParameter {
  key: string;
  value: string;
  type: string;
}

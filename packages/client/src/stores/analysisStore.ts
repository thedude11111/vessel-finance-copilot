import { create } from 'zustand';
import apiClient from '../api/axios';
import { VesselParameter, AnalysisResult } from 'shared-types';

interface AnalysisState {
  activeAnalysisId: string | null;
  parameters: VesselParameter[];
  results: AnalysisResult | null;
  chatHistory: { role: 'user' | 'model'; message: string }[];
  loading: boolean;
  error: string | null;
  
  setActiveAnalysisId: (id: string | null) => void;
  addParameter: (param: VesselParameter) => void;
  setResults: (results: AnalysisResult) => void;
  addChatMessage: (role: 'user' | 'model
', message: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  sendParameterMessage: (analysisId: string, message: string) => Promise<void>;
  sendResultsQuestion: (analysisId: string, question: string) => Promise<void>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  activeAnalysisId: null,
  parameters: [],
  results: null,
  chatHistory: [],
  loading: false,
  error: null,

  setActiveAnalysisId: (id) => set({ activeAnalysisId: id }),
  addParameter: (param) => set((state) => ({ parameters: [...state.parameters, param] })),
  setResults: (results) => set({ results }),
  addChatMessage: (role, message) =>
    set((state) => ({
      chatHistory: [...state.chatHistory, { role, message }],
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchAnalysis: async (analysisId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/analysis/${analysisId}`);
      const analysis: VesselAnalysis = response.data;
      set({ parameters: analysis.parameters, results: analysis.results || null });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch analysis.' });
    } finally {
      set({ loading: false });
    }
  },

  sendParameterMessage: async (analysisId, message) => {
    set({ loading: true, error: null });
    get().addChatMessage('user', message);
    try {
      const response = await apiClient.post(`/analysis/${analysisId}/chat-parameters`, { message });
      const newParameters: VesselParameter[] = response.data;
      set((state) => ({
        parameters: [...state.parameters, ...newParameters],
      }));
      get().addChatMessage('model', 'Parameters extracted and saved.');
    } catch (err: any) {
      set({ error: err.message || 'Failed to extract parameters.' });
      get().addChatMessage('model', `Error: ${err.message || 'Failed to extract parameters.'}`);
    } finally {
      set({ loading: false });
    }
  },

  sendResultsQuestion: async (analysisId, question) => {
    set({ loading: true, error: null });
    get().addChatMessage('user', question);
    try {
      const response = await apiClient.post(`/analysis/${analysisId}/chat-results`, { question });
      const answer: string = response.data.answer;
      get().addChatMessage('model', answer);
    } catch (err: any) {
      set({ error: err.message || 'Failed to analyze results.' });
      get().addChatMessage('model', `Error: ${err.message || 'Failed to analyze results.'}`);
    } finally {
      set({ loading: false });
    }
  },
}));

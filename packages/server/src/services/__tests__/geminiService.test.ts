import { extractParametersFromMessage, analyzeResults } from '../geminiService';

describe('geminiService', () => {
  // Mock the GoogleGenerativeAI and model for testing
  const mockGenerateContent = jest.fn();
  const mockResponseText = jest.fn();

  beforeAll(() => {
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn(() => ({
        getGenerativeModel: jest.fn(() => ({
          generateContent: mockGenerateContent,
        })),
      })),
    }));
  });

  beforeEach(() => {
    mockGenerateContent.mockClear();
    mockResponseText.mockClear();
  });

  describe('extractParametersFromMessage', () => {
    it('should extract parameters from a message', async () => {
      const mockGeminiResponse = '```json\n[{"key":"vesselPrice","value":"50000000","type":"currency"}]\n```';
      mockResponseText.mockReturnValue(mockGeminiResponse);
      mockGenerateContent.mockResolvedValue({ response: { text: mockResponseText } });

      const message = "The vessel price is $50 million.";
      const result = await extractParametersFromMessage(message);

      expect(result).toEqual([{
        key: "vesselPrice",
        value: "50000000",
        type: "currency"
      }]);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(message));
    });

    it('should throw an error if Gemini response is not valid JSON', async () => {
      const mockGeminiResponse = 'invalid json';
      mockResponseText.mockReturnValue(mockGeminiResponse);
      mockGenerateContent.mockResolvedValue({ response: { text: mockResponseText } });

      const message = "Some message.";
      await expect(extractParametersFromMessage(message)).rejects.toThrow("AI response was not valid JSON.");
    });
  });

  describe('analyzeResults', () => {
    it('should analyze results and return a natural language answer', async () => {
      const mockGeminiResponse = 'The IRR is 15%.';
      mockResponseText.mockReturnValue(mockGeminiResponse);
      mockGenerateContent.mockResolvedValue({ response: { text: mockResponseText } });

      const question = "What is the internal rate of return?";
      const analysisData = { npv: 100, irr: 0.15 };
      const result = await analyzeResults(question, analysisData);

      expect(result).toBe(mockGeminiResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(question));
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(analysisData, null, 2)));
    });
  });
});

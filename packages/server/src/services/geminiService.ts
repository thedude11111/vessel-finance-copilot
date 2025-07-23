// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedParameter } from 'shared-types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

/**
 * Extracts structured financial parameters from a user's chat message.
 * @param message - The user's natural language input.
 * @returns A promise that resolves to a structured JSON object of parameters.
 */
export async function extractParametersFromMessage(message: string): Promise<ExtractedParameter[]> {
    const prompt = `
        You are an expert financial analyst assistant for the shipping industry.
        Your task is to extract financial parameters from the user's text and return them as a clean JSON object.
        The user is defining variables for a vessel purchase financial model.
        Identify the parameter key (in camelCase), its value (as a raw number), and its type (e.g., "currency", "percentage", "years", "tonnage", "text").
        User input: "${message}"
        JSON output:
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    try {
        // Clean up the text to ensure it's valid JSON before parsing
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse Gemini response as JSON:", error);
        throw new Error("AI response was not valid JSON.");
    }
}

/**
 * Answers questions about a financial analysis based on provided data.
 * @param question - The user's question.
 * @param analysisData - The calculated financial data (results).
 * @returns A promise that resolves to a natural language answer.
 */
export async function analyzeResults(question: string, analysisData: any): Promise<string> {
    const prompt = `
        You are a helpful financial analyst. You will be given a set of calculated financial results for a shipping vessel investment and a user's question about those results.
        Your task is to answer the user's question based *only* on the provided data. Do not make up information.
        Be clear and concise.

        Provided Data: ${JSON.stringify(analysisData, null, 2)}

        User Question: "${question}"

        Your Answer:
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

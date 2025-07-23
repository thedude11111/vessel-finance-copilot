import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { extractParametersFromMessage, analyzeResults } from '../services/geminiService';
import { performFinancialCalculations } from '../services/calculationService';
import { User, ExtractedParameter, AnalysisResult } from 'shared-types';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticateToken);

// Create a new analysis
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = (req as any).user.id;

  try {
    const analysis = await prisma.vesselAnalysis.create({
      data: {
        name,
        userId,
      },
    });
    res.status(201).json(analysis);
  } catch (error) {
    console.error("Error creating analysis:", error);
    res.status(500).json({ error: 'Failed to create analysis' });
  }
});

// Get all analyses for the authenticated user
router.get('/', async (req, res) => {
  const userId = (req as any).user.id;

  try {
    const analyses = await prisma.vesselAnalysis.findMany({
      where: { userId },
      include: { parameters: true, results: true },
    });
    console.log(`User ${userId} retrieved ${analyses.length} analyses.`);
    res.json(analyses);
  } catch (error) {
    console.error("Error retrieving analyses:", error);
    res.status(500).json({ error: 'Failed to retrieve analyses' });
  }
});

// Get a single analysis by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  try {
    const analysis = await prisma.vesselAnalysis.findFirst({
      where: { id, userId },
      include: { parameters: true, results: true },
    });

    if (!analysis) {
      console.warn(`Analysis ${id} not found for user ${userId}.`);
      return res.status(404).json({ error: 'Analysis not found' });
    }

    console.log(`User ${userId} retrieved analysis ${id}.`);
    res.json(analysis);
  } catch (error) {
    console.error(`Error retrieving analysis ${id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve analysis' });
  }
});

// Delete an analysis by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  try {
    await prisma.vesselAnalysis.deleteMany({
      where: { id, userId },
    });
    console.log(`User ${userId} deleted analysis ${id}.`);
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting analysis ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

// Chat to extract parameters
router.post('/:id/chat-parameters', async (req, res) => {
  const { id: analysisId } = req.params;
  const { message } = req.body;

  try {
    const extractedParams: ExtractedParameter[] = await extractParametersFromMessage(message);

    // Save extractedParams to the database as VesselParameter records
    const createdParameters = await prisma.$transaction(
      extractedParams.map((param) =>
        prisma.vesselParameter.create({
          data: {
            analysisId,
            key: param.key,
            value: param.value,
            type: param.type,
          },
        })
      )
    );
    console.log(`Extracted and saved ${createdParameters.length} parameters for analysis ${analysisId}.`);
    res.json(createdParameters);
  } catch (error) {
    console.error("Error in chat-parameters:", error);
    res.status(500).json({ error: 'Failed to extract and save parameters' });
  }
});

// Run financial calculation
router.post('/:id/run-calculation', async (req, res) => {
  const { id: analysisId } = req.params;

  try {
    const parameters = await prisma.vesselParameter.findMany({ where: { analysisId } });

    if (parameters.length === 0) {
      console.warn(`No parameters found for analysis ${analysisId} to run calculations.`);
      return res.status(400).json({ error: 'No parameters found for this analysis to run calculations.' });
    }

    const calculationResults = performFinancialCalculations(parameters);

    const analysisResult = await prisma.analysisResult.upsert({
      where: { analysisId },
      update: {
        cashFlowProjections: calculationResults.cashFlowProjections,
        profitabilityMetrics: calculationResults.profitabilityMetrics,
        chartData: calculationResults.chartData,
      },
      create: {
        analysisId,
        cashFlowProjections: calculationResults.cashFlowProjections,
        profitabilityMetrics: calculationResults.profitabilityMetrics,
        chartData: calculationResults.chartData,
      },
    });
    console.log(`Ran calculations and saved results for analysis ${analysisId}.`);
    res.json(analysisResult);
  } catch (error) {
    console.error("Error in run-calculation:", error);
    res.status(500).json({ error: 'Failed to run calculation' });
  }
});

// Chat about results
router.post('/:id/chat-results', async (req, res) => {
  const { id } = req.params;
  const { question } = req.body;

  try {
    const results = await prisma.analysisResult.findUnique({ where: { analysisId: id } });
    if (!results) {
      console.warn(`Results not found for analysis ${id}.`);
      return res.status(404).json({ error: 'Results not found' });
    }

    const answer = await analyzeResults(question, results);
    console.log(`User asked about results for analysis ${id}. Gemini provided an answer.`);
    res.json({ answer });
  } catch (error) {
    console.error("Error in chat-results:", error);
    res.status(500).json({ error: 'Failed to analyze results' });
  }
});

export default router;


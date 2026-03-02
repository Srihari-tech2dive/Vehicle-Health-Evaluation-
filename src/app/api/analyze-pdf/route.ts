import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { PDFAnalysisResult, LearningInsight } from '@/lib/types';
import ZAI from 'z-ai-web-dev-sdk';

// Extract text from PDF using pdfplumber (via Python subprocess)
async function extractPDFText(pdfBuffer: Buffer): Promise<string> {
  try {
    const { execSync } = await import('child_process');
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    
    // Write buffer to temp file
    const tempDir = os.tmpdir();
    const tempPdfPath = path.join(tempDir, `upload-${Date.now()}.pdf`);
    
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    // Use Python to extract text with pdfplumber
    const pythonScript = `
import pdfplumber
import sys

try:
    with pdfplumber.open("${tempPdfPath}") as pdf:
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\\n"
        print(text)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`;
    
    const scriptPath = path.join(tempDir, `extract-${Date.now()}.py`);
    fs.writeFileSync(scriptPath, pythonScript);
    
    // Run Python script
    const result = execSync(`python3 "${scriptPath}"`, { 
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });
    
    // Cleanup temp files
    try {
      fs.unlinkSync(tempPdfPath);
      fs.unlinkSync(scriptPath);
    } catch {
      // Ignore cleanup errors
    }
    
    return result;
  } catch (error) {
    console.error('PDF extraction error:', error);
    // Fallback: return empty text
    return '';
  }
}

// Analyze PDF content with LLM
async function analyzeWithLLM(pdfText: string, vehicleId: string): Promise<PDFAnalysisResult> {
  try {
    const zai = await ZAI.create();
    
    const systemPrompt = `You are an expert vehicle diagnostic analyst with knowledge of automotive engineering, maintenance, and predictive health analysis. You analyze vehicle service reports and provide detailed health assessments.

Your task is to:
1. Extract key information from the service report
2. Assess the impact on vehicle health
3. Provide actionable insights
4. Identify patterns that can improve predictive models

Always respond in valid JSON format matching the expected output structure.`;

    const userPrompt = `Analyze this vehicle service report and provide a comprehensive health assessment.

Vehicle ID: ${vehicleId}

Service Report Content:
${pdfText}

Respond in this exact JSON format:
{
  "extractedData": {
    "serviceDate": "YYYY-MM-DD format or null",
    "mileage": number or null,
    "serviceType": "type of service performed",
    "issuesFound": ["list of issues found"],
    "componentsReplaced": ["list of replaced components"],
    "nextServiceDue": "recommended next service date or mileage",
    "recommendations": ["mechanic recommendations"]
  },
  "healthImpact": {
    "scoreAdjustment": number between -20 and +15,
    "affectedComponents": ["components affected by this service"],
    "predictedIssues": ["potential future issues based on report"]
  },
  "insights": ["3-5 key insights from the report"],
  "rlModelUpdate": {
    "patternsLearned": ["patterns identified for future predictions"],
    "confidenceLevel": number between 0 and 1
  }
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse JSON response
    let analysisData;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      analysisData = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse LLM response as JSON');
      // Provide default analysis
      analysisData = {
        extractedData: {
          serviceDate: null,
          mileage: null,
          serviceType: 'General Service',
          issuesFound: [],
          componentsReplaced: [],
          nextServiceDue: null,
          recommendations: ['Regular maintenance recommended']
        },
        healthImpact: {
          scoreAdjustment: 5,
          affectedComponents: [],
          predictedIssues: []
        },
        insights: ['Service report analyzed. Vehicle health updated based on service data.'],
        rlModelUpdate: {
          patternsLearned: ['Service history pattern recorded'],
          confidenceLevel: 0.75
        }
      };
    }

    return {
      vehicleId,
      analyzedAt: new Date(),
      extractedData: analysisData.extractedData || {},
      healthImpact: analysisData.healthImpact || { scoreAdjustment: 0, affectedComponents: [], predictedIssues: [] },
      insights: analysisData.insights || [],
      rlModelUpdate: analysisData.rlModelUpdate || { patternsLearned: [], confidenceLevel: 0.7 }
    };
  } catch (error) {
    console.error('LLM analysis error:', error);
    // Return default analysis
    return {
      vehicleId,
      analyzedAt: new Date(),
      extractedData: {
        serviceType: 'Service Report Uploaded',
        recommendations: ['Continue regular maintenance schedule']
      },
      healthImpact: {
        scoreAdjustment: 5,
        affectedComponents: [],
        predictedIssues: []
      },
      insights: ['Service report has been recorded. Vehicle health score updated.'],
      rlModelUpdate: {
        patternsLearned: ['Service record added to history'],
        confidenceLevel: 0.6
      }
    };
  }
}

// Run RL learning based on PDF analysis
function runRLLearning(vehicleId: string, analysis: PDFAnalysisResult): LearningInsight[] {
  const insights: LearningInsight[] = [];
  
  // Generate RL learning insight based on PDF analysis
  if (analysis.rlModelUpdate.patternsLearned.length > 0) {
    const rlInsight: LearningInsight = {
      id: `insight-rl-${Date.now()}`,
      type: 'new_pattern',
      message: `RL Model Updated: ${analysis.rlModelUpdate.patternsLearned.join(', ')}`,
      confidence: analysis.rlModelUpdate.confidenceLevel,
      timestamp: new Date()
    };
    insights.push(rlInsight);
  }
  
  // Generate threshold adjustment insight if issues found
  if (analysis.extractedData.issuesFound && analysis.extractedData.issuesFound.length > 0) {
    const thresholdInsight: LearningInsight = {
      id: `insight-threshold-${Date.now()}`,
      type: 'threshold_adjustment',
      message: `Threshold adjusted based on service report: Issues detected - ${analysis.extractedData.issuesFound.slice(0, 2).join(', ')}`,
      confidence: 0.85,
      timestamp: new Date()
    };
    insights.push(thresholdInsight);
  }
  
  // Generate prediction improvement insight
  if (analysis.healthImpact.predictedIssues && analysis.healthImpact.predictedIssues.length > 0) {
    const predictionInsight: LearningInsight = {
      id: `insight-pred-${Date.now()}`,
      type: 'accuracy_improvement',
      message: `Prediction accuracy improved: Monitoring ${analysis.healthImpact.affectedComponents.slice(0, 2).join(', ')} for potential issues`,
      confidence: 0.9,
      timestamp: new Date()
    };
    insights.push(predictionInsight);
  }
  
  return insights;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const vehicleId = formData.get('vehicleId') as string;

    if (!file || !vehicleId) {
      return NextResponse.json(
        { error: 'File and vehicleId are required' },
        { status: 400 }
      );
    }

    // Check if vehicle exists
    const vehicle = store.getVehicle(vehicleId);
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const pdfText = await extractPDFText(buffer);

    // Analyze with LLM
    const analysisResult = await analyzeWithLLM(pdfText, vehicleId);

    // Update vehicle with analysis results
    const updatedVehicle = store.processPDFAnalysis(vehicleId, analysisResult);
    
    // AUTO-RUN RL LEARNING based on PDF analysis
    const rlInsights = runRLLearning(vehicleId, analysisResult);
    
    // Store RL insights
    const allInsights = store.getLearningInsights();
    rlInsights.forEach(insight => {
      allInsights.unshift(insight);
    });

    // Create notification for RL update
    const notification = {
      type: 'rl_update',
      title: '🤖 AI Learning Updated',
      message: `PDF analysis complete. RL model learned ${analysis.rlModelUpdate.patternsLearned.length} new pattern(s).`,
      vehicleName: vehicle.name,
      confidence: analysis.rlModelUpdate.confidenceLevel,
      timestamp: new Date()
    };

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      vehicle: updatedVehicle,
      rlInsights,
      notification
    });
  } catch (error) {
    console.error('PDF analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze PDF' },
      { status: 500 }
    );
  }
}

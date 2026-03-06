// src/app/api/analyze-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFAnalysisResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Dynamic import for pdf2json (ESM compatible)
    const { default: PDFParser } = await import('pdf2json');
    
    // 2️⃣ Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const vehicleId = formData.get('vehicleId') as string;
    
    // 3️⃣ Validate
    if (!file || file.type !== 'application/pdf' || !vehicleId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid PDF and vehicleId required' 
      }, { status: 400 });
    }

    // 4️⃣ Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5️⃣ Extract text using pdf2json WITH ERROR HANDLING
    let pdfText = '';
    let pageCount = 0;
    
    try {
      const result = await extractTextWithPdf2json(buffer, PDFParser);
      pdfText = result.text || '';
      pageCount = result.pages || 1;
    } catch (extractError: any) {
      console.warn('⚠️ Text extraction failed, using fallback:', extractError.message);
      // Fallback: try simple buffer-to-string conversion for basic PDFs
      pdfText = buffer.toString('utf-8').replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
      pageCount = 1;
    }

    // 6️⃣ Parse PDF content (with null-safety)
    const extractedData = parseVehicleReport(pdfText || '');
    
    // 7️⃣ Build PDFAnalysisResult matching your interface
    const analysis: PDFAnalysisResult = {
      vehicleId,
      analyzedAt: new Date(),
      extractedData: {
        serviceDate: extractedData.serviceDate,
        mileage: extractedData.mileage,
        serviceType: extractedData.serviceType,
        issuesFound: extractedData.issuesFound,
        componentsReplaced: extractedData.componentsReplaced,
        nextServiceDue: extractedData.nextServiceDue,
        recommendations: extractedData.recommendations
      },
      healthImpact: {
        scoreAdjustment: extractedData.healthScore ? extractedData.healthScore - 75 : 0,
        affectedComponents: extractedData.componentsReplaced || [],
        predictedIssues: extractedData.healthScore && extractedData.healthScore < 70 
          ? ['Consider brake pad replacement soon', 'Monitor battery health'] 
          : []
      },
      insights: [
        `Service completed on ${extractedData.serviceDate || 'unknown date'}`,
        `Health score: ${extractedData.healthScore || 'N/A'}/100`,
        `${extractedData.componentsReplaced?.length || 0} component(s) serviced`
      ].filter(Boolean),
      rlModelUpdate: {
        patternsLearned: [
          extractedData.serviceType ? `Service type: ${extractedData.serviceType}` : '',
          extractedData.healthScore ? `Health score recorded: ${extractedData.healthScore}/100` : '',
          ...(extractedData.componentsReplaced?.map((c: string) => `Component serviced: ${c}`) || []),
          ...(extractedData.issuesFound?.map((i: string) => `Issue noted: ${i}`) || [])
        ].filter(Boolean),
        confidenceLevel: 0.92
      }
    };

    // 8️⃣ Return response
    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicleId,
        name: extractedData.vehicleName || 'Unknown Vehicle'
      },
      analysis,
      notification: {
        title: '✓ Analysis Complete',
        message: extractedData.healthScore 
          ? `${extractedData.vehicleName || 'Vehicle'} health score: ${extractedData.healthScore}/100`
          : 'Service report processed successfully'
      }
    });

  } catch (error: any) {
    console.error('❌ PDF API Error:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to analyze PDF',
        analysis: {
          vehicleId: '',
          analyzedAt: new Date(),
          extractedData: {},
          healthImpact: { scoreAdjustment: 0, affectedComponents: [], predictedIssues: [] },
          insights: [],
          rlModelUpdate: { patternsLearned: [], confidenceLevel: 0 }
        } as PDFAnalysisResult
      },
      { status: 500 }
    );
  }
}

// Helper: Extract text using pdf2json (with Promise wrapper)
async function extractTextWithPdf2json(buffer: Buffer, PDFParser: any): Promise<{ text: string; pages: number }> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        let fullText = '';
        const pages = pdfData.Pages?.length || 0;
        
        for (let pageNum = 0; pageNum < pages; pageNum++) {
          const page = pdfData.Pages[pageNum];
          if (page?.Texts) {
            const pageText = page.Texts.map((textItem: any) => {
              return textItem.R?.map((r: any) => {
                try {
                  return decodeURIComponent(r.T || '');
                } catch {
                  return r.T || ''; // Fallback if decode fails
                }
              }).join(' ') || '';
            }).join(' ');
            fullText += pageText + '\n';
          }
        }
        resolve({ text: fullText.trim(), pages });
      } catch (error: any) {
        reject(error);
      }
    });
    
    pdfParser.on('pdfParser_dataError', (err: any) => {
      reject(new Error(`PDF parsing error: ${err.parserError || 'Unknown error'}`));
    });
    
    // Parse the buffer
    try {
      pdfParser.parseBuffer(buffer);
    } catch (parseError: any) {
      reject(parseError);
    }
  });
}

// Helper: Parse your specific PDF format (NULL-SAFE)
function parseVehicleReport(text: string) {
  // Ensure text is a valid string
  if (!text || typeof text !== 'string') {
    return {
      vehicleName: 'Unknown',
      serviceDate: undefined,
      healthScore: 75, // Default baseline
      componentsReplaced: [],
      issuesFound: [],
      recommendations: ['Unable to extract detailed data - please review manually']
    };
  }

  const result: {
    vehicleName?: string;
    serviceDate?: string;
    mileage?: number;
    serviceType?: string;
    issuesFound?: string[];
    componentsReplaced?: string[];
    nextServiceDue?: string;
    recommendations?: string[];
    healthScore?: number;
  } = {};

  try {
    // Extract vehicle name (safe match)
    const vehicleMatch = text.match(/Vehicle:\s*([^\n]+)/i);
    if (vehicleMatch?.[1]) {
      result.vehicleName = vehicleMatch[1].trim();
    }

    // Extract service date
    const dateMatch = text.match(/Date:\s*([^\n]+)/i);
    if (dateMatch?.[1]) {
      result.serviceDate = dateMatch[1].trim();
    }

    // Extract health score (safe)
    const scoreMatch = text.match(/Health Score:\s*(\d+)/i);
    if (scoreMatch?.[1]) {
      result.healthScore = parseInt(scoreMatch[1], 10);
    }

    // Extract service details (lines starting with "-")
    const lines = text.split('\n').filter(line => line.trim());
    const serviceLines = lines.filter(line => line.trim().startsWith('-'));
    const services = serviceLines.map(s => s.replace(/^-\s*/, '').trim()).filter(s => s);
    
    // Categorize services
    const components: string[] = [];
    const issues: string[] = [];
    
    services.forEach(service => {
      const lower = service.toLowerCase();
      if (lower.includes('change') || lower.includes('replacement') || lower.includes('rotation') || lower.includes('inspection') || lower.includes('test') || lower.includes('diagnostic')) {
        components.push(service);
      }
      if (lower.includes('warning') || lower.includes('issue') || lower.includes('failed') || lower.includes('error')) {
        issues.push(service);
      }
    });
    
    result.componentsReplaced = components.length > 0 ? components : undefined;
    result.issuesFound = issues.length > 0 ? issues : undefined;
    result.serviceType = services.length > 0 ? services.join(', ') : undefined;
    
    // Generate recommendations based on health score
    if (result.healthScore !== undefined) {
      const recs: string[] = [];
      if (result.healthScore < 70) recs.push('Schedule comprehensive inspection');
      if (result.healthScore < 60) recs.push('Consider component replacement');
      if (result.healthScore >= 80) recs.push('Continue regular maintenance schedule');
      if (recs.length > 0) result.recommendations = recs;
    }
  } catch (parseError: any) {
    console.warn('⚠️ PDF parse error, using defaults:', parseError.message);
    // Return safe defaults
    return {
      vehicleName: 'Unknown',
      serviceDate: undefined,
      healthScore: 75,
      componentsReplaced: [],
      issuesFound: [],
      recommendations: ['Parse error - please review PDF manually']
    };
  }

  return result;
}
// src/app/api/analyze-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist';

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const vehicleId = formData.get('vehicleId') as string || 'unknown';
    
    // 2️⃣ Validate input
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // 3️⃣ Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4️⃣ Set pdfjs worker path (required for server-side usage)
    pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
      'pdfjs-dist/legacy/build/pdf.worker.min.js'
    );

    // 5️⃣ Extract text from PDF
    const pdfText = await extractPDFText(buffer);
    
    // 6️⃣ Generate mock analysis (replace with real LLM later)
    const analysis = {
      summary: `Successfully processed ${file.name}. Extracted ${pdfText.length} characters.`,
      healthScore: Math.floor(Math.random() * 20) + 70, // 70-90 for demo
      alerts: [],
      recommendations: [
        "Review extracted data for accuracy",
        "Schedule routine maintenance check",
        "Monitor fluid levels regularly"
      ],
      rlModelUpdate: {
        patternsLearned: [],
        confidenceLevel: 0.85
      }
    };

    // 7️⃣ Return complete response
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      },
      pdf: {
        text: pdfText,
        preview: pdfText.substring(0, 500),
        charCount: pdfText.length,
        wordCount: pdfText.trim().split(/\s+/).filter(w => w).length
      },
      analysis: analysis,
      message: "PDF analyzed successfully"
    });

  } catch (error: any) {
    console.error('❌ PDF Analysis Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return structured error for frontend handling
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to analyze PDF',
        details: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}

// Helper: Extract text using pdfjs-dist
async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    const pdf = await pdfjs.getDocument(new Uint8Array(buffer)).promise;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Text extraction failed:', error);
    throw new Error('Could not extract text from PDF');
  }
}
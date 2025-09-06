import { NextRequest, NextResponse } from 'next/server';
import { translationService } from '@/lib/services/translation.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLang, targetLang, type = 'text' } = body;

    // Validate input
    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceLang, targetLang' },
        { status: 400 }
      );
    }

    if (!['ar', 'en'].includes(sourceLang) || !['ar', 'en'].includes(targetLang)) {
      return NextResponse.json(
        { error: 'Invalid language codes. Must be "ar" or "en"' },
        { status: 400 }
      );
    }

    let result;
    
    if (type === 'html') {
      result = await translationService.translateHtmlContent(text, sourceLang, targetLang);
    } else {
      result = await translationService.translateText(text, sourceLang, targetLang);
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Translation failed' 
      },
      { status: 500 }
    );
  }
}

import Tesseract from 'tesseract.js';
import logger from '../config/logger.js';

export const processReceiptOCR = async (buffer: Buffer): Promise<{
  amount: number | null;
  merchantName: string | null;
  date: string | null;
  confidence: number;
}> => {
  try {
    const { data } = await Tesseract.recognize(buffer, 'eng', {
      logger: m => logger.debug(`Tesseract: ${m.status} ${Math.round(m.progress * 100)}%`),
    });

    const text = data.text;
    const confidence = data.confidence;

    logger.info('OCR text extracted', { textPreview: text.substring(0, 100), confidence });

    // Extraction logic
    const amountMatch = text.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|([A-Z][a-z]{2,8}\s\d{1,2},\s\d{4})/);
    const date = dateMatch ? dateMatch[0] : null;

    // Guess merchant (usually first non-empty line)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const merchantName = lines.length > 0 ? lines[0] : null;

    return {
      amount,
      merchantName: merchantName && merchantName.length > 30 ? merchantName.substring(0, 30) : merchantName,
      date,
      confidence: Math.round(confidence),
    };
  } catch (error) {
    logger.error('OCR processing failed', { error });
    return { amount: null, merchantName: null, date: null, confidence: 0 };
  }
};

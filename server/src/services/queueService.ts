import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../config/logger.js';
import { sendExpenseNotificationEmail } from './emailService.js';
import { processReceiptOCR } from './ocrService.js';
import supabase from '../config/supabase.js';
import { emitExpenseSubmitted } from './socketService.js';

// Fallback to memory if Redis is not available
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 3) {
      logger.warn('Redis unreachable after 3 attempts. Falling back to in-memory processing for queues.');
      return null;
    }
    return Math.min(times * 100, 2000);
  },
});

let useMemoryFallback = false;

connection.on('error', (err: any) => {
  if (!useMemoryFallback) {
    logger.warn('Redis error encountered. Subsequent operations will use in-memory fallback.', { 
      error: err.message || 'Unknown Redis error' 
    });
    useMemoryFallback = true;
  }
});

// Suppress unhandled rejections for the connection itself
connection.on('connect', () => {
  logger.info('✅ Connected to Redis successfully');
  useMemoryFallback = false;
});

// 1. Email Queue
export const emailQueue = new Queue('email-queue', { connection });
emailQueue.on('error', (err) => logger.warn('Email Queue Redis connection error', { error: err.message }));
const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    logger.info(`Processing email job ${job.id}`);
    const { to, subject, templateData } = job.data;
    await sendExpenseNotificationEmail(to, subject, templateData);
  },
  { connection }
);
emailWorker.on('failed', (job, err) => logger.error(`Email job ${job?.id} failed`, { err }));

// 2. OCR Queue
export const ocrQueue = new Queue('ocr-queue', { connection });
ocrQueue.on('error', (err) => logger.warn('OCR Queue Redis connection error', { error: err.message }));
const ocrWorker = new Worker(
  'ocr-queue',
  async (job: Job) => {
    logger.info(`Processing OCR job ${job.id}`);
    const { expenseId, fileBufferBase64, companyId } = job.data;
    const buffer = Buffer.from(fileBufferBase64, 'base64');
    
    // Process OCR
    const result = await processReceiptOCR(buffer);
    
    // Update Expense
    await supabase.from('expenses')
      .update({
        is_ocr_processed: true,
        ocr_confidence: result.confidence,
        amount: result.amount || undefined,
        amount_in_base_currency: result.amount || undefined,
        expense_date: result.date || undefined,
        merchant_name: result.merchantName || undefined,
      })
      .eq('id', expenseId)
      .eq('company_id', companyId);

    logger.info(`OCR job ${job.id} completed. Confidence: ${result.confidence}%`);
  },
  { connection }
);
ocrWorker.on('failed', (job, err) => logger.error(`OCR job ${job?.id} failed`, { err }));

// Dispatchers with fallback
export const dispatchEmailJob = async (to: string, subject: string, templateData: any) => {
  if (useMemoryFallback) {
    // Process immediately in memory
    logger.info('(Fallback) Executing email job in memory');
    sendExpenseNotificationEmail(to, subject, templateData).catch(err => logger.error(err));
  } else {
    await emailQueue.add('send-notification', { to, subject, templateData }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
  }
};

export const dispatchOcrJob = async (expenseId: string, companyId: string, fileBufferBase64: string) => {
  if (useMemoryFallback) {
    // Process immediately in memory
    logger.info('(Fallback) Executing OCR job in memory');
    setTimeout(async () => {
      try {
        const buffer = Buffer.from(fileBufferBase64, 'base64');
        const result = await processReceiptOCR(buffer);
        await supabase.from('expenses')
          .update({
            is_ocr_processed: true,
            ocr_confidence: result.confidence,
            amount: result.amount || undefined,
            amount_in_base_currency: result.amount || undefined,
            expense_date: result.date || undefined,
            merchant_name: result.merchantName || undefined,
          })
          .eq('id', expenseId)
          .eq('company_id', companyId);
      } catch (err) {
        logger.error('Fallback OCR failed', { err });
      }
    }, 100);
  } else {
    await ocrQueue.add('process-receipt', { expenseId, companyId, fileBufferBase64 });
  }
};

// =============================================================
// SCHEDULED JOBS - Node-cron powered background tasks
// =============================================================
import cron from 'node-cron';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';

export function initScheduledJobs() {
  // ---- Pending expense reminders (every day at 9 AM) ----
  cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ Running pending expense reminder job');
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: staleExpenses } = await supabase
        .from('expenses')
        .select('id, employee_id, description, amount, submitted_at')
        .eq('status', 'pending')
        .lt('submitted_at', threeDaysAgo.toISOString())
        .is('deleted_at', null);

      if (staleExpenses && staleExpenses.length > 0) {
        // Get managers
        const { data: managers } = await supabase
          .from('users')
          .select('id')
          .in('role', ['manager', 'admin'])
          .eq('is_active', true)
          .is('deleted_at', null);

        if (managers) {
          const notifications = [];
          for (const expense of staleExpenses) {
            for (const manager of managers) {
              notifications.push({
                user_id: manager.id,
                expense_id: expense.id,
                type: 'expense_reminder',
                title: 'Pending Expense Reminder',
                message: `Expense "$${expense.amount}" has been pending for 3+ days`,
              });
            }
          }
          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
            logger.info(`Created ${notifications.length} reminder notifications`);
          }
        }
      }
    } catch (error) {
      logger.error('Reminder job failed', { error });
    }
  });

  // ---- Cleanup old read notifications (weekly, Sunday midnight) ----
  cron.schedule('0 0 * * 0', async () => {
    logger.info('🧹 Running notification cleanup job');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', thirtyDaysAgo.toISOString());

      logger.info(`Cleaned up ${count || 0} old notifications`);
    } catch (error) {
      logger.error('Cleanup job failed', { error });
    }
  });

  // ---- Currency rate refresh (daily at midnight) ----
  cron.schedule('0 0 * * *', async () => {
    logger.info('💱 Running currency rate refresh job');
    try {
      // Insert updated rates (demo values — in production, fetch from API)
      const rates = [
        { base_currency: 'USD', target_currency: 'EUR', rate: 0.92 },
        { base_currency: 'USD', target_currency: 'GBP', rate: 0.79 },
        { base_currency: 'USD', target_currency: 'INR', rate: 83.5 },
        { base_currency: 'EUR', target_currency: 'USD', rate: 1.09 },
        { base_currency: 'GBP', target_currency: 'USD', rate: 1.27 },
        { base_currency: 'INR', target_currency: 'USD', rate: 0.012 },
      ];
      await supabase.from('currency_rates').insert(rates);
      logger.info('Currency rates refreshed');
    } catch (error) {
      logger.error('Currency refresh failed', { error });
    }
  });

  logger.info('📅 Scheduled jobs initialized: reminders (9AM daily), cleanup (Sun midnight), currency (midnight)');
}

import cron from 'node-cron';
import { runBirthdayCheck }    from '../notifications/birthdayChecker.js';
import { runProbationCheck }   from '../notifications/probationChecker.js';
import { runAnniversaryCheck } from '../notifications/anniversaryChecker.js';
import { runProfileCheck }     from '../notifications/profileChecker.js';
import { runPayrollCheck }     from '../notifications/payrollChecker.js';

// Export so HR can trigger manually via API
export async function runAllChecks() {
  console.log('[ReminderJob] Running all reminder checks...');
  await runBirthdayCheck();
  await runProbationCheck();
  await runAnniversaryCheck();
  await runProfileCheck();
  await runPayrollCheck();
  console.log('[ReminderJob] All checks complete ✅');
}

// Fires every day at 9:00 AM IST
cron.schedule('0 9 * * *', async () => {
  try {
    await runAllChecks();
  } catch (err) {
    console.error('[ReminderJob] ❌ Error during checks:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

console.log('[ReminderJob] Cron registered — daily at 9:00 AM IST ✅');

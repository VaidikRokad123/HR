import EmployeeProfessional from '../models/EmployeeProfessionalModel.js';
import NotificationLog      from '../models/NotificationLogModel.js';
import { publish }          from '../queues/publisher.js';
import { QUEUES }           from '../queues/setup.js';

export async function runProbationCheck() {
  const today       = new Date();
  const currentYear = today.getFullYear();

  // Find all employees still in probation with a duration set, not yet notified
  const employees = await EmployeeProfessional.find({
    inProbation:            true,
    probationEndedNotified: false,
    dateJoined:             { $exists: true, $ne: null },
    probationDuration:      { $exists: true, $ne: null }
  });

  let notified = 0;

  for (const emp of employees) {
    // Calculate probation end date: dateJoined + probationDuration months
    const probationEnd = new Date(emp.dateJoined);
    probationEnd.setMonth(probationEnd.getMonth() + (emp.probationDuration || 6));

    const msLeft   = probationEnd - today;
    const daysLeft = Math.ceil(msLeft / 86400000);

    if (daysLeft < 0 || daysLeft > 7) continue;  // Alert if probation ends within 7 days

    const alreadySent = await NotificationLog.findOne({
      emp_code: emp.emp_code,
      type:     'probation',
      year:     currentYear
    });
    if (alreadySent) continue;

    await publish(QUEUES.PROBATION, {
      emp_code:      emp.emp_code,
      name:          emp.nameAsPerAadhaar || emp.emp_code,
      probationEnd:  probationEnd,
      daysLeft:      daysLeft
    });

    // Mark as notified to prevent re-alerting
    await EmployeeProfessional.updateOne(
      { emp_code: emp.emp_code },
      { probationEndedNotified: true }
    );

    await NotificationLog.create({
      emp_code: emp.emp_code,
      type:     'probation',
      year:     currentYear
    });

    notified++;
  }

  console.log(`[ProbationChecker] Notified ${notified} upcoming probation end(s)`);
}

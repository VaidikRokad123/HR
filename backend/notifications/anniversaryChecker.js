import EmployeeProfessional from '../models/EmployeeProfessionalModel.js';
import NotificationLog      from '../models/NotificationLogModel.js';
import { publish }          from '../queues/publisher.js';
import { QUEUES }           from '../queues/setup.js';

export async function runAnniversaryCheck() {
  const today       = new Date();
  const currentYear = today.getFullYear();

  const targetDates = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    targetDates.push({
      month: d.getMonth() + 1,
      day: d.getDate(),
      daysLeft: i
    });
  }

  const matchConditions = targetDates.map(t => ({
    joinMonth: t.month,
    joinDay: t.day
  }));

  const employees = await EmployeeProfessional.aggregate([
    {
      $match: {
        emp_code:   { $exists: true, $ne: null },
        dateJoined: { $exists: true, $ne: null },
        exitDate:   { $eq: null }  // skip exited employees
      }
    },
    {
      $addFields: {
        joinMonth:      { $month: '$dateJoined' },
        joinDay:        { $dayOfMonth: '$dateJoined' },
        joiningYear:    { $year: '$dateJoined' },
        yearsCompleted: { $subtract: [currentYear, { $year: '$dateJoined' }] }
      }
    },
    {
      $match: {
        joiningYear: { $lt: currentYear },  // not a new joiner this year
        $or: matchConditions
      }
    }
  ]);

  console.log(`[AnniversaryChecker] Found ${employees.length} upcoming work anniversary(s) within 7 days`);

  for (const emp of employees) {
    const alreadySent = await NotificationLog.findOne({
      emp_code: emp.emp_code,
      type:     'anniversary',
      year:     currentYear
    });
    if (alreadySent) continue;

    const target = targetDates.find(t => t.month === emp.joinMonth && t.day === emp.joinDay);
    const daysLeft = target ? target.daysLeft : 7;

    await publish(QUEUES.ANNIVERSARY, {
      emp_code:       emp.emp_code,
      name:           emp.nameAsPerAadhaar || emp.emp_code,
      dateJoined:     emp.dateJoined,
      yearsCompleted: emp.yearsCompleted,
      daysLeft:       daysLeft
    });

    await NotificationLog.create({
      emp_code: emp.emp_code,
      type:     'anniversary',
      year:     currentYear
    });
  }
}

import EmployeeProfessional from '../models/EmployeeProfessionalModel.js';
import EmployeePayroll      from '../models/EmployeePayrollModel.js';
import NotificationLog      from '../models/NotificationLogModel.js';
import { publish }          from '../queues/publisher.js';
import { QUEUES }           from '../queues/setup.js';

export async function runPayrollCheck() {
  const today        = new Date();
  const currentYear  = today.getFullYear();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Employees who joined 7+ days ago and are still active
  const employees = await EmployeeProfessional.find({
    emp_code:   { $exists: true, $ne: null },
    dateJoined: { $lte: sevenDaysAgo },
    exitDate:   { $eq: null }
  });

  let notified = 0;

  for (const emp of employees) {
    const payroll = await EmployeePayroll.findOne({ emp_code: emp.emp_code });

    // Skip if payroll setup is already configured.
    if (payroll) continue;

    const alreadySent = await NotificationLog.findOne({
      emp_code: emp.emp_code,
      type:     'payroll_pending',
      year:     currentYear
    });
    if (alreadySent) continue;

    await publish(QUEUES.PAYROLL, {
      emp_code:   emp.emp_code,
      name:       emp.nameAsPerAadhaar || emp.emp_code,
      dateJoined: emp.dateJoined,
      department: emp.department
    });

    await NotificationLog.create({
      emp_code: emp.emp_code,
      type:     'payroll_pending',
      year:     currentYear
    });

    notified++;
  }

  console.log(`[PayrollChecker] Notified ${notified} payroll pending case(s)`);
}

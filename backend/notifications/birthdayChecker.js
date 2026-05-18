import Employee from "../models/EmployeeModel.js";
import NotificationLog from "../models/NotificationLogModel.js";
import { publish } from "../queues/publisher.js";
import { QUEUES } from "../queues/setup.js";

export async function runBirthdayCheck() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const targetDates = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    targetDates.push({
      month: d.getMonth() + 1,
      day: d.getDate(),
      daysLeft: i,
    });
  }

  const matchConditions = targetDates.map((t) => ({
    dobMonth: t.month,
    dobDay: t.day,
  }));

  // Match employees whose DOB month+day matches any of the next 7 days
  const employees = await Employee.aggregate([
    {
      $match: {
        emp_code: { $exists: true, $ne: null },
        dob: { $exists: true, $ne: null },
      },
    },
    {
      $addFields: {
        dobMonth: { $month: "$dob" },
        dobDay: { $dayOfMonth: "$dob" },
      },
    },
    {
      $match: {
        $or: matchConditions,
      },
    },
  ]);

  console.log(
    `[BirthdayChecker] Found ${employees.length} upcoming birthday(s) within 7 days`,
  );

  for (const emp of employees) {
    const alreadySent = await NotificationLog.findOne({
      emp_code: emp.emp_code,
      type: "birthday",
      year: currentYear,
    });
    if (alreadySent) continue;

    const target = targetDates.find(
      (t) => t.month === emp.dobMonth && t.day === emp.dobDay,
    );
    const daysLeft = target ? target.daysLeft : 7;

    await publish(QUEUES.BIRTHDAY, {
      emp_code: emp.emp_code,
      name: emp.fullName,
      dob: emp.dob,
      daysLeft: daysLeft,
    });

    await NotificationLog.create({
      emp_code: emp.emp_code,
      type: "birthday",
      year: currentYear,
    });
  }
}

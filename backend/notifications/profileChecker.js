import User             from '../models/UserModel.js';
import EmployeeBank     from '../models/EmployeeBankModel.js';
import EmployeeProfessional from '../models/EmployeeProfessionalModel.js';
import NotificationLog  from '../models/NotificationLogModel.js';
import { publish }      from '../queues/publisher.js';
import { QUEUES }       from '../queues/setup.js';

const isCompleteEmployeeProfile = (bank, professional) => {
  if (!professional?.linkedinUrl) return false;
  if (!bank) return false;

  if (bank.companyOpensBank) {
    return Boolean(bank.panNumber && bank.aadharNumber && bank.permissionToUsePanAadhar);
  }

  return Boolean(bank.bankName && bank.personalAccountNumber && bank.personalIfsc);
};

export async function runProfileCheck() {
  const today        = new Date();
  const currentYear  = today.getFullYear();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  // Approved employees; approval date is represented by the professional record creation date.
  const approvedUsers = await User.find({
    status:    'approved',
    emp_code:  { $exists: true, $ne: null }
  });

  let notified = 0;

  for (const user of approvedUsers) {
    const [bank, professional] = await Promise.all([
      EmployeeBank.findOne({ emp_code: user.emp_code }),
      EmployeeProfessional.findOne({ emp_code: user.emp_code })
    ]);

    if (!professional || new Date(professional.createdAt) > threeDaysAgo) continue;

    const profileIncomplete = !isCompleteEmployeeProfile(bank, professional);
    if (!profileIncomplete) continue;

    const alreadySent = await NotificationLog.findOne({
      emp_code: user.emp_code,
      type:     'profile_incomplete',
      year:     currentYear
    });
    if (alreadySent) continue;

    const daysLeft = Math.ceil((today - new Date(professional.createdAt)) / 86400000);

    await publish(QUEUES.PROFILE, {
      emp_code: user.emp_code,
      email:    user.email,
      daysLeft
    });

    await NotificationLog.create({
      emp_code: user.emp_code,
      type:     'profile_incomplete',
      year:     currentYear
    });

    notified++;
  }

  console.log(`[ProfileChecker] Notified ${notified} incomplete profile(s)`);
}

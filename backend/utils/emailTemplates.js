/**
 * Email Templates
 * These functions generate email subjects and HTML bodies dynamically using the provided `data` object.
 */

export const getOfferEmail = (data) => ({
  subject: `You're Hired! Join Us as ${data.jobTitle} at Saeculum Solutions Pvt Ltd`,
  body: `
    <p>Greetings of the Day, ${data.candidateName}!</p>
    <p>We've thoroughly enjoyed our conversations with you over the past few weeks and are pleased to inform you that your background and approach have impressed both the team and myself. We would like to formally offer you the position of <strong>${data.jobTitle}</strong> at Saeculum Solutions Pvt Ltd.</p>
    <p>We believe your skills, knowledge, and experience would be a great addition to our ${data.departmentName} team. Your Reporting Manager will be ${data.managerName}. Based on our interview and phone discussions, your joining date will be <strong>${data.joiningDate}</strong>. Kindly confirm this date via email so we can proceed with sharing your onboarding details.</p>
    <p>Please note that this offer is valid for 2 days, and if we do not receive your acceptance within this time, the offer will be automatically revoked.</p>
    <p>We are excited about the possibility of you joining us and contributing to the success of Saeculum Solutions Pvt Ltd.</p>
    <p>Looking forward to your positive reply! Let’s bring out the best together.</p>
    <br>
    <p>Best Regards,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getOfferLetter2 = (data) => ({
  subject: `Congratulations! Job Offer from Saeculum Solutions!!`,
  body: `
    <p>Dear ${data.candidateName},</p>
    <p>Warm greetings from the team at Saeculum Solutions Pvt Ltd!</p>
    <p>After an extensive search and thorough evaluation, we are thrilled to have discovered a gem in you. Your passion, expertise, and the spark you brought to the Interview Rounds have truly set you apart. It is with great excitement that I extend to you an offer to join our team at Saeculum Solutions Pvt Ltd as our new <strong>${data.jobTitle}</strong>.</p>
    <p>We are pleased to offer you the position of ${data.jobTitle} with Saeculum Solutions Pvt Ltd. Attached, you will find the detailed offer letter and employment contract. These documents outline the terms and conditions of your employment, including your start date, job location, and other important details.</p>
    <p>Please review these documents carefully. We would appreciate it if you could sign and return the offer letter by <strong>${data.deadlineDate}</strong>. If we do not receive your acceptance by this date, this offer will be considered canceled.</p>
    <p>Should you have any questions or require further clarification regarding the offer, feel free to contact me directly at 9712912983 or hr@saeculumsolutions.com. We are excited about the prospect of you joining our team and look forward to your affirmative response.</p>
    <p>Thank you once again for considering Saeculum Solutions Pvt Ltd as your career move. We are confident that you will make significant contributions to our team and help us achieve our goals.</p>
    <br>
    <p>Best regards,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getInternshipLetter = (data) => ({
  subject: `Internship and Employment Offer from Saeculum Solutions Pvt. Ltd.`,
  body: `
    <p>Dear ${data.candidateName},</p>
    <p>Greetings of the day.</p>
    <p>We are pleased to extend to you an offer for a <strong>${data.internshipPeriod}</strong> with Saeculum Solutions Pvt. Ltd.</p>
    <p>Your role during the internship will be <strong>${data.jobTitle}</strong>.</p>
    <p>The details of your internship and subsequent employment are as follows:</p>
    <ul>
      <li><strong>Internship Period:</strong> ${data.internshipPeriod}</li>
      <li><strong>Position:</strong> ${data.jobTitle}</li>
      <li><strong>Post-Internship Agreement:</strong> Upon successful completion of the internship, you will be offered a full-time position with a 2-year tenure agreement with Saeculum Solutions Pvt. Ltd.</li>
    </ul>
    <p>We believe that your skills and enthusiasm will be a valuable addition to our team, and we are excited about the opportunity to work with you. Please confirm your acceptance of this offer by replying to this email by <strong>${data.deadlineDate}</strong>.</p>
    <p>If you have any questions or need further information, please do not hesitate to contact us.</p>
    <p>Looking forward to your positive response.</p>
    <br>
    <p>Best regards,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getRejectionEmail = (data) => ({
  subject: `Update on Your Application for ${data.jobTitle} at Saeculum Solutions Pvt Ltd`,
  body: `
    <p>Dear ${data.candidateName},</p>
    <p>Greetings of the Day!</p>
    <p>Thank you for taking the time to apply for the <strong>${data.jobTitle}</strong> position at Saeculum Solutions. We truly appreciate your interest in joining our team.</p>
    <p>After careful consideration, we have decided to move forward with other applicants whose experience and skillsets more closely align with our current needs. We understand this may be disappointing, but we want to assure you that this is not a reflection of your abilities. We were impressed by your background, and we encourage you to continue enhancing your skills.</p>
    <p>We have saved your resume in our database, and we will gladly reach out if a suitable opportunity arises in the future. Please feel free to reapply when your skillsets have evolved, as we would be more than happy to consider you again.</p>
    <p>While we are unable to provide individual feedback due to the high volume of applications, we want to express our sincere gratitude for your interest in Saeculum Solutions.</p>
    <p>We wish you the very best in your job search and future endeavors. We hope to have the chance to connect with you again.</p>
    <p>Thank you once more, and best of luck!</p>
    <br>
    <p>Best regards,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getBirthdayMail = (data) => ({
  subject: `Happy Birthday, ${data.employeeName}!`,
  body: `
    <p>Dear ${data.employeeName},</p>
    <p>On behalf of the entire team at Saeculum Solutions, I wish you a very happy birthday!</p>
    <p>We hope you have a wonderful day filled with joy, celebration, and everything that makes you happy. We appreciate your hard work and dedication to Saeculum Solutions, and we're grateful to have you as part of our team.</p>
    <p>Once again, Happy Birthday, ${data.employeeName}! We wish you all the best for a wonderful year ahead.</p>
    <br>
    <p>Sincerely,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getWorkAnniversaryMail = (data) => ({
  subject: `Happy Work Anniversary, ${data.employeeName}!`,
  body: `
    <p>Dear ${data.employeeName},</p>
    <p>On behalf of the entire team at Saeculum Solutions, I'm thrilled to celebrate your work anniversary with you today! It's hard to believe it's already been <strong>${data.yearsOfService} years</strong> since you joined us as <strong>${data.jobTitle}</strong>.</p>
    <p>In your time here, you've made significant contributions to our company. Your <strong>${data.specificSkills}</strong> have been invaluable on <strong>${data.specificProjects}</strong>, and we're grateful for your dedication and hard work.</p>
    <p>We appreciate your positive attitude, willingness to help others, and <strong>${data.positiveAttributes}</strong>. You've not only grown professionally but also become a valued member of our team. We appreciate your camaraderie and the positive impact you have on those around you.</p>
    <p>Thank you for everything you do! We wish you continued success and fulfillment in your role here.</p>
    <p>Once again, congratulations on your work anniversary, ${data.employeeName}!</p>
    <br>
    <p>Sincerely,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getBackgroundVerificationMail = (data) => ({
  subject: `Saeculum Solutions Background Verification - ${data.employeeName}`,
  body: `
    <p>Dear Team,</p>
    <p>Greetings from Saeculum Solutions!</p>
    <p>My name is ${data.hrName}, and I'm the HR Representative at Saeculum Solutions.</p>
    <p>We need to conduct a background verification for <strong>${data.employeeName}</strong> who previously worked at your organization. We will be grateful if you could provide us with a few details.</p>
    
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="text-align: left;">Details</th>
          <th style="text-align: left;">Candidate's Input</th>
          <th style="text-align: left;">HR Comments</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Company Name & Address</td>
          <td>${data.companyDetails || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Employee Code</td>
          <td>${data.employeeCode || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Period of Employment</td>
          <td>${data.employmentPeriod || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Designation</td>
          <td>${data.designation || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Remuneration</td>
          <td>${data.remuneration || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Supervisor Name & Designation</td>
          <td>${data.supervisorDetails || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Reason for leaving</td>
          <td>${data.reasonForLeaving || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Eligible for rehire</td>
          <td>${data.eligibleForRehire || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Is Exit Formalities Completed</td>
          <td>${data.exitFormalitiesCompleted || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Duties & responsibilities handled</td>
          <td>${data.dutiesHandled || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Any Integrity/ Disciplinary Issue</td>
          <td>${data.integrityIssues || 'None'}</td>
          <td></td>
        </tr>
        <tr>
          <td>Performance at Work</td>
          <td>${data.performance || ''}</td>
          <td></td>
        </tr>
        <tr>
          <td>Additional Comments</td>
          <td>${data.additionalComments || ''}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    
    <p><strong>Verified From:</strong></p>
    <ul>
      <li>Name: </li>
      <li>Designation: </li>
      <li>Contact Number: </li>
      <li>Official Email-id: </li>
    </ul>
    <p>Thank you so much for your time and support.</p>
    <br>
    <p>Sincerely,</p>
    <p>${data.hrName}<br>HR Representative<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getFarewellMail = (data) => ({
  subject: `Wishing You Well, ${data.employeeName}`,
  body: `
    <p>Dear ${data.employeeName},</p>
    <p>On behalf of the entire team at Saeculum Solutions, I am writing to express our sincere gratitude for your contributions to the company over the past <strong>${data.yearsOfService} years</strong>. We were sorry to hear about your decision to <strong>${data.reasonForLeaving}</strong>, but we understand and fully support your next steps.</p>
    <p>Your contributions to Saeculum Solutions over the past ${data.yearsOfService} years have been truly valuable. We appreciate your dedication and hard work, and you will be missed by your colleagues.</p>
    <p>We wish you the very best of luck in your future endeavors. We have no doubt that you will achieve great things.</p>
    <p>On behalf of the entire Saeculum Solutions team, we thank you again for your contributions and wish you continued success and fulfillment in your future career.</p>
    <p>Please keep in touch! We would love to hear about your future endeavors.</p>
    <br>
    <p>Sincerely,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

export const getProbationCompletionMail = (data) => ({
  subject: `Congratulations! You've Officially Joined the Saeculum Solutions Team!`,
  body: `
    <p>Dear ${data.employeeName},</p>
    <p>We're thrilled to announce that you've successfully completed your probationary period at Saeculum Solutions, ending on <strong>${data.completionDate}</strong>! On behalf of the entire team, I want to extend a hearty congratulations! We're confident that you'll continue to be a valuable asset to Saeculum Solutions.</p>
    <p>As you transition to permanent status, you'll now unlock a full range of employee benefits, which is mentioned in the HR Hand Book.</p>
    <p>We're excited to have you officially on board and look forward to your continued success with Saeculum Solutions!</p>
    <p>If you have any questions about your new permanent status, benefits, or anything else at all, please don't hesitate to reach out to us directly at HR@saeculumsolutions.com.</p>
    <p>Once again, congratulations on becoming a permanent member of the Saeculum Solutions team! We're happy to have you on board!</p>
    <br>
    <p>Sincerely,</p>
    <p>HR Department<br>Saeculum Solutions Pvt Ltd</p>
  `
});

// ─────────────────────────────────────────────────────────────
// Automated Reminder Templates (used by RabbitMQ email consumer)
// ─────────────────────────────────────────────────────────────

export const getProfileIncompleteMail = ({ emp_code, email, daysLeft }) => ({
  subject: `⚠️ Incomplete Profile — ${emp_code} (${daysLeft} days since approval)`,
  body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7941d; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Saeculum HRMS — Action Required</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h3>⚠️ Employee Profile Incomplete</h3>
        <p>Employee <strong>${emp_code}</strong> (${email}) was approved <strong>${daysLeft} days ago</strong> but has not yet completed their profile.</p>
        <p><strong>Missing:</strong> Bank details / LinkedIn URL</p>
        <p>Please follow up with the employee to complete the onboarding process.</p>
      </div>
    </div>
  `
});

export const getPayrollPendingMail = ({ emp_code, name, dateJoined, department }) => ({
  subject: `💰 Payroll Setup Pending — ${name} (${emp_code})`,
  body: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7941d; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Saeculum HRMS — Payroll Alert</h2>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h3>💰 Payroll Setup Required</h3>
        <p>Employee <strong>${name}</strong> (${emp_code}) from <strong>${department}</strong> joined on <strong>${new Date(dateJoined).toLocaleDateString('en-IN')}</strong> but salary account details have not been configured.</p>
        <p>Please complete the payroll setup in the HR portal.</p>
      </div>
    </div>
  `
});

// ─────────────────────────────────────────────────────────────
// Central builders — called by RabbitMQ consumers
// ─────────────────────────────────────────────────────────────

/**
 * Maps a RabbitMQ routing key → { subject, body } for the email consumer.
 */
export const buildEmailContent = (routingKey, payload) => {
  switch (routingKey) {
    case 'birthday.reminder':
      return getBirthdayMail({ employeeName: payload.name });
    case 'probation.ending':
      return getProbationCompletionMail({
        employeeName:   payload.name,
        completionDate: new Date(payload.probationEnd).toLocaleDateString('en-IN')
      });
    case 'work.anniversary':
      return getWorkAnniversaryMail({
        employeeName:    payload.name,
        yearsOfService:  payload.yearsCompleted,
        jobTitle:        payload.jobTitle || 'their role',
        specificSkills:  'dedication and expertise',
        specificProjects: 'key projects',
        positiveAttributes: 'positive attitude'
      });
    case 'profile.incomplete':
      return getProfileIncompleteMail(payload);
    case 'payroll.pending':
      return getPayrollPendingMail(payload);
    default:
      throw new Error(`No email template found for routing key: ${routingKey}`);
  }
};

/**
 * Maps a RabbitMQ routing key → plain-text in-app notification message.
 * Used by notificationConsumer to write to NotificationModel.
 */
export const buildInAppMessage = (routingKey, payload) => {
  const name = payload.name || payload.emp_code;
  switch (routingKey) {
    case 'birthday.reminder':
      return `🎂 ${name}'s birthday is in ${payload.daysLeft} days`;
    case 'probation.ending':
      return `🏁 ${name}'s probation period ends in ${payload.daysLeft} days`;
    case 'work.anniversary':
      return `🎉 ${name} completes ${payload.yearsCompleted} year(s) with the company in ${payload.daysLeft} days`;
    case 'profile.incomplete':
      return `⚠️ Employee ${payload.emp_code} has not completed their profile (${payload.daysLeft} days since approval)`;
    case 'payroll.pending':
      return `💰 Payroll setup pending for ${name} (${payload.emp_code}) — ${payload.department}`;
    default:
      return `Notification: ${routingKey} for ${payload.emp_code}`;
  }
};

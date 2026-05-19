import { formatOrdinalDate } from './dateFormatter.js';

export function buildAppraisalLetterStructuredData(payload) {
  const {
    name,
    gender,
    role,
    currentSalary,
    revisedSalaryDate,
    companyName = 'Saeculum Solutions Pvt. Ltd.',
    signatoryName = 'HARDIKKUMAR VINZAVA',
    signatoryTitle = 'DIRECTOR'
  } = payload;

  if (!name || !gender || !role || !currentSalary || !revisedSalaryDate) {
    throw new Error('Missing required fields');
  }

  const upperName = name.toUpperCase();
  const formattedDate = formatOrdinalDate(new Date());
  const formattedRevisedDate = formatOrdinalDate(revisedSalaryDate);
  const salutation = gender === 'male' ? 'Mr.' : 'Ms.';

  const dateLine = `Date: ${formattedDate}`;
  const employeeLine = `Employee Name: ${salutation} ${upperName}`;
  const designationLine = `Designation: ${role}`;

  const openingParagraph = `It was a pleasure appraising you and discussing the key events, responsibilities, accomplishments, failures, etc., which you as an individual had faced and the related impact on the company's growth. As a part of yearly appraisals and consequent to the review of your performance for the last year, we are pleased to revise your CTC to ${currentSalary} with effect from ${formattedRevisedDate}.`;

  const commitmentParagraph = `Further, you agree that the appraisal is done in order to motivate employees and this appraisal has been specifically granted and approved in lieu of you making a long-term commitment to stay with the company (at least for a year till the next appraisal cycle). Hence, as per the assurance you have given, we issue this appraisal linked to your confirmation, declaration, and undertaking that in case you leave the company before the committed period (12 months from the effective date of appraisal/increment), the company reserves the rights to roll back the entire Increment amount which you have availed for all the months you continued working with the company till date of your resignation. Such a differential amount shall be adjusted and settled against your last salary during F&F (Full and final settlement); however, if such a differential amount is higher than your monthly salary, the company reserves the right to claim back such additional amount from you. Secondly, in case you leave the company before 12 months from the increment date, the company reserves the right to claim back the increment monthly amount X 12 months which shall be payable by the employee to the company.`;

  const responsibilitiesParagraph = `With promotion and further elevation, come new responsibilities, and your detailed scope of work shall be communicated to you by your reporting manager shortly over an email. The same is subject to change from time to time as per work exigencies. With the promotion, you may be required to execute the compliance/commitment documents, as may be required by the company, in the best interest of the organization's growth.`;

  const closingParagraph = `We are sure you will make the best use of the opportunity offered to you and shall continue contributing to the success of our organization and fully justify the confidence placed in you by the management. A separate communication on the details of your salary revision is being sent to you.`;

  const wishLine = `Wish you all the best.`;
  const yoursTruly = `Yours Truly,`;

  const acceptanceLine1 = `Employee's Name: ${salutation} ${upperName}`;

  return {
    metadata: {
      name,
      upperName,
      gender,
      role,
      currentSalary,
      revisedSalaryDate,
      formattedRevisedDate,
      date: formattedDate,
      companyName,
      signatoryName,
      signatoryTitle,
      salutation
    },
    pages: [
      {
        pageNumber: 1,
        paragraphs: [
          { id: 'title', content: 'Appraisal Letter', type: 'title' },
          { id: 'date', content: dateLine, type: 'date' },
          { id: 'employeeName', content: employeeLine, type: 'info-line' },
          { id: 'designation', content: designationLine, type: 'info-line' },
          { id: 'opening', content: openingParagraph, type: 'paragraph' },
          { id: 'commitment', content: commitmentParagraph, type: 'paragraph' },
          { id: 'responsibilities', content: responsibilitiesParagraph, type: 'paragraph' },
          { id: 'closing', content: closingParagraph, type: 'paragraph' },
          { id: 'wish', content: wishLine, type: 'paragraph' },
          { id: 'yoursTruly', content: yoursTruly, type: 'paragraph' },
          { id: 'signature', content: `${signatoryName}<br>${signatoryTitle}`, type: 'signature' },
          { id: 'company', content: companyName, type: 'company' },
          { id: 'separator', content: '--------------------------------X----------------------------X-----------------------', type: 'separator' },
          { id: 'acceptance1', content: acceptanceLine1, type: 'footer' },
          { id: 'acceptance2', content: "Employee's Signature: _____________________", type: 'footer' },
          { id: 'acceptance3', content: 'Place: Ahmedabad, Gujarat, India', type: 'footer' }
        ]
      }
    ]
  };
}

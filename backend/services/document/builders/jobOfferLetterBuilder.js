import { formatOrdinalDate } from '../../../utils/dateFormatter.js';

function formatCurrencyINR(value) {
    if (value == null || value === '') return '0';
    return Number(value).toLocaleString('en-IN');
}

function getSalutation(gender) {
    if (!gender) return 'Mr.';
    const g = gender.toLowerCase();
    if (g === 'female') return 'Ms.';
    return 'Mr.';
}

function getCompanyAddress() {
    return 'A-501, Kalp Business Park, Near Kia Showroom, Sardar Patel Ring Road, Nikol, Gujarat, Ahmedabad, 382350';
}

function getOfficePlace(employee) {
    return (
        employee?.permanentAddress?.city ||
        employee?.currentAddress?.city ||
        'Ahmedabad'
    );
}

export function buildJobOfferLetterStructuredData(employee) {
    if (!employee) throw new Error('Employee data is required');
    if (!employee.fullName) throw new Error('Employee fullName is required');
    if (!employee.designation) throw new Error('Employee designation is required');
    if (!employee.ctcPerYear) throw new Error('Employee ctcPerYear is required');
    if (!employee.dateJoining) throw new Error('Employee dateJoining is required');
    if (!employee.officialEmail && !employee.personalEmail) throw new Error('Employee email is required');

    const salutation = getSalutation(employee.gender);
    const upperName = employee.fullName.toUpperCase();
    const today = formatOrdinalDate(new Date());
    const joiningDate = formatOrdinalDate(employee.dateJoining);
    const designation = employee.designation;
    const reportingManager = employee.reportingManager || 'Reporting Manager';
    const companyName = process.env.COMPANY_NAME || 'SAECULUM SOLUTIONS PVT LTD';
    const companyAddress = getCompanyAddress();
    const annualCTC = formatCurrencyINR(employee.ctcPerYear);
    const employeeEmail = employee.officialEmail || employee.personalEmail;
    const place = getOfficePlace(employee);
    const signatoryName = process.env.DOCUMENT_SIGNATORY_NAME || 'HARDIK VINZAVA';
    const signatoryTitle = process.env.DOCUMENT_SIGNATORY_TITLE || 'DIRECTOR';

    const p1 = `We are pleased to offer you the position of ${designation} with ${companyName}. As we discussed during your interview / interactions, you will be functionally reporting to your reporting manager ${reportingManager} at our office located at ${companyAddress}.`;

    const p2 = `Your initial annual salary compensation package shall be for ${annualCTC}/-. The detailed salary break-up shall be as per mentioned in the appointment letter; deductions / applicable taxation shall be as per the then applicable laws. You are required to join us latest by ${joiningDate} beyond which this offer stands cancelled, unless otherwise either party communicates the said delay beforehand and the same being accepted in writing by other party.`;

    const p3 = `We look forward to your arrival at our organization and are we hope that you will play a key role in our company's expansion and growth. Your detailed appointment letter will be issued to you after your probations Completion.`;

    const p4 = `If this employment offer is acceptable to you, please share the sign copy of this letter and return it to us by or before ${joiningDate} over the email.`;

    const acceptanceLine = `I, ${salutation} ${upperName}, hereby accept the above-mentioned employment offer along with the terms mentioned therein and acknowledge receiving a copy of the same.`;

    return {
        metadata: {
            documentType: 'job-offer-letter',
            name: employee.fullName,
            upperName,
            gender: employee.gender || '',
            designation,
            ctcPerYear: employee.ctcPerYear,
            dateJoining: employee.dateJoining,
            reportingManager,
            companyName,
            companyAddress,
            signatoryName,
            signatoryTitle,
            date: today,
            place,
            employeeEmail,
            salutation
        },
        pages: [
            {
                pageNumber: 1,
                paragraphs: [
                    { id: 'title', content: 'OFFER LETTER', type: 'title' },
                    { id: 'date', content: `Date: ${today}`, type: 'date' },
                    { id: 'employee', content: `${salutation} ${upperName}`, type: 'employee-name' },
                    { id: 'p1', content: p1, type: 'paragraph' },
                    { id: 'p2', content: p2, type: 'paragraph' },
                    { id: 'p3', content: p3, type: 'paragraph' },
                    { id: 'p4', content: p4, type: 'paragraph' },
                    { id: 'yoursTruly', content: 'Yours truly,', type: 'paragraph' },
                    { id: 'signature', content: `${signatoryName}<br>(${signatoryTitle})`, type: 'signature' }
                ]
            },
            {
                pageNumber: 2,
                paragraphs: [
                    // { id: 'separator', content: '--------------------------------X----------------------------X-----------------------', type: 'separator' },
                    { id: 'acceptance', content: acceptanceLine, type: 'paragraph' },
                    { id: 'signatureLabel', content: 'Signature_____________________', type: 'footer' },
                    { id: 'dateLine', content: `Date: ${joiningDate}`, type: 'footer' },
                    { id: 'emailLine', content: `Email: ${employeeEmail}`, type: 'footer' },
                    { id: 'placeLine', content: `Place: ${place}`, type: 'footer' }
                ]
            }
        ]
    };
}
import mongoose from 'mongoose';

const employeeProfessionalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emp_code: {
    type: String,
    required: true,
    unique: true
  },
  nameAsPerAadhaar: {
    type: String,
    trim: true
  },
  dateJoined: {
    type: Date,
    required: true
  },
  tenure: {
    type: String
  },
  exitDate: {
    type: Date
  },
  department: {
    type: String,
    required: true,
    trim: true,
    enum: [
      "Product & Delivery",
      "Human Resources",
      "Sales & marketing",
      "Design",
      "Engineering"
    ]
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
    enum: [
      "SR Quality Assurance Engineer",
      "Team Lead - Software Development",
      "Software Development Engineer - SDE 3",
      "Software Development Engineer - SDE 2",
      "Software Development Engineer - SDE 1",
      "Software Development - Intern",
      "Jr. Video Editor",
      "Sr. Human Resource Executive",
      "Product Manager",
      "Team Lead",
      "Jr Human Resource Executive",
      "Sr. BDE",
      "Sr. UI/UX",
      "Intern-Graphics",
      "Intern - UI/UX UI/UX Designer",
      "Quality Assurance Engineer",
      "Quality Assurance - Intern",
      "JR Quality Assurance Engineer"
    ]
  },
  employmentType: {
    type: String,
    trim: true,
    enum: [
      "Temporary",
      "Permanent",
      "Contract Base",
      "Probation",
      "Internship",
      "Trainee",
      "Notice period"
    ]
  },
  reportingManager: {
    type: String,
    trim: true
  },
  attendanceBiometricId: {
    type: String,
    trim: true
  },
  inProbation: {
    type: Boolean,
    default: true
  },
  probationDuration: {
    type: Number
  },
  probationEndedNotified: {
    type: Boolean,
    default: false
  },
  workEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('EmployeeProfessional', employeeProfessionalSchema);

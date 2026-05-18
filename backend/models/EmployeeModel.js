import mongoose from 'mongoose';
import { DEPARTMENTS, DESIGNATIONS } from '../config/rbac.js';

const EMPLOYMENT_TYPES_NEW = ['Full-Time', 'Contract', 'Intern', 'Notice-Period'];
const WORK_LOCATIONS = ['Office', 'Remote', 'Hybrid'];
const NA = 'not set yet';

const addressSchema = new mongoose.Schema({
  street:  { type: String, default: NA },
  city:    { type: String, default: NA },
  state:   { type: String, default: NA },
  pincode: { type: String, default: NA }
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name:         { type: String, default: NA },
  phone:        { type: String, default: NA },
  relationship: { type: String, default: NA }
}, { _id: false });

const referenceSchema = new mongoose.Schema({
  name:  { type: String, default: NA },
  phone: { type: String, default: NA },
  email: { type: String, default: NA }
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  emp_code: { type: String, unique: true, sparse: true },

  /* ── Section 1a: Basic Identity ─────────────────────── */
  fullName:             { type: String, required: true, trim: true },
  dob:                  { type: Date,   required: true },
  age:                  { type: Number },
  gender:               { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  maritalStatus:        { type: String, enum: ['Single', 'Married', 'Divorced', 'Engaged'], required: true },
  religion:             { type: String, default: NA },
  physicallyHandicapped:{ type: String, enum: ['Yes', 'No', NA], default: NA },

  /* ── Section 1b: Contact ─────────────────────────────── */
  personalMobile:    { type: String, required: true },
  personalEmail:     { type: String, required: true, lowercase: true, trim: true },
  currentAddress:    { type: addressSchema },
  sameAsCurrent:     { type: Boolean, default: false },
  permanentAddress:  { type: addressSchema },
  emergencyContacts: { type: [emergencyContactSchema], default: [] },

  /* ── Section 1c: Government ID ──────────────────────── */
  aadharNumber:   { type: String, required: true },
  panNumber:      { type: String, required: true },
  passportNumber: { type: String, default: NA },
  drivingLicence: { type: String, default: NA },
  voterIdNumber:  { type: String, default: NA },

  /* ── Section 1d: Education ──────────────────────────── */
  highestQualification: { type: String, required: true },
  graduationYear:       { type: Number, required: true },
  instituteName:        { type: String, required: true },
  previousEmployer:     { type: String, default: NA },
  references:           { type: [referenceSchema], default: [] },

  /* ── Section 2: Employment ──────────────────────────── */
  dateJoining:      { type: Date },
  employmentType:   { type: String, enum: EMPLOYMENT_TYPES_NEW },
  probationMonths:  { type: Number, default: 0 },
  confirmationDate: { type: Date },
  workLocation:     { type: String, enum: WORK_LOCATIONS },
  designation:      { type: String, enum: DESIGNATIONS },
  department:       { type: String, enum: DEPARTMENTS },
  reportingManager: { type: String, default: NA },
  officialEmail:    { type: String, lowercase: true, trim: true },
  workMobile:       { type: String, default: NA },
  laptopAssigned:   { type: String, default: NA },

  /* ── Section 3: Payroll ─────────────────────────────── */
  gross:             { type: Number },
  ctc:               { type: Number },
  accountHolderName: { type: String },
  bankNameBranch:    { type: String },
  accountNumber:     { type: String },
  ifscCode:          { type: String },
  pfApplicable:      { type: Boolean, default: false },
  pfNumber:          { type: String, default: NA },
  uanNumber:         { type: String, default: NA },
  esicApplicable:    { type: Boolean, default: false },
  esicNumber:        { type: String, default: NA },
  ptApplicable:      { type: Boolean, default: false },
  ptNumber:          { type: String, default: NA },
  tdsRegime:         { type: String, default: NA },
  form12bb:          { type: String, default: NA },

  /* ── Meta ───────────────────────────────────────────── */
  pendingSections:      { type: [String], default: [] },
  completionPercentage: { type: Number, default: 0 },
}, { timestamps: true });

/* ── Auto-age + copy address + completion % ──────────── */
employeeSchema.pre('save', function(next) {
  // Age
  if (this.dob) {
    const today = new Date();
    let age = today.getFullYear() - new Date(this.dob).getFullYear();
    const m = today.getMonth() - new Date(this.dob).getMonth();
    if (m < 0 || (m === 0 && today.getDate() < new Date(this.dob).getDate())) age--;
    this.age = age;
  }
  // Same address
  if (this.sameAsCurrent && this.currentAddress) {
    this.permanentAddress = { ...this.currentAddress.toObject() };
  }
  // Completion
  this.completionPercentage = calcCompletion(this);
  next();
});

function calcCompletion(e) {
  const required = [
    'fullName', 'dob', 'gender', 'maritalStatus',
    'personalMobile', 'personalEmail',
    'aadharNumber', 'panNumber',
    'highestQualification', 'graduationYear', 'instituteName',
    'dateJoining', 'employmentType', 'workLocation', 'designation', 'department', 'officialEmail',
    'gross', 'ctc', 'accountHolderName', 'bankNameBranch', 'accountNumber', 'ifscCode',
  ];
  const NA_VAL = 'not set yet';
  let filled = required.filter(f => {
    const v = e[f];
    return v !== undefined && v !== null && v !== '' && v !== NA_VAL;
  }).length;
  const hasEmergency = e.emergencyContacts && e.emergencyContacts.length > 0;
  const hasRef       = e.references && e.references.length > 0;
  const total = required.length + 2;
  filled += (hasEmergency ? 1 : 0) + (hasRef ? 1 : 0);
  return Math.round((filled / total) * 100);
}

export default mongoose.model('Employee', employeeSchema);

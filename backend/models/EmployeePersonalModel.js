import mongoose from 'mongoose';

const employeePersonalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emp_code: {
    type: String
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  age: {
    type: Number
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  personalEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  }
}, { timestamps: true });

// Calculate age from DOB
employeePersonalSchema.pre('save', function(next) {
  if (this.dob) {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

export default mongoose.model('EmployeePersonal', employeePersonalSchema);

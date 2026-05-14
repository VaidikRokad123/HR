import mongoose from 'mongoose';

const addressSchema = {
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' }
};

const employeeAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emp_code: {
    type: String
  },
  currentAddress: {
    type: addressSchema,
    required: true
  },
  permanentAddress: {
    type: addressSchema,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('EmployeeAddress', employeeAddressSchema);

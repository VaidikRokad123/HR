import { addressSchema, emergencyContactSchema } from "./commonSchemas.js";

export const contactFields = {
  personalMobile: { type: String, required: true, trim: true },
  personalEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  currentAddress: { type: addressSchema, default: () => ({}) },
  sameAsCurrent: { type: Boolean, default: false },
  permanentAddress: { type: addressSchema, default: () => ({}) },
  emergencyContacts: { type: [emergencyContactSchema], default: [] },
};

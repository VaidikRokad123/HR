import { addressSchema, emergencyContactSchema, NA } from "./commonSchemas.js";

export const contactFields = {
  personalMobile: { type: String, default: NA, trim: true },
  personalEmail: {
    type: String,
    default: NA,
    lowercase: true,
    trim: true,
  },
  currentAddress: { type: addressSchema, default: () => ({}) },
  sameAsCurrent: { type: Boolean, default: false },
  permanentAddress: { type: addressSchema, default: () => ({}) },
  emergencyContacts: { type: [emergencyContactSchema], default: [] },
};

import { NA, referenceSchema } from "./commonSchemas.js";

export const educationFields = {
  highestQualification: { type: String, required: true, trim: true },
  graduationYear: { type: Number, required: true },
  instituteName: { type: String, required: true, trim: true },
  previousEmployer: { type: String, default: NA, trim: true },
  references: { type: [referenceSchema], default: [] },
};

import { NA, referenceSchema } from "./commonSchemas.js";

export const educationFields = {
  highestQualification: { type: String, default: NA, trim: true },
  graduationYear: { type: Number, default: null },
  instituteName: { type: String, default: NA, trim: true },
  previousEmployer: { type: String, default: NA, trim: true },
  references: { type: [referenceSchema], default: [] },
};

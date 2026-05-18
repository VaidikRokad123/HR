import { NA } from "./commonSchemas.js";

export const familyFields = {
  fatherName: { type: String, default: NA, trim: true },
  motherName: { type: String, default: NA, trim: true },
  spouseName: { type: String, default: NA, trim: true },
  marriageDate: { type: Date },
};

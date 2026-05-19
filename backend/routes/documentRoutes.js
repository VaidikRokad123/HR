import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  compileDocument,
  getDocumentDraft,
  getDocumentTypes,
  inspectOfferLetter,
  prepareOfferLetter,
  inspectAppraisalLetter,
  prepareAppraisalLetter,
  uploadEmployeeDocument,
  getEmployeeDocuments
} from "../controllers/documentController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const empCode = req.params.emp_code;
    const dir = path.join("uploads", empCode);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.get("/types", getDocumentTypes);
router.get("/draft", getDocumentDraft);
router.get("/offer-letter/:userId/inspect", inspectOfferLetter);
router.post("/offer-letter/:userId/prepare", prepareOfferLetter);
router.get("/appraisal-letter/:userId/inspect", inspectAppraisalLetter);
router.post("/appraisal-letter/:userId/prepare", prepareAppraisalLetter);
router.post("/compile", compileDocument);

router.post("/upload/:emp_code", upload.single("file"), uploadEmployeeDocument);
router.get("/:emp_code", getEmployeeDocuments);

export default router;

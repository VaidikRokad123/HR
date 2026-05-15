import express from 'express';
import {
  compileDocument,
  getDocumentDraft,
  getDocumentTypes,
  inspectOfferLetter,
  prepareOfferLetter
} from '../controllers/documentController.js';
import { auth, hrOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/types', auth, hrOnly, getDocumentTypes);
router.get('/draft', auth, hrOnly, getDocumentDraft);
router.get('/offer-letter/:userId/inspect', auth, hrOnly, inspectOfferLetter);
router.post('/offer-letter/:userId/prepare', auth, hrOnly, prepareOfferLetter);
router.post('/compile', auth, hrOnly, compileDocument);

export default router;

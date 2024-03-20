import { Router } from "express";
const router = Router();

import protect from "../../middleware/auth/protect";
import { uploadEventShowcase } from "../../controllers/eventsShowcase/upload";
import { getAllLimitedInfo } from "../../controllers/eventsShowcase/getAllLimitedInfo";

router.post("/", protect, uploadEventShowcase);
router.get("/getLimitedInfo", getAllLimitedInfo);

export default router;

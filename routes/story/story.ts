import { Router } from "express";
const router = Router();

import { uploadStory } from "../../controllers/story/upload";
import { getLimitedInfo } from "../../controllers/story/getLimitedInfo";
import { getAllInfo } from "../../controllers/story/getAllInfo";

router.post("/", uploadStory);
router.get("/getLimitedInfo", getLimitedInfo);
router.get("/getAllInfo", getAllInfo);

export default router;

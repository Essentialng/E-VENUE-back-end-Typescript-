import { Router } from "express";
const router = Router();

import protect from "../../middleware/auth/protect";
import { uploadEvent } from "../../controllers/events/upload";
import { getLimitedInfo } from "../../controllers/events/getLimitedInfo";
import { search } from "../../controllers/events/search";
import { getEvent } from "../../controllers/events/getEvent";
import { countByCategory } from "../../controllers/events/countByCategory";
import { adminCategoryCount } from "../../controllers/events/getCatByEvenue";
import { limitedInfoByAdmin } from "../../controllers/events/getLimitedInfoByAdmin";

router.post("/", protect, uploadEvent);
router.post("/getLimitedInfo", getLimitedInfo);
router.get("/search", search);
router.get("/:event_id", getEvent);
router.get("/q/countByCategory", countByCategory);
router.get("/q/adminCategoryCount", adminCategoryCount);
router.get("/q/limitedInfoByAdmin", limitedInfoByAdmin);

export default router;

import { Router } from "express";
const router = Router();

import protect from "../../middleware/auth/protect";
import { uploadEventService } from "../../controllers/eventServices/upload";
import { getLimitedInfoForAll } from "../../controllers/eventServices/getLimitedInfoForAll";
import { search } from "../../controllers/eventServices/search";
import { getServiceProvider } from "../../controllers/eventServices/dynamicServiceProviders";
import { countByCategory } from "../../controllers/eventServices/countByCategory";
import { addReview } from "../../controllers/eventServices/addReview";
import { getReviews } from "../../controllers/eventServices/getReviews";

router.post("/", protect, uploadEventService);
router.post("/getLimitedInfoForAll", getLimitedInfoForAll);
router.get("/search", search);
router.get("/getServiceProvider/:sProvider_id", getServiceProvider);
router.get("/countByCategory", countByCategory);
router.post("/addReview", addReview);
router.get("/getReviews/:sProvider_id", getReviews);

export default router;

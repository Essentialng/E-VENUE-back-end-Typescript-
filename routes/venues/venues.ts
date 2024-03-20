import { Router } from "express";
const router = Router();

import { uploadVenue } from "../../controllers/venues/upload";
import { getAll } from "../../controllers/venues/getAll";
import { search } from "../../controllers/venues/search";
import { getVenue } from "../../controllers/venues/getVenue";
import { getLocationCount } from "../../controllers/venues/getLocationCount";
import { getCategoryCount } from "../../controllers/venues/getCategoryCount";

router.post("/", uploadVenue);
router.post("/getAll", getAll);
router.get("/search", search);
router.get("/:venue_id", getVenue);
router.get("/loc/getLocationCount", getLocationCount);
router.get("/catc/getCategoryCount", getCategoryCount);

export default router;

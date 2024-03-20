import { Router } from "express";
const router = Router();

import protect from "../../middleware/auth/protect";
import { uploadShortVideo } from "../../controllers/shortVideos/upload";
import { getLimitedInfo } from "../../controllers/shortVideos/getLimitedInfo";
import { getAllInfo } from "../../controllers/shortVideos/getAllInfo";
import { addComment } from "../../controllers/shortVideos/addComment";
import { addLike } from "../../controllers/shortVideos/addLike";
import { unLike } from "../../controllers/shortVideos/unLike";
import { increaseView } from "../../controllers/shortVideos/addViews";

router.post("/", protect, uploadShortVideo);
router.get("/", getLimitedInfo);
router.get("/getAllInfo", getAllInfo);
router.post("/addComment", addComment);
router.post("/addLike", addLike);
router.post("/unLike", unLike);
router.post("/increaseView", increaseView);

export default router;

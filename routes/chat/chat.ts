import { Router } from "express";
import { getChatHistory } from "../../controllers/chat/getHistory";
import { getInbox } from "../../controllers/chat/getInbox";

const router = Router();

router.get("/", getChatHistory);
router.get("/getInbox", getInbox);

export default router;

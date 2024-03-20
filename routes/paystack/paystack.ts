import { Router } from "express";
const router = Router();

import { payment } from "../../controllers/paystack/paystack";

router.get("/payment", payment);

export default router;

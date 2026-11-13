import { Router } from "express";
import { getIncidents } from "../controllers/incidentController.js";

const router = Router();
router.get("/", getIncidents);
export default router;

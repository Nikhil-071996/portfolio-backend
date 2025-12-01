import express from "express";
import { createProject, getProjects } from "../controller/projectController.js";

const router = express.Router();

router.get("/", getProjects);        
router.post("/", createProject);     

export default router;

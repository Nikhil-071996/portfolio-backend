import express from "express";
import upload from "../utils/multer.js";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../controller/projectController.js";

const router = express.Router();

router.get("/get-all", getProjects);

// Upload 1 thumbnail file
router.post("/create", upload.single("thumbnail"), createProject);

router.post("/update/:id", upload.single("thumbnail"), updateProject);

router.delete("/delete/:id", deleteProject);

export default router;

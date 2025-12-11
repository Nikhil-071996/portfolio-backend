import Project from "../model/projectSchema.js";

// GET all projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error });
  }
};

// CREATE project
export const createProject = async (req, res) => {
  try {
    const data = req.body;

    if (req.file) {
      data.thumbnail = req.file.path; // Cloudinary URL
    }

    const newProject = await Project.create(data);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(400).json({ message: "Error creating project", error });
  }
};



// UPDATE project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (req.file) {
      data.thumbnail = req.file.path; // Replace with new Cloudinary URL
    }

    const updatedProject = await Project.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: "Error updating project", error });
  }
};


// DELETE project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Project.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error });
  }
};


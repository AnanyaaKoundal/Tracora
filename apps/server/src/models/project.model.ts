import mongoose from "mongoose";
import User from './employee.model'

const projectSchema = new mongoose.Schema({
    project_id: {
        type: String,
        required: true,
        unique: true
    },
    project_name: {
        type: String,
        required: true,
        unique: true
    },
    project_description: {
        type: String,
        required: true,
    },
    project_start_date: {
        type: Date,
        required: true
    },
    project_end_date: {
        type: Date
    },
    project_status: {
        type: String,
        enum: ["Upcoming","Active", "Completed", "Inactive", "Overdue"],
        default: "Active"
    },
    created_by: {
        type: String,
        ref: 'Employee',
        required: true
    }
},
    { timestamps: true}
)

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
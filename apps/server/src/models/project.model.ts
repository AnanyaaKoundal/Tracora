import mongoose from "mongoose";
import User from './user.model'

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
    description: {
        type: String,
        required: true,
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ["Active", "Completed", "Inactive"],
        default: "Active"
    },
    team_members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User"
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},
    { timestamps: true}
)

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
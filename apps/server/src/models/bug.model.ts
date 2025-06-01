import mongoose from "mongoose";
import User from './user.model'
import Project from "./project.model";
import Feature from "./feature.model";
import Comment from "./comment.model";

const bugSchema = new mongoose.Schema({
    bug_id: {
        type: String,
        required: true,
        unique: true
    },
    bug_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Open", "Under Review", "Closed"],
        default: "Open"
    },
    feature_id: {
        type: String,
        ref: "Feature",
        required: true
    },
    project_id: {
        type: String,
        ref: "Project",
        required: true
    },
    reported_by: {
        type: String,
        ref: 'User',
        required: true
    },
    assigned_to: {
        type: String,
        ref: "User"
    },
    comments: [{
        type: String,
        ref: "Comment"
    }]
},
    { timestamps: true}
)

const Bug = mongoose.models.Bug || mongoose.model("Bug", bugSchema);

export default Bug;
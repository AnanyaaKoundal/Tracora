import mongoose from "mongoose";
import User from './employee.model'
import Project from "./project.model";

const featureSchema = new mongoose.Schema({
    feature_id: {
        type: String,
        required: true,
        unique: true
    },
    feature_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Development", "Deployed", "On Hold", "Testing"],
        default: "Development"
    },
    project_id: {
        type: String,
        ref: "Project",
        required: true
    },
    created_by: {
        type: String,
        ref: 'User',
        required: true
    },
    developer: {
        type: String,
        ref: "User"
    },
    tester: {
        type: String,
        ref: "User"
    }
},
    { timestamps: true}
)

const Feature = mongoose.models.Feature || mongoose.model("Feature", featureSchema);

export default Feature;
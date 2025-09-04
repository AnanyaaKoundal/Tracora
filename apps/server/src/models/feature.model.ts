import mongoose from "mongoose";

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
    feature_description: {
        type: String,
        required: true,
    },
    feature_status: {
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
        ref: 'Employee',
        required: true
    },
    developer: [{
        type: String,
        ref: "User"
    }],
},
    { timestamps: true}
)

const Feature = mongoose.models.Feature || mongoose.model("Feature", featureSchema);

export default Feature;
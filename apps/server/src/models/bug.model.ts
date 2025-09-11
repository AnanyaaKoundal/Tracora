import mongoose from "mongoose";

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
    bug_description: {
        type: String,
        required: true,
    },
    bug_status: {
        type: String,
        enum: ["Open", "Under Review", "Closed", "Fixed"],
        default: "Open"
    },
    // feature_id: {
    //     type: String,
    //     ref: "Feature",
    //     required: true
    // },
    reported_by: {
        type: String,
        ref: 'Employee',
        required: true
    },
    assigned_to: {
        type: String,
        ref: "Employee"
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
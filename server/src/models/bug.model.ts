import mongoose from "mongoose";
import Employee from "./employee.model";

export enum BugPriority {
    Critical = 1,
    High,
    Medium,
    Low,
    Trivial,
}


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
    bug_priority: {
        type: Number,
        enum: Object.values(BugPriority).filter(v => typeof v === "number"), // only 1,2,3,4,5
        default: BugPriority.Medium,
      },
    company_id: {
        type: String,
        required: true,
        ref: 'Company'
    },
    // Optional so bugs filed before projects existed stay valid. The client form
    // requires it, but the database must not, or old documents become unwriteable.
    project_id: {
        type: String,
        ref: 'Project'
    },
    reported_by: {
        type: String,
        ref: 'Employee',
        required: true
    },
    assigned_to: {
        type: String,
        ref: "Employee"
    },
    notify_users: [{
        type: String,
        ref: Employee
    }],
    comments: [{
        type: String,
        ref: "Comment"
    }]
},
    { timestamps: true }
)

const Bug = mongoose.models.Bug || mongoose.model("Bug", bugSchema);

export default Bug;
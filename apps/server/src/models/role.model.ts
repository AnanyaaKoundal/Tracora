import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    role_id: {
        type: String,
        required: true,
        unique: true
    },
    role_name: {
        type: String,
        required: true,
    },
    company_id: {
        type: String,
        required: true,
        ref: "Company"
    },
    is_default: {
        type: Boolean,
        default: false
    },
    is_admin: {
        type: Boolean,
        default: false
    }
},
    { timestamps: true }
)

roleSchema.index({ role_name: 1, company_id: 1 }, { unique: true })
roleSchema.index({ role_id: 1 })

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export default Role;
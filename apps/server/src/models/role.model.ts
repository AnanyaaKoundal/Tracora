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
        unique: true,
    }
},
    { timestamps: true}
)

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export default Role;
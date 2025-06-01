import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    role_id: {
        type: String,
        required: true,
        unique: true
    },
    role_name: {
        type: String,
        enum: ["Admin", "Manager", "Developer", "Tester"],
        required: true,
    }
},
    { timestamps: true}
)

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export default Role;
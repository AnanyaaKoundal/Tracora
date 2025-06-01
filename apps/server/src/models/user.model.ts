import mongoose from "mongoose";
import Role from "./role.model";
import Project from "./project.model";

const userSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    }, 
    user_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    roleId: [{
        type: String,
        ref: "Role"
    }],      
    projects : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    }
},
    { timestamps: true}
)

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
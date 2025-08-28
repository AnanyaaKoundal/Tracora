import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
    company_id:{
        type: String,
        required: true,
        ref: "Company"
    },
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
    contact_no:{
        type: String,
        required: true
    },
    roleId: [{
        type: String,
        ref: "Role"
    }],      
    project : {
        type: String,
        ref: "Project"
    }
},
    { timestamps: true}
)

const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

export default Employee;
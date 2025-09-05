import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
    company_id:{
        type: String,
        required: true,
        ref: "Company"
    },
    employee_id: {
        type: String,
        required: true,
        unique: true
    }, 
    employee_name: {
        type: String,
        required: true
    },
    employee_email: {
        type: String,
        required: true,
        unique: true
    },
    employee_contact_number:{
        type: String,
        required: true
    },
    roleId: [{
        type: String,
        ref: "Role"
    }],      
    projectId : {
        type: String,
        ref: "Project"
    }
},
    { timestamps: true}
)

const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

export default Employee;
import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    company_id:{
        type: String,
        required: true,
        unique: true,
    },
    company_name: {
        type: String,
        required: true,
        unique: true
    }, 
    company_email: {
        type: String,
        required: true
    },
    company_phone: {
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
},
    { timestamps: true}
)

const Company = mongoose.models.Company || mongoose.model("Company", companySchema);

export default Company;
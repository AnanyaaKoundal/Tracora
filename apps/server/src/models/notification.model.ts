import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
    title:{
        type: String,
    },
    participants: {
        type: String,
        ref: "Employee",
        required: true
    },
    message:{
        type: String,
        required: true
    },
    reference_id: {
        type: String,
        required: true
    },
    reference_name:{
        type: String,
    },
    sender_id: {
        type: String,
        ref: "Employee",
        required: true
    },
    sender_name: {
        type: String,
    },
    readStatus: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    }
},
    { timestamps: true }
)

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
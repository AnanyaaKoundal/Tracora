import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    participants: {
        type: [String],
        ref: "Employee",
        required: true
    },
    reference_id: {
        type: String,
        required: true
    },
    reference_name:{
        type: String,
        required: true
    },
    readStatus: {
        type: Map,
        of: Boolean,
        default: {}
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
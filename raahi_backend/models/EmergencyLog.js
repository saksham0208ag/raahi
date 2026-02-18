const mongoose=require("mongoose");
const emergencyLogSchema=new mongoose.Schema({
    passenger:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Passenger",
        required:true
    },
    location:{
        latitude:Number,
        longitude:Number
    },
    alertStatus:{
        type:String,
        default:"Sent"
    },
    time:{
        type:Date,
        default:Date.now
    }
});
module.exports=mongoose.model("EmergencyLog",emergencyLogSchema)
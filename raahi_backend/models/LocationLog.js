const mongoose=require("mongoose")
const locationLogSchema=new mongoose.Schema({
    bus:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Bus",
        required:true
    },
    latitude:{
        type:Number,
        required:true
    },
    longitude:{
        type:Number,
        required:true
    },
    timestamp:{
        type:Date,
        default:Date.now
    }
});

module.exports=mongoose.model("LocationLog",locationLogSchema)
const mongoose=require("mongoose");
const driverSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    licenseNumber:{
        type:String,
        required:true,
        unique:true
    }
});
module.exports=mongoose.model("Driver",driverSchema)
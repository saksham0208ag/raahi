const mongoose=require("mongoose");
const driverSchema=new mongoose.Schema({
    organizationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Organization",
        index:true
    },
    name:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    driverCode:{
        type:String,
        required:true,
        trim:true
    },
    licenseNumber:{
        type:String,
        required:true
    },
    assignedBus:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Bus"
    },
    status:{
        type:String,
        enum:["active","inactive"],
        default:"active"
    }
});
driverSchema.index({ organizationId: 1, driverCode: 1 }, { unique: true });
driverSchema.index({ organizationId: 1, licenseNumber: 1 }, { unique: true });
module.exports=mongoose.model("Driver",driverSchema)

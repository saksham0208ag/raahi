const mongoose=require("mongoose");
const busSchema=new mongoose.Schema({
    organizationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Organization",
        index:true
    },
    busNumber:{
        type:String,
        required:true,
        trim:true
    },
     type:{
        type:String,
        enum:['INSTITUTION','CITY'],
        required:true
    },
    institutionName: {
    type: String,
  },
  route:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Route"
  },
  driver:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Driver"
  },
  status:{
    type:String,
    enum:["running","maintenance","not_in_use","active","inactive"],
    default:"running"
  }
 });

busSchema.index({ organizationId: 1, busNumber: 1 }, { unique: true });
module.exports=mongoose.model("Bus",busSchema)

const mongoose=require("mongoose");
const busSchema=new mongoose.Schema({
    busNumber:{
        type:String,
        required:true,
        unique:true
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
  status:{
    type:String,
    enum:["running","maintenance","not_in_use","active","inactive"],
    default:"running"
  }
 });
module.exports=mongoose.model("Bus",busSchema)

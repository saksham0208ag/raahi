const mongoose = require("mongoose");
const passengerSchema=new mongoose.Schema({
organizationId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Organization",
    index:true
},
passengerType:{
    type:String,
    enum:["student","city"],
    default:"student",
    index:true
},
name:{
    type:String,
    required:true
},
rollNo:{
    type:String,
    required:function(){
        return this.passengerType !== "city";
    },
    trim:true
},
phone:{
    type:String,
    trim:true
},
stopName:{
    type:String,
    required:function(){
        return this.passengerType !== "city";
    },
    trim:true,
    default:""
},
destinationStop:{
    type:String,
    trim:true,
    default:""
},
bus:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Bus"
},
route:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Route"
},
gaurdian:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Gaurdian"
},
status:{
    type:String,
    enum:["active","inactive"],
    default:"active"
}
});
passengerSchema.index(
    { organizationId: 1, rollNo: 1 },
    { unique: true, partialFilterExpression: { passengerType: "student", rollNo: { $type: "string" } } }
);
passengerSchema.index(
    { organizationId: 1, phone: 1 },
    { unique: true, partialFilterExpression: { passengerType: "city", phone: { $type: "string" } } }
);
module.exports=mongoose.model("Passenger",passengerSchema)

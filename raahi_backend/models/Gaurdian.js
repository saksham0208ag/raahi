const mongoose=require("mongoose");
const gaurdianSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    relation:{
        type:String
    }
});
module.exports=mongoose.model("Gaurdian",gaurdianSchema)

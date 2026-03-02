const mongoose=require('mongoose');
const routeSchema=new mongoose.Schema({
    organizationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Organization",
        index:true
    },
    routeName:{
        type:String,
        required:true
    },
    startPoint:{
        type:String,
        required:true
    },
    endPoint:{
        type:String,
        required:true
    },
    stops:[{
        type:String
    }]
});
routeSchema.index({ organizationId: 1, routeName: 1 }, { unique: true });
module.exports=mongoose.model("Route",routeSchema)

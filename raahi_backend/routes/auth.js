const express=require('express');
const router=express.Router();
const Passenger=require("../models/Passenger");
const mongoose=require("mongoose");

router.post("/login",async(req,res)=>{
    const{role,userId}=req.body;

    try{
        if(role==='regular'){
            const query = mongoose.Types.ObjectId.isValid(userId)
                ? { $or: [{ _id: userId }, { rollNo: userId }] }
                : { rollNo: userId };

            const passenger=await Passenger.findOne(query);
            if(!passenger){
                return res.status(404).json({message:"User not found"});
            }
            return res.json({
                role:"regular",
                passengerId:passenger._id,
                busId:passenger.bus
            });
        }

        if(role==='organisation'){
            return res.json({
                role:"organisation",
                busId:"6976de06d31cd7b4eccebea8"
            });
        }
        res.status(404).json({message:"Invalid role"});
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});
module.exports=router;

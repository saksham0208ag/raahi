const express=require("express");
const router=express.Router();
const Passenger=require("../models/Passenger");
const Gaurdian=require("../models/Gaurdian");
const Bus=require("../models/Bus");
const Route=require("../models/Route");

const escapeRegex=(value)=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

const findRouteAndBusByStop=async(stopName)=>{
    const normalizedStop=String(stopName || "").trim();
    if(!normalizedStop){
        return null;
    }

    const stopRegex=`${escapeRegex(normalizedStop)}`;
    const route=await Route.findOne({
        $or:[
            {
                stops:{
                    $elemMatch:{
                        $regex:stopRegex,
                        $options:"i"
                    }
                }
            },
            {
                startPoint:{
                    $regex:stopRegex,
                    $options:"i"
                }
            },
            {
                endPoint:{
                    $regex:stopRegex,
                    $options:"i"
                }
            }
        ]
    });

    if(!route){
        return {route:null,bus:null,reason:"ROUTE_NOT_FOUND"};
    }

    const bus=await Bus.findOne({
        route:route._id,
        status:{$in:["running","active"]}
    }) || await Bus.findOne({route:route._id});

    if(!bus){
        return {route,bus:null,reason:"BUS_NOT_FOUND"};
    }

    return {route,bus,reason:null};
};

/* ALL PASSENGERS */
router.get("/",async(req,res)=>{
    const passengers=await Passenger.find().populate("gaurdian bus route");
    res.json(passengers);
});

/* ADD PASSENGER */
router.post("/",async(req,res)=>{
    try{
        const stopName=String(req.body.stopName || "").trim();
        if(!stopName){
            return res.status(400).json({error:"Stop name is required"});
        }

        const routeAndBus=await findRouteAndBusByStop(stopName);
        if(!routeAndBus || routeAndBus.reason==="ROUTE_NOT_FOUND"){
            return res.status(400).json({error:"No route found for this stop name"});
        }
        if(routeAndBus.reason==="BUS_NOT_FOUND"){
            return res.status(400).json({error:"Route found, but no bus is assigned to this route"});
        }

        const gaurdianName=req.body.gaurdianName || req.body.guardianName || req.body.gaurdian?.name || req.body.guardian?.name;
        const gaurdianPhone=req.body.gaurdianPhone || req.body.guardianPhone || req.body.gaurdian?.phone || req.body.guardian?.phone;
        const gaurdianEmail=req.body.gaurdianEmail || req.body.guardianEmail || req.body.gaurdian?.email || req.body.guardian?.email;

        if(!gaurdianName || !gaurdianPhone || !gaurdianEmail){
            return res.status(400).json({error:"Guardian name, phone and email are required"});
        }

        const gaurdian=await Gaurdian.create({
            name:gaurdianName,
            phone:String(gaurdianPhone),
            email:String(gaurdianEmail).toLowerCase()
        });

        const payload={
            ...req.body,
            rollNo:req.body.rollNo || req.body.rollno || req.body.roll_no || req.body.rollNumber,
            stopName,
            bus:routeAndBus.bus._id,
            route:routeAndBus.route._id,
            gaurdian:gaurdian._id
        };

        delete payload.busId;
        delete payload.busNumber;

        const passenger=new Passenger(payload);
        await passenger.save();
        const savedPassenger=await Passenger.findById(passenger._id).populate("gaurdian bus route");
        res.json(savedPassenger);
    }catch(err){
        res.status(400).json({error:err.message});
    }
});

/* UPDATE PASSENGER */
router.put("/:id",async(req,res)=>{
    try{
        const passenger=await Passenger.findById(req.params.id);
        if(!passenger){
            return res.status(404).json({error:"Passenger not found"});
        }

        const gaurdianName=req.body.gaurdianName || req.body.guardianName || req.body.gaurdian?.name || req.body.guardian?.name;
        const gaurdianPhone=req.body.gaurdianPhone || req.body.guardianPhone || req.body.gaurdian?.phone || req.body.guardian?.phone;
        const gaurdianEmail=req.body.gaurdianEmail || req.body.guardianEmail || req.body.gaurdian?.email || req.body.guardian?.email;

        if(gaurdianName || gaurdianPhone || gaurdianEmail){
            if(!gaurdianName || !gaurdianPhone || !gaurdianEmail){
                return res.status(400).json({error:"Guardian name, phone and email are required"});
            }

            if(passenger.gaurdian){
                await Gaurdian.findByIdAndUpdate(
                    passenger.gaurdian,
                    {
                        name:gaurdianName,
                        phone:String(gaurdianPhone),
                        email:String(gaurdianEmail).toLowerCase()
                    },
                    {new:true,runValidators:true}
                );
            }else{
                const gaurdian=await Gaurdian.create({
                    name:gaurdianName,
                    phone:String(gaurdianPhone),
                    email:String(gaurdianEmail).toLowerCase()
                });
                passenger.gaurdian=gaurdian._id;
                await passenger.save();
            }
        }

        const payload={
            ...req.body,
            rollNo:req.body.rollNo || req.body.rollno || req.body.roll_no || req.body.rollNumber
        };

        const stopName=String(req.body.stopName || "").trim();
        if(stopName){
            const routeAndBus=await findRouteAndBusByStop(stopName);
            if(!routeAndBus || routeAndBus.reason==="ROUTE_NOT_FOUND"){
                return res.status(400).json({error:"No route found for this stop name"});
            }
            if(routeAndBus.reason==="BUS_NOT_FOUND"){
                return res.status(400).json({error:"Route found, but no bus is assigned to this route"});
            }
            payload.stopName=stopName;
            payload.bus=routeAndBus.bus._id;
            payload.route=routeAndBus.route._id;
        }

        delete payload.gaurdianName;
        delete payload.guardianName;
        delete payload.gaurdianPhone;
        delete payload.guardianPhone;
        delete payload.gaurdianEmail;
        delete payload.guardianEmail;
        delete payload.gaurdian;
        delete payload.guardian;
        delete payload.busId;
        delete payload.busNumber;

        const updated=await Passenger.findByIdAndUpdate(
            req.params.id,
            payload,
            {new:true,runValidators:true}
        ).populate("gaurdian bus route");
        res.json(updated);
    }catch(err){
        res.status(400).json({error:err.message});
    }
});

/* DELETE PASSENGER */
router.delete("/:id",async(req,res)=>{
    try{
        const deletedPassenger=await Passenger.findByIdAndDelete(req.params.id);
        if(deletedPassenger?.gaurdian){
            await Gaurdian.findByIdAndDelete(deletedPassenger.gaurdian);
        }
        res.json({success:true});
    }catch(err){
        res.status(400).json({error:err.message});
    }
});

module.exports=router;

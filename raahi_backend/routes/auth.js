const express=require('express');
const router=express.Router();
const Passenger=require("../models/Passenger");
const mongoose=require("mongoose");
const Organization=require("../models/Organization");
const { isSubscriptionExpired } = require("../middleware/organizationContext");
const Driver=require("../models/Driver");
const Bus=require("../models/Bus");

router.post("/login",async(req,res)=>{
    const{role,userId}=req.body;
    const organizationCode = String(req.body.organizationCode || req.organizationCode || "").trim().toLowerCase();

    try{
        let organization = req.organization || null;
        if (!organization && organizationCode) {
            organization = await Organization.findOne({ code: organizationCode });
        }
        if (!organization) {
            return res.status(400).json({ message: "Valid organization code is required" });
        }
        if (isSubscriptionExpired(organization) && organization.status !== "inactive") {
            organization.status = "inactive";
            await organization.save();
        }
        if (organization.status !== "active") {
            return res.status(403).json({ message: "Organization subscription is inactive/expired" });
        }

        if(role==='regular'){
            const query = mongoose.Types.ObjectId.isValid(userId)
                ? { $or: [{ _id: userId }, { rollNo: userId }] }
                : { rollNo: userId };

            const passenger=await Passenger.findOne({
                ...query,
                organizationId: organization._id
            })
                .populate("gaurdian")
                .populate("bus")
                .populate("route");
            if(!passenger){
                return res.status(404).json({message:"User not found"});
            }
            return res.json({
                role:"regular",
                organizationId: organization._id,
                organizationCode: organization.code,
                passengerId:passenger._id,
                busId:passenger.bus?._id || passenger.bus,
                passengerDetails:{
                    id:passenger._id,
                    name:passenger.name,
                    rollNo:passenger.rollNo,
                    stopName:passenger.stopName,
                    status:passenger.status,
                    busId:passenger.bus?._id || null,
                    busNumber:passenger.bus?.busNumber || "",
                    routeId:passenger.route?._id || null,
                    routeName:passenger.route?.routeName || "",
                    routeStartPoint:passenger.route?.startPoint || "",
                    routeEndPoint:passenger.route?.endPoint || "",
                    routeStops:Array.isArray(passenger.route?.stops) ? passenger.route.stops : [],
                    guardianName:passenger.gaurdian?.name || "",
                    guardianPhone:passenger.gaurdian?.phone || "",
                    guardianEmail:passenger.gaurdian?.email || ""
                }
            });
        }

        if(role==='organisation'){
            return res.json({
                role:"organisation",
                organizationId: organization._id,
                organizationCode: organization.code,
                busId:"6976de06d31cd7b4eccebea8"
            });
        }
        if(role==='driver'){
            const normalizedDriverCode = String(userId || "").trim().toLowerCase();
            if (!normalizedDriverCode) {
                return res.status(400).json({ message: "Driver code is required" });
            }

            const driver = await Driver.findOne({
                organizationId: organization._id,
                driverCode: normalizedDriverCode,
                status: "active"
            }).populate("assignedBus");

            if (!driver) {
                return res.status(404).json({ message: "Driver not found or inactive" });
            }

            const buses = await Bus.find({
                organizationId: organization._id
            }).select("_id busNumber status route");

            return res.json({
                role: "driver",
                organizationId: organization._id,
                organizationCode: organization.code,
                driverDetails: {
                    id: driver._id,
                    name: driver.name,
                    phone: driver.phone,
                    driverCode: driver.driverCode,
                    assignedBusId: driver.assignedBus?._id || null,
                    assignedBusNumber: driver.assignedBus?.busNumber || ""
                },
                buses: buses || []
            });
        }
        res.status(404).json({message:"Invalid role"});
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});
module.exports=router;

const mongoose = require("mongoose")



 const addressSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true
    },
     address:[
      { 
        name:{
            type:String,
            required: true
        },
        phone:{
            type:Number,
            required: true
        },
        building:{
            type:String,
            required: true
        }, city:{
            type:String,
            required: true
        },
        district:{
            type:String,
            required: true
        },
        state:{
            type:String,
            required: true
        },
        pincode:{
            type:String,
            required: true
        }
       
      }
     ]
 })


 const addressModel = mongoose.model("address", addressSchema)

module.exports = addressModel
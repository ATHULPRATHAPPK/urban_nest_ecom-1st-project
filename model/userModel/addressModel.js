const mongoose = require("mongoose")



 const addressSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true
    },
     address:[
      { 
        firstName:{
            type:String,
            required: true
        },
        secondName:{
            type:String,
            required: true
        },
        mobileNumber:{
            type:Number,
            required: true
        }, email:{
            type:String,
            required: true
        },
        pincode:{
            type:Number,
            required: true
        },
        place:{
            type:String,
            required: true
        },
        state:{
            type:String,
            required: true
        }
       
      }
     ]
 })


 const addressModel = mongoose.model("address", addressSchema)

module.exports = addressModel
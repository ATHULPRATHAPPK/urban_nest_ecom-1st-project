const mongoose= require("mongoose")

// user schema-----------------------------------------------------------------------

const couponData= new mongoose.Schema({
   
    code:{
        type:String,
        require:true
    },
    discountType:{
        type:String,
        require:true
    },
    discountAmount:{
        type:Number,
        require:true
    },
    startDate:{
        type:String,
        require:true
    },
    expirationDate:{
        type:String,
        require:true
    },
    minOrderAmount:{
        type:Number,
        require:true
    },
    userIds:[{
        type: String
    }]
  
})


module.exports= mongoose.model("coupon",couponData)

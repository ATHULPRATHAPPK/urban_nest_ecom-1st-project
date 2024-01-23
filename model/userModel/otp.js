const mongoose=  require("mongoose")


const otpSchema = new mongoose.Schema({
    userId:{
        type:String,
        require:true
    },
    otp:{
        type:String,
        require:true
    },
    expiresAt:{
        type:Date,
        default:Date.now()+60*1000
       
    }
})

const otpModel = mongoose.model("otp",otpSchema)

module.exports= otpModel
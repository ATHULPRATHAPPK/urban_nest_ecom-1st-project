const mongoose= require("mongoose")

// user schema-----------------------------------------------------------------------

const offerData = new mongoose.Schema({
   
    offerName:{
        type:String,
        require:true
    },
percentage:{
        type:Number,
        require:true
    },   
    startDate:{
        type:String,
        require:true
    },
    endDate:{
        type:String,
        require:true
    },
   
  
})


module.exports= mongoose.model("offer",offerData)
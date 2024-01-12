
const mongoose= require("mongoose")

// user schema-----------------------------------------------------------------------

const adminData= new mongoose.Schema({
   
    email:{
        type: String,
        require:true
    },
    password:{
        type: String,
        require:true
    }
})

//user model----------------------------- 
module.exports= mongoose.model("admin",adminData)



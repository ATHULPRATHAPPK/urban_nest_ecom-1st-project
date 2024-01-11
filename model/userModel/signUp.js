
const mongoose= require("mongoose")

// user schema-----------------------------------------------------------------------

const userData= new mongoose.Schema({
    name:{
        type: String,
        require:true
    },
    email:{
        type: String,
        require:true
    },
    password:{
        type: Number,
        require:true
    }
})

//user model----------------------------- 
const usermodel= new mongoose.model("userData",userData)

module.exports=usermodel
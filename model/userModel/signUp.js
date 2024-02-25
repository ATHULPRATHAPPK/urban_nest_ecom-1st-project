
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
        type: String,
        require:true
    },
    mobile:{
        type: Number,
       
    },

    status:{
    type:Number,    
    default:0,
    require: true
    },
    is_verified:{
    type :Number,
    default:0,
    require:true
    },
     is_verified:{
    type :Number,
    default:0,
    require:true
    },
    is_deleted:{
     type :Number,
     default:0,
    require:true
        }
        
})

//user model----------------------------- 
const usermodel= new mongoose.model("userData",userData)

module.exports=usermodel
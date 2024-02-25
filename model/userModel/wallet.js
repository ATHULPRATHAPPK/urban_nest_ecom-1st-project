const mongoose = require("mongoose")



 const walletSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true
    },
    balance: {
        default:0,
        type:Number,      
        required: true
    },
     transaction:[
      { 
        date:{
            type:String,
          
        },
        amount:{
            type:Number,
           
        },
        reason:{
            type:String,
         
        }
         
      }
     ]
    
 })


 const walletModel = mongoose.model("wallet", walletSchema)

module.exports = walletModel
const mongoose=  require("mongoose")


const orderSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true
    },
    address:{
       type :Object,
       required :true
    },
   
    product: [

        {   productId:{
              type: String,
              required: true
           },
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },

            price: {
                type: Number,
                required: true
            },

            total: {
                type: Number,
                required: true
            },
            adminStatus:{
                default:1,
                type: Number,
                required: true
            },
            returnStatus:{
                default:0,
                type: Number,
                required: true
            },returnText:{
                default:"",
                type: String,
               
            },
            paymentType: {
       
                type: String,
               
            },
            discount : {
       
                type: Number,
                default: 0
               
            },
           
            productImage: [
                {
                    filename: {
                        type: String,
                        require: true
                    },
                    path: {
                        type: String,
                        require: true
                    },
                    resizedFile: {
                        type: String,
                        require: true
                    },
                }
            ]

        }
    ],
    subTotal:{
        type: Number,
        require: true
    },
    paymentStatus:{
        type: Boolean,
        default: true
    },
    isAdminVerify:{
        default:true,
        type: Boolean,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
      },
   
      
          
 
})

const orderModel = mongoose.model("order",orderSchema)

module.exports= orderModel


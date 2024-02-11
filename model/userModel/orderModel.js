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
            isApproved:{
                default:false,
                type: Boolean,
                required: true
            },
            isCancelled:{
                default:false,
                type: Boolean,
                required: true
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
    orderStatus:{
        default:false,
        type: Boolean,
        required: true
    },
    isAdminVerify:{
        default:true,
        type: Boolean,
        required: true
    }
          
 
})

const orderModel = mongoose.model("order",orderSchema)

module.exports= orderModel


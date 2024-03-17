const mongoose = require("mongoose")


const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true
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
            stock :{
                type: Number,
               
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
        required: true

    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
   

})

const cartModel = mongoose.model("cart", cartSchema)

module.exports = cartModel





const mongoose=  require("mongoose")


const wishlistSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true
    },
    
    product: [

        {   productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
           }
        }
    ], 
} )

const wishlistModel = mongoose.model("wishlist",wishlistSchema)

module.exports= wishlistModel

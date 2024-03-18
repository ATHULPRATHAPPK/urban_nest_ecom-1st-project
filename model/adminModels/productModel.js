const  mongoose = require("mongoose")


 const productSchema= new mongoose.Schema({
    productName:{
        type:String,
        require:true
    },
    brandName:{
        type:String,
        require:true
    },

    discription:{
        type:String,
        require:true
    },   
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categorie',
        required: true
    },
    
    color:{
        type:String,
        require:true
    },
    processor:{
        type:String,
        require:true
    },
    ram:{
        type:String,
        require:true
    },
    internalStorage:{
        type:String,
        require:true
    },
    quantity:{
        type:Number,
        require:true
    },
    price:{
        type:String,
        require:true
    },
    productImage: [
        {
            filename:{
                type:String,
                require:true
            },
            path: {
                type:String,
                require:true
            },
            resizedFile: {
                type:String,
                require:true
            },
        }
    ],
    is_listed :{
        type:Boolean,
        default:true,
        require:true
    },
    is_deleted :{
        type:Boolean,
        default:true,
        require:true
    },
   offer :{
        type:Number,
        default:0,
       
    },
    

    
 })

 const productModel = new mongoose.model("product",productSchema)

 module.exports= productModel

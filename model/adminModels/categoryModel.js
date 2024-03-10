const mongoose =require("mongoose")



const categorySchema = new mongoose.Schema ({
     
    category : {
        type:String,
        require:true
    },
    subcategory: {
        type:String,
        require:true
    },
    discription : {
        type:String,
        require:true
    },
    status:{
        type:Boolean,
        default:true,
       
    },
    offerPercentage:{
        type:Number,
        default:0,
    }
})


const categoryModel= new mongoose.model("categorie",categorySchema)

module.exports = categoryModel
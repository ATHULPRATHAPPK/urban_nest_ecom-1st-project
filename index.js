const { error } = require("console")
const express= require("express")
const app = express()
const mongoose = require("mongoose")
const userRouter= require("./routers/userRouters")
const path = require("path")
 


mongoose.connect("mongodb://127.0.0.1:27017/ecommerce").then(()=>{
    console.log("db connected....")
}).catch((error)=>{
    console.log(error.message)
})
userRouter.use(express.static(path.join(__dirname,'public')))


app.use("/",userRouter)



app.listen(3001,()=>{
    console.log("server connected....");
})
const express= require("express")
const path = require("path")
const userRouter= express()
const controllers= require("../controller/userController/usercontrol")
const ejs= require("ejs")
userRouter.set("view engine","ejs")
userRouter.set("views","views/userViews")
const bodyparser= require("body-parser")
userRouter.use(bodyparser.urlencoded({extended:true}))
userRouter.use(bodyparser.json())

userRouter.get("/home",controllers.loadhome)
userRouter.post("/home",controllers.insertdata)







module.exports= userRouter
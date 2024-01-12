const express= require("express")
const path = require("path")
const adminRouter= express()
const controllers= require("../controller/adminController/adminControl")
const config=require("../config/config")
const ejs= require("ejs")
adminRouter.set("view engine","ejs")
adminRouter.set("views","views/adminViews")
const bodyparser= require("body-parser")
const session = require("express-session")

adminRouter.use(bodyparser.urlencoded({extended:true}))
adminRouter.use(bodyparser.json())


adminRouter.get("/admin",controllers.adminlogin)
adminRouter.post("/adminhome",controllers.adminload)




module.exports= adminRouter
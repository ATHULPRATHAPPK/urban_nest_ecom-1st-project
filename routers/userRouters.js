const express= require("express")
const path = require("path")
const userRouter= express()
const controllers= require("../controller/userController/usercontrol")
const config=require("../config/config")
const ejs= require("ejs")
userRouter.set("view engine","ejs")
userRouter.set("views","views/userViews")
const bodyparser= require("body-parser")
const session = require("express-session")
userRouter.use(bodyparser.urlencoded({extended:true}))
userRouter.use(bodyparser.json())
userRouter.use(session({secret:config.sessionSecret}))


userRouter.get("/home",controllers.loadhome)
userRouter.get("/login",controllers.loadlogin)
userRouter.get("/register",controllers.loadRegister)
userRouter.post("/register",controllers.insertdata)
userRouter.post("/otp",controllers.otpVerify)
userRouter.post("/login",controllers.loginload)
userRouter.get("/forgotpassword",controllers.forgotpassword)
userRouter.post("/forgotpassword",controllers.otpForgotpass)
userRouter.post("/otpForgotpassword",controllers.otpVerifyForgot)
userRouter.post("/passwordReset",controllers.resetPassword)







module.exports= userRouter
const express= require("express")
const path = require("path")
const userRouter= express()
const controllers= require("../controller/userController/usercontrol")
const config=require("../config/config")
const nocache = require("nocache");
const ejs= require("ejs")
userRouter.set("view engine","ejs")
userRouter.set("views","views/userViews")
const bodyparser= require("body-parser")
const session = require("express-session") 
const userMiddleware = require("../middleware/userMiddleware")

userRouter.use(bodyparser.urlencoded({extended:true}))
userRouter.use(bodyparser.json())
userRouter.use(nocache());

userRouter.get("/",controllers.loadhome)

userRouter.get("/login",userMiddleware.isLogin,controllers.loadlogin)
userRouter.post("/login",controllers.loginload)
userRouter.get("/register",userMiddleware.isLogin,controllers.loadRegister)
userRouter.post("/register",controllers.insertdata)
userRouter.post("/otp",controllers.otpVerify)

userRouter.get("/forgotpassword",controllers.forgotpassword)
userRouter.post("/forgotpassword",controllers.otpForgotpass)
userRouter.post("/otpForgotpassword",controllers.otpVerifyForgot)
userRouter.post("/passwordReset",controllers.resetPassword)


userRouter.get("/user-product",controllers.loadProduct)
userRouter.get("/user-laptops",controllers.loadLaptops)
userRouter.get("/user-mobiles",controllers.loadMobiles)
userRouter.get("/user-tablets",controllers.loadTablets)
userRouter.get("/user-allProducts",controllers.loadAllProducts)
userRouter.get("/user-logout",controllers.usereLogout)

userRouter.post("/addCart",controllers.addToCart)
userRouter.post('/addToCartWishlist',controllers.addCartFromWishlist)
userRouter.get("/cart",controllers.loadCart)
userRouter.post("/cartDelete",controllers.cartDelete)
userRouter.post("/updateQuantity",controllers.updateQuantity)

userRouter.get("/account",controllers.userAccount)
userRouter.get("/userOrder",controllers.userOrders)
userRouter.get("/userAddress",controllers.userAddress)
userRouter.get("/userWishlist",controllers.userWishlist)

userRouter.get("/userWallet",controllers.loadWallet)
userRouter.post('/editDetails',controllers.editDetails)



userRouter.post('/addAddress',controllers.addAddress)
userRouter.post('/deleteaddress', controllers.deleteAddress);
userRouter.get("/edit-address/:id",controllers.loadEditAddress)
userRouter.post('/editAddress',controllers.editAddress)
userRouter.get("/checkout",controllers.loadCheckout)
userRouter.post("/order",controllers.loadOrder)
userRouter.get("/orderConfirm",controllers.OrderComplete)
userRouter.post("/processPayment",controllers.paymentCompleted)
userRouter.post("/processRePayment",controllers.retryPaymentCompleted)
userRouter.post('/failedRazorPayment',controllers.paymentfailed)
userRouter.post("/failedRazorRePayment",controllers.rePaymentFailed)
userRouter.get("/paymentFailed",controllers.failedPage)
userRouter.post("/retryPayment",controllers.retryPayment)
userRouter.post("/changePassword",controllers.changePassword)

userRouter.get("/orderStatus",controllers.loadOrderStatus)
userRouter.post("/viewOrderDetails",controllers.orderStatus)
userRouter.post("/cancelOrder",controllers.orderCancel)
userRouter.post("/returnRequest",controllers.returnRequest)


userRouter.post("/addWishlist",controllers.addWishlist)
userRouter.post("/removeWishlist",controllers.removeWishlist )


userRouter.post("/userCoupon",controllers.addUserCoupon)
userRouter.get("/couponDash",controllers.userCoupon)
userRouter.get("/downloadInvoice/:productId",controllers.loadInvoice )


module.exports= userRouter
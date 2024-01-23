
const mongoose = require("mongoose")
const path = require("path")
const express = require("express")
const app = express()

const userRouter = require("../../routers/userRouters")
const ejs = require("ejs")
const userModel = require("../../model/userModel/signUp")
const otpModel = require("../../model/userModel/otp")
const { log } = require("console")
const bodyParser = require("body-parser")
const bodyparser = require("body-parser")
const nodemailer = require("nodemailer")
const mailgen = require("mailgen")

app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

app.set("view engine", "ejs")
app.set(path.join(__dirname, "views", "userViews"))







const loadhome = (req, res) => {


    res.render("home")
}

const loadlogin = (req, res) => {

    res.render("userlogin")
}

const loadRegister = (req, res) => {
    res.render("userRegister")
}

const insertdata = async (req, res) => {

    try {

  const alreadyExist = await userModel.findOne({email:req.body.email})

  if(alreadyExist){

    res.render("userRegister",{message:"This email already exist"})
  }
   else{
        console.log(`mail ${req.body.email}`);
        const insertdb = await new userModel({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            mobile: req.body.number
        })

        await insertdb.save()

        // ---------------------------------------------------------nodemailer-----------------------------------------

        
// const mailcontent = (req,res)=>{

    function otpGenerator (length){       //otp generating function
        let otp =""
       
        for(let i= 0;i<length;i++){
       
           otp= otp+(Math.floor(Math.random()*10).toString())
        }
        return otp
       console.log(otp);
       
       }

    let otp=  otpGenerator(4)        
    console.log(`otp is ${otp}`);    //returning otp
//    const userMail = req.body.email
     let config ={
         service : "gmail",
         auth :{
             user:"athulprathap216@gmail.com",     //email and password of sender
             pass:"hsse gmvs vpvo ghdd"
            
         }
     }
     let transporter = nodemailer.createTransport(config)
  
      let mailgenerator= new mailgen({
          theme : "default",
          product : {
              name : "Urban Nest",
              link : "https://http://localhost:3001/home"
          }
      })
 let response = {
     body :{
         name: req.body.name,
         intro: `urban nest verification code ${otp}`,
         outro: "thankyou"
     }
 }
 
 let mail = mailgenerator.generate(response)
 
 let message ={
     from : "athulprathap216@gmail.com" ,
     to : req.body.email,
     subject : "otp verification",
     html :mail
 
 }
 
 transporter.sendMail(message).then(()=>{
    //  return res.json({
    //      msg: "mail sended"
    //  })
    console.log(`mail sended to the ${req.body.email}`);
 }).catch((error)=>{
     console.log(error);
 })
    



  const insertotp = await new  otpModel({

    userId:req.body.email,
    otp: otp,
    expiresAt:Date.now()

  })
 
  await insertotp.save()

   let userid=req.body.email

        res.render("otpVerification",{data:userid})
    }

    //---------------------delete otp---------------------------------after two minites--------
    const deleteExpiredOtps = async () => {
        try {
          const currentTimestamp = new Date();
          await otpModel.deleteMany({ expiresAt: { $lt: currentTimestamp } });
          console.log('Expired OTPs deleted successfully.');
        } catch (error) {
          console.error('Error deleting expired OTPs:', error.message);
        } 
      
      };
      
      setTimeout(deleteExpiredOtps,60*1000)
    //   ------------------------------------------------------------------------
}
    catch (error) {
        console.log(error.message);
    }
}


const otpVerify = async (req,res)=>{

    let otp1 = req.body.digit1
    let otp2 = req.body.digit2
    let otp3 = req.body.digit3
    let otp4 = req.body.digit4
 
    let mainOtp = otp1+otp2+otp3+otp4
    const userid = req.body.email
    console.log(userid);

    const otpData = await otpModel.findOne({userId:userid,otp:mainOtp})

    
 
 console.log(typeof mainOtp);
 console.log(mainOtp);
 console.log(otpData)
 if(otpData){
    await userModel.updateOne({email:userid},{$set:{is_verified:1}})

 res.render("userlogin")
 }
 else{
    res.render("otpVerification",{data:userid})
 }

//  ------------------------------------------------------loadhome page--------------------------------------------
}
const loginload = async (req, res) => {

    const email1 = req.body.email
    const password1 = req.body.password.toString()



    const userdata = await userModel.findOne({ email: email1, password: password1, status: 0 ,is_verified:1})
    console.log(userdata);

    if (userdata) {
        const name1 = await userdata.name
        req.session.user_id = userdata._id
        console.log(req.session.user_id);

        res.render("home", { message: name1 })
    }
    else {
        res.render("userlogin",{message:"email and password are incorrect"})
    }
}

const forgotpassword = (req,res)=>{

    res.render("forgotpassword")
}


//------------------------------ forgotpassword otp sending and saving in database------------------------
const otpForgotpass = async (req,res)=>{

    let email1 = req.body.email
    const userdata= await userModel.findOne({email:email1})
    console.log(userdata);
    if(userdata){
     // ---------------------------------------mail sending by node mailer-----------------

     function otpGenerator (length){       //otp generating function
        let otp =""
       
        for(let i= 0;i<length;i++){
       
           otp= otp+(Math.floor(Math.random()*10).toString())
        }
        return otp
       
       
       }

    let otp=  otpGenerator(4)        
    console.log(`otp is ${otp}`);    //returning otp
//    const userMail = req.body.email
     let config ={
         service : "gmail",
         auth :{
             user:"athulprathap216@gmail.com",     //email and password of sender
             pass:"hsse gmvs vpvo ghdd"
            
         }
     }
     let transporter = nodemailer.createTransport(config)
  
      let mailgenerator= new mailgen({
          theme : "default",
          product : {
              name : "Urban Nest",
              link : "https://http://localhost:3001/home"
          }
      })
 let response = {
     body :{
         name: req.body.name,
         intro: `urban nest verification code ${otp}`,
         outro: "thankyou"
     }
 }
 
 let mail = mailgenerator.generate(response)
 
 let message ={
     from : "athulprathap216@gmail.com" ,
     to : req.body.email,
     subject : "otp verification",
     html :mail
 
 }
 
 transporter.sendMail(message).then(()=>{
    //  return res.json({
    //      msg: "mail sended"
    //  })
    console.log(`mail sended to the ${req.body.email}`);
 }).catch((error)=>{
     console.log(error);
 })
    



  const insertotp = await new  otpModel({

    userId:req.body.email,
    otp: otp,
    expiresAt:Date.now()

  })
 
  await insertotp.save()

// --------------------------------------------------
    let userid= req.body.email
    res.render("otpVerification2",{data:userid})
    }
    else{
        res.render("forgotpassword",{message:"User not  found"})
    }

  //---------------------delete otp---------------------------------after two minites--------
  const deleteExpiredOtps = async () => {
    try {
      const currentTimestamp = new Date();
      await otpModel.deleteMany({ expiresAt: { $lt: currentTimestamp } });
      console.log('Expired OTPs deleted successfully.');
    } catch (error) {
      console.error('Error deleting expired OTPs:', error.message);
    } 
  
  };
  
  setTimeout(deleteExpiredOtps,60*1000)
//   ------------------------------------------------------------------------
}






//------------------------ forgot password otp verification------------------
const otpVerifyForgot = async (req,res)=>{
  

    let otp1 = req.body.digit1
    let otp2 = req.body.digit2
    let otp3 = req.body.digit3
    let otp4 = req.body.digit4
 
    let mainOtp = otp1+otp2+otp3+otp4
    const userid = req.body.email
    console.log(userid);

    const otpData = await otpModel.findOne({userId:userid,otp:mainOtp})

    
 

 console.log(mainOtp);
 console.log(otpData)
 if(otpData){
   

 res.render("passwordset",{data:userid})
 }
 else{
    res.render("otpVerification2",{data:userid})
 }

}

const resetPassword = async (req,res)=>{

    let password = req.body.password
    let password1= req.body.password1
    let email=req.body.email

    if(password===password1){
    
        await userModel.updateOne({email:email},{$set:{password:password}})

        res.render("userlogin")

    }
    else{
        res.render("passwordset",{message:"Password missmatch plz enter correcrtly"})
    }
}



module.exports = {
    loadhome,
    loadlogin,
    loadRegister,
    insertdata,
    loginload,
    otpVerify,
    forgotpassword,
    otpForgotpass,
    otpVerifyForgot,
    resetPassword 
}
const path =require("path")
const express= require("express")
const app = express()

const adminRouter= require("../../routers/adminRouters")
const ejs= require("ejs")
const admin= require("../../model/adminModels/adminSchema")
const { log } = require("console")
const bodyParser = require("body-parser")
const bodyparser=require("body-parser")
app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json())

app.set("view engine","ejs")
app.set(path.join(__dirname,"views","adminViews"))


const adminlogin = (req,res)=>{

    res.render("login")
}

const adminload = async (req,res)=>{

const email1= req.body.email;
const  password1 = req.body.password
console.log(email1);
console.log(password1);

const admindata= await admin.findOne({email:email1,password:password1})


 if(admindata){
    res.render("home")

}
else{
    res.render("login",{message:"email and password are incorrect"})
}

}




module.exports={
 adminlogin,
 adminload,

}
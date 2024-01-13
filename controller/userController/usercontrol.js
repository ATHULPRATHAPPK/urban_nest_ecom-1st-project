

const path =require("path")
const express= require("express")
const app = express()

const userRouter= require("../../routers/userRouters")
const ejs= require("ejs")
const userModel= require("../../model/userModel/signUp")
const { log } = require("console")
const bodyParser = require("body-parser")
const bodyparser=require("body-parser")
app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json())

app.set("view engine","ejs")
app.set(path.join(__dirname,"views","userViews"))



const loadhome= (req,res)=>{


    res.render("home")
}

const loadlogin=(req,res)=>{
    
    res.render("userlogin")
}

const loadRegister=(req,res)=>{
    res.render("userRegister")
}

const insertdata = async (req,res)=>{

    try{
    console.log(`mail ${req.body.email}`);
    const insertdb= await new  userModel({
        name:req.body.name,
        email:req.body.email,
        password: req.body.password
    })
     
    await insertdb.save()
  
    res.redirect("/register")
}
catch(error){
    console.log(error.message);
}
 }

const loginload = async (req,res)=>{

  const  email1 = req.body.email
  const  password1 = req.body.password
  
  

  const userdata= await userModel.findOne({email:email1,password:password1,status:0}) 
  console.log(userdata);

  if(userdata){
    const name1= await userdata.name
    req.session.user_id=userdata._id
    console.log(req.session.user_id);

    res.render("home",{message:name1})
}
else{
    res.redirect("/login")
} 
}





module.exports={
loadhome,
loadlogin,
loadRegister,
insertdata,
loginload,
}
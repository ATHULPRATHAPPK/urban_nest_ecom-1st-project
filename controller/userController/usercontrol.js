

const path =require("path")
const express= require("express")
const app = express()

const userRouter= require("../../routers/userRouters")
const ejs= require("ejs")
const userModel= require("../../model/userModel/signUp")
const { log } = require("console")


app.set("view engine","ejs")
app.set(path.join(__dirname,"views","userViews"))



const loadhome= (req,res)=>{

    res.render("home")
}

const insertdata = async (req,res)=>{

    try{
    console.log(`mail ${req.body.name}`);
    const insertdb= await new  userModel({
        name:req.body.name,
        email:req.body.email,
        password: req.body.password
    })
     
    await insertdb.save()
  
    res.redirect("/home")
}
catch(error){
    console.log(error.message);
}
}
const loginload = (req,res)=>{

  const  email


}



module.exports={loadhome,
insertdata}
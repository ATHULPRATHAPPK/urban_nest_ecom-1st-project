const path =require("path")
const express= require("express")
const app = express()

const adminRouter= require("../../routers/adminRouters")
const ejs= require("ejs")
const admin= require("../../model/adminModels/adminSchema")
const userModel =require("../../model/userModel/signUp")
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



//-----------------------------------------------------------------admin home validation------------------------------------------------  

const adminload = async (req,res)=>{

const email1= req.body.email;
const  password1 = req.body.password
console.log(email1);
                  console.log(password1);    
        const admindata= await admin.findOne({email:email1,password:password1})
      if(admindata){
                  res.render("adminHome")
}
     
else{
    res.render("login",{message:"email and password are incorrect"})
}
}


//------------------------------------------admin dash usertable-----------------------------------------------  
const userdeatails= async (req,res)=>{

    const userdata= await userModel.find({})
    console.log(userdata);

    res.render("userTable",{users:userdata})

}


//------------------------------------------admin dash usertable to block----------------------------------------------  
const userblock = async (req,res)=>{

    const userBlock= req.query.id
    
 
    // console.log(userdata);

    const blockedUser= await userModel.findOne({_id:userBlock})
    console.log(blockedUser);
    if(blockedUser){
          await userModel.updateOne({_id:userBlock},{$set:{status:1}})


    }   const userdata= await userModel.find({})
    res.render("userTable",{users:userdata} )

}
//------------------------------------------admin dash usertable to unblock----------------------------------------------  
const userUnblock= async (req,res)=>{

    const userBlock= req.query.id
  
    const unblockedUser= await userModel.findOne({_id:userBlock})
    if(unblockedUser){
        await userModel.updateOne({_id:userBlock},{$set:{status:0}})


  }  const userdata= await userModel.find({})
  res.render("userTable",{users:userdata} )

}


//----------------------------------------admin to delete user----------------------------------------------------

const userdelete =  async (req,res)=>{
 
     const userDelete = req.query.id

     const deleteUser= await userModel.deleteOne({_id:userDelete})

     if(deleteUser){
        await userModel.deleteOne({_id:userDelete})
     }

     const userdata= await userModel.find({})
  res.render("userTable",{users:userdata})

}


//--------------------------------------------------------------------------category--------------------------------------------- 


//-----------------------------------categoryManagment---------------------------------------------------


const loadCategoryManage = (req,res)=>{

    res.render("categoryManagment")


}



module.exports={
 adminlogin,
 adminload,
userdeatails,
userblock,
userUnblock,
userdelete,
loadCategoryManage
}
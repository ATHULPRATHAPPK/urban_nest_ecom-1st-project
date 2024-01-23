const path = require("path")
const express = require("express")
const app = express()

const adminRouter = require("../../routers/adminRouters")
const ejs = require("ejs")
const admin = require("../../model/adminModels/adminSchema")
const userModel = require("../../model/userModel/signUp")
const categoryModel = require("../../model/adminModels/categoryModel")
const { log } = require("console")
const bodyParser = require("body-parser")
const bodyparser = require("body-parser")
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

app.set("view engine", "ejs")
app.set(path.join(__dirname, "views", "adminViews"))


const adminlogin = (req, res) => {

    res.render("login")
}

const admindash = (req, res) => {

    // need to cheak the session-------
    res.render("adminHome")

}

//-----------------------------------------------------------------admin home validation------------------------------------------------  

const adminload = async (req, res) => {

    const email1 = req.body.email;
    const password1 = req.body.password
    console.log(email1);
    console.log(password1);
    const admindata = await admin.findOne({ email: email1, password: password1 })
    if (admindata) {
        res.render("adminHome")
    }

    else {
        res.render("login", { message: "email and password are incorrect" })
    }
}


//------------------------------------------admin dash usertable-----------------------------------------------  
const userdeatails = async (req, res) => {

    const userdata = await userModel.find({})
    console.log(userdata);

    res.render("userTable", { users: userdata })

}


//------------------------------------------admin dash usertable to block----------------------------------------------  
const userblock = async (req, res) => {

    const userBlock = req.query.id


    // console.log(userdata);

    const blockedUser = await userModel.findOne({ _id: userBlock })
    console.log(blockedUser);
    if (blockedUser) {
        await userModel.updateOne({ _id: userBlock }, { $set: { status: 1 } })


    } const userdata = await userModel.find({})
    res.render("userTable", { users: userdata })

}
//------------------------------------------admin dash usertable to unblock----------------------------------------------  
const userUnblock = async (req, res) => {

    const userBlock = req.query.id

    const unblockedUser = await userModel.findOne({ _id: userBlock })
    if (unblockedUser) {
        await userModel.updateOne({ _id: userBlock }, { $set: { status: 0 } })


    } const userdata = await userModel.find({})
    res.render("userTable", { users: userdata })

}


//----------------------------------------admin to delete user----------------------------------------------------

const userdelete = async (req, res) => {

    const userDelete = req.query.id

    const deleteUser = await userModel.deleteOne({ _id: userDelete })

    if (deleteUser) {
        await userModel.deleteOne({ _id: userDelete })
    }

    const userdata = await userModel.find({})
    res.render("userTable", { users: userdata })

}


//-----------------------------------------------------------------------product managment--------------------------------------------- 

const loadProductManage = (req, res) => {



    res.render("productManagment")

}

//-------------------------------------------------------category managment-------------------------

const loadCategoryManage = async (req, res) => {

    const categoryTable=   await categoryModel.find({})
    res.render("categoryManagment",{ category: categoryTable })

}

// -------------------------------------------------------------addCategory-------------------------------------------------------------

const addCategory = async (req,res)=>{

    let mainCategory = req.body.mainCategory
    let subcategory = req.body.subcategory
    let discription = req.body.discription

    console.log(mainCategory);
    console.log(subcategory);
    console.log(discription);

   
     
     const insertdb =  await categoryModel({
        category: mainCategory,
        subcategory:subcategory,
        discription:discription
      })

      await insertdb.save()

    

    const categoryTable=   await categoryModel.find({})
    console.log(categoryTable);

   


   res.redirect("/categoryManagement")
}

//-----------------------------------------------------categoryBlock------------------------
const categoryBlock = async (req,res)=>{

    const categoryBlock = req.query.id

    const blockCategory = await categoryModel.findOne({_id:categoryBlock})
    if (blockCategory) {
        await categoryModel.updateOne({ _id: categoryBlock }, { $set: { status: false } })


    }
    
    res.redirect("/categoryManagement")
   
}
//-------------------------------------------------categoryUnblock------------------------------

const categoryUnblock = async (req,res)=>{

    const categoryunblock = req.query.id

    const unblockCategory = await categoryModel.findOne({_id:categoryunblock})
    if (unblockCategory) {
        await categoryModel.updateOne({ _id:  categoryunblock }, { $set: { status: true } })


    }
    
    res.redirect("/categoryManagement")
   
}

//-------------------------------------------------categoryDelete------------------------------

const categoryDelete = async (req,res)=>{
    const categorydelete = req.query.id
    await categoryModel.deleteOne({_id:categorydelete})

    res.redirect("/categoryManagement")
}

const addLaptop = (req,res)=>{

   res.render("addLpatop")

}


module.exports = {
    adminlogin,
    admindash,
    adminload,
    userdeatails,
    userblock,
    userUnblock,
    userdelete,
    loadProductManage,
    loadCategoryManage,
    addCategory,
    categoryBlock,
    categoryUnblock,
    categoryDelete,
    addLaptop
    
}
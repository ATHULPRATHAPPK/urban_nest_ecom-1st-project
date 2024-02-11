const path = require("path")
const express = require("express")
const sharp=require('sharp')
const fs = require("fs")
const app = express()
const session = require("express-session");

const adminRouter = require("../../routers/adminRouters")
const ejs = require("ejs")
const admin = require("../../model/adminModels/adminSchema")
const cartModel = require("../../model/userModel/cart")
const userModel = require("../../model/userModel/signUp")
const categoryModel = require("../../model/adminModels/categoryModel")
const orderModel = require("../../model/userModel/orderModel")
const { log } = require("console")
const bodyparser = require("body-parser")
const productModel = require("../../model/adminModels/productModel")
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())




app.set("view engine", "ejs")
app.set(path.join(__dirname, "views", "adminViews"))



//-----------------------------------------------adminlogin--------------

const adminlogin = (req, res) => {
   
    res.render("login")
}

// ---------------------------------------------------admin home-----------
const admindash = (req, res) => {
    
    res.render("adminHome")
}

//-----------------------------------------------------------------admin home validation------------------------------------------------  

const adminload = async (req, res) => {

    try {
        const email1 = req.body.email;
        const password1 = req.body.password
        console.log(email1);
        console.log(password1);
        const admindata = await admin.findOne({ email: email1, password: password1 })
        if (admindata) {

            req.session.admin = email1;
            console.log("admin", req.session.admin);
            res.render("adminHome")
        }
        else {
            res.render("login", { message: "email and password are incorrect" })
        }
    }
    catch (error) {
        console.error(error);
    }

}

//-----------------------------admin delete sesssion----------

const deleteSession =(req,res)=>{


    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Session destroyed successfully');
            res.redirect('/admin');
        

}
    })}

//------------------------------------------admin dash usertable-----------------------------------------------  
const userdeatails = async (req, res) => {

    try {
        const userdata = await userModel.find({is_deleted:0})
      
        res.render("userTable", { users: userdata })
    }
    catch (error) {
        console.log(error);
    }
}

//------------------------------------------admin dash usertable to block----------------------------------------------  
const userblock = async (req, res) => {

    try {
        const userBlock = req.query.id
        const blockedUser = await userModel.findOne({ _id: userBlock })
        console.log(blockedUser);
        if (blockedUser) {
            await userModel.updateOne({ _id: userBlock }, { $set: { status: 1 } })
        }
        const userdata = await userModel.find({})
        res.render("userTable", { users: userdata })
    }
    catch (error) {
        console.log(error);
    }
}
//------------------------------------------admin dash usertable to unblock----------------------------------------------  
const userUnblock = async (req, res) => {

    try {
        const userBlock = req.query.id
        const unblockedUser = await userModel.findOne({ _id: userBlock })
        if (unblockedUser) {
            await userModel.updateOne({ _id: userBlock }, { $set: { status: 0 } })
        } const userdata = await userModel.find({})
        res.render("userTable", { users: userdata })
    }
    catch (error) {
        console.log(error);
    }
}

//----------------------------------------admin to delete user----------------------------------------------------

const userdelete = async (req, res) => {
    try {
        const userDelete = req.query.id
        const deleteUser = await userModel.updateOne({ _id: userDelete }, { $set: { is_deleted: 1 } });
       
        const userdata = await userModel.find({ is_deleted: 0})
        res.render("userTable", { users: userdata })
    }
    catch (error) {
        console.log(error);
    }
}

//-----------------------------------------------------------------------product managment--------------------------------------------- 

const loadProductManage = async (req, res) => {
    try {
        const ProductTable = await productModel.find({is_deleted :true }).populate("subcategory")
        res.render("productManagment", { ProductTable })
    }
    catch (error) {
        console.log(error);
    }
}




//-------------------------------------------------------category managment-------------------------



const loadCategoryManage = async (req, res) => {
    try {
        const categoryTable = await categoryModel.find({})
        const message = req.query.message;
        res.render("categoryManagment", { category: categoryTable, message })
    }
    catch (error) {
        console.log(error);
    }
}


// -------------------------------------------------------------addCategory-------------------------------------------------------------



const addCategory = async (req, res) => {
    try {
        let mainCategory = req.body.mainCategory
        let subcategory = req.body.subcategory
        let discription = req.body.discription

        // console.log(mainCategory);
        // console.log(subcategory);
        // console.log(discription);
        const dupilcateCategory = await categoryModel.findOne({ subcategory: req.body.subcategory })
        if (dupilcateCategory) {
            res.redirect("/categoryManagement?message=This Subcategory is already present");
        }
        else {
            const insertdb = await categoryModel({
                category: mainCategory,
                subcategory: subcategory,
                discription: discription
            })
            await insertdb.save()
            const categoryTable = await categoryModel.find({})
            console.log(categoryTable);
            res.redirect("/categoryManagement")
        }
    }
    catch (error) {
        console.log(error);
    }
}



//-----------------------------------------------------categoryBlock------------------------




const categoryBlock = async (req, res) => {
    try {
        const categoryBlock = req.query.id
        const blockCategory = await categoryModel.findOne({ _id: categoryBlock })
        if (blockCategory) {
            await categoryModel.updateOne({ _id: categoryBlock }, { $set: { status: false } })
        }
        res.redirect("/categoryManagement")
    }
    catch (error) {
        console.log(error);
    }
}



//-------------------------------------------------categoryUnblock------------------------------




const categoryUnblock = async (req, res) => {
    try {
        const categoryunblock = req.query.id
        const unblockCategory = await categoryModel.findOne({ _id: categoryunblock })
        if (unblockCategory) {
            await categoryModel.updateOne({ _id: categoryunblock }, { $set: { status: true } })
        }
        res.redirect("/categoryManagement")
    }
    catch (error) {
        console.log(error);
    }
}


//-------------------------------------------------categoryDelete------------------------------




const categoryDelete = async (req, res) => {
    try {
        const categorydelete = req.query.id
        await categoryModel.deleteOne({ _id: categorydelete })
        res.redirect("/categoryManagement")
    }
    catch (error) {
        console.log(error);
    }
}


//-----------------------------------------------------------edit category------------




const categoryEdit = async (req, res) => {



    try {
        const categoryedit = req.query.id
        const editDetail = await categoryModel.findOne({ _id: categoryedit })
        console.log(editDetail);

        if (editDetail) {
            res.render("editCategory", { message: editDetail })
        }

        else {
            res.redirect("/categoryManagement")
        }
    }
    catch (error) {
        console.log(error);
    }
}



//---------------------------------------------------------edit category------------




const editInsert = async (req, res) => {
    try {
        const categoryId = req.body.id
        const category = req.body.category
        const subcategory = req.body.subcategory
        const discription = req.body.discription
        const editDetail = await categoryModel.findOne({ _id: categoryId })

        const duplicate = await categoryModel.find({ subcategory: subcategory })
        const duplicates = "This sub category is already present"

        if (duplicate.length > 0) {
            res.render("editCategory", { message: editDetail, duplicates })
            // res.redirect("/editCategory?")

            // res.redirect("/editCategory?id=" + categoryId + "&message=This Subcategory already present");

        }

        else {
            const result = await categoryModel.updateOne(
                { _id: categoryId },
                { $set: { category, subcategory, discription } }
            )
            res.redirect("/categoryManagement")
        }
    }
    catch (error) {
        console.log(error);
    }
}



//-------------------------------------------------add product------------------------------




const addproduct = async (req, res) => {

    try {

        const category = await categoryModel.find({ status: true })
        res.render("addproduct", { category })
    }
    catch (error) {
        console.log(error);
    }
}



//----------------------------------insertproduct--------------------------------------




const insertProduct = async (req, res) => {

    // Fetch the subcategory document from the Category collection
    try {

      

        // Process the uploaded images, filter out duplicates

        const productImages = await Promise.all(req.files.map(async (file) => {
            try {
                console.log("promise is working");
                const resizedFilename = `resized-${ file.filename }`;
                const resizedPath = path.join(__dirname, '../../public/uploads',resizedFilename)
                              console.log("files",file);
                     
                await sharp(file.path)
                    .resize({ height: 500, width: 550, fit: 'fill' })
                    .toFile(resizedPath);

                return {
                    filename: file.filename,
                    path: file.path,
                    resizedFile: resizedFilename,

                };
            } catch (error) {
                console.error('Error processing and saving image:', error);
                return null; // Exclude failed images
            }
        }))


 console.log("quantity is", req.body.quantity);
 console.log("price is", req.body.price);


       
        const productData = {

            productName: req.body.productName,
            brandName: req.body.brandName,
            discription: req.body.discription,
            subcategory: req.body.subcategory,
            color: req.body.color,
            processor: req.body.processor,
            ram: req.body.ram,
            internalStorage: req.body.internalStorage,
            quantity: req.body.quantity,
            price: req.body.price,
            productImage: productImages

        }


        const insertproduct = await new productModel(productData)

        await insertproduct.save()

        res.redirect("/productManagment")
    }
    catch (error) {
        console.log(error);
    }
}

// ------------------------------------------unlist product---------------------------------------------------

const unlistProduct = async (req,res)=>{
   try{

    const unlist = req.query.id
    
          
   const unlistDocument = await productModel.findOne({_id:unlist})
    if(unlistDocument){
        await productModel.updateOne(
            { _id: unlist },
            { $set: { is_listed : false } }
        )
        res.redirect("/productManagment")
    }

   }
   catch(error){
    console.log(error);
   }

}

//-------------------------------------------list product-------------------------------------------------------------------

const listProduct = async (req,res)=>{
    try{
 
     const list = req.query.id
     
           
    const unlistDocument = await productModel.findOne({_id:list})

     if(unlistDocument){
         await productModel.updateOne(
             { _id: list },
             { $set: { is_listed : true } }
         )
         res.redirect("/productManagment")
     }
 
    }
    catch(error){
     console.log(error);
    }
 
 }


 //-------------------------------------------edit product-------------------------------------------------------------------



 const editProduct = async (req,res)=>{

    const editDocumentid = req.query.id

    const editDetail = await productModel.findOne({_id : editDocumentid}).populate('subcategory')

    
    if (editDetail) {
       
    res.render("editProduct",{editDetail})
 }
 
 else {
    res.redirect("/productManagment")
}
 }



//--------------------------------------edit insert product---------------------------------



const editInsertProduct = async (req, res) => {

    // Fetch the subcategory document from the Category collection
    try {

      

        // Process the uploaded images, filter out duplicates

        const productImages = await Promise.all(req.files.map(async (file) => {
            try {
               
                const resizedFilename = `resized-${ file.filename }`;
                const resizedPath = path.join(__dirname, '../../public/uploads',resizedFilename)
                            //   console.log("files",file);
                     
                await sharp(file.path)
                    .resize({ height: 500, width: 550, fit: 'fill' })
                    .toFile(resizedPath);

                return {
                    filename: file.filename,
                    path: file.path,
                    resizedFile: resizedFilename,

                };
            } catch (error) {
                console.error('Error processing and saving image:', error);
                return null; // Exclude failed images
            }
        }))


        const productid = req.body.poductId

      
         
        await productModel.findByIdAndUpdate(
            productid,
            { $push: { productImage:productImages } })
        
       
        const productData = {

            productName: req.body.productName,
            brandName: req.body.brandName,
            discription: req.body.discription,
            subcategory: req.body.subcategory,
            color: req.body.color,
            processor: req.body.processor,
            ram: req.body.ram,
            internalStorage: req.body.internalStorage,
            quantity: req.body.quantity,
            price: req.body.price,
           

        }
       
        const updateResult = await productModel.updateOne({ _id: productid }, { $set: productData });
       


        const cartPrice = await cartModel.updateOne({"product.productId":  productid},{$set: {
            "product.$.price": req.body.price
        }})


        const cart = await cartModel.findOne({
            
            "product.productId": productid
        });
        
        if (cart) {
            let subTotal = 0; // Initialize subTotal variable to calculate the sum of totals
            // Iterate over the product array to update the total for the matching product
            cart.product.forEach(product => {
                if (product.productId === productid) {
                    product.total = product.price * product.quantity;
                }
                subTotal += product.total; // Calculate subTotal
            });
        
            // Update the subTotal field in the cart document
            cart.subTotal = subTotal;
        
            // Save the updated cart
            await cart.save();
        
           
        } else {
            console.log("No cart found for the user or no product found with productId");
        }
       
        res.redirect("/productManagment")
    }
    catch (error) {
        console.log(error);
    }
}






//----------------------------------=delete image------------------


 const deleteImage = async (req, res) => {
    const productId = req.query.id;
    const imageIndex = req.query.imageIndex;

    const imageDocument = await productModel.findOne({ _id: productId });

    // Check if the imageIndex is within the valid range
    if (imageIndex >= 0 && imageIndex < imageDocument.productImage.length) {
        const filenameToDelete = imageDocument.productImage[imageIndex].filename;
        console.log(filenameToDelete);
        const filePath = path.join(__dirname, '../../public/uploads', filenameToDelete);

        // Use fs.unlinkSync to delete the file
        fs.unlinkSync(filePath);

        // Use $pull with the filename to remove the specific element from the array
        await productModel.findByIdAndUpdate(imageDocument._id, { $pull: { productImage: { filename: filenameToDelete } } });

        res.redirect(`/admin/edit-product?id=${productId}`);
    }
};



//-----------------------------------product delete-----------------


const productDelete = async (req,res)=>{
 
    const deleteProduct = req.query.id

    await productModel.updateOne(
        { _id: deleteProduct },
        { $set: { is_deleted :false } }
    )
    res.redirect("/productManagment")

}

//----------------------------------User Orders-----------------
const loadOrders = async (req,res)=>{


const userOrders= await orderModel.find().populate("userId")



    res.render("userOrders",{userOrders})
}


//----------------------------------approve product-----------------
const approveProduct = async  (req,res) =>{

   const orderDetails= await orderModel.findOne({_id:req.body.orderId})
   
  
   const productDetails = await orderModel.findOne({
    _id: req.body.orderId,
    "product._id": req.body.productId
});

if(productDetails){
    const isApproved = await orderModel.updateOne(
        { _id:  req.body.orderId, 'product._id': req.body.productId },
        { $set: { 'product.$.isApproved': true } },     
    );


}


res.status(200).json({ message: "Order approved successfully" });
}



  //----------------------------------order cancellation----------------- 


const cancelProduct = async  (req,res) =>{

    const orderDetails= await orderModel.findOne({_id:req.body.orderId})
    
   
    const productDetails = await orderModel.findOne({
     _id: req.body.orderId,
     "product._id": req.body.productId
 });
 
 if(productDetails){
     const isApproved = await orderModel.updateOne(
         { _id:  req.body.orderId, 'product._id': req.body.productId },
         { $set: { 'product.$.isCancelled': true } },     
     );
 
 
 }
 
    
 
 res.status(200).json({ message: "Order cancelled successfully" });
 }


module.exports = {
    adminlogin,
    admindash,
    adminload,
    deleteSession,
    userdeatails,
    userblock,
    userUnblock,
    userdelete,
    categoryEdit,
    editInsert,
    loadProductManage,
    loadCategoryManage,
    addCategory,
    categoryBlock,
    categoryUnblock,
    categoryDelete,
    addproduct,
    insertProduct,
    unlistProduct,
    listProduct,
    editProduct,
    deleteImage,
    editInsertProduct,
    productDelete,
    loadOrders,
    approveProduct,
    cancelProduct
    

}
const express = require("express")
const path = require("path")
const adminRouter = express()
const multer = require("multer")
const controllers = require("../controller/adminController/adminControl")
const config = require("../config/config")
const ejs = require("ejs")
adminRouter.set("view engine", "ejs")
adminRouter.set("views", "views/adminViews")
const bodyparser = require("body-parser")

const adminMiddleware = require("../middleware/adminMiddleware")

adminRouter.use(bodyparser.urlencoded({ extended: true }))
adminRouter.use(bodyparser.json())



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        // Use the original filename and add a unique identifier
        const uniqueIdentifier = Date.now();
        const originalFileNameWithoutExtension = path.parse(file.originalname).name;
        const uniqueFilename = `${originalFileNameWithoutExtension}-${uniqueIdentifier}${path.extname(file.originalname)}`;

        cb(null, uniqueFilename);
    },
});

const upload = multer({ storage: storage });





adminRouter.get("/admin",adminMiddleware.isLogout, controllers.adminlogin)
adminRouter.post("/adminhome", controllers.adminload)
adminRouter.get("/adminhome", adminMiddleware.isLogin, controllers.admindash)
adminRouter.get("/admin-logout", controllers.deleteSession)

adminRouter.get("/userdetails", adminMiddleware.isLogin, controllers.userdeatails)
adminRouter.get("/admin/block-user", adminMiddleware.isLogin, controllers.userblock)
adminRouter.get("/admin/unblock-user", adminMiddleware.isLogin, controllers.userUnblock)
adminRouter.get("/admin/delete-user", controllers.userdelete)


adminRouter.get("/categoryManagement", adminMiddleware.isLogin, controllers.loadCategoryManage)
adminRouter.post("/addCategory", controllers.addCategory)
adminRouter.get("/admin/block-category", adminMiddleware.isLogin, controllers.categoryBlock)
adminRouter.get("/admin/unblock-category", adminMiddleware.isLogin, controllers.categoryUnblock)
adminRouter.get("/admin/delete-category", adminMiddleware.isLogin, controllers.categoryDelete)
adminRouter.get("/admin/edit-category", adminMiddleware.isLogin, controllers.categoryEdit)
adminRouter.post('/editCategory', controllers.editInsert)

adminRouter.get("/productManagment", adminMiddleware.isLogin, controllers.loadProductManage)
adminRouter.get("/addproduct", adminMiddleware.isLogin, controllers.addproduct)
adminRouter.post("/addproduct", upload.array("productImage", 4), controllers.insertProduct)
adminRouter.get("/admin/unlist-product", adminMiddleware.isLogin, controllers.unlistProduct)
adminRouter.get("/admin/list-product", adminMiddleware.isLogin, controllers.listProduct)
adminRouter.get("/admin/edit-product", adminMiddleware.isLogin, controllers.editProduct)
adminRouter.post("/admin/edit-product", upload.array("productImage", 4), controllers.editInsertProduct)
adminRouter.get("/product/delete-image", adminMiddleware.isLogin, controllers.deleteImage)
adminRouter.get("/admin/delete-product", adminMiddleware.isLogin, controllers.productDelete)

module.exports = adminRouter
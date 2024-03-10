const path = require("path")
const express = require("express")
const sharp = require('sharp')
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
const couponModel = require("../../model/adminModels/couponSchema")
const walletModel = require("../../model/userModel/wallet")
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
const admindash = async (req, res) => {

    const totalOnlineOrder = await orderModel.aggregate([
        {
            $match: {
                'product.paymentType': 'ONLINE',
                'product.returnStatus': { $ne: 3 },
                'product.adminStatus': { $ne: 5 }
            }
        },
        {
            $project: {
                product: {
                    $filter: {
                        input: '$product',
                        as: 'prod',
                        cond: {
                            $and: [
                                { $eq: ['$$prod.paymentType', 'ONLINE'] },
                                { $ne: ['$$prod.returnStatus', 3] }
                            ]
                        }
                    }
                }
            }
        },
        { $unwind: '$product' },
        {
            $group: {
                _id: null,
                total: { $sum: '$product.total' }
            }
        }
    ]);

    const totalOflineOrder = await orderModel.aggregate([
        {
            $match: {
                'product.paymentType': 'COD',
                'product.adminStatus': 4,
                'product.returnStatus': { $ne: 3 }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$subTotal' }
            }
        }
    ]);

    const totalOnline = totalOnlineOrder.length > 0 ? totalOnlineOrder[0].total : 0;
    const totalOffline = totalOflineOrder.length > 0 ? totalOflineOrder[0].total : 0;
    const overallSales = totalOffline + totalOnline;
    console.log("overallSales:", overallSales);


    // total oredrs
    const numberOfOrders = await orderModel.aggregate([
        {
            $match: {
                "product.adminStatus": 4, // Match documents where adminStatus is equal to 4
                "product.returnStatus": { $ne: 3 } // Match documents where returnStatus is not equal to 3
            }
        },
        {
            $project: {
                productCount: { $size: '$product' }
            }
        },
        {
            $group: {
                _id: null,
                totalProductCount: { $sum: '$productCount' }
            }
        }
    ]);

    // Access the total product count from the result
    const totalOrders = numberOfOrders.length > 0 ? numberOfOrders[0].totalProductCount : 0;
    console.log('Total number of products:', totalOrders);

    // pending order to ship 
    const pendingToShipTotal = await orderModel.aggregate([
        {
            $unwind: "$product" // Unwind the product array
        },
        {
            $match: {
                "product.adminStatus": { $lt: 2 } // Match documents where adminStatus is less than 2
            }
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 } // Count the number of matching documents
            }
        }
    ]);

    const pendingToDeliverTotal = await orderModel.aggregate([
        {
            $unwind: "$product" // Unwind the product array
        },
        {
            $match: {
                "product.adminStatus": { $lt: 4 } // Match documents where adminStatus is less than 4
            }
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 } // Count the number of matching documents
            }
        }
    ]);

    // Extract the counts from the aggregation result
    const pendingToShipCount = pendingToShipTotal.length > 0 ? pendingToShipTotal[0].count : 0;
    const pendingToDeliverCount = pendingToDeliverTotal.length > 0 ? pendingToDeliverTotal[0].count : 0;


    //pending returns
    const totalReturns = await orderModel.aggregate([
        {
            $unwind: "$product" // Unwind the product array
        },
        {
            $match: {
                "product.returnStatus": 3 // Match documents where returnStatus is 3
            }
        },
        {
            $group: {
                _id: null,
                totalReturns: { $sum: 1 } // Count the number of documents
            }
        }
    ]);
    const totalRetuns = totalReturns.length > 0 ? totalReturns[0].totalReturns : 0;
    console.log(totalRetuns);

    // total orders
    const allOrders = await orderModel.aggregate([
        {
            $match: {
                'product': { $exists: true, $ne: [] } // Match documents where the product array exists and is not empty
            }
        },
        {
            $group: {
                _id: null,
                totalProductCount: { $sum: { $size: "$product" } }
            }
        }
    ]);

    const totalOrdersCount = allOrders.length > 0 ? allOrders[0].totalProductCount : 0;



    //cancelled order


    const totalCancelled = await orderModel.aggregate([
        {
            $unwind: "$product" // Unwind the product array
        },
        {
            $match: {
                "product.adminStatus": 5 // Match documents where returnStatus is 3
            }
        },
        {
            $group: {
                _id: null,
                totalCancelled: { $sum: 1 } // Count the number of documents
            }
        }
    ]);
    const cancelled = totalCancelled.length > 0 ? totalCancelled[0].totalCancelled : 0;


    //monthly rewnue
    const currentDate = new Date(); // Get the current date
    const currentYear = currentDate.getFullYear(); // Get the current year
    const currentMonth = currentDate.getMonth(); // Get the current month (0-indexed)

    // Set the start date to the first day of the current year
    const startDate = new Date(currentYear, 0, 1);

    // Set the end date to the current date
    const endDate = currentDate;

    // Perform aggregation to calculate total monthly sales for each month
    const monthlySales = await orderModel.aggregate([
        {
            $match: {
                "date": {
                    $gte: startDate, // Start of the current year
                    $lte: endDate    // Current date
                }
            }
        },
        {
            $unwind: "$product" // If product is an array, it's being unwinded to work with individual products
        },
        {
            $match: {
                "product.adminStatus": 4, // Match documents where adminStatus is equal to 4
                "product.returnStatus": { $ne: 3 } // Match documents where returnStatus is not equal to 3
            }
        },
        {
            $group: {
                _id: { $month: "$date" }, // Grouping by month
                monthlySale: { $sum: "$product.total" } // Calculating the total sum of the total field of products for each month
            }
        }
    ]);

    // Prepare data for rendering the graph
    const dataForGraph = {
        months: [],
        sales: []
    };

    // Fill dataForGraph with aggregated monthly sales data
    for (let i = 0; i <= currentMonth; i++) {
        const monthData = monthlySales.find(item => item._id === i + 1); // Months are 1-indexed in Date object
        const monthlySale = monthData ? monthData.monthlySale : 0;
        dataForGraph.months.push(getMonthName(i)); // Get the name of the month
        dataForGraph.sales.push(monthlySale);
    }

    console.log("Data for graph:", dataForGraph);

    // Function to get the name of the month
    function getMonthName(monthIndex) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthIndex];
    }





    res.render("adminHome", { overallSales, totalOrders, pendingToShipCount, pendingToDeliverCount, totalRetuns, totalOrdersCount, cancelled, dataForGraph });
}


//-----------------------------------------------------------------admin home validation------------------------------------------------  

const adminload = async (req, res) => {
    try {
        const email1 = req.body.email;
        const password1 = req.body.password;
        console.log(email1);
        console.log(password1);
        const admindata = await admin.findOne({ email: email1, password: password1 });
        if (admindata) {
            req.session.admin = email1;
            console.log("admin", req.session.admin);

            // Dash details
            const totalOnlineOrder = await orderModel.aggregate([
                {
                    $match: {
                        'product.paymentType': 'ONLINE',
                        'product.returnStatus': { $ne: 3 },
                        'product.adminStatus': { $ne: 5 }
                    }
                },
                {
                    $project: {
                        product: {
                            $filter: {
                                input: '$product',
                                as: 'prod',
                                cond: {
                                    $and: [
                                        { $eq: ['$$prod.paymentType', 'ONLINE'] },
                                        { $ne: ['$$prod.returnStatus', 3] }
                                    ]
                                }
                            }
                        }
                    }
                },
                { $unwind: '$product' },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$product.total' }
                    }
                }
            ]);

            const totalOflineOrder = await orderModel.aggregate([
                {
                    $match: {
                        'product.paymentType': 'COD',
                        'product.adminStatus': 4,
                        'product.returnStatus': { $ne: 3 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$subTotal' }
                    }
                }
            ]);

            const totalOnline = totalOnlineOrder.length > 0 ? totalOnlineOrder[0].total : 0;
            const totalOffline = totalOflineOrder.length > 0 ? totalOflineOrder[0].total : 0;
            const overallSales = totalOffline + totalOnline;
            console.log("overallSales:", overallSales);


            // total oredrs
            const numberOfOrders = await orderModel.aggregate([
                {
                    $match: {
                        "product.adminStatus": 4, // Match documents where adminStatus is equal to 4
                        "product.returnStatus": { $ne: 3 } // Match documents where returnStatus is not equal to 3
                    }
                },
                {
                    $project: {
                        productCount: { $size: '$product' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProductCount: { $sum: '$productCount' }
                    }
                }
            ]);

            // Access the total product count from the result
            const totalOrders = numberOfOrders.length > 0 ? numberOfOrders[0].totalProductCount : 0;
            console.log('Total number of products:', totalOrders);

            // pending order to ship 
            const pendingToShipTotal = await orderModel.aggregate([
                {
                    $unwind: "$product" // Unwind the product array
                },
                {
                    $match: {
                        "product.adminStatus": { $lt: 2 } // Match documents where adminStatus is less than 2
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 } // Count the number of matching documents
                    }
                }
            ]);

            const pendingToDeliverTotal = await orderModel.aggregate([
                {
                    $unwind: "$product" // Unwind the product array
                },
                {
                    $match: {
                        "product.adminStatus": { $lt: 4 } // Match documents where adminStatus is less than 4
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 } // Count the number of matching documents
                    }
                }
            ]);

            // Extract the counts from the aggregation result
            const pendingToShipCount = pendingToShipTotal.length > 0 ? pendingToShipTotal[0].count : 0;
            const pendingToDeliverCount = pendingToDeliverTotal.length > 0 ? pendingToDeliverTotal[0].count : 0;


            //pending returns
            const totalReturns = await orderModel.aggregate([
                {
                    $unwind: "$product" // Unwind the product array
                },
                {
                    $match: {
                        "product.returnStatus": 3 // Match documents where returnStatus is 3
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalReturns: { $sum: 1 } // Count the number of documents
                    }
                }
            ]);
            const totalRetuns = totalReturns.length > 0 ? totalReturns[0].totalReturns : 0;
            console.log(totalRetuns);


            // total orders
            const allOrders = await orderModel.aggregate([
                {
                    $match: {
                        'product': { $exists: true, $ne: [] } // Match documents where the product array exists and is not empty
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProductCount: { $sum: { $size: "$product" } }
                    }
                }
            ]);

            const totalOrdersCount = allOrders.length > 0 ? allOrders[0].totalProductCount : 0;


            const totalCancelled = await orderModel.aggregate([
                {
                    $unwind: "$product" // Unwind the product array
                },
                {
                    $match: {
                        "product.adminStatus": 5 // Match documents where returnStatus is 3
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCancelled: { $sum: 1 } // Count the number of documents
                    }
                }
            ]);
            const cancelled = totalCancelled.length > 0 ? totalCancelled[0].totalCancelled : 0;
            console.log("cancelled", cancelled);
            //monthly sdales

            const currentDate = new Date(); // Get the current date
            const currentYear = currentDate.getFullYear(); // Get the current year
            const currentMonth = currentDate.getMonth(); // Get the current month (0-indexed)

            // Set the start date to the first day of the current year
            const startDate = new Date(currentYear, 0, 1);

            // Set the end date to the current date
            const endDate = currentDate;

            // Perform aggregation to calculate total monthly sales for each month
            const monthlySales = await orderModel.aggregate([
                {
                    $match: {
                        "date": {
                            $gte: startDate, // Start of the current year
                            $lte: endDate    // Current date
                        }
                    }
                },
                {
                    $unwind: "$product" // If product is an array, it's being unwinded to work with individual products
                },
                {
                    $match: {
                        "product.adminStatus": 4, // Match documents where adminStatus is equal to 4
                        "product.returnStatus": { $ne: 3 } // Match documents where returnStatus is not equal to 3
                    }
                },
                {
                    $group: {
                        _id: { $month: "$date" }, // Grouping by month
                        monthlySale: { $sum: "$product.total" } // Calculating the total sum of the total field of products for each month
                    }
                }
            ]);

            // Prepare data for rendering the graph
            const dataForGraph = {
                months: [],
                sales: []
            };

            // Fill dataForGraph with aggregated monthly sales data
            for (let i = 0; i <= currentMonth; i++) {
                const monthData = monthlySales.find(item => item._id === i + 1); // Months are 1-indexed in Date object
                const monthlySale = monthData ? monthData.monthlySale : 0;
                dataForGraph.months.push(getMonthName(i)); // Get the name of the month
                dataForGraph.sales.push(monthlySale);
            }

            console.log("Data for graph:", dataForGraph);

            // Function to get the name of the month
            function getMonthName(monthIndex) {
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                return months[monthIndex];
            }





            res.render("adminHome", { overallSales, totalOrders, pendingToShipCount, pendingToDeliverCount, totalRetuns, totalOrdersCount, cancelled, dataForGraph });
        } else {
            res.render("login", { message: "email and password are incorrect" });
        }
    } catch (error) {
        console.error(error);
    }
}


//-----------------------------admin delete sesssion----------

const deleteSession = (req, res) => {


    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Session destroyed successfully');
            res.redirect('/admin');


        }
    })
}

//------------------------------------------admin dash usertable-----------------------------------------------  
const userdeatails = async (req, res) => {

    try {
        const userdata = await userModel.find({ is_deleted: 0 })

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

        const userdata = await userModel.find({ is_deleted: 0 })
        res.render("userTable", { users: userdata })
    }
    catch (error) {
        console.log(error);
    }
}

//-----------------------------------------------------------------------product managment--------------------------------------------- 

const loadProductManage = async (req, res) => {
    try {
        const ProductTable = await productModel.find({ is_deleted: true }).populate("subcategory")
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
                const resizedFilename = `resized-${file.filename}`;
                const resizedPath = path.join(__dirname, '../../public/uploads', resizedFilename)
                console.log("files", file);

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

const unlistProduct = async (req, res) => {
    try {

        const unlist = req.query.id


        const unlistDocument = await productModel.findOne({ _id: unlist })
        if (unlistDocument) {
            await productModel.updateOne(
                { _id: unlist },
                { $set: { is_listed: false } }
            )
            res.redirect("/productManagment")
        }

    }
    catch (error) {
        console.log(error);
    }

}

//-------------------------------------------list product-------------------------------------------------------------------

const listProduct = async (req, res) => {
    try {

        const list = req.query.id


        const unlistDocument = await productModel.findOne({ _id: list })

        if (unlistDocument) {
            await productModel.updateOne(
                { _id: list },
                { $set: { is_listed: true } }
            )
            res.redirect("/productManagment")
        }

    }
    catch (error) {
        console.log(error);
    }

}


//-------------------------------------------edit product-------------------------------------------------------------------



const editProduct = async (req, res) => {

    const editDocumentid = req.query.id

    const editDetail = await productModel.findOne({ _id: editDocumentid }).populate('subcategory')


    if (editDetail) {

        res.render("editProduct", { editDetail })
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

                const resizedFilename = `resized-${file.filename}`;
                const resizedPath = path.join(__dirname, '../../public/uploads', resizedFilename)
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
            { $push: { productImage: productImages } })


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



        const cartPrice = await cartModel.updateOne({ "product.productId": productid }, {
            $set: {
                "product.$.price": req.body.price
            }
        })


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


const productDelete = async (req, res) => {

    const deleteProduct = req.query.id

    await productModel.updateOne(
        { _id: deleteProduct },
        { $set: { is_deleted: false } }
    )
    res.redirect("/productManagment")

}

//----------------------------------User Orders-----------------
const loadOrders = async (req, res) => {


    const userOrders = await orderModel.find().populate("userId")



    res.render("userOrders", { userOrders })
}


//----------------------------------approve product-----------------
const approveProduct = async (req, res) => {

    const orderDetails = await orderModel.findOne({ _id: req.body.orderId })


    const productDetails = await orderModel.findOne({
        _id: req.body.orderId,
        "product._id": req.body.productId
    });

    if (productDetails) {
        const isApproved = await orderModel.updateOne(
            { _id: req.body.orderId, 'product._id': req.body.productId },
            { $set: { 'product.$.isApproved': true } },
        );


    }


    res.status(200).json({ message: "Order approved successfully" });
}



//----------------------------------order cancellation----------------- 


const cancelProduct = async (req, res) => {

    const orderDetails = await orderModel.findOne({ _id: req.body.orderId })


    const productDetails = await orderModel.findOne({
        _id: req.body.orderId,
        "product._id": req.body.productId
    });

    if (productDetails) {
        const isApproved = await orderModel.updateOne(
            { _id: req.body.orderId, 'product._id': req.body.productId },
            { $set: { 'product.$.isCancelled': true } },
        );

    }


    const quantity = orderDetails.product[0].quantity
    console.log(req.body.mainId);
    const product = await productModel.findOne({ _id: req.body.mainId });
    console.log("product to add quantiry", product);
    if (product) {
        product.quantity += quantity;
        await product.save();
    }
    // const product = orderDetails.product.find(item => item._id === orderIdToFind);

    // if (product) {
    //     // If the product is found, retrieve its quantity
    //     const quantity = product.quantity;
    //     console.log(`The quantity of product with productId ${orderIdToFind} is ${quantity}`);
    // } else {
    //     console.log(`Product with productId ${orderIdToFind} not found in the order.`);
    // }



    res.status(200).json({ message: "Order cancelled successfully" });
}


//----------------------------------------------------------------------------------// 
//==========================admin orderupdate ======================================//
//----------------------------------------------------------------------------------// 

const updateOrderStatus = async (req, res) => {

    const { orderId, productId, status } = req.body


    //find the orderdetail
    const orderDetails = await orderModel.findOne({ _id: orderId, "product._id": productId })
    console.log(" orderDetails", orderDetails);

    const result = await orderModel.updateOne(
        { _id: orderId, "product._id": productId },
        { $set: { "product.$.adminStatus": status } }
    );

    console.log(result);



    res.status(200).json({ message: "Order cancelled successfully" });
}


//----------------------------------------------------------------------------------// 
//========================== update return status ======================================//
//----------------------------------------------------------------------------------// 
const updateReturnStatus = async (req, res) => {


    const { orderId, productId, status } = req.body
    console.log("orderId", orderId);
    console.log(productId, status);

    const result = await orderModel.updateOne(
        { _id: orderId, "product._id": productId },
        { $set: { "product.$.returnStatus": status } }
    );

    //update the quantity whwn admin approve return request
    if (status == 3) {
        try {
            const productOrderDetails = await orderModel.findOne({
                _id: orderId,
                "product._id": productId
            }, {
                "product.$": 1
            });

            if (productOrderDetails && productOrderDetails.product && productOrderDetails.product.length > 0) {
                const product = productOrderDetails.product[0];
                const newQty = product.quantity;
                const pId = product.productId;

                const productModelDetails = await productModel.findOne({ _id: pId });

                if (productModelDetails) {
                    productModelDetails.quantity += newQty;
                    await productModelDetails.save();
                } else {
                    console.log("Product not found in product model.");
                }
            } else {
                console.log("Product not found in order.");
            }
        } catch (error) {
            console.error("Error occurred while finding product details:", error);
        }

        const userData = await orderModel.find({ _id: orderId })
        console.log("userData", userData);
        const userId = userData[0].userId;

        let retunedProduct = await orderModel.findOne(
            { _id: orderId },
            { product: { $elemMatch: { _id: productId } } }
        );
        console.log("retunedProduct", retunedProduct);

        const cancelledAmount = retunedProduct.product[0].total;
        // const userId = retunedProduct.userId;
        const currentDate = new Date();
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1; // Note: January is 0, so we add 1
        const year = currentDate.getFullYear();

        const formattedDate = `${day}-${month}-${year}`;

        await walletModel.updateOne(
            { userId: userId },
            {
                $inc: { balance: cancelledAmount },
                $push: {
                    transaction: {
                        date: formattedDate,
                        amount: cancelledAmount,
                        reason: 'Refund for cancelled order'
                    }
                }
            }
        );

    }





    res.status(200).json({ message: "Order cancelled successfully" });
}

//----------------------------------------------------------------------------------// 
//==========================load coupon============================================//
//----------------------------------------------------------------------------------// 
const loadCoupon = async (req, res) => {

    const couponDetails = await couponModel.find({})
    console.log("couponDetails", couponDetails);

    res.render("coupon", { couponDetails })
}




//----------------------------------------------------------------------------------// 
//==========================add coupon=============================================//
//----------------------------------------------------------------------------------// 

const addCoupon = async (req, res) => {

    const { code, discountType, discountAmount, startDate, expirationDate, minOrderAmount } = req.body


    console.log("code", code);
    //creating new coupon
    const newCoupon = await couponModel({

        code: code,
        discountType: discountType,
        discountAmount: discountAmount,
        startDate: startDate,
        expirationDate: expirationDate,
        minOrderAmount: minOrderAmount

    })

    newCoupon.save()


    res.status(200).json({ message: "coupon update su..." });
}




//----------------------------------------------------------------------------------// 
//========================== delete coupon===========================================//
//----------------------------------------------------------------------------------// 


const deleteCoupon = async (req, res) => {


    const { couponId } = req.body


    await couponModel.deleteOne({ _id: couponId })


    res.status(200).json({ message: "coupon update su..." });
}

//----------------------------------------------------------------------------------// 
//====================   sales report===============================================//
//----------------------------------------------------------------------------------// 

const loadSalesDash = (req, res) => {


    res.render("salesReport")
}



const generateSalesReport = async (req, res) => {
    try {
        const startDate = req.body["start-date"];
        const endDate = req.body["end-date"];
        console.log(startDate);
        // Validate dates
        // if (!isValidDate(startDate) || !isValidDate(endDate)) {
        //     return res.status(400).json({ error: "Invalid date format" });
        // }

        // Convert dates to JavaScript Date objects with time included
        const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
        const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

        // Use aggregation to fetch orders within the specified date range
        const orders = await orderModel.aggregate([
            {
                $match: {
                    date: { $gte: startDateTime, $lte: endDateTime },
                },
            },
            // Add more aggregation stages if needed
        ]);

        const updatedOrders = orders.map((order) => {
            order.product.forEach((product) => { // Change 'Products' to 'product'
                product._id = generateRandomString(5); // You can adjust the length as needed
            });
            return order;
        });


        console.log(" updatedOrders", updatedOrders);
        console.log(" updatedOrders", startDate);
        console.log("endDate", endDate);
        return res.status(200).json({
            orders: updatedOrders,
            startDate: startDate,
            endDate: endDate,
        });
    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Failed to generate sales report" });
    }
};

// Example function for generating random string
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}


//----------------------------------------------------------------------------------// 
//====================   sales montthly report======================================//
//----------------------------------------------------------------------------------// 

const generateMonthlyReport = async (req, res) => {

    try {
        const currentDate = new Date();
        const startDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First day of current month
        const endDateTime = new Date(); // Current date

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding 1 because month is zero-based
        const day = String(currentDate.getDate()).padStart(2, '0');
        const startDate = `${year}-${month}-01`; // First day of the current month
        const endDate = `${year}-${month}-${day}`; // Current date

        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);



        console.log("Start Date:", startDateTime);
        console.log("End Date:", endDateTime);

        const orders = await orderModel.aggregate([
            {
                $match: {
                    date: { $gte: startDateTime, $lte: endDateTime },
                },
            },
            // Add more aggregation stages if needed
        ]);

        const updatedOrders = orders.map((order) => {
            order.product.forEach((product) => { // Change 'Products' to 'product'
                product._id = generateRandomString(5); // You can adjust the length as needed
            });
            return order;
        });


        return res.status(200).json({
            orders: updatedOrders,
            startDate: startDate,
            endDate: endDate,
        });

    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Failed to generate sales report" });
    }

}



const generateWeeklyReport = async (req, res) => {

    try {
        // Get the current date
        const currentDate = new Date();
         console.log("reached the serv");
        // Calculate the start of the week (Sunday)
        const startDateTime = new Date(currentDate);
        startDateTime.setDate(currentDate.getDate() - currentDate.getDay()); // Subtract current day of the week (0 is Sunday)
        
        // Calculate the end of the week (Saturday)
        const endDateTime = new Date(currentDate);
        endDateTime.setDate(startDateTime.getDate() + 6); // Add 6 to get to Saturday
        
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding 1 because month is zero-based
        const day = String(currentDate.getDate()).padStart(2, '0');
        const startDate = `${year}-${month}-${String(startDateTime.getDate()).padStart(2, '0')}`; // Start of the week
        const endDate = `${year}-${month}-${String(endDateTime.getDate()).padStart(2, '0')}`; // End of the week
        
        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);
        



        console.log("Start Date:", startDateTime);
        console.log("End Date:", endDateTime);

        const orders = await orderModel.aggregate([
            {
                $match: {
                    date: { $gte: startDateTime, $lte: endDateTime },
                },
            },
            // Add more aggregation stages if needed
        ]);

        const updatedOrders = orders.map((order) => {
            order.product.forEach((product) => { // Change 'Products' to 'product'
                product._id = generateRandomString(5); // You can adjust the length as needed
            });
            return order;
        });


        return res.status(200).json({
            orders: updatedOrders,
            startDate: startDate,
            endDate: endDate,
        });

    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Failed to generate sales report" });
    }

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
    cancelProduct,
    updateOrderStatus,
    updateReturnStatus,
    loadCoupon,
    addCoupon,
    deleteCoupon,
    loadSalesDash,
    generateSalesReport,
    generateMonthlyReport,
    generateWeeklyReport

}
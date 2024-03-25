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
const offerModel = require("../../model/adminModels/offerModel")
const { log } = require("console")
const bodyparser = require("body-parser")
const productModel = require("../../model/adminModels/productModel")
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())




app.set("view engine", "ejs")
app.set(path.join(__dirname, "views", "adminViews"))



//-----------------------------------------------adminlogin--------------

const adminlogin = (req, res) => {
    try {
    res.render("login")
} catch (error) {
    console.error(error);
}
}

// ---------------------------------------------------admin home-----------
const admindash = async (req, res) => {
    try {
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


    const allOrdersplaced = await orderModel.find();

    const allProducts = allOrdersplaced.flatMap(order => order.product);
    
    // Count the occurrences of each product
    const productCountMap = allProducts.reduce((acc, product) => {
        const productId = product.productId; // Assuming 'productId' is the property containing the product ID
        acc[productId] = (acc[productId] || 0) + 1;
        return acc;
    }, {});
    
    // Sort the product count map by count in descending order
    const sortedProducts = Object.entries(productCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Get top 5 products
    
    // Convert the sorted products to an object
    const topProductsObject = {};
    sortedProducts.forEach(([productId, count]) => {
        topProductsObject[productId] = count;
    });

    const topProductsDetails = [];

    // Fetch product details for each top productId and include the count
    for (const productId in topProductsObject) {
        try {
            const productDetail = await productModel.findById(productId);
            if (productDetail) {
                const count = topProductsObject[productId];
                topProductsDetails.push({ productDetail, count });
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
    }



    res.render("adminHome", { overallSales, totalOrders, pendingToShipCount, pendingToDeliverCount, totalRetuns, totalOrdersCount, cancelled, dataForGraph ,topProductsDetails});

} catch (error) {
    console.error(error);
}
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


            const allOrdersplaced = await orderModel.find();

            const allProducts = allOrdersplaced.flatMap(order => order.product);
            
            // Count the occurrences of each product
            const productCountMap = allProducts.reduce((acc, product) => {
                const productId = product.productId; // Assuming 'productId' is the property containing the product ID
                acc[productId] = (acc[productId] || 0) + 1;
                return acc;
            }, {});
            
            // Sort the product count map by count in descending order
            const sortedProducts = Object.entries(productCountMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5); // Get top 5 products
            
            // Convert the sorted products to an object
            const topProductsObject = {};
            sortedProducts.forEach(([productId, count]) => {
                topProductsObject[productId] = count;
            });
        
            const topProductsDetails = [];
        
            // Fetch product details for each top productId and include the count
            for (const productId in topProductsObject) {
                try {
                    const productDetail = await productModel.findById(productId);
                    if (productDetail) {
                        const count = topProductsObject[productId];
                        topProductsDetails.push({ productDetail, count });
                    }
                } catch (error) {
                    console.error('Error fetching product details:', error);
                }
            }


            res.render("adminHome", { overallSales, totalOrders, pendingToShipCount, pendingToDeliverCount, totalRetuns, totalOrdersCount, cancelled, dataForGraph,topProductsDetails });
        } else {
            res.render("login", { message: "email and password are incorrect" });
        }
    } catch (error) {
        console.error(error);
    }
}


//-----------------------------admin delete sesssion----------

const deleteSession = (req, res) => {

    try {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Session destroyed successfully');
            res.redirect('/admin');


        }
    })
} catch (error) {
    console.error(error);
}
}

//------------------------------------------admin dash usertable-----------------------------------------------  
const userdeatails = async (req, res) => {

    try {
        const currentPage = parseInt(req.query.page) || 1;
        console.log("ujhdgshfsiuvh page", currentPage);
        const productsPerPage = 10;

        const userdataAll = await userModel.find({ is_deleted: 0 })

        const totalPages = Math.ceil(userdataAll.length / productsPerPage);
        console.log("totalPages", totalPages);
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = currentPage * productsPerPage;
        const  userdata =userdataAll.slice(startIndex, endIndex);
        res.render("userTable", { users: userdata,currentPage: currentPage,
            totalPages: totalPages })
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
        const ProductTableAll = await productModel.find({ is_deleted: true }).populate("subcategory");
        let offerDetails = await offerModel.find();

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // Get the current date and format it
        const currentDate = formatDate(new Date().toISOString());
        const currentDateObj = new Date(currentDate.split('/').reverse().join('/'));

        const currentPage = parseInt(req.query.page) || 1;
        const productsPerPage = 10;
        const totalPages = Math.ceil(ProductTableAll.length / productsPerPage);
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = currentPage * productsPerPage;
        const  ProductTable =ProductTableAll.slice(startIndex, endIndex);
        // Filter offerDetails array to keep only offers with end dates greater than the current date
        offerDetails = offerDetails.filter(offer => {
            const endDateParts = offer.endDate.split('/');
            const endDateObj = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);
            return endDateObj > currentDateObj;
        });

        res.render("productManagment", { ProductTable, offerDetails, currentDate ,currentPage: currentPage,
            totalPages: totalPages});
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};






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
    try {
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
} catch (error) {
    console.error(error);
}
};



//-----------------------------------product delete-----------------


const productDelete = async (req, res) => {
    try {
    const deleteProduct = req.query.id

    await productModel.updateOne(
        { _id: deleteProduct },
        { $set: { is_deleted: false } }
    )
    res.redirect("/productManagment")
} catch (error) {
    console.error(error);
}
}

//----------------------------------User Orders-----------------
const loadOrders = async (req, res) => {

    try {

    const userOrdersAll = await orderModel.find().populate("userId")

  const currentPage = parseInt(req.query.page) || 1;
        console.log("ujhdgshfsiuvh page", currentPage);
        const productsPerPage = 10;
        const totalPages = Math.ceil(userOrdersAll.length / productsPerPage);
        console.log("totalPages", totalPages);
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = currentPage * productsPerPage;
        const userOrders =userOrdersAll.slice(startIndex, endIndex);
    res.render("userOrders", { userOrders,currentPage: currentPage,
        totalPages: totalPages })
} catch (error) {
    console.error(error);
}
}


//----------------------------------approve product-----------------
const approveProduct = async (req, res) => {
    try {
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
} catch (error) {
    console.error(error);
}
}



//----------------------------------order cancellation----------------- 


const cancelProduct = async (req, res) => {
    try {
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
} catch (error) {
    console.error(error);
}
}


//----------------------------------------------------------------------------------// 
//==========================admin orderupdate ======================================//
//----------------------------------------------------------------------------------// 

const updateOrderStatus = async (req, res) => {
    try {
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
} catch (error) {
    console.error(error);
}
}


//----------------------------------------------------------------------------------// 
//========================== update return status ======================================//
//----------------------------------------------------------------------------------// 
const updateReturnStatus = async (req, res) => {

    try {
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
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//==========================load coupon============================================//
//----------------------------------------------------------------------------------// 
const loadCoupon = async (req, res) => {
    try {
    const couponDetails = await couponModel.find({})
    console.log("couponDetails", couponDetails);

    res.render("coupon", { couponDetails })
} catch (error) {
    console.error(error);
}
}




//----------------------------------------------------------------------------------// 
//==========================add coupon=============================================//
//----------------------------------------------------------------------------------// 

const addCoupon = async (req, res) => {
    try {
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
} catch (error) {
    console.error(error);
}
}




//----------------------------------------------------------------------------------// 
//========================== delete coupon===========================================//
//----------------------------------------------------------------------------------// 


const deleteCoupon = async (req, res) => {

    try {
    const { couponId } = req.body


    await couponModel.deleteOne({ _id: couponId })


    res.status(200).json({ message: "coupon update su..." });
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//====================   sales report===============================================//
//----------------------------------------------------------------------------------// 

const loadSalesDash = async (req, res) => {
    try {
    res.render("salesReport")
} catch (error) {
    console.error(error);
}
}





//----------------------------------------------------------------------------------// 
//====================   sales montthly report======================================//
//----------------------------------------------------------------------------------// 





//appling offer--------------------

const applyOffer = async (req, res) => {
    try {
    const parsedPercentage = parseFloat(req.body.Percentage);
    const categoryId = req.body.CatId.trim(); // Remove extra spaces

  

    if (!isNaN(parsedPercentage) && parsedPercentage >= 0 && parsedPercentage <= 100) {
        try {
            // Convert categoryId to a valid ObjectId
            console.log("categoryId",categoryId);

            // If the parsed percentage is valid, update the category model
            await categoryModel.updateOne({ _id: categoryId }, { $set: { offerPercentage: parsedPercentage } });
            await productModel.updateMany({ subcategory: categoryId}, { $set: { offer: parsedPercentage } });
           
            return res.status(200).json({ message: 'Offer percentage updated successfully.' });
        } catch (error) {
            console.error('Error updating offer percentage:', error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    } else {
        // If the parsed percentage is not valid, return an error response
        return res.status(400).json({ error: 'Invalid percentage value.' });
    }
} catch (error) {
    console.error(error);
}
}

//edit  offer--------------------
const editOffer = async (req,res)=>{
  
    const parsedPercentage = parseFloat(req.body.newPercentage);
    const categoryId = req.body.categoryId.trim(); // Remove extra spaces


try {
    // Convert categoryId to a valid ObjectId
    

    // If the parsed percentage is valid, update the category model
    await categoryModel.updateOne({ _id: categoryId }, { $set: { offerPercentage: parsedPercentage } });
    return res.status(200).json({ message: 'Offer percentage updated successfully.' });
} catch (error) {
    console.error('Error updating offer percentage:', error);
    return res.status(500).json({ error: 'Internal server error.' });
}

}

//delete offer--------------------
const offerDelete = async (req,res)=>{
    const categoryId = req.body.categoryId.trim();

    try {
        // Convert categoryId to a valid ObjectId
        
    
        // If the parsed percentage is valid, update the category model
        await categoryModel.updateOne({ _id: categoryId }, { $set: { offerPercentage: 0 } });
        await productModel.updateMany({ subcategory: categoryId}, { $set: { offer: 0 } });
        return res.status(200).json({ message: 'Offer percentage updated successfully.' });
    } catch (error) {
        console.error('Error updating offer percentage:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}
//delete product  offer--------------------
const productOfferDelete = async (req,res)=>{
    try {
    const productId = req.body.productId
    await productModel.updateOne({ _id: productId }, { $set: { offer: 0 } });
    return res.status(200).json({ message: 'Offer percentage updated successfully.' });
} catch (error) {
    console.error('Error updating offer percentage:', error);
    return res.status(500).json({ error: 'Internal server error.' });
}
}


const OffersDash = async (req, res) => {
    try {
        // Function to format date from YYYY-MM-DD to DD/MM/YYYY
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // Fetch offer details from the database
        const offerDetails = await offerModel.find();
        
        // Get the current date and format it
        const currentDate = formatDate(new Date().toISOString());

        console.log(currentDate);

        // Render the 'offer' view with offer details and current date
        res.render("offer", { offerDetails, currentDate });
    } catch (error) {
        // Handle errors
        console.error('Error fetching offer details:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};







const createOffer = async (req, res) => {
    try {
    console.log(req.body);
    const { offerName, offerPercentage, startDate, endDate } = req.body;
    console.log(offerName, offerPercentage, startDate, endDate);

    // Function to format date from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Format the start date and end date
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // Creating the offer document with formatted dates
    const offer = await offerModel({
        offerName: offerName,
        percentage: offerPercentage,
        startDate: formattedStartDate,
        endDate: formattedEndDate
    });

    // Save the offer document
    await offer.save();

    const data = "ok";
    res.status(200).json(data);
} catch (error) {
    console.error(error);
}
};


const offerApplyPage = async (req,res)=>{
    try {
    const productId = req.query.productId
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Fetch offer details from the database
    const offerDetails = await offerModel.find();
    
    // Get the current date and format it
    const currentDate = formatDate(new Date().toISOString());

    console.log(currentDate);

    res.render("offerAddingPage",{productId,offerDetails,currentDate})
} catch (error) {
    console.error(error);
}
}


//produc side offer applied
const addOfferToProduct = async  (req,res)=>{
    try {
  
    const { productId,selectedOfferId} = req.body

   const offerApplied =  await offerModel.findOne({_id:selectedOfferId})


   await productModel.updateOne( {_id: productId}, { $set: { offer: offerApplied.percentage  } });
   

   
    
    const data = "ok";
    res.status(200).json(data);
} catch (error) {
    console.error(error);
}
}





//----------------------------------------------------------------------------------// 
//====================   sales report======================================//
//----------------------------------------------------------------------------------// 

const salesRePortDate = async (req,res)=>{
    try {

const startDate = req.body["start-date"];
const endDate = req.body["end-date"];

 // Convert dates to JavaScript Date objects with time included
 const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
 const endDateTime = new Date(`${endDate}T23:59:59.999Z`);
 const orders = await orderModel.aggregate([
    {
        $match: {
            date: { $gte: startDateTime, $lte: endDateTime },
        },
    },
    // Add more aggregation stages if needed
]);



res.render("salesReportPage",{orders})
} catch (error) {
    console.error(error);
}
}




//----------------------------------------------------------------------------------// 
//====================   sales montthly report======================================//
//----------------------------------------------------------------------------------// 
const generateMonthlysalesReport = async(req,res)=>{
    try {
 const selectedMonth = req.body.selectedMonth
    const  totalOrders = await orderModel.find()
    const orders = totalOrders.filter(order => {
        // Extract month from the order's date
        const orderMonth = new Date(order.date).getMonth() + 1; // Month is zero-based, so adding 1
    
        // Check if the order's month matches the selected month
        return orderMonth === parseInt(selectedMonth);
    });


    console.log(orders,"order");
    res.render("salesReportPage",{orders})
} catch (error) {
    console.error(error);
}
}




//----------------------------------------------------------------------------------// 
//====================   sales weeekly report======================================//
//----------------------------------------------------------------------------------// 
const generateWeeklysalesReport = async (req,res)=>{
    try {

        const currentDate = new Date();
        const startDateTime = new Date(currentDate);
        startDateTime.setDate(currentDate.getDate() - currentDate.getDay());
        const endDateTime = new Date(currentDate);
        endDateTime.setDate(startDateTime.getDate() + 6);
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding 1 because month is zero-based
        const day = String(currentDate.getDate()).padStart(2, '0');
        const startDate = `${year}-${month}-${String(startDateTime.getDate()).padStart(2, '0')}`; // Start of the week
        const endDate = `${year}-${month}-${String(endDateTime.getDate()).padStart(2, '0')}`; // End of the week
        
        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);

        const orders = await orderModel.aggregate([
            {
                $match: {
                    date: { $gte: startDateTime, $lte: endDateTime },
                },
            },
            // Add more aggregation stages if needed
        ]);

        res.render("salesReportPage",{orders})

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
    applyOffer,
    editOffer,
    offerDelete,
    productOfferDelete,
    OffersDash,
    createOffer,
    offerApplyPage,
    addOfferToProduct,
    salesRePortDate,
    generateMonthlysalesReport,
    generateWeeklysalesReport

}
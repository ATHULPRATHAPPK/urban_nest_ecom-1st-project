
const mongoose = require("mongoose")
const path = require("path")
const express = require("express")
const app = express()
const paypal = require("paypal-rest-sdk")
const puppeteer = require("puppeteer")
const ejs = require("ejs")
const userModel = require("../../model/userModel/signUp")
const otpModel = require("../../model/userModel/otp")
const cartModel = require("../../model/userModel/cart")
const addressModel = require("../../model/userModel/addressModel")
const moment = require('moment');
const categoryModel = require("../../model/adminModels/categoryModel")
const orderModel = require("../../model/userModel/orderModel")
const productModel = require("../../model/adminModels/productModel")
const wishlistModel = require("../../model/userModel/wishlist")
const couponModel = require("../../model/adminModels/couponSchema")
const walletModel = require("../../model/userModel/wallet")
require('dotenv').config();
const { log, Console } = require("console")
const bodyParser = require("body-parser")
const bodyparser = require("body-parser")
const nodemailer = require("nodemailer")
const mailgen = require("mailgen")
const emailAddress = process.env.EMAIL_ADDRESS;
const emailPassword = process.env.EMAIL_PASSWORD;

app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

app.set("view engine", "ejs")
app.set(path.join(__dirname, "views", "userViews"))



//----------------------------home page load-------------------------------------------------------------

const loadhome = async (req, res) => {
    try {
        let sectionIndex = 0;
        const allProducts = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory")
        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const message = userData.name
            const userId = userData._id
            const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
            if (wishlist) {
                const wishlistProducts = wishlist.product;
                const products = wishlistProducts.map(item => item.productId);
                //to filter the productid for wish list
                const productIds = products.map(product => product._id);
                console.log("product ids", productIds);
                console.log("mobile ids working..");
                res.render("home", { allProducts, message, sectionIndex, productIds });
            } else {

                res.render("home", { allProducts, message, sectionIndex });
            }
        }
        else {
            res.render("home", { allProducts, sectionIndex })
        }
    } catch (error) {
        console.error(error);
    }

}



//---------------------------- load login page-------------------------------------------------------------


const loadlogin = async (req, res) => {
    try {
        res.render("userlogin")
    } catch (error) {
        console.error(error);
    }
}


//-----------------------------------load register page -------------------------------------------------------------
const loadRegister = (req, res) => {
    try {
        res.render("userRegister")
    } catch (error) {
        console.error(error);
    }
}



//----------------------------inserting and mail generation-------------------------------------------------------------
const insertdata = async (req, res) => {

    try {

        if (req.body.password1 === req.body.password) {
            const alreadyExist = await userModel.findOne({ email: req.body.email })


            if (alreadyExist) {

                res.render("userRegister", { message: "This email already exist" })
            }
            else {
                console.log(`mail ${req.body.email}`);
                const insertdb = await new userModel({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                    mobile: req.body.number
                })

                await insertdb.save()

                // ---------------------------------nodemailer-----------------------------------------


                // const mailcontent = (req,res)=>{

                function otpGenerator(length) {       //otp generating function
                    let otp = ""

                    for (let i = 0; i < length; i++) {

                        otp = otp + (Math.floor(Math.random() * 10).toString())
                    }
                    return otp
                    console.log(otp);

                }

                let otp = otpGenerator(4)
                console.log(`otp is ${otp}`);    //returning otp
                //    const userMail = req.body.email
                let config = {
                    service: "gmail",
                    auth: {
                        user: emailAddress,     //email and password of sender
                        pass: emailPassword

                    }
                }
                let transporter = nodemailer.createTransport(config)

                let mailgenerator = new mailgen({
                    theme: "default",
                    product: {
                        name: "Urban Nest",
                        link: "https://http://localhost:3001/home"
                    }
                })
                let response = {
                    body: {
                        name: req.body.name,
                        intro: `urban nest verification code ${otp}`,
                        outro: "thankyou"
                    }
                }

                let mail = mailgenerator.generate(response)

                let message = {
                    from: "athulprathap216@gmail.com",
                    to: req.body.email,
                    subject: "otp verification",
                    html: mail

                }

                transporter.sendMail(message).then(() => {
                    //  return res.json({
                    //      msg: "mail sended"
                    //  })
                    console.log(`mail sended to the ${req.body.email}`);
                }).catch((error) => {
                    console.log(error);
                })

                const insertotp = await new otpModel({

                    userId: req.body.email,
                    otp: otp,
                    expiresAt: Date.now()

                })

                await insertotp.save()
                let userid = req.body.email
                res.render("otpVerification", { data: userid })
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

            setTimeout(deleteExpiredOtps, 60 * 1000)



        } else {
            res.render("userRegister", { message: "Password Missmatch" })
        }

    }
    catch (error) {
        console.log(error.message);
    }
}



//----------------------------login otp verification-------------------------------------------------------------
const otpVerify = async (req, res) => {
    try {
        let otp1 = req.body.digit1
        let otp2 = req.body.digit2
        let otp3 = req.body.digit3
        let otp4 = req.body.digit4

        let mainOtp = otp1 + otp2 + otp3 + otp4
        const userid = req.body.email
        console.log(userid);

        const otpData = await otpModel.findOne({ userId: userid, otp: mainOtp })



        console.log(typeof mainOtp);
        console.log(mainOtp);
        console.log(otpData)
        if (otpData) {
            await userModel.updateOne({ email: userid }, { $set: { is_verified: 1 } })

            res.render("userlogin", { completed: "Successfully Registered" })
        }
        else {
            res.render("otpVerification", { data: userid })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
//  ------------------------------------------------------loadhome page--------------------------------------------

const loginload = async (req, res) => {
    try {
        const email1 = req.body.email
        const password1 = req.body.password.toString()


        const userdata = await userModel.findOne({ email: email1, password: password1, status: 0, is_verified: 1, is_deleted: 0 })

        if (userdata) {
            const id = userdata._id
            req.session.userId = email1
            console.log(req.session.userId);

            let userWallet = await walletModel.findOne({ userId: id });

            // If the user doesn't have a wallet, create a new one
            if (!userWallet) {
                userWallet = new walletModel({
                    userId: id,
                    balance: 0,
                    transactions: [] // You can initialize transactions array if needed
                });
                await userWallet.save();
            }

            res.redirect("/")
        }
        else {
            res.render("userlogin", { message: "email and password are incorrect" })
        }

    } catch (error) {
        console.log(error.message);
    }
}


//----------------------------logout user--------------

const usereLogout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).send('Internal Server Error');
            } else {
                console.log('Session destroyed successfully');
                res.redirect('/');


            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

//  ------------------------------------------------------forgot password-------------------------------------------
const forgotpassword = (req, res) => {
    try {
        res.render("forgotpassword")
    } catch (error) {
        console.log(error.message);
    }
}


//------------------------------ forgotpassword otp sending and saving in database------------------------
const otpForgotpass = async (req, res) => {
    try {
        let email1 = req.body.email
        const userdata = await userModel.findOne({ email: email1 })
        console.log(userdata);
        if (userdata) {
            // ---------------------------------------mail sending by node mailer-----------------

            function otpGenerator(length) {       //otp generating function
                let otp = ""
                for (let i = 0; i < length; i++) {
                    otp = otp + (Math.floor(Math.random() * 10).toString())
                }
                return otp
            }

            let otp = otpGenerator(4)
            console.log(`otp is ${otp}`);    //returning otp
            //    const userMail = req.body.email
            let config = {
                service: "gmail",
                auth: {
                    user: "athulprathap216@gmail.com",     //email and password of sender
                    pass: "hsse gmvs vpvo ghdd"

                }
            }
            let transporter = nodemailer.createTransport(config)

            let mailgenerator = new mailgen({
                theme: "default",
                product: {
                    name: "Urban Nest",
                    link: "https://http://localhost:3001/home"
                }
            })
            let response = {
                body: {
                    name: req.body.name,
                    intro: `urban nest verification code ${otp}`,
                    outro: "thankyou"
                }
            }

            let mail = mailgenerator.generate(response)

            let message = {
                from: "athulprathap216@gmail.com",
                to: req.body.email,
                subject: "otp verification",
                html: mail

            }

            transporter.sendMail(message).then(() => {
                //  return res.json({
                //      msg: "mail sended"
                //  })
                console.log(`mail sended to the ${req.body.email}`);
            }).catch((error) => {
                console.log(error);
            })




            const insertotp = await new otpModel({

                userId: req.body.email,
                otp: otp,
                expiresAt: Date.now()

            })

            await insertotp.save()

            // --------------------------------------------------
            let userid = req.body.email
            res.render("otpVerification2", { data: userid })
        }
        else {
            res.render("forgotpassword", { message: "User not  found" })
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

        setTimeout(deleteExpiredOtps, 60 * 1000)

    } catch (error) {
        console.log(error.message);
    }
}



//------------------------ forgot password otp verification------------------
const otpVerifyForgot = async (req, res) => {

    try {
        let otp1 = req.body.digit1
        let otp2 = req.body.digit2
        let otp3 = req.body.digit3
        let otp4 = req.body.digit4

        let mainOtp = otp1 + otp2 + otp3 + otp4
        const userid = req.body.email
        console.log(userid);

        const otpData = await otpModel.findOne({ userId: userid, otp: mainOtp })
        console.log(otpData)
        if (otpData) {
            res.render("passwordset", { data: userid })
        }
        else {
            res.render("otpVerification2", { data: userid })
        }
    } catch (error) {
        console.log(error.message);
    }

}


//------------------------ password reset otp --------------------------------------------
const resetPassword = async (req, res) => {
    try {
        let password = req.body.password
        let password1 = req.body.password1
        let email = req.body.email

        if (password === password1) {
            await userModel.updateOne({ email: email }, { $set: { password: password } })
            res.render("userlogin")
        }
        else {
            res.render("passwordset", { message: "Password missmatch plz enter correcrtly" })
        }
    } catch (error) {
        console.log(error.message);
    }
}


//-----------------------------load product idivid details---------------------------------------------------
const loadProduct = async (req, res) => {
    try {
        const productId = req.query.id
        const productDetails = await productModel.findOne({ _id: productId }).populate("subcategory")

        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const message = userData
            const userId = userData._id

            const productPresent = await cartModel.find({ userId: userId, "product.productId": productId })
            if (productPresent.length > 0) {
                res.render("productDetails", { productDetails, message, productPresent })
            } else {
                res.render("productDetails", { productDetails, message })
            }

        }
        else {
            res.render("productDetails", { productDetails })

        }
    } catch (error) {
        console.log(error.message);
    }
}

//-------------------------------------------------------------laptop page -------------------

const loadLaptops = async (req, res) => {
    try {
        const productDetails = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory");
        const laptopProducts = productDetails.filter((product) => {
            return product.subcategory.category === 'laptops';
        });
        let sectionIndex = 0; // Define the section index here
        const sortBy = req.query.sortBy;
        const searchQuery = req.query.q;

        console.log(req.query.q, "search");
        let querydata = [];
        querydata.push(
            req.query.categories || '', // If req.query.categories is undefined, use an empty string
            req.query.colors || '',     // If req.query.colors is undefined, use an empty string
            req.query.brands || ''      // If req.query.brands is undefined, use an empty string
        );
        querydata = querydata.map(item => item.split(',')).flat().filter(Boolean);
        let uniqueSubcategories = [];
        let uniqueColors = [];
        let uniqueBrands = [];

        // Iterate over the productDetails array to collect unique values
        laptopProducts.forEach(product => {
            // Extract subcategory.subcategory, color, and brandName
            const subcategory = product.subcategory.subcategory;
            const color = product.color;
            const brand = product.brandName;

            // Add unique subcategory to the array if not already present
            if (!uniqueSubcategories.includes(subcategory)) {
                uniqueSubcategories.push(subcategory);
            }

            // Add unique color to the array if not already present
            if (!uniqueColors.includes(color)) {
                uniqueColors.push(color);
            }

            // Add unique brand to the array if not already present
            if (!uniqueBrands.includes(brand)) {
                uniqueBrands.push(brand);
            }
        });

        // Now uniqueSubcategories, uniqueColors, and uniqueBrands contain the unique values



        const currentPage = parseInt(req.query.page) || 1;
        console.log("ujhdgshfsiuvh page", currentPage);
        const productsPerPage = 9;
        const totalPages = Math.ceil(laptopProducts.length / productsPerPage);
        console.log("totalPages", totalPages);

        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = currentPage * productsPerPage;
        const productsForPage = laptopProducts.slice(startIndex, endIndex);


        if (req.query.categories || req.query.colors || req.query.brands) {


            console.log("category present");
            console.log("req.query.sortBy", req.query.sortBy);

            const selectedCategories = req.query.categories ? req.query.categories.split(",") : [];
            const selectedColors = req.query.colors ? req.query.colors.split(",") : [];
            const selectedBrands = req.query.brands ? req.query.brands.split(",") : [];

            let filteredProducts = laptopProducts.filter(product => {
                let match = true;

                // Check if the product matches the selected categories
                if (selectedCategories.length > 0 && !selectedCategories.includes(product.subcategory.subcategory)) {
                    match = false;
                }

                // Check if the product matches the selected colors
                if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
                    match = false;
                }

                // Check if the product matches the selected brands
                if (selectedBrands.length > 0 && !selectedBrands.includes(product.brandName)) {
                    match = false;
                }

                return match;
            });

            if (searchQuery) {
                // Filter the previously filtered products based on the search query
                const regex = new RegExp(searchQuery, "i");
                filteredProducts = filteredProducts.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }

            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            const productsForPage = filteredProducts.slice(startIndex, endIndex);


            if (req.session.userId) {
                const userData = await userModel.findOne({ email: req.session.userId });
                const message = userData;
                const userId = userData._id
                //populate data collecting from product model
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else {
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, querydata, uniqueSubcategories, uniqueColors, uniqueBrands });
                    } else {

                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                }
            } else {
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    //pagination in high to low
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productLaptop: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productLaptop: productsForPage, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                }
                else {
                    res.render("products", {
                        productLaptop: productsForPage, currentPage: currentPage,
                        totalPages: totalPages, sectionIndex, uniqueSubcategories, querydata, uniqueColors, uniqueBrands,
                    });
                }
            }



        }
        else {

            console.log("category  not prsent");
            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(laptopProducts.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            let productsForPage = laptopProducts.slice(startIndex, endIndex);



            if (searchQuery) {
                const regex = new RegExp(searchQuery, "i");
                productsForPage = productsForPage.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }


            if (req.session.userId) {
                const userData = await userModel.findOne({ email: req.session.userId })
                const message = userData
                const userId = userData._id
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {
                    const sortedProduct = laptopProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);


                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                    } else {

                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                    }

                } else if (sortBy === "Low-to-high") {

                    const sortedProduct = laptopProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }

                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        console.log("product ids", productIds);
                        console.log("mobile ids working..");
                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                    } else {

                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                    }

                } else {

                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        console.log("product ids", productIds);

                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                    } else {

                        res.render("products", { productLaptop: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                    }
                }
            }
            else {

                if (sortBy === "High-to-low") {

                    const sortedProduct = laptopProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productLaptop: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands });

                } else if (sortBy === "Low-to-high") {

                    const sortedProduct = laptopProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productLaptop: productsForPage, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                } else {
                    console.log("this else is working",);
                    res.render("products", { productLaptop: productsForPage, sectionIndex, currentPage: currentPage, totalPages: totalPages, querydata, uniqueColors, uniqueBrands, uniqueSubcategories });
                }
            }
        }
        // Pass the filteredProducts to the view
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


//------------------------------------------------------------mobile Page-------------------

const loadMobiles = async (req, res) => {
    try {
        const productDetails = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory");
        const mobileProducts = productDetails.filter((product) => {
            return product.subcategory.category === 'mobile';
        });

        let sectionIndex = 0; // Define the section index here
        const sortBy = req.query.sortBy;
        const searchQuery = req.query.q;

        console.log(req.query.q, "search");
        let querydata = [];
        querydata.push(
            req.query.categories || '', // If req.query.categories is undefined, use an empty string
            req.query.colors || '',     // If req.query.colors is undefined, use an empty string
            req.query.brands || ''      // If req.query.brands is undefined, use an empty string
        );
        querydata = querydata.map(item => item.split(',')).flat().filter(Boolean);
        let uniqueSubcategories = [];
        let uniqueColors = [];
        let uniqueBrands = [];

        // Iterate over the productDetails array to collect unique values
        mobileProducts.forEach(product => {
            // Extract subcategory.subcategory, color, and brandName
            const subcategory = product.subcategory.subcategory;
            const color = product.color;
            const brand = product.brandName;

            // Add unique subcategory to the array if not already present
            if (!uniqueSubcategories.includes(subcategory)) {
                uniqueSubcategories.push(subcategory);
            }

            // Add unique color to the array if not already present
            if (!uniqueColors.includes(color)) {
                uniqueColors.push(color);
            }

            // Add unique brand to the array if not already present
            if (!uniqueBrands.includes(brand)) {
                uniqueBrands.push(brand);
            }
        });




        //paginatio

        const currentPage = parseInt(req.query.page) || 1;
        console.log("ujhdgshfsiuvh page", currentPage);
        const productsPerPage = 9;
        const totalPages = Math.ceil(mobileProducts.length / productsPerPage);
        console.log("totalPages", totalPages);

        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = currentPage * productsPerPage;
        const productsForPage = mobileProducts.slice(startIndex, endIndex);

        if (req.query.categories || req.query.colors || req.query.brands) {
            console.log("category present");
            console.log("req.query.sortBy", req.query.sortBy);

            const selectedCategories = req.query.categories ? req.query.categories.split(",") : [];
            const selectedColors = req.query.colors ? req.query.colors.split(",") : [];
            const selectedBrands = req.query.brands ? req.query.brands.split(",") : [];

            let filteredProducts = mobileProducts.filter(product => {
                let match = true;

                // Check if the product matches the selected categories
                if (selectedCategories.length > 0 && !selectedCategories.includes(product.subcategory.subcategory)) {
                    match = false;
                }

                // Check if the product matches the selected colors
                if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
                    match = false;
                }

                // Check if the product matches the selected brands
                if (selectedBrands.length > 0 && !selectedBrands.includes(product.brandName)) {
                    match = false;
                }

                return match;
            });


            if (searchQuery) {
                // Filter the previously filtered products based on the search query
                const regex = new RegExp(searchQuery, "i");
                filteredProducts = filteredProducts.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }


            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            const productsForPage = filteredProducts.slice(startIndex, endIndex);


            if (req.session.userId) {
                const userData = await userModel.findOne({ email: req.session.userId });
                const message = userData;
                const userId = userData._id
                //populate data collecting from product model
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else {
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, querydata, uniqueSubcategories, uniqueColors, uniqueBrands });
                    } else {

                        res.render("products", { productMobile: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                }
            } else {
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    //pagination in high to low
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productMobile: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productMobile: productsForPage, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                }
                else {
                    res.render("products", {
                        productMobile: productsForPage, currentPage: currentPage,
                        totalPages: totalPages, sectionIndex, uniqueSubcategories, querydata, uniqueColors, uniqueBrands
                    });
                }
            }



        } else {
            console.log("category  not prsent");
            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(mobileProducts.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            let productsForPage = mobileProducts.slice(startIndex, endIndex);

            if (searchQuery) {
                const regex = new RegExp(searchQuery, "i");
                productsForPage = productsForPage.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }


            if (req.session.userId) {
                let sectionIndex = 0;
                const userData = await userModel.findOne({ email: req.session.userId })
                const message = userData
                const userId = userData._id
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {
                    const sortedProduct = mobileProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });

                    }



                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = mobileProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {

                        res.render("products", { productMobile: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }



                } else {

                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productMobile: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }

                }
            }
            else {



                if (sortBy === "High-to-low") {

                    const sortedProduct = mobileProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }

                    res.render("products", { productMobile: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });

                } else if (sortBy === "Low-to-high") {

                    const sortedProduct = mobileProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }

                    res.render("products", { productMobile: productsForPage, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });

                } else {

                    console.log("this else is workin");
                    res.render("products", { productMobile: productsForPage, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                }
            }
        }
        // Pass the filteredProducts to the view
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

//------------------------------------------------------------Tablets Page-------------------

const loadTablets = async (req, res) => {
    try {
        const productDetails = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory")
        const tabletsProducts = productDetails.filter((product) => {
            return product.subcategory.category === 'tablets';
        });


        let sectionIndex = 0; // Define the section index here
        const sortBy = req.query.sortBy;
        const searchQuery = req.query.q;
        let querydata = [];
        querydata.push(
            req.query.categories || '', // If req.query.categories is undefined, use an empty string
            req.query.colors || '',     // If req.query.colors is undefined, use an empty string
            req.query.brands || ''      // If req.query.brands is undefined, use an empty string
        );
        querydata = querydata.map(item => item.split(',')).flat().filter(Boolean);
        let uniqueSubcategories = [];
        let uniqueColors = [];
        let uniqueBrands = [];

        // Iterate over the productDetails array to collect unique values
        tabletsProducts.forEach(product => {
            // Extract subcategory.subcategory, color, and brandName
            const subcategory = product.subcategory.subcategory;
            const color = product.color;
            const brand = product.brandName;

            // Add unique subcategory to the array if not already present
            if (!uniqueSubcategories.includes(subcategory)) {
                uniqueSubcategories.push(subcategory);
            }

            // Add unique color to the array if not already present
            if (!uniqueColors.includes(color)) {
                uniqueColors.push(color);
            }

            // Add unique brand to the array if not already present
            if (!uniqueBrands.includes(brand)) {
                uniqueBrands.push(brand);
            }
        });

        // Now uniqueSubcategories, uniqueColors, and uniqueBrands contain the unique values

        const currentPage = parseInt(req.query.page) || 1;
        console.log("ujhdgshfsiuvh page", currentPage);
        const productsPerPage = 9;
        const totalPages = Math.ceil(tabletsProducts.length / productsPerPage);
        console.log("totalPages", totalPages);

        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = currentPage * productsPerPage;
        const productsForPage = tabletsProducts.slice(startIndex, endIndex);

        if (req.query.categories || req.query.colors || req.query.brands) {


            console.log("category present");
            console.log("req.query.sortBy", req.query.sortBy);

            const selectedCategories = req.query.categories ? req.query.categories.split(",") : [];
            const selectedColors = req.query.colors ? req.query.colors.split(",") : [];
            const selectedBrands = req.query.brands ? req.query.brands.split(",") : [];

            let filteredProducts = tabletsProducts.filter(product => {
                let match = true;

                // Check if the product matches the selected categories
                if (selectedCategories.length > 0 && !selectedCategories.includes(product.subcategory.subcategory)) {
                    match = false;
                }

                // Check if the product matches the selected colors
                if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
                    match = false;
                }

                // Check if the product matches the selected brands
                if (selectedBrands.length > 0 && !selectedBrands.includes(product.brandName)) {
                    match = false;
                }

                return match;
            });


            if (searchQuery) {
                // Filter the previously filtered products based on the search query
                const regex = new RegExp(searchQuery, "i");
                filteredProducts = filteredProducts.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }




            console.log("Filtered Products:", filteredProducts);
            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            const productsForPage = filteredProducts.slice(startIndex, endIndex);


            if (req.session.userId) {
                const userData = await userModel.findOne({ email: req.session.userId });
                const message = userData;
                const userId = userData._id
                //populate data collecting from product model
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productTabletse: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else {
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, querydata, uniqueSubcategories, uniqueColors, uniqueBrands });
                    } else {

                        res.render("products", { productTablets: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                }
            } else {
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    //pagination in high to low
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productTablets: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productTablets: productsForPage, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                }
                else {
                    res.render("products", {
                        productTablets: productsForPage, currentPage: currentPage,
                        totalPages: totalPages, sectionIndex, uniqueSubcategories, querydata, uniqueColors, uniqueBrands
                    });
                }
            }


        } else {

            console.log("category  not prsent");
            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(tabletsProducts.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            let productsForPage = tabletsProducts.slice(startIndex, endIndex);

            if (searchQuery) {
                const regex = new RegExp(searchQuery, "i");
                productsForPage = productsForPage.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }


            if (req.session.userId) {
                const userData = await userModel.findOne({ email: req.session.userId })
                const message = userData
                const userId = userData._id
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {
                    const sortedProduct = tabletsProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);

                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }

                } else if (sortBy === "Low-to-high") {

                    const sortedProduct = tabletsProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);

                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }

                } else {

                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { productTablets: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                }
            }
            else {

                if (sortBy === "High-to-low") {
                    const sortedProduct = tabletsProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productTablets: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = tabletsProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { productTablets: sortedProduct, productsForPage, sort: -1, currentPage: currentPage, totalPages: totalPages, sectionIndex, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                } else {
                    res.render("products", { productTablets: productsForPage, currentPage: currentPage, totalPages: totalPages, sectionIndex, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                }
            }
        }     // Pass the filteredProducts to the view
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

//------------------------------------------------------------all products Page-------------------


const loadAllProducts = async (req, res) => {
    try {
        const productDetails = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory");
        // console.log("productDetails",productDetails);

        let sectionIndex = 0; // Define the section index here
        const sortBy = req.query.sortBy;
        const searchQuery = req.query.q;

        console.log(req.query.q, "search");

        let querydata = [];
        querydata.push(
            req.query.categories || '', // If req.query.categories is undefined, use an empty string
            req.query.colors || '',     // If req.query.colors is undefined, use an empty string
            req.query.brands || ''      // If req.query.brands is undefined, use an empty string
        );
        querydata = querydata.map(item => item.split(',')).flat().filter(Boolean);

        let uniqueSubcategories = [];
        let uniqueColors = [];
        let uniqueBrands = [];

        // Iterate over the productDetails array to collect unique values
        productDetails.forEach(product => {
            // Extract subcategory.subcategory, color, and brandName
            const subcategory = product.subcategory.subcategory;
            const color = product.color;
            const brand = product.brandName;

            // Add unique subcategory to the array if not already present
            if (!uniqueSubcategories.includes(subcategory)) {
                uniqueSubcategories.push(subcategory);
            }

            // Add unique color to the array if not already present
            if (!uniqueColors.includes(color)) {
                uniqueColors.push(color);
            }

            // Add unique brand to the array if not already present
            if (!uniqueBrands.includes(brand)) {
                uniqueBrands.push(brand);
            }
        });



        if (req.query.categories || req.query.colors || req.query.brands) {
            console.log("category present");
            console.log("req.query.sortBy", req.query.sortBy);

            const selectedCategories = req.query.categories ? req.query.categories.split(",") : [];
            const selectedColors = req.query.colors ? req.query.colors.split(",") : [];
            const selectedBrands = req.query.brands ? req.query.brands.split(",") : [];

            // Filter the products based on the selected categories, colors, and brands
            let filteredProducts = productDetails.filter(product => {
                let match = true;

                // Check if the product matches the selected categories
                if (selectedCategories.length > 0 && !selectedCategories.includes(product.subcategory.subcategory)) {
                    match = false;
                }

                // Check if the product matches the selected colors
                if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
                    match = false;
                }

                // Check if the product matches the selected brands
                if (selectedBrands.length > 0 && !selectedBrands.includes(product.brandName)) {
                    match = false;
                }

                return match;
            });



            //search works here 

            if (searchQuery) {
                // Filter the previously filtered products based on the search query
                const regex = new RegExp(searchQuery, "i");
                filteredProducts = filteredProducts.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }



            console.log("Filtered Products:", filteredProducts);
            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            const productsForPage = filteredProducts.slice(startIndex, endIndex);

            if (req.session.userId) {
                const userData = await userModel.findOne({ email: req.session.userId });
                const message = userData;
                const userId = userData._id
                //populate data collecting from product model
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { allProducts: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { allProducts: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { allProducts: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    } else {
                        res.render("products", { allProducts: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                } else {
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { allProducts: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, querydata, uniqueSubcategories, uniqueColors, uniqueBrands });
                    } else {

                        res.render("products", { allProducts: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                }
            } else {
                if (sortBy === "High-to-low") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    //pagination in high to low
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { allProducts: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    res.render("products", { allProducts: productsForPage, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                }
                else {
                    res.render("products", {
                        allProducts: productsForPage, currentPage: currentPage,
                        totalPages: totalPages, sectionIndex, uniqueSubcategories, querydata, uniqueColors, uniqueBrands
                    });
                }
            }
        } else {

            console.log("category  not prsent");
            const currentPage = parseInt(req.query.page) || 1;
            console.log("ujhdgshfsiuvh page", currentPage);
            const productsPerPage = 9;
            const totalPages = Math.ceil(productDetails.length / productsPerPage);
            console.log("totalPages", totalPages);

            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = currentPage * productsPerPage;
            let productsForPage = productDetails.slice(startIndex, endIndex);

            if (searchQuery) {
                const regex = new RegExp(searchQuery, "i");
                productsForPage = productsForPage.filter(product => {
                    return (
                        regex.test(product.subcategory.subcategory) ||
                        regex.test(product.color) ||
                        regex.test(product.brandName) ||
                        regex.test(product.productName)
                        // Add more fields if needed
                    );
                });
            }




            if (req.session.userId) {
                const userData = await userModel.findOne({ email: req.session.userId });
                const message = userData;
                const userId = userData._id
                //populate data collecting from product model
                const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
                if (sortBy === "High-to-low") {

                    const sortedProduct = productDetails.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);



                        res.render("products", { allProducts: productsForPage, message, sectionIndex, productIds, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });

                    } else {

                        res.render("products", { allProducts: productsForPage, message, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }


                } else if (sortBy === "Low-to-high") {
                    const sortedProduct = productDetails.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }
                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { allProducts: productsForPage, message, sectionIndex, productIds, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });

                    } else {

                        res.render("products", { allProducts: productsForPage, message, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }

                } else {

                    if (wishlist) {
                        const wishlistProducts = wishlist.product;
                        const products = wishlistProducts.map(item => item.productId);
                        //to filter the productid
                        const productIds = products.map(product => product._id);
                        res.render("products", { allProducts: productsForPage, message, sectionIndex, productIds, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });

                    } else {

                        res.render("products", { allProducts: productsForPage, message, sectionIndex, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                    }
                }
            } else {

                if (sortBy === "High-to-low") {



                    const sortedProduct = productDetails.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));


                    //pagination in high to low
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );;
                        });
                    }
                    res.render("products", { allProducts: productsForPage, sectionIndex, sort: 1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });

                } else if (sortBy === "Low-to-high") {

                    const sortedProduct = productDetails.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    let productsForPage = sortedProduct.slice(startIndex, endIndex);

                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, "i");
                        productsForPage = productsForPage.filter(product => {
                            return (
                                regex.test(product.subcategory.subcategory) ||
                                regex.test(product.color) ||
                                regex.test(product.brandName) ||
                                regex.test(product.productName)
                                // Add more fields if needed
                            );
                        });
                    }


                    res.render("products", { allProducts: productsForPage, sectionIndex, sort: -1, currentPage: currentPage, totalPages: totalPages, uniqueSubcategories, querydata, uniqueColors, uniqueBrands });
                }
                else {
                    res.render("products", {
                        allProducts: productsForPage, currentPage: currentPage,
                        totalPages: totalPages, sectionIndex, uniqueSubcategories, querydata, uniqueColors, uniqueBrands
                    });
                }
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

//---------------------------------------------------cart--------------------------------------------------------

const loadCart = async (req, res) => {

    try {

        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const targetUserId = userData._id
            const message = userData
            const cartDetails = await cartModel.find({}).populate("userId");

            const userCartDetails = cartDetails.filter((cart) => {
                // Check if userId exists and is not null before accessing its _id property
                return cart.userId && cart.userId._id.equals(targetUserId);
            });


            console.log("user cart", userCartDetails);
            if (userCartDetails.length > 0) {

                let cartId = userCartDetails[0]._id
                console.log("cartId", cartId);
                console.log("userCartDetails", userCartDetails);

                userCartDetails.forEach(async cart => {
                    console.log("User ID:", cart.userId._id);
                    console.log("Products:");
                    for (const product of cart.product) {
                        console.log("  Product ID:", product.productId);
                        let productIdToUpdate = product.productId;

                        // Use await within an async function to wait for the findOne operation
                        try {
                            const foundProduct = await productModel.findOne({ _id: productIdToUpdate });
                            if (foundProduct) {
                                console.log("    Quantity:", foundProduct.quantity);
                                // Access other properties of the found product object as needed
                                if (foundProduct.quantity == 0) {
                                    const cart = await cartModel.findById(cartId);
                                    if (cart) {
                                        // Find the index of the product in the cart's product array
                                        const productIndex = cart.product.findIndex(product => product.productId === productIdToUpdate);

                                        if (productIndex !== -1 && cart.product[productIndex].quantity != 0) {
                                            // Update the quantity of the product to zero


                                            cart.subTotal = cart.subTotal - cart.product[productIndex].quantity * cart.product[productIndex].price




                                            cart.product[productIndex].stock = 0;
                                            cart.product[productIndex].quantity = 0;
                                            cart.product[productIndex].total = 0;
                                            // Save the updated cart document
                                            await cart.save();

                                            console.log("Product quantity in cart updated to zero");
                                        } else {
                                            console.log("Product not found in cart");
                                        }
                                    } else {
                                        console.log("Cart not found");
                                    }




                                    //i want to update and set the qunity in product array curresponding product to zero
                                } else {

                                    const cart = await cartModel.findById(cartId);
                                    if (cart) {
                                        // Find the index of the product in the cart's product array
                                        const productIndex = cart.product.findIndex(product => product.productId === productIdToUpdate);

                                        if (productIndex !== -1) {
                                            // Update the quantity of the product to zero
                                            cart.product[productIndex].stock = foundProduct.quantity;

                                            // Save the updated cart document
                                            await cart.save();

                                            console.log("Product this is working");
                                        } else {
                                            console.log("Product not found in cart");
                                        }
                                    } else {
                                        console.log("Cart not found");
                                    }

                                }
                            } else {
                                console.log("    Product not found in product model");
                            }
                        } catch (error) {
                            console.error("Error finding product:", error);
                        }
                    }
                });

                res.render("cart", { userCartDetails, message })
            }
            else {
                console.log("user cart not presnt");
                const noCartDetails = "no user presnt"
                res.render("cart", { noCartDetails })
            }
        }
        else {
            res.redirect("/")
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");

    }

}
//----------------------------------------------------------------------------------// 
//============================Add to cart===========================================//
//----------------------------------------------------------------------------------// 
const addToCart = async (req, res) => {


    const pId = req.body.productId
    const pQuantity = req.body.quantity
    const userData = req.body.userDetails
    const userdetails = JSON.parse(userData)
    productDetails = await productModel.find({ _id: pId }).populate("subcategory");
    const cartUser = await cartModel.find({}).populate("userId");
    const isUserPresent = cartUser.some(cartDoc => cartDoc.userId && cartDoc.userId._id.equals(userdetails._id));

    if (isUserPresent) {
        const priceInt = parseInt(productDetails[0].price, 10)
        const quatityInt = parseInt(pQuantity, 10)
        const productId = productDetails[0]._id; // Assuming productDetails is an array with at least one element
        const cartItems = await cartModel.find({
            userId: userdetails._id,
            product: {
                $elemMatch: {
                    productId: productId
                }
            }
        });

        if (cartItems.length > 0) {
            // -----------------------adding same product in the cart----------
            console.log("adding same product");
            const userId = userdetails._id;
            const productId = productDetails[0].id

            //--------------same product total and subtotal---------------
            for (const cartItem of cartItems) {
                // Find the product within the cartItem's product array
                const matchingProduct = cartItem.product.find(product => product.productId === productId);
                const totalForProduct = matchingProduct.total;
                const offerPrice = productDetails[0].offer
                const newPrice = priceInt - (priceInt * offerPrice / 100)

                const totalSum = totalForProduct + newPrice * quatityInt
                const roundedTotal = totalSum.toFixed(2)
                //---------------finding the existing subtotal in  the cart------
                const userCart = await cartModel.find({ userId: userdetails._id })
                const subTotalValue = userCart[0].subTotal;
                const newSubTotal = subTotalValue + newPrice * quatityInt
                const roundedSubTotal = newSubTotal.toFixed(2)

                await cartModel.updateOne(
                    { userId: userdetails._id, "product.productId": productId },
                    {
                        $set: {
                            "product.$.total": roundedTotal,
                            subTotal: roundedSubTotal,
                        },
                    }
                );
            }
            //-----------------icrementing quantity---------------------------  
            await cartModel.updateOne(
                { userId: userId, "product.productId": productId },
                { $inc: { "product.$.quantity": quatityInt } }
            );
        }
        else {
            //---------------if the user adding new product 
            console.log("adding ne wproduct to the existing user cart");
            const priceInt = parseInt(productDetails[0].price, 10)
            const quatityInt = parseInt(pQuantity, 10)
            const offerPrice = productDetails[0].offer

            const newPrice = priceInt - (priceInt * offerPrice / 100)
            const roundedPrice = newPrice.toFixed(2)
            const discount = priceInt - newPrice
            const totalDiscount = discount * quatityInt


            //---------------finding subtotal-----------------
            const userCart = await cartModel.find({ userId: userdetails._id })
            const subTotalValue = userCart[0].subTotal;
            const newSubTotal = subTotalValue + newPrice * quatityInt

            const roundedSubTotal = newSubTotal.toFixed(2);
            const roundedTotal = (newPrice * quatityInt).toFixed(2)
            //--------------product details push in the product array-------
            const newProduct = {
                productId: productDetails[0]._id,
                name: productDetails[0].productName,
                quantity: pQuantity,
                price: roundedPrice,
                discount: totalDiscount,
                productImage: productDetails[0].productImage,
                total: roundedTotal,
            }
            //--------updating the new product and adding to subtotal------
            await cartModel.updateOne(
                { userId: userdetails._id },
                {
                    $push: { product: newProduct },
                    $set: { subTotal: roundedSubTotal }
                }
            );
        }
    }

    else {
        //--------------creating cart for individual users----------
        const priceInt = parseInt(productDetails[0].price, 10)
        const quatityInt = parseInt(pQuantity, 10)
        //-----------------cart data inserting
        console.log("creating new user cart");
        //-----------------SUBTOTAL-----------------------
        const offerPrice = productDetails[0].offer

        const newPrice = priceInt - (priceInt * offerPrice / 100)
        const roundedPrice = newPrice.toFixed(2)
        const roundedTotal = (newPrice * quatityInt).toFixed(2)
        const discount = priceInt - newPrice
        const totaldiscount = discount * quatityInt
        const subTotal = newPrice * quatityInt
        // inserting new user cart details---------    
        const userCart = await cartModel({
            userId: userdetails._id,
            product: [{
                productId: productDetails[0]._id,
                name: productDetails[0].productName,
                quantity: pQuantity,
                price: roundedPrice,
                discount: totaldiscount,
                productImage: productDetails[0].productImage,
                total: roundedTotal,


            }],
            subTotal: subTotal
        })
        await userCart.save()
    }

    const data = "ok"
    res.status(200).json(data)
}


//----------------------------------------------------------------------------------// 
//============================add from wishlist======================================//
//----------------------------------------------------------------------------------// 

const addCartFromWishlist = async (req, res) => {

    console.log(req.body);

    if (req.session.userId) {
        const pId = req.body.productId
        const userDetails = await userModel.findOne({ email: req.session.userId })
        const userId = userDetails._id
        const userCart = await cartModel.findOne({ userId: userId })
        console.log(userCart, "userCart");
        productDetails = await productModel.find({ _id: pId }).populate("subcategory");
        console.log(" productDetails", productDetails);
        if (userCart) {
            console.log("this if is working");
            const price = productDetails[0].price
            const offerPrice = productDetails[0].subcategory.offerPercentage
            const newPrice = price - (price * offerPrice / 100)
            const roundedPrice = newPrice.toFixed(2)
            const userCart = await cartModel.find({ userId: userId })
            const subTotalValue = userCart[0].subTotal;
            const newSubTotal = subTotalValue + newPrice
            const roundedSubTotal = newSubTotal.toFixed(2);
            const roundedTotal = newPrice.toFixed(2)

            const newProduct = {
                productId: productDetails[0]._id,
                name: productDetails[0].productName,
                quantity: 1,
                price: roundedPrice,
                productImage: productDetails[0].productImage,
                total: roundedTotal,
            }

            await cartModel.updateOne(
                { userId: userId },
                {
                    $push: { product: newProduct },
                    $set: { subTotal: roundedSubTotal }
                }
            );


        } else {


            console.log("no cart product is working..");
            const price = productDetails[0].price
            const offerPrice = productDetails[0].subcategory.offerPercentage
            const newPrice = price - (price * offerPrice / 100)
            const roundedPrice = newPrice.toFixed(2)
            const userCart = await cartModel({
                userId: userId,
                product: [{
                    productId: productDetails[0]._id,
                    name: productDetails[0].productName,
                    quantity: 1,
                    price: roundedPrice,
                    productImage: productDetails[0].productImage,
                    total: roundedPrice,


                }],
                subTotal: roundedPrice
            })
            await userCart.save()


        }

        const data = "ok"
        res.status(200).json(data)

    } else {
        res.redirect("/login")
    }

}



//----------------------------------------------------------------------------------// 
//============================remove from cart======================================//
//----------------------------------------------------------------------------------// 

const cartDelete = async (req, res) => {

    const productId = req.body.productId
    // console.log( typeof productId);
    // console.log(productId);
    // console.log("session id",req.session.userId);
    if (req.session.userId) {
        const userDetails = await userModel.findOne({ email: req.session.userId })
        const userId = userDetails._id

        const subTotal = await cartModel.findOne({ userId: userId, "product.productId": productId });
        const deletedProduct = subTotal.product.find(item => item.productId === productId)
        const total = deletedProduct.total
        const cartSubTotal = subTotal.subTotal
        console.log("cart subtotal", cartSubTotal);
        console.log("deleted product total", total);
        const updatedCart = await cartModel.updateOne(
            { userId: userId },
            { $pull: { product: { productId: productId } } }
        );

        const deleteSubTotal = await cartModel.find({ userId: userId })

        //  console.log("updated subtotal is",deleteSubTotal);
        if (deleteSubTotal) {
            if (deleteSubTotal.length > 0 && deleteSubTotal[0].product.length === 0) {

                console.log("no more product");
                await cartModel.deleteOne({ userId: userId })
            }
            else {
                const updatedSubTotal = cartSubTotal - total
                console.log(updatedSubTotal);
                await cartModel.updateOne({ userId: userId }, { $set: { subTotal: updatedSubTotal } })
                console.log("subtotal updated");

            }
        }
        res.json({
            products: updatedCart
        });


    } else {
        res.redirect("/login")
    }
}




//----------------------------------------------------------------------------------// 
//==========================quantity updation in the cart===========================//
//----------------------------------------------------------------------------------// 

const updateQuantity = async (req, res) => {
    try {
        const userDetails = await userModel.findOne({ email: req.session.userId });
        const userId = userDetails._id;
        const productId = req.body.productId;
        const newQuantity = req.body.quantity;

        console.log("Received productId:", productId);
        console.log("Received newQuantity:", newQuantity);
        const productDetaills = await productModel.find({ _id: productId }).populate("subcategory")
        console.log(productDetaills[0].quantity, " quantity");
        if (productDetaills[0].quantity >= newQuantity) {
            const cart = await cartModel.findOne({ userId: userId, "product.productId": productId });
            if (cart) {
                const product = cart.product.find(product => product.productId === productId);
                if (product) {


                    const price = (product.price).toFixed(2);
                    const total = (newQuantity * price).toFixed(2);
                    const offer = productDetaills[0].offer
                    const newPrice = productDetaills[0].price - (productDetaills[0].price * offer / 100)
                    const discount = productDetaills[0].price - newPrice
                    const totalDiscount = discount * newQuantity
                    console.log("new total", total);
                    await cartModel.updateOne(
                        { userId: userId, "product.productId": productId },
                        { $set: { "product.$.total": total, "product.$.discount": totalDiscount } }
                    );
                    const userCart = await cartModel.find({ userId: userId })
                    if (userCart.length > 0) {
                        const totalSum = userCart[0].product.reduce((accumulator, product) => accumulator + product.total, 0);
                        console.log("Total sum of 'total' field in the product array:", totalSum);
                        const rondedTotal = totalSum.toFixed(2)
                        await cartModel.updateOne(
                            { userId: userId, "product.productId": productId },
                            { $set: { subTotal: rondedTotal } }
                        );
                    } else {
                        console.error("Cart not found for the user.");
                    }
                } else {
                    console.error("Product not found in cart.");
                }
            } else {
                console.error("Cart not found for the user.");
            }
            await cartModel.updateOne(
                { userId: userId, "product.productId": productId },
                { $set: { "product.$.quantity": newQuantity } }
            );
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: productDetaills[0].quantity });
        }
    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }

};

//----------------------------------------------------------------------------------// 
//==========================user profile============================================//
//----------------------------------------------------------------------------------// 


const userAccount = async (req, res) => {
    try {
        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const message = userData
            const userId = userData._id
            const addressdetails = await addressModel.find({ userId: userId })
            const orderDetails = await orderModel.find({ userId: userId });
            res.render("userAccount", { message, addressdetails, orderDetails });
        }
        else {
            res.redirect("/login")
        }
    } catch (error) {
        console.error(error);
    }
}



//----------------------------------------------------------------------------------// 
//========================== user orders============================================//
//----------------------------------------------------------------------------------// 

const userOrders = async (req, res) => {
    try {
    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const message = userData
        const userId = userData._id
        const addressdetails = await addressModel.find({ userId: userId })
        const orderDetails = await orderModel.find({ userId: userId });
        console.log("orderDetails", orderDetails);
        res.render("userOrders", { message, addressdetails, orderDetails });
    }
    else {
        res.redirect("/login")

    }
} catch (error) {
    console.error(error);
}
    
}


//----------------------------------------------------------------------------------// 
//========================== user address page======================================//
//----------------------------------------------------------------------------------// 

const userAddress = async (req, res) => {
    try {
    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const message = userData
        const userId = userData._id
        const addressdetails = await addressModel.find({ userId: userId })
        const orderDetails = await orderModel.find({ userId: userId });
        res.render("userAddress", { message, addressdetails, orderDetails });
    }
    else {
        res.redirect("/login")

    }
} catch (error) {
    console.error(error);
}
}


//----------------------------------------------------------------------------------// 
//==========================add address ============================================//
//----------------------------------------------------------------------------------// 

const addAddress = async (req, res) => {
    try { 
    const {
        name,
        phone,
        building,
        city,
        district,
        state,
        pincode
    } = req.body;

    userDetail = await userModel.findOne({ email: req.session.userId })
    userId = userDetail._id
    const userAddress = await addressModel.findOne({ userId: userId })
    if (!userAddress) {
        console.log("new address created");
        const address = await addressModel.create({
            userId: userId,
            address: {
                name: name,
                phone: phone,
                building: building,
                city: city,
                district: district,
                state: state,
                pincode: pincode
            }
        });
        await address.save()
    }
    else {
        console.log(" address added");
        const addaddress = {
            name: name,
            phone: phone,
            building: building,
            city: city,
            district: district,
            state: state,
            pincode: pincode
        }
        const address = await addressModel.updateOne(
            { userId: userId },
            { $push: { address: addaddress } }
        )
    }
    const newAddress = await addressModel.find({ userId: userId })
    console.log("new address", newAddress);
    res.status(200).json({ newAddress });
} catch (error) {
    console.error(error);
}
}


//----------------------------------------------------------------------------------// 
//=================================add address =====================================//
//----------------------------------------------------------------------------------// 

const deleteAddress = async (req, res) => {
    try {
    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const message = userData
        const userId = userData._id
        const addressId = req.body.addressId;
        console.log(addressId);
        const result = await addressModel.updateOne(
            { userId: userId },
            { $pull: { address: { _id: req.body.addressId } } }
        );
        res.status(200).json();
    }
    else {
        res.redirect("/login")
    }
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//==========================edit address details============================================//
//----------------------------------------------------------------------------------// 
const loadEditAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userData = await userModel.findOne({ email: req.session.userId });
        const userId = userData._id;
     
        
        const userAddress = await addressModel.findOne({ userId: userId, address: { $elemMatch: { _id: addressId } } });
        
        const address = userAddress.address.find(addr => addr._id.toString() === addressId );
   
        res.json(address);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//----------------------------------------------------------------------------------// 
//==========================editing  address============================================//
//----------------------------------------------------------------------------------// 

const editAddress = async (req,res)=>{

console.log(req.body);
try {
    // Extract data from the request body
    const { name, phone, building, city, district, state, pincode, addressId } = req.body;
    
    // Construct the update object with the new data
    const updateData = {
        name: name,
        phone: phone,
        building: building,
        city: city,
        district: district,
        state: state,
        pincode: pincode
    };

    // Find and update the document where the address ID matches
    const updatedAddress = await addressModel.findOneAndUpdate(
        { 'address._id': addressId },
        { $set: { 'address.$': updateData } },
        { new: true }
    );

    // Check if the address was updated successfully
    if (!updatedAddress) {
        return res.status(404).json({ error: 'Address not found' });
    }

    // Send the updated address back to the client
    res.json(updatedAddress);
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
}

}
//----------------------------------------------------------------------------------// 
//==========================loadCheckout============================================//
//----------------------------------------------------------------------------------// 

const loadCheckout = async (req, res) => {
    try {
    if (req.session.userId) {

        const userData = await userModel.findOne({ email: req.session.userId })
        const userId = userData._id
        const message = userData
        const error = req.query.error;
        const userAddress = await addressModel.find({ userId: userId })



        // Update the document to pull the object from the array
        await cartModel.updateOne(
            { userId: userId },
            { $pull: { product: { stock: 0 } } }
        );

        console.log("Object(s) with stock value of 0 pulled from the array");


        const userCart = await cartModel.findOne({ userId: userId })


        if (userCart && userCart.product && userCart.product.length > 0) {
            if (error === 'address_not_selected') {

                res.render('checkout', { userAddress, message, userCart, error: 'can not continue without selecting an address' });
            } else if (!userCart) {

                res.render('checkout', { userAddress, message, userCart, error: 'your cart is empty' });
            }

            else {

                const userWallet = await walletModel.find({ userId: userId })
                const walletBalance = userWallet[0].balance
                console.log(walletBalance, "walletBalance");
                res.render("checkout", { userAddress, userCart, message, walletBalance })
            }

        } else {

            await cartModel.deleteOne({ userId: userId });
            res.redirect("/cart")
        }
    }
    else {
        res.redirect("/login")
    }
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//==========================load order============================================//
//----------------------------------------------------------------------------------// 


const loadOrder = async (req, res) => {
    try {

    const userData = await userModel.findOne({ email: req.session.userId })
    const userId = userData._id
    console.log(" userId ", userId);
    const paymentMode = req.body.paymentOption
    const couponCode = req.body.couponId;
    if (req.session.userId) {
        const selectedAddressId = req.body.selectedAddressId;
        if (selectedAddressId) {
            console.log("address is present");
            if (paymentMode === 'Online Payment') {

                console.log("payment is online");



                if (couponCode) {

                    const coupenDetails = await couponModel.findOne({ code: couponCode })
                    let coupenReduction = coupenDetails.discountAmount
                    const cartDetails = await cartModel.findOne({ userId: userId }).populate("userId")
                    const userCart = await cartModel.findOne({ userId: userId })
                    for (const cartProduct of userCart.product) {
                        const product = await productModel.findOne({ _id: cartProduct.productId });

                        if (product) {
                            product.quantity -= cartProduct.quantity;
                            if (product.quantity) {
                                console.log("this if is working");
                                await product.save();
                            } else {
                                // The product is less than one
                                console.log("this else is working");
                                const newSubTotal = userCart.subTotal - coupenDetails.discountAmount
                                res.render("payment", { cartDetails, subTotal: newSubTotal, selectedAddressId })
                                return; // Return here to prevent further processing
                            }
                        }
                    }

                    const newSubTotal = userCart.subTotal - coupenDetails.discountAmount
                    console.log("coupenReduction...",coupenReduction)
                    res.render("payment", { cartDetails, subTotal: newSubTotal, selectedAddressId, coupenReduction })

                } else {

                    const cartDetails = await cartModel.findOne({ userId: userId }).populate("userId")
                    const subTotal = cartDetails.subTotal
                    console.log(cartDetails);
                    res.render("payment", { cartDetails, subTotal, selectedAddressId })

                }



            } else if (paymentMode === 'Cash On Delivery') {

                if (couponCode) {

                    console.log("coupen present", couponCode);
                    const coupenDetails = await couponModel.findOne({ code: couponCode })
                    const userCart = await cartModel.findOne({ userId: userId })
                    for (const cartProduct of userCart.product) {
                        const product = await productModel.findOne({ _id: cartProduct.productId });

                        if (product) {
                            product.quantity -= cartProduct.quantity;
                            if (product.quantity >= 0) {
                                await product.save();
                            } else {
                                // The product is less than one
                                res.redirect("/login");
                                return; // Return here to prevent further processing
                            }
                        }
                    }
                    const userAddress = await addressModel.findOne({ userId: userId });

                    const newSubTotal = userCart.subTotal - coupenDetails.discountAmount
                    console.log(" newSubTotal", newSubTotal);
                    if (userAddress) {
                        const selectedAddress = userAddress.address.find(n => n._id.toString() === selectedAddressId.toString());
                        const orderDetails = orderModel({
                            userId: userId,
                            address: selectedAddress,

                            product: userCart.product.map(product => ({
                                productId: product.productId,
                                name: product.name,
                                quantity: product.quantity,
                                price: product.price,
                                discount: product.discount,
                                total: product.total,
                                paymentType: "COD",
                                productImage: product.productImage
                            })),
                            subTotal: newSubTotal
                        });
                        await orderDetails.save();
                        await cartModel.deleteOne({ userId: userId }); // Delete cart when payment completed
                        res.redirect("/orderConfirm");
                        console.log(userId);
                        await couponModel.updateOne({ code: couponCode }, { $push: { userIds: userId } });

                    } else {
                        res.redirect("/checkout?error=address_not_selected");
                    }

                }
                else {
                    const userCart = await cartModel.findOne({ userId: userId })
                    for (const cartProduct of userCart.product) {
                        const product = await productModel.findOne({ _id: cartProduct.productId });
                        // console.log("product in the product model is", product);
                        if (product) {
                            product.quantity -= cartProduct.quantity;
                            if (product.quantity >= 0) {
                                await product.save();
                            } else {
                                // The product is less than one
                                res.redirect("/login");
                                return; // Return here to prevent further processing
                            }
                        }
                    }

                    // After processing all cart products, create the order
                    const userAddress = await addressModel.findOne({ userId: userId });
                    if (userAddress) {
                        console.log("this.....");
                        console.log("userCart", userCart);
                        const selectedAddress = userAddress.address.find(n => n._id.toString() === selectedAddressId.toString());
                        const orderDetails = orderModel({
                            userId: userId,
                            address: selectedAddress,

                            product: userCart.product.map(product => ({
                                productId: product.productId,
                                name: product.name,
                                quantity: product.quantity,
                                price: product.price,
                                total: product.total,
                                discount: product.discount,
                                paymentType: "COD",

                                productImage: product.productImage
                            })),
                            subTotal: userCart.subTotal
                        });
                        await orderDetails.save();
                        await cartModel.deleteOne({ userId: userId }); // Delete cart when payment completed
                        res.redirect("/orderConfirm");




                    } else {
                        res.redirect("/checkout?error=address_not_selected");
                    }
                }
            } else {
                console.log("payment is from wallet");

                const userWallet = await walletModel.find({ userId: userId })
                const walletBalance = userWallet[0].balance

                const userCart = await cartModel.find({ userId: userId })
                const cartTotal = userCart[0].subTotal
                console.log(cartTotal, walletBalance);


                console.log("wallet using ");

                if (couponCode) {

                    console.log("coupen present", couponCode);
                    const coupenDetails = await couponModel.findOne({ code: couponCode })
                    const userCart = await cartModel.findOne({ userId: userId })
                    for (const cartProduct of userCart.product) {
                        const product = await productModel.findOne({ _id: cartProduct.productId });

                        if (product) {
                            product.quantity -= cartProduct.quantity;
                            if (product.quantity >= 0) {
                                await product.save();
                            } else {
                                // The product is less than one
                                res.redirect("/login");
                                return; // Return here to prevent further processing
                            }
                        }
                    }
                    const userAddress = await addressModel.findOne({ userId: userId });

                    const newSubTotal = userCart.subTotal - coupenDetails.discountAmount
                    console.log(" newSubTotal", newSubTotal);
                    if (userAddress) {
                        const selectedAddress = userAddress.address.find(n => n._id.toString() === selectedAddressId.toString());
                        const orderDetails = orderModel({
                            userId: userId,
                            address: selectedAddress,

                            product: userCart.product.map(product => ({
                                productId: product.productId,
                                name: product.name,
                                quantity: product.quantity,
                                price: product.price,
                                total: product.total,
                                discount: product.discount,
                                paymentType: 'Online Payment',
                                productImage: product.productImage
                            })),
                            subTotal: newSubTotal
                        });
                        await orderDetails.save();
                        await cartModel.deleteOne({ userId: userId }); // Delete cart when payment completed

                        console.log(userId);
                        await couponModel.updateOne({ code: couponCode }, { $push: { userIds: userId } });
                        // update wallet amount------------------------
                        const currentDate = new Date();
                        const day = currentDate.getDate();
                        const month = currentDate.getMonth() + 1; // Note: January is 0, so we add 1
                        const year = currentDate.getFullYear();

                        const formattedDate = `${day}-${month}-${year}`;
                        const newWalletBalance = walletBalance - newSubTotal
                        // Increment balance and push new transaction
                        console.log("newWalletBalance", newWalletBalance);
                        console.log("walletBalance", walletBalance);
                        console.log("newSubTotal ", newSubTotal);

                        await walletModel.updateOne(
                            { userId: userId },
                            {
                                $set: { balance: newWalletBalance },
                                $push: {
                                    transaction: {
                                        date: formattedDate,
                                        amount: newSubTotal,
                                        reason: 'product purchased'
                                    }
                                }
                            }
                        );
                        res.redirect("/orderConfirm");
                        //-------------------------
                    } else {
                        res.redirect("/checkout?error=address_not_selected");
                    }

                }
                else {
                    console.log("without coupen is working");
                    const userCart = await cartModel.findOne({ userId: userId })
                    for (const cartProduct of userCart.product) {
                        const product = await productModel.findOne({ _id: cartProduct.productId });
                        // console.log("product in the product model is", product);
                        if (product) {
                            product.quantity -= cartProduct.quantity;
                            if (product.quantity >= 0) {
                                await product.save();
                            } else {
                                // The product is less than one
                                res.redirect("/login");
                                return; // Return here to prevent further processing
                            }
                        }
                    }

                    // After processing all cart products, create the order
                    const userAddress = await addressModel.findOne({ userId: userId });
                    if (userAddress) {
                        const selectedAddress = userAddress.address.find(n => n._id.toString() === selectedAddressId.toString());
                        const orderDetails = orderModel({
                            userId: userId,
                            address: selectedAddress,

                            product: userCart.product.map(product => ({
                                productId: product.productId,
                                name: product.name,
                                quantity: product.quantity,
                                price: product.price,
                                total: product.total,
                                discount: product.discount,
                                paymentType: 'Online Payment',

                                productImage: product.productImage
                            })),
                            subTotal: userCart.subTotal
                        });
                        await orderDetails.save();
                        await cartModel.deleteOne({ userId: userId }); // Delete cart when payment completed

                        const currentDate = new Date();
                        const day = currentDate.getDate();
                        const month = currentDate.getMonth() + 1; // Note: January is 0, so we add 1
                        const year = currentDate.getFullYear();

                        const formattedDate = `${day}-${month}-${year}`;
                        const newWalletBalance = walletBalance - cartTotal
                        // Increment balance and push new transaction
                        console.log("newWalletBalance", newWalletBalance);
                        console.log("walletBalance", walletBalance);
                        console.log("newSubTotal ", cartTotal);

                        await walletModel.updateOne(
                            { userId: userId },
                            {
                                $set: { balance: newWalletBalance },
                                $push: {
                                    transaction: {
                                        date: formattedDate,
                                        amount: cartTotal,
                                        reason: 'product purchased'
                                    }
                                }
                            }
                        );

                        res.redirect("/orderConfirm");




                    } else {
                        res.redirect("/checkout?error=address_not_selected");
                    }
                }

            }
        } else {
            res.redirect("/checkout?error=address_not_selected");
        }

    } else {
        res.redirect("/login");
    }
} catch (error) {
    console.error(error);
}

}



const OrderComplete = (req, res) => {
    try {
    console.log(req.body);

    res.render("orderConfirm")
} catch (error) {
    console.error(error);
}
}



//----------------------------------------------------------------------------------// 
//========================== payment completed======================================//
//----------------------------------------------------------------------------------// 

const paymentCompleted = async (req, res) => {
    try {
        const { subtotal, addressId, response , coupenReduction } = req.body;
    console.log(response);
    console.log("coupenReduction...",coupenReduction)

    // Retrieve user data
    const userData = await userModel.findOne({ email: req.session.userId });
    const userId = userData._id;

    // Retrieve user cart
    const userCart = await cartModel.findOne({ userId: userId });
    const numberOfProductsInCart = userCart.product.length
    let productPerReduction = 0; 
    if (coupenReduction !== null) {
        productPerReduction = coupenReduction / numberOfProductsInCart;
    }
    
    const userAddress = await addressModel.findOne({ userId: userId })
    if (userCart) {
        // Check if userAddress is defined and has the address property
        if (userAddress && userAddress.address) {
            // Find selected address
            const selectedAddress = userAddress.address.find(n => n._id.toString() === addressId.toString());

            // Create order details
            const orderDetails = orderModel({
                userId: userId,
                address: selectedAddress,

                product: userCart.product.map(product => ({
                    productId: product.productId,
                    name: product.name,
                    quantity: product.quantity,
                    price: product.price,
                    total: product.total,
                    paymentType: "ONLINE",
                    discount: product.discount,
                    coupondiscount :  productPerReduction,
                    productImage: product.productImage
                })),
                subTotal: subtotal
            });

            // Save order details
            await orderDetails.save();

            // Delete user's cart
            await cartModel.deleteOne({ userId: userId });


        } else {
            // If userAddress is not defined or does not have the address property, handle the error
            console.error("User address is undefined or does not have the address property");
            return res.status(500).send("Internal Server Error");
        }
    }

    // If user cart not found, send an empty response
    res.status(200).json();
} catch (error) {
    console.error(error);
}
};


//----------------------------------------------------------------------------------// 
//========================online retryPayment============================================//
//----------------------------------------------------------------------------------// 
const retryPayment = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        console.log(orderId, "orderId");
        failedOredr = await orderModel.findOne({ _id: orderId })
        console.log(" failedOredr", failedOredr);



        res.render("rePayment", { failedOredr })
    } catch (error) {
        // Handle any errors that occurred during the execution of the function
        console.error('An error occurred:', error);

    }
};

//----------------------------------------------------------------------------------// 
//==========================payment  completed============================================//
//----------------------------------------------------------------------------------// 
const retryPaymentCompleted = async (req, res) => {
    try {
    //here upate the order payment status trueadmin status
    console.log("retryPayment completed");
    console.log(req.body);
    console.log(req.body.failedOrderId);
    const orderId = req.body.failedOrderId
    const order = await orderModel.findById(orderId);
    order.product.forEach(product => {
        product.adminStatus = 1;
    });
    order.paymentStatus = true;
    await order.save();

    res.status(200).json();
} catch (error) {
    console.error(error);
}
}


const rePaymentFailed = (req, res) => {
    try {
    if (req.session.userId) {

        res.status(200).json({ success: true, message: 'Failed payment handled successfully.' });

    } else {

        res.redirect("/login")

    }
} catch (error) {
    console.error(error);
}
}
//----------------------------------------------------------------------------------// 
//==========================cancel order============================================//
//----------------------------------------------------------------------------------// 

const orderCancel = async (req, res) => {
    try {
    if (req.session.userId) {
        const userData = userModel.findOne({ email: req.session.userId })
        const userId = userData._id

        const { productId, orderId } = req.body

        // const productDetaills = await orderModel({_id:orderId})

        //updating the value of adminstatus to cancel
        let cancelledProduct = await orderModel.findOneAndUpdate(
            { _id: orderId },
            { $set: { 'product.$[elem].adminStatus': 5 } },
            { arrayFilters: [{ 'elem._id': productId }], new: true }
        );

        const paymentType = cancelledProduct.product[0].paymentType
        if (paymentType === "ONLINE") {
            const cancelledAmount = cancelledProduct.product[0].total - cancelledProduct.product[0].coupondiscount ;
            const userId = cancelledProduct.userId;
            const currentDate = new Date();
            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1; // Note: January is 0, so we add 1
            const year = currentDate.getFullYear();

            const formattedDate = `${day}-${month}-${year}`;

            // Increment balance and push new transaction
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

            console.log('Balance incremented and transaction added successfully.');
        }

        // console.log("cancelledProduct", cancelledProduct);
        // console.log("productId", productId);
        //update the product quqntity in product model with respet to the cancelled qunity
        const product = cancelledProduct.product.find(p => p._id.toString() === productId.toString());



        const pId = product.productId
        const qty = product.quantity
        // updating quantity
        const productDocument = await productModel.findById(pId);
        console.log("productDocument", productDocument);
        const productQty = productDocument.quantity
        const totalQty = productQty + qty
        console.log("totalQty", totalQty);
        const quantityUpdate = await productModel.updateOne(
            { _id: pId }, // Filter criteria to find the product by its ID
            { $set: { quantity: totalQty } } // Update operation to set the quantity to totalQty
        );


        res.status(200).json();
    } else {
        res.redirect("/login");
    }
} catch (error) {
    console.error(error);
}

}






//----------------------------------------------------------------------------------// 
//==========================order details page======================================//
//----------------------------------------------------------------------------------//


const loadOrderStatus = async (req, res) => {
    try {
        const { productId, orderId } = req.query;



        const trimmedOrderId = orderId.trim();

        if (!trimmedOrderId) {
            throw new Error("orderId is missing from the request query parameters.");
        }


        const userDetails = await orderModel.findById(trimmedOrderId);
        const userAddress = userDetails.address
        const filteredProducts = userDetails.product.filter(product => product.productId === productId);
        const productDetails = await productModel.findOne({ _id: productId })


        res.render("orderStatus", { userAddress, filteredProducts, productDetails, trimmedOrderId });
    } catch (error) {
        // Log any errors that occur during the database operation
        console.error("Error fetching user details:", error);

        // Render an error page or handle the error as needed
        res.status(500).render("errorPage", { message: "Error fetching user details. Please try again later." });
    }
};





//----------------------------------------------------------------------------------// 
//==========================order status post ======================================//
//----------------------------------------------------------------------------------// 

const orderStatus = async (req, res) => {

    try {
    const { productId, orderId } = req.body

    console.log(productId);
    console.log(orderId);







    res.status(200).json();
} catch (error) {
    console.error(error);
}
}


//----------------------------------------------------------------------------------// 
//==========================return request to the admin ============================//
//----------------------------------------------------------------------------------// 

const returnRequest = async (req, res) => {
    try {
          const { productId, returnReason, orderId } = req.body;
    console.log("productId", productId);
    console.log("orderid", orderId);
    console.log("productId", typeof productId);
    try {
        await orderModel.findOneAndUpdate(
            { _id: orderId },
            { $set: { 'product.$[elem].returnStatus': 1, 'product.$[elem].returnText': returnReason } },
            { arrayFilters: [{ 'elem._id': productId }], new: true }
        );

        res.status(200).json("ok");
    } catch (error) {
        console.error("Error occurred while processing return request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
} catch (error) {
    console.error(error);
}
}






//----------------------------------------------------------------------------------// 
//========================== user wishlist==========================================//
//----------------------------------------------------------------------------------// 
const userWishlist = async (req, res) => {
    try {
    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId });
        const userId = userData._id;

        const message = userData
        const userWishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId");

        if (userWishlist) {
            let productDetails = [];
            userWishlist.product.forEach(product => {
                productDetails.push(product.productId); // Pushing the productId object directly
            });
            let cartProduct = await cartModel.findOne({ userId: userId })
            console.log("cartProduct", cartProduct);
            let cartPresent = [];
            if (cartProduct && cartProduct.product) {
                cartPresent = cartProduct.product.map(product => product.productId);
            }
            console.log("cartPresent", cartPresent);
            res.render("userWishlist", { productDetails, cartPresent, message });
        } else {
            res.render("userWishlist", { message });
        }
    } else {
        res.redirect("/login");
    }
} catch (error) {
    console.error(error);
}
}



const editDetails = async (req, res) => {

    try {
    const { name, mobile } = req.body

    await userModel.updateOne(
        { email: req.session.userId }, // Filter criteria: Find the document with the specified email
        { $set: { name: name, mobile: mobile } } // Update operation: Set the name and mobile fields with the provided values
    );

    res.status(200).json("ok");
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//========================== add wishlist==========================================//
//----------------------------------------------------------------------------------// 
const addWishlist = async (req, res) => {
    try {
    console.log(req.body.productId);
    const { productId } = req.body
    if (req.session.userId) {
        const userDetails = await userModel.findOne({ email: req.session.userId })
        const userId = userDetails._id

        const message = userDetails
        console.log(productId);
        const userwishlist = await wishlistModel.find({ userId: userId })
        if (userwishlist.length > 0) {
            console.log("adding to the existing wishlist");
            await wishlistModel.updateOne(
                { userId: userId },
                { $push: { product: { productId: productId } } }
            );
        } else {
            console.log("creating new wishlist");
            console.log("userid", userId);
            console.log("productId", productId);
            const newWishlist = wishlistModel({
                userId: userId,
                product: [
                    {
                        productId: productId
                    }
                ]
            });
            await newWishlist.save();
            console.log("New wishlist created successfully.");
        }

        //populate data collecting from product model
        const wishlist = await wishlistModel.findOne({ userId: userId }).populate("product.productId")
        if (wishlist) {
            const wishlistProducts = wishlist.product;
            const products = wishlistProducts.map(item => item.productId);

            //to filter the productid
            const productIds = products.map(product => product._id);
            console.log("product ids", productIds);

            res.status(200).json({ productIds });
        }
    }
    else {
        res.redirect("/login")
    }
} catch (error) {
    console.error(error);
}
}

//removing product from wishlist

const removeWishlist = async (req, res) => {
    try {
    const productId = req.body.productId

    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const userId = userData._id
        const userWishlist = await wishlistModel.find({ userId: userId }).populate("product.productId")

        if (userWishlist) {



            const updatedWishlist = await wishlistModel.findOneAndUpdate(
                { userId: userId },
                { $pull: { product: { productId: productId } } },
                { new: true }
            ).populate("product.productId");


            res.status(200).json();
        }



    } else {

    }
} catch (error) {
    console.error(error);
}
}


//----------------------------------------------------------------------------------// 
//========================== apply coupon==========================================//
//----------------------------------------------------------------------------------// 

const addUserCoupon = async (req, res) => {

    try {
           console.log("req.body", req.body);
    const { coupon } = req.body
    console.log(coupon);
    console.log(typeof coupon);
    const couponPresent = await couponModel.find({ code: coupon })


    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const userId = userData._id

        if (couponPresent.length > 0) {


            if (couponPresent.some(coupon => coupon.userIds.includes(userId))) {
                // Coupon is already used by the user
                res.status(200).json({ message: `Coupon is already used.` });
            } else {
                //find the current date
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero if necessary
                const day = String(today.getDate()).padStart(2, '0'); // Add leading zero if necessary
                const currentDate = `${year}-${month}-${day}`;
                //validating the coupon expired or not
                for (const coupon of couponPresent) {


                    if (currentDate >= coupon.startDate && currentDate <= coupon.expirationDate) {
                        console.log(`Coupon ${coupon.code} is valid today.`);

                        const userCart = await cartModel.findOne({ userId: userId })

                        console.log(userCart.subTotal);
                        console.log(coupon.minOrderAmount);
                        if (userCart.subTotal >= coupon.minOrderAmount) {
                            //if the coupen is applicable change the subtotal
                            const newSubTotal = userCart.subTotal - coupon.discountAmount
                            console.log(newSubTotal);

                            res.status(200).json({ applied: newSubTotal });

                        } else {
                            res.status(200).json({ message: `minimum amount to apply this coupon is ${coupon.minOrderAmount}` });
                        }



                    } else {
                        res.status(200).json({ message: `Coupon ${coupon.code} is expired.` });
                    }

                }
            }

        } else {
            res.status(200).json({ message: `Coupon is invalid.` });
        }

    } else {
        res.redirect("/login")
    }
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//========================== load wallet  ==========================================//
//----------------------------------------------------------------------------------// 


const loadWallet = async (req, res) => {
    try {
    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const userId = userData._id
        const message = userData
        const userWallet = await walletModel.findOne({ userId: userId }).populate("userId")
        console.log(userWallet);
        res.render("userWallet", { userWallet, message })
    }
    else {
        res.redirect("/login")
    }
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//=================== coupon product   ==========================================//
//----------------------------------------------------------------------------------// 

const userCoupon = async (req, res) => {

    try {
    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const userId = userData._id
        const message = userData

        const coupons = await couponModel.find()


        res.render("usercoupon", { coupons, message })

    }
    else {
        res.redirect("/login")
    }
} catch (error) {
    console.error(error);
}
}

//----------------------------------------------------------------------------------// 
//=================== invoice     ==========================================//
//----------------------------------------------------------------------------------// 


const loadInvoice = async (req, res) => {
    try {
        const productId = req.params.productId; // Use req.params for URL parameters
        const orderId = req.query.orderId;
        console.log(orderId, "orderId ", productId, " productId");

        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId });
            const userId = userData._id;
            const message = userData;

            const orderData = await orderModel.find({ _id: orderId });
            console.log("orderData", orderData);
            const filteredProducts = orderData.flatMap(order => {
                return order.product.filter(product => String(product._id) === productId);
            });
            console.log("filteredProducts", filteredProducts)





            const dateString = orderData[0].date;
            const originalDate = new Date(dateString);
            const formattedDate = moment(originalDate).format('DD/MM/YYYY');
            console.log(formattedDate);


            const data = {
                order: orderData,
                filteredProducts: filteredProducts,
                user: userData,
                date: formattedDate
            };


            const ejsTemplate = path.resolve(__dirname, '../../views/userViews/invoice.ejs');


            const ejsData = await ejs.renderFile(ejsTemplate, data);

            //       // Launch Puppeteer and generate PDF
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.setContent(ejsData, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

            //       // Close the browser
            await browser.close();

            //       // Set headers for inline display in the browser
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename=order_invoice.pdf'
            }).send(pdfBuffer);






        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error(error);

    }
};


const changePassword = async (req, res) => {
    try {

        const { currentPassword, newPassword } = req.body
        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId });
            const userId = userData._id;

            if (userData.password === currentPassword) {
                console.log("Password is correct");

                console.log(userId, "userId");
                await userModel.updateOne({ _id: userId }, { $set: { password: newPassword } })

                return res.status(200).send({ message: 'Password changed successfully' });

            } else {
                console.log("Password mismatch");
                // Send response to frontend
                return res.status(400).send({ message: 'Password is incorrect' });
            }
        }
        else {
            res.redirect("/login")
        }
    } catch (error) {
        console.error(error);

    }
}


const paymentfailed = async (req, res) => {

    try {
        // Extract payment and order information from the request body
        console.log("payment failed..", req.body);
        const addressId = req.body.addressId




        const userData = await userModel.findOne({ email: req.session.userId })
        const userId = userData._id
        const message = userData

        const userCart = await cartModel.findOne({ userId: userId })
        const userAddress = await addressModel.findOne({ userId: userId })
        const selectedAddress = userAddress.address.find(n => n._id.toString() === addressId.toString());
        console.log("selectedAddress", selectedAddress);
        console.log(userCart, "userCart");

        const orderDetails = orderModel({
            userId: userId,
            address: selectedAddress,

            product: userCart.product.map(product => ({
                productId: product.productId,
                name: product.name,
                quantity: product.quantity,
                price: product.price,
                total: product.total,
                adminStatus: 6,
                paymentType: "Online Payment",
                productImage: product.productImage
            })),
            subTotal: userCart.subTotal,
            paymentStatus: false
        });
        await orderDetails.save();
        await cartModel.deleteOne({ userId: userId });





        res.status(200).json({ success: true, message: 'Failed payment handled successfully.' });
    } catch (error) {
        // Handle errors
        console.error('Error handling failed payment:', error);
        res.status(500).json({ success: false, message: 'Failed to handle payment failure.' });
    }

}


const failedPage = async (req, res) => {

    try {

    const data = "payment not completed"
    if (req.session.userId) {

        res.render("orderConfirm", { data })

    } else {

        res.redirect("/login")

    }
} catch (error) {
    console.error(error);
}
}

module.exports = {
    loadhome,
    loadlogin,
    usereLogout,
    loadRegister,
    insertdata,
    loginload,
    otpVerify,
    forgotpassword,
    otpForgotpass,
    otpVerifyForgot,
    resetPassword,
    loadProduct,
    loadLaptops,
    loadMobiles,
    loadTablets,
    loadAllProducts,
    addToCart,
    addCartFromWishlist,
    loadCart,
    cartDelete,
    updateQuantity,
    userAccount,
    userOrders,
    userAddress,
    userWishlist,
    editDetails,
    changePassword,

    addAddress,
    deleteAddress,
    loadEditAddress,
    editAddress,
    loadCheckout,
    loadOrder,
    OrderComplete,
    paymentCompleted,
    paymentfailed,
    rePaymentFailed,
    failedPage,
    retryPayment,
    retryPaymentCompleted,
    // cancelOrder,
    loadOrderStatus,
    orderStatus,
    orderCancel,
    returnRequest,
    addWishlist,
    removeWishlist,
    addUserCoupon,
    loadWallet,
    userCoupon,
    loadInvoice,

}

const mongoose = require("mongoose")
const path = require("path")
const express = require("express")
const app = express()

const userRouter = require("../../routers/userRouters")
const ejs = require("ejs")
const userModel = require("../../model/userModel/signUp")
const otpModel = require("../../model/userModel/otp")
const cartModel = require("../../model/userModel/cart")
const addressModel = require("../../model/userModel/addressModel")
const orderModel = require("../../model/userModel/orderModel")
const productModel = require("../../model/adminModels/productModel")
const { log } = require("console")
const bodyParser = require("body-parser")
const bodyparser = require("body-parser")
const nodemailer = require("nodemailer")
const mailgen = require("mailgen")


app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())

app.set("view engine", "ejs")
app.set(path.join(__dirname, "views", "userViews"))





//----------------------------home page load-------------------------------------------------------------

const loadhome = async (req, res) => {

    const allProducts = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory")
    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const message = userData.name
        res.render("home", { allProducts, message })
    }
    else {
        res.render("home", { allProducts })
    }

}



//---------------------------- load login page-------------------------------------------------------------


const loadlogin = async (req, res) => {
    res.render("userlogin")
}


//-----------------------------------load register page -------------------------------------------------------------
const loadRegister = (req, res) => {
    res.render("userRegister")

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

    //  ------------------------------------------------------loadhome page--------------------------------------------
}
const loginload = async (req, res) => {

    const email1 = req.body.email
    const password1 = req.body.password.toString()


    const userdata = await userModel.findOne({ email: email1, password: password1, status: 0, is_verified: 1, is_deleted: 0 })
    if (userdata) {

        req.session.userId = email1
        console.log(req.session.userId);

        res.redirect("/")
    }
    else {
        res.render("userlogin", { message: "email and password are incorrect" })
    }
}


//----------------------------logout user--------------

const usereLogout = (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Session destroyed successfully');
            res.redirect('/');


        }
    })
}

//  ------------------------------------------------------forgot password-------------------------------------------
const forgotpassword = (req, res) => {

    res.render("forgotpassword")
}


//------------------------------ forgotpassword otp sending and saving in database------------------------
const otpForgotpass = async (req, res) => {

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

}






//------------------------ forgot password otp verification------------------
const otpVerifyForgot = async (req, res) => {


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

}


//------------------------ password reset otp --------------------------------------------
const resetPassword = async (req, res) => {

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
}


//-----------------------------load product in the home page---------------------------------------------------
const loadProduct = async (req, res) => {

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
}

//-------------------------------------------------------------laptop page -------------------

const loadLaptops = async (req, res) => {
    try {
        const productDetails = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory");
        const laptopProducts = productDetails.filter((product) => {
            return product.subcategory.category === 'laptops';
        });

        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const message = userData
            res.render("products", { productLaptop: laptopProducts, message });
        }
        else {

            res.render("products", { productLaptop: laptopProducts });
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

        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const message = userData

            res.render("products", { productMobile: mobileProducts, message });
        }
        else {
            res.render("products", { productMobile: mobileProducts });
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

        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const message = userData
            res.render("products", { productTablets: tabletsProducts, message });
        }
        else {
            res.render("products", { productTablets: tabletsProducts });
        }

        // Pass the filteredProducts to the view
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

//------------------------------------------------------------all products Page-------------------


const loadAllProducts = async (req, res) => {
    try {

        const productDetails = await productModel.find({ is_listed: true, is_deleted: true }).populate("subcategory");

        if (req.session.userId) {
            const userData = await userModel.findOne({ email: req.session.userId })
            const message = userData
            res.render("products", { allProducts: productDetails, message });
        }
        else {
            res.render("products", { allProducts: productDetails });
        }
        // Pass the filteredProducts to the view

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
            const cartDetails = await cartModel.find({}).populate("userId")

            const userCartDetails = cartDetails.filter((cart) => {
                return cart.userId._id.equals(targetUserId);
            });



            if (userCartDetails.length > 0) {
                res.render("cart", { userCartDetails, message })
            }
            else {
                console.log("user cart not presnt");
                const noCartDetails = "no user presnt"
                res.render("cart", { noCartDetails, })
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



    productDetails = await productModel.find({ _id: pId })


    const cartUser = await cartModel.find({}).populate("userId")


    const isUserPresent = cartUser.some(cartDoc => cartDoc.userId._id.equals(userdetails._id));

    console.log(isUserPresent);

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
                const totalSum = totalForProduct + priceInt * quatityInt
                //---------------finding the existing subtotal in  the cart------
                const userCart = await cartModel.find({ userId: userdetails._id })
                const subTotalValue = userCart[0].subTotal;
                const newSubTotal = subTotalValue + priceInt * quatityInt

                await cartModel.updateOne(
                    { userId: userdetails._id, "product.productId": productId },
                    {
                        $set: {
                            "product.$.total": totalSum,
                            subTotal: newSubTotal,
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

            //---------------finding subtotal-----------------
            const userCart = await cartModel.find({ userId: userdetails._id })
            const subTotalValue = userCart[0].subTotal;
            const newSubTotal = subTotalValue + priceInt * quatityInt

            //--------------product details push in the product array-------
            const newProduct = {
                productId: productDetails[0]._id,
                name: productDetails[0].productName,
                quantity: pQuantity,
                price: productDetails[0].price,
                productImage: productDetails[0].productImage,
                total: priceInt * quatityInt,
            }
            //--------updating the new product and adding to subtotal------
            await cartModel.updateOne(
                { userId: userdetails._id },
                {
                    $push: { product: newProduct },
                    $set: { subTotal: newSubTotal }
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
        const subTotal = priceInt * quatityInt
        // inserting new user cart details---------    
        const userCart = await cartModel({
            userId: userdetails._id,
            product: [{
                productId: productDetails[0]._id,
                name: productDetails[0].productName,
                quantity: pQuantity,
                price: productDetails[0].price,
                productImage: productDetails[0].productImage,
                total: priceInt * quatityInt
            }],
            subTotal: subTotal
        })
        await userCart.save()
    }

    const data = "ok"
    res.status(200).json(data)
}
//----------------------------------------------------------------------------------// 
//============================remove from cart======================================//
//----------------------------------------------------------------------------------// 

const cartDelete = async (req, res) => {

    const productId = req.body.productId
    // console.log( typeof productId);
    // console.log(productId);
    // console.log("session id",req.session.userId);

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

        const cart = await cartModel.findOne({ userId: userId, "product.productId": productId });
        if (cart) {
            const product = cart.product.find(product => product.productId === productId);
            if (product) {
                const price = product.price;
                const total = newQuantity * price
                console.log("new total", total);
                await cartModel.updateOne(
                    { userId: userId, "product.productId": productId },
                    { $set: { "product.$.total": total } }
                );
                const userCart = await cartModel.find({ userId: userId })
                if (userCart.length > 0) {
                    const totalSum = userCart[0].product.reduce((accumulator, product) => accumulator + product.total, 0);
                    console.log("Total sum of 'total' field in the product array:", totalSum);
                    await cartModel.updateOne(
                        { userId: userId, "product.productId": productId },
                        { $set: { subTotal: totalSum } }
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
    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

//----------------------------------------------------------------------------------// 
//==========================user profile============================================//
//----------------------------------------------------------------------------------// 


const userAccount = async (req, res) => {

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
}



//----------------------------------------------------------------------------------// 
//========================== user orders============================================//
//----------------------------------------------------------------------------------// 

const userOrders = async (req,res) =>{

    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const message = userData
        const userId = userData._id

        const addressdetails = await addressModel.find({ userId: userId })

        const orderDetails = await orderModel.find({ userId: userId });


        res.render("userOrders", { message, addressdetails, orderDetails });


    }

    else {


        res.redirect("/login")

    }
}


//----------------------------------------------------------------------------------// 
//========================== user address page======================================//
//----------------------------------------------------------------------------------// 

const  userAddress = async (req,res)=>{


    
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

 
    
}


//----------------------------------------------------------------------------------// 
//==========================add address ============================================//
//----------------------------------------------------------------------------------// 

const addAddress = async (req, res) => {
    console.log("dfxdfgkugfuyftydydtyftyfdtydfty-----------");
console.log("req.body",req.body);

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
                city:  city,
                district: district,
                state:state,
                pincode: pincode
            }
        });


        await address.save()

    }
    else {
        console.log(" address added");
        const addaddress =  {
            name: name,
            phone: phone,
            building:  building,
            city:  city,
            district: district,
            state:state,
            pincode: pincode
        }
        const address = await addressModel.updateOne(
            { userId: userId },
            { $push: { address: addaddress } }
        )

    }


    const newAddress = await addressModel.find({ userId: userId })
    console.log("new address", newAddress);


    res.status(200).json({newAddress });
   
}


//----------------------------------------------------------------------------------// 
//=================================add address =====================================//
//----------------------------------------------------------------------------------// 

const deleteAddress = async (req, res) => {

    if (req.session.userId) {
        const userData = await userModel.findOne({ email: req.session.userId })
        const message = userData
        const userId = userData._id
        const result = await addressModel.updateOne(
            { userId: userId },
            { $pull: { address: { _id: req.body.addressId } } }
        );


        res.status(200).json();

    }

    else {
        res.redirect("/login")
    }
}

//----------------------------------------------------------------------------------// 
//==========================loadCheckout============================================//
//----------------------------------------------------------------------------------// 

const loadCheckout = async (req, res) => {


    if (req.session.userId) {

        const userData = await userModel.findOne({ email: req.session.userId })
        const userId = userData._id
        const error = req.query.error;
        const userAddress = await addressModel.find({ userId: userId })
        const message = userData
        const userCart = await cartModel.findOne({ userId: userId })

        if (error === 'address_not_selected') {

            res.render('checkout', { userAddress, message, userCart, error: 'can not continue without selecting an address' });
        } else if (!userCart) {
            res.render('checkout', { userAddress, message, userCart, error: 'your cart is empty' });
        }

        else {

            res.render("checkout", { userAddress, userCart, message })
        }
    }
    else {
        res.redirect("/login")
    }
}

//----------------------------------------------------------------------------------// 
//==========================loadCheckout============================================//
//----------------------------------------------------------------------------------// 


const loadOrder = async (req, res) => {
    if (req.session.userId) {
        const selectedAddressId = req.body.selectedAddressId;
        if (selectedAddressId) {
            console.log("address is present");
            const userData = await userModel.findOne({ email: req.session.userId })
            const userId = userData._id
            const userCart = await cartModel.findOne({ userId: userId })
            for (const cartProduct of userCart.product) {
                const product = await productModel.findOne({ _id: cartProduct.productId });
                console.log("product in the product model is", product);
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
                const orderDetails =  orderModel({
                    userId: userId,
                    address: selectedAddress,
                    product: userCart.product.map(product => ({
                        productId: product.productId,
                        name: product.name,
                        quantity: product.quantity,
                        price: product.price,
                        total: product.total,
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
        res.redirect("/login");
    }
}



const  OrderComplete =(req,res)=>{


    res.render("orderConfirm")
}




//----------------------------------------------------------------------------------// 
//==========================cancel order============================================//
//----------------------------------------------------------------------------------// 

const orderCancel = async (req,res)=>{

    const { productId, orderId } = req.body



          //updating the value of adminstatus to cancel
  let cancelledProduct =  await orderModel.findOneAndUpdate(
        { _id: orderId },
        { $set: { 'product.$[elem].adminStatus': 5 } },
        { arrayFilters: [{ 'elem._id': productId }], new: true }
    );

 console.log("cancelledProduct",cancelledProduct);
 console.log("productId",productId);
        //update the product quqntity in product model with respet to the cancelled qunity
        const product = cancelledProduct.product.find(p => p._id.toString() === productId.toString());

    // Product object found, do something with it
   

const  pId = product.productId
const  qty = product.quantity     

const productDocument = await productModel.findById( pId);
console.log("productDocument",productDocument);
const productQty = productDocument.quantity
const totalQty = productQty+ qty
console.log("totalQty",totalQty);
const quantityUpdate = await productModel.updateOne(
    { _id: pId }, // Filter criteria to find the product by its ID
    { $set: { quantity: totalQty } } // Update operation to set the quantity to totalQty
);


    res.status(200).json();

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
        const userAddress= userDetails.address
        const filteredProducts = userDetails.product.filter(product => product.productId === productId);
        const productDetails = await productModel.findOne({_id:productId})
        
       
        res.render("orderStatus", { userAddress , filteredProducts,productDetails,trimmedOrderId});
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


    const { productId, orderId } = req.body

    console.log(productId);
    console.log(orderId);


  
    



    res.status(200).json();

}


//----------------------------------------------------------------------------------// 
//==========================return request to the admin ============================//
//----------------------------------------------------------------------------------// 

const returnRequest = async (req, res) => {
    const { productId, returnReason, orderId } = req.body;
    console.log("productId",productId);
    console.log("orderid", orderId);
    console.log("productId",typeof productId);
    try {
        await orderModel.findOneAndUpdate(
            { _id: orderId },
            { $set: { 'product.$[elem].returnStatus': 1 ,'product.$[elem].returnText':returnReason} },
            { arrayFilters: [{ 'elem._id': productId }], new: true }
        );

        res.status(200).json("ok");
    } catch (error) {
        console.error("Error occurred while processing return request:", error);
        res.status(500).json({ error: "Internal server error" });
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
    loadCart,
    cartDelete,
    updateQuantity,
    userAccount,
    userOrders,
    userAddress,




    addAddress,
    deleteAddress,
    loadCheckout,
    loadOrder,
    OrderComplete,
    // cancelOrder,
    loadOrderStatus,
    orderStatus,
    orderCancel,
    returnRequest
}
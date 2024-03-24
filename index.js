const { error } = require("console")
const express = require("express")
const app = express()
require('dotenv').config();
const mongoose = require("mongoose")
const userRouter = require("./routers/userRouters")
const adminRouter = require("./routers/adminRouters")
const path = require("path")
const session = require("express-session")


app.use(
  session({
    secret: "your-secret-key-here", // my secret key
    resave: false,
    saveUninitialized: false,
  })
);
function connectDb() {
  mongoose.connect("mongodb+srv://athulprathap96:athul@123@cluster0.irbd3lh.mongodb.net/").then(() => {
    console.log("db connected....")
  }).catch((error) => {
    console.log(error.message)
  })
}
connectDb()
app.use(express.static(path.join(__dirname, 'public')))


app.use("/", userRouter)
app.use("/", adminRouter)



app.listen(3001, () => {
  console.log("server connected....");
})
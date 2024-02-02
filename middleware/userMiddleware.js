const session = require("express-session")


const isLogin = async(req, res, next) => {
    try{
        if(req.session.userId){
            res.redirect('/');
        }
        else {
           next()
        }
    } catch(error) {
        console.log(error.message);
    }
}


const isLogout = async(req, res, next) => {
    try{
        if(!req.session.userId){
            next()
        }
        else {
           
            next()
        }
    } catch(error) {
        console.log(error.message);
    }
}


module.exports={
    isLogin ,
    isLogout 
}


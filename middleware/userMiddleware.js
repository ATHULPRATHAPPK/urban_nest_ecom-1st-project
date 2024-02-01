const session = require("express-session")


const isLogin = async(req, res, next) => {
    try{
        if(req.session.userid){
            next();
        }
        else {
            res.redirect('/');
        }
    } catch(error) {
        console.log(error.message);
    }
}

const isLogout = async(req, res, next) => {
    try{
        
        if(!req.session.userid){
            next();
        }else{
            res.redirect('/');
        }
    } catch(error) {
        console.log(error.message);
    }
}


module.exports={
    isLogin,
    isLogout
}
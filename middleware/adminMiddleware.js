



//session for admin log in
const isLogin = async(req, res, next) => {
    try{
        if(req.session.adminId){
            next();
        }
        else {
            res.redirect('/admin');
        }
    } catch(error) {
        console.log(error.message);
    }
}


//damin logout
const isLogout = async(req, res, next) => {
    try{
        
        if(!req.session.adminId){
            next();
        }else{
            res.redirect('/admin');
        }
    } catch(error) {
        console.log(error.message); 
    }
} 


module.exports={
    isLogin,
    isLogout
}
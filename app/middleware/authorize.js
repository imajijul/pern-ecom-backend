export const authorize = (...roles)=>{
    return (req, res, next)=>{
        if(!req.users){
            return res.status(401).json({success: false, message: "Unauthorized"})
        }
        if(!roles.includes(req.users.role)){
            return res.status(403).json({success: false, message: 'Forbidden'})
        }
        next()

    }
}
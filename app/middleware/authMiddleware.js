import jwt from "jsonwebtoken"
import { jwt_access_secret } from "../config/config.js"
import { dbconnect } from "../database/db.js"

export const  authMiddleware = async(req, res, next)=>{
    try{
        const token = req.cookies.access_token

        if(!token){
            return res.status(401).json({success: false, message: "Unauthorized"})
        }

        const decodedToken = jwt.verify(token, jwt_access_secret)
 
        const userFindQuery =  `SELECT u.id, u.email, r.name AS role  FROM users u JOIN roles r On u.role_id = r.id WHERE u.id=$1`

        const user = await dbconnect.query(userFindQuery, [decodedToken.id])
        
        if(!user.rows[0]){
            return res.status(404).json({success: false, message: "User not found, Register first"})
        }
        // req.user = {
        //     id: user.rows[0].id,
        //     email: user.rows[0].email,
        // }
        req.users= user.rows[0]
        return next()
        
    }catch(err){
        console.error(err)
        if(err.name === "TokenExpiredError"){
        return res.status(401).json({success: false, message: "Token Expired"})
        }

        return res.status(401).json({success: false, message: "Token Invalid"})


    }
}

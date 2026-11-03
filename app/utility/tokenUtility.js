import jwt from "jsonwebtoken"
import { jwt_access_expire, jwt_access_secret } from "../config/config.js"


export const generateAccessToken = async(id, email, role)=>{
    let payload = {
        id, email, role
    }
    let token = await jwt.sign(payload, jwt_access_secret, {expiresIn: jwt_access_expire})
    return token
}

export const decodedToken = async (req, res)=>{
    let access_token = req.cookies.access_token
    let decoded = await jwt.verify(access_token, jwt_access_secret)
    return decoded
}
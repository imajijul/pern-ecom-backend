import { cookieOptions, jwt_refresh_secret } from "../config/config.js"
import { dbconnect } from "../database/db.js"
import { generateAccessToken } from "../utility/tokenUtility.js";
import jwt from "jsonwebtoken"

export const registerUserController = async (req, res)=>{
    try {
        const {name, email, phone, password} = req.body

        let register_query = `INSERT INTO users(name, email, password, phone) VALUES ($1, $2, $3, $4)`

        const find_user_query = `SELECT email FROM users WHERE email=$1`
        let find_user = await dbconnect.query(find_user_query, [email])
       
        if(find_user.rows[0] && find_user.rows[0].email){
            return res.json({success: false, message: "user already exist"})
        }
        
        await dbconnect.query(register_query, [name, email, password, phone])
        res.json({success: true, message: "registration success"})
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}

// login user
export const loginUserControler = async (req, res)=>{
    try {
        const {email, password} = req.body
        let login_query = `SELECT u.id, u.email, u.password, r.name AS role_name FROM users u JOIN roles r ON u.role_id = r.id  WHERE email = $1 AND password = $2 `

        let result = await dbconnect.query(login_query, [email, password])

        if(email === result.rows[0].email && password=== result.rows[0].password){
            let {id, email, role_name} = result.rows[0]
            let access_token  = await generateAccessToken(id, email, role_name)
            res
            .cookie("access_token", access_token, cookieOptions)
            .json({success: true, message: "login success"})
        }else{
            res.json({success: false, message: "incorrect email or password"})
        }
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}

export const updateUserController = async (req, res)=>{
    try {
        let {name, phone} = req.body
        let id = req.users.id
        const find_user_query = `SELECT id, email FROM users WHERE id=$1`
        let find_user = await dbconnect.query(find_user_query, [id])
        
        if(!find_user.rows[0]){
            return res.json({success: false, message: "User not found. Register Please!"})
        }
        let update_user_query = `UPDATE users SET name = $1, phone = $2 WHERE id = $3`
        let data = await dbconnect.query(update_user_query, [name, phone, find_user.rows[0].id])
        if(data.rowCount===0){
            return res.json({success: false, message: "Update failed"})
        }
        res.json({success: true, message: "data update success"})
    }catch (err) {
        res.json({success: false, message: err.message})
    }
}

export const logoutController = async (req, res)=>{
    try {
        if(req.cookies.token){
            res.cookie("token", "", {...cookieOptions, maxAge: 1})
            res.json({success: true, message: "logout success"})
        }else{
            res.json({success: false, message: "please! login user"})
        }
         
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}



// export const accessRefreshController = async (req, res)=>{
//     try {
//         const incomming_refreshToken = req.cookies.refresh_token || req.body.refresh_token || req.headers.refresh_token

//         if(!incomming_refreshToken){
//             res.send("go to login page")
//         }
//         let decodedToken = await jwt.verify(incomming_refreshToken, jwt_refresh_secret)

//         let user_find_query =  `SELECT * FROM users WHERE id=$1`
//         let user = await dbconnect.query(user_find_query, [decodedToken.id])
  
//         if(!user.rows[0]){
//             return res.send("User not found")
//         }

//         if(incomming_refreshToken !== user.rows[0].refresh_token){
//             res.send("token expired")
//         }
//         const newaccess_token = await generateAccessToken(user.rows[0].id)
        
//         res
//         .cookie("access_token", newaccess_token, cookieOptions)
//         .send("login success")
        
//     } catch (err) {
//         res.json({success: false, message: err.message})
//     }
// }

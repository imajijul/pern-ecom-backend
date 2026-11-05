import { cookieOptions, jwt_refresh_secret } from "../config/config.js"
import { dbconnect } from "../database/db.js"
import { generateAccessToken } from "../utility/tokenUtility.js";
import jwt from "jsonwebtoken"
import crypto from "crypto";
import bcrypt from "bcrypt";

import { emailSend } from "../utility/emailUtility.js";

export const registerUserController = async (req, res)=>{
    try {
        const {name, email, phone, password} = req.body
        const hashedPassword = await bcrypt.hash(password, 12)
        
        const find_user_query = `SELECT email FROM users WHERE email=$1`
        let find_user = await dbconnect.query(find_user_query, [email])
        if(find_user.rows[0] && find_user.rows[0].email){
            return res.json({success: false, message: "user already exist"})
        }
        
        let register_query = `INSERT INTO users(name, email, password, phone) VALUES ($1, $2, $3, $4)`
        await dbconnect.query(register_query, [name, email, hashedPassword, phone])
        
        res.json({success: true, message: "registration success"})
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}

// send email verification link
export const sendEmailVerifyController = async (req, res)=>{
    try {
        const {email} = req.query

        const token = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex")

        const verifyLink = `http://localhost:3000/verify-email?token=${token}`
        
        const emailSubject = `Verify Your Email`
        const emailText = `
            <!DOCTYPE html>
            <html>
                <h2>Welcome!</h2>
                <p>Please verify your email address.</p>
                <a href="${verifyLink}">Verify Email</a>
                <p>Link expires in 15 minutes.</p>
            </html>
        `
        const expires = new Date(Date.now() + 5 * 60 * 1000);
        // console.log(expires +  new Date(Date.now()))

        // await dbconnect.query("BEGIN")

        const find_user_query = `SELECT id, name, email, is_verified, status FROM users WHERE email=$1`

        let find_user = await dbconnect.query(find_user_query, [email])
       
        if(find_user.rows.length === 0){
            return res.json({success: false, message: "user not found"})
        } 
        
        if (find_user.rows[0].status === "block") {
            return res.status(403).json({
                success: false,
                message: "Your account is blocked"
            });
        }
        
        if (
            find_user.rows[0].is_verified === true &&
            find_user.rows[0].status === "active"
        ) {
            return res.status(200).json({
                success: true,
                message: "Email already verified"
            });
        }

        await emailSend(email, emailText, emailSubject )

        const update_query = `
            UPDATE users
            SET verification_token = $1,
                verification_expires = $2
            WHERE email = $3 AND id = $4
                AND is_verified = FALSE
                AND status = 'inactive'
            RETURNING id, email
            `
        await dbconnect.query(update_query, [
            hashedToken,
            expires,
            find_user.rows[0].email, 
            find_user.rows[0].id
        ]);

        
        res.json({success: true, message: find_user.rows[0]})
    } catch (err) {
        // await dbconnect.query("ROLLBACK")  
        res.json({success: false, message: err.message})
    }
}

// verify email via link
export const emailVerifyController = async (req, res)=>{
    try {
        const {token} = req.query

        if(!token){
            return res.status(400).json({
                success: false,
                message: "token is required"
            })
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        let verify_query = `
            UPDATE users
            SET status = 'active',
                is_verified = TRUE,
                verification_token = NULL,
                verification_expires = NULL,
                updated_at = NOW()
            WHERE verification_token = $1
                AND verification_expires > NOW()
                AND is_verified = FALSE
                AND status = 'inactive'
            RETURNING id, email, is_verified


        `
        let data = await dbconnect.query(verify_query, [hashedToken])

        if(data.rows.length === 0){
            return res.status(400).json({
                success: false,
                message: "invalid or expired verfication link"
            })
        }
        res.json({success: true, message: "email verification successfull"})
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}



// login user
export const loginUserControler = async (req, res)=>{
    try {
        const {email, password} = req.body

        // step-1: input value check
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        let login_query = `SELECT u.id, u.email, u.password, u.status, r.name AS role_name FROM users u JOIN roles r ON u.role_id = r.id  WHERE email = $1`

        // step-2: fetch user by email
        let result = await dbconnect.query(login_query, [email])
        let user = result.rows[0]
        if(result.rows.length === 0){
            return res.status(400).json({
                success: false,
                message: "email not registered"
            })
        }

        // step-3: compare password
        let isMatched = await bcrypt.compare(password, user.password)
        
        if(!isMatched){
            return res.status(400).json({
                success: false,
                message: "ivalid email or password"
            })
        }
        
        // step-4: check account status
        if(user.status === "block"){
            return res.status(400).json({
                success: false,
                message: "Your account is blocked. Please submit an appeal."
            })
        }

         // step-5: generate token and login success
        let access_token  = await generateAccessToken(user.id, user.email, user.role_name)
        return res
        .cookie("access_token", access_token, cookieOptions)
        .json({success: true, message: "login success"})
    } catch (err) {
        return res.json({success: false, message: err.message})
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

export const forgotPasswordtController = async (req, res)=>{
    try {
        
        return res.json({success: true, message: "password forgot success"})
         
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}

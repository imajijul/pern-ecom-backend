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


export const changePasswordtController = async (req, res)=>{
    try {
        const {current_password, new_password} = req.body
        const {id, email} = req.users

        // step-1: input value check
        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        let user_query = `SELECT id, email, password FROM users  
        WHERE email = $1 AND id = $2`

        // step-2: fetch user by email and id from authMidleware
        let result = await dbconnect.query(user_query, [email, id])
        
        // step-3: check user data
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
        });
}

        // step-4: compare password
        let isMatched = await bcrypt.compare(current_password, result.rows[0].password)
        
        if(!isMatched){
            return res.status(400).json({
                success: false,
                message: "ivalid current password"
            })
        }

        const hashedPassword = await bcrypt.hash(new_password, 12)

        // step-5: update password
        let pass_query = `
            UPDATE users
            SET password = $1
            WHERE id = $2
                AND email = $3
            RETURNING id, email
        `
        const data = await dbconnect.query(pass_query, [hashedPassword, result.rows[0].id, result.rows[0].email])
        
        if(data.rows.length === 0){
             return res.status(400).json({
                success: false,
                message: "password could't change"
            })
        }
        return res
        .status(200)
        .json({success: true, message: "password changed"})
       
         
    } catch (err) {
        res
        .status(500)
        .json({success: false, message: err.message})
    }
}



export const forgotPasswordtController = async (req, res)=>{
    try {
        // step-1; input email
        let {email} = req.body
        if(!email){
            return res.status(400).json ({
                success: false,
                message: "email is required"
            })
        }

        // step-2: check user by email 
        let find_query = `SELECT id, name, email FROM users WHERE email = $1`
        let user_data = await dbconnect.query(find_query, [email])
        
        if(user_data.rows.length === 0){
            return res.status(400).json ({
                success: false,
                message: "user not found with your email address"
            })
        }

        // step-3: reset token generate
        const token = crypto.randomBytes(32).toString("hex")

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex")
        
        // step-4: send reset link via email
        const reset_expires = new Date(Date.now() + 15 * 60 * 1000)
        const resetLink = `http://localhost:3000/reset-password?token=${token}`
        
        const emailSubject = `Reset Password`
        const emailText = `
            <!DOCTYPE html>
            <html>
                <h2>Welcome!</h2>
                <p>Please click the link to reset yout password.</p>
                <a href="${resetLink}">Reset</a>
                <p>Link expires in 15 minutes.</p>
            </html>
            `
        await emailSend(email, emailSubject, emailText )

        // step-5: update token and expires
        const update_query = `
            UPDATE users
            SET reset_password_token = $1,
                reset_password_expires = $2
            WHERE email = $3 AND id = $4
            RETURNING id, email
            `
        await dbconnect.query(update_query, [
            hashedToken,
            reset_expires,
            user_data.rows[0].email, 
            user_data.rows[0].id
        ]);

        return res.json({success: true, message: "password reset link send to your email"})
         
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}


// reset pass  via link
export const resetPasswordController = async (req, res)=>{
    try {
        const {token} = req.query
        const {password} = req.body

        // step-1: check input
        if(!token || !password){
            return res.status(400).json({
                success: false,
                message: "token and password are required"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 12)

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        let reset_query = `
            UPDATE users
            SET 
                password = $1,
                reset_password_token = NULL,
                reset_password_expires = NULL,
                updated_at = NOW()
            WHERE reset_password_token = $2
                AND reset_password_expires > NOW()  
            RETURNING id, email


        `
        let data = await dbconnect.query(reset_query, [hashedPassword, hashedToken])
        console.log(data.rows)
        if(data.rows.length === 0){
            return res.status(400).json({
                success: false,
                message: "invalid or expired password reset link"
            })
        }
        res.json({success: true, message: "password reset successfull"})
    } catch (err) {
        res.json({success: false, message: err.message})
    }
}

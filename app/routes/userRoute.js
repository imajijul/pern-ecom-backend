import express from "express"
import { sendEmailVerifyController, forgotPasswordtController, loginUserControler, registerUserController, updateUserController, emailVerifyController } from "../controllers/userController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const userRouter = express.Router()

userRouter.post("/register", registerUserController) // register user
userRouter.post("/login", loginUserControler) // login user
userRouter.put("/update-user", authMiddleware, updateUserController) // update user
userRouter.get("/forgot-password", forgotPasswordtController)

userRouter.post("/verify-email", sendEmailVerifyController)
userRouter.post("/verify", emailVerifyController)

export default userRouter
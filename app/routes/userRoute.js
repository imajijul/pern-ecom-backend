import express from "express"
import { sendEmailVerifyController, forgotPasswordtController, loginUserControler, registerUserController, updateUserController, emailVerifyController, changePasswordtController, resetPasswordController } from "../controllers/userController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const userRouter = express.Router()

userRouter.post("/register", registerUserController) // register user
userRouter.post("/login", loginUserControler) // login user
userRouter.put("/update-user", authMiddleware, updateUserController) // update user
userRouter.post("/change-password", authMiddleware, changePasswordtController)
userRouter.post("/forgot-password", forgotPasswordtController)
userRouter.post("/reset-password", resetPasswordController)

userRouter.post("/verify-email", authMiddleware, sendEmailVerifyController)
userRouter.post("/verify", authMiddleware, emailVerifyController)

export default userRouter
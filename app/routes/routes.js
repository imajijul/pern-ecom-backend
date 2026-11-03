import express from "express"
import {loginUserControler, logoutController, registerUserController, updateUserController } from "../controllers/userController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { authorize } from "../middleware/authorize.js"
import { createProductController, getAllProductControler, productDetailsControler, productFilterControler } from "../controllers/productsController.js"
import { createWishlistControler, deleteWishlistControler, getWishlistControler } from "../controllers/wishlists.js"
import { createCartsControler, deleteCartsControler, deleteSingleCartControler, getCartsControler } from "../controllers/cartsController.js"
import { createInvoiceControler, getInvoiceItemsControler, getInvoiceListControler, paymentCancelControler, paymentFailControler, paymentSuccessControler } from "../controllers/invoiceController.js"

const router = express.Router()

// user routes
router.post("/register", registerUserController) // register user
router.post("/login", loginUserControler) // login user
router.put("/update-user", authMiddleware, updateUserController) // update user
// router.get("/logout", logoutController) // login user

// Profile CRUD | Password Change/Reset | 

// Admin
router.post("/create-product", authMiddleware, authorize("super_admin","admin"), createProductController) // create product


// product routes
router.get("/all-products", getAllProductControler) // all produts list
router.get("/product-details/:id", productDetailsControler) // all produts list
router.get("/product", productFilterControler) // all produts list
// Prduct by category

// wishlists
router.post("/add-wishlist", authMiddleware, createWishlistControler)
router.get("/wishlists", authMiddleware, getWishlistControler)
router.post("/remove-wishlists/", authMiddleware, deleteWishlistControler)

// carts
router.post("/add-cart", authMiddleware, createCartsControler)
router.get("/carts", authMiddleware, getCartsControler)
router.delete("/carts", authMiddleware, deleteCartsControler) // all
router.delete("/signle-cart", authMiddleware, deleteSingleCartControler) // all

// invoice
router.post("/create-invoice", authMiddleware, createInvoiceControler)
router.get("/invoices", authMiddleware, getInvoiceListControler)
router.get("/invoice-items", authMiddleware, getInvoiceItemsControler)

router.put("/payment-success/:trxID", authMiddleware, paymentSuccessControler)
router.put("/payment-fail/:trxID", authMiddleware, paymentFailControler)
router.put("/payment-cancel/:trxID", authMiddleware, paymentCancelControler)









export default router
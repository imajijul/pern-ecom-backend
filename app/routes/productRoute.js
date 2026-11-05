import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { authorize } from "../middleware/authorize.js"
import { createProductController, getAllProductControler, productDetailsControler, productFilterControler } from "../controllers/productsController.js"
import { createWishlistControler, deleteWishlistControler, getWishlistControler } from "../controllers/wishlists.js"
import { createCartsControler, deleteCartsControler, deleteSingleCartControler, getCartsControler } from "../controllers/cartsController.js"
import { createInvoiceControler, getInvoiceItemsControler, getInvoiceListControler, paymentCancelControler, paymentFailControler, paymentSuccessControler } from "../controllers/invoiceController.js"

const productRouter = express.Router()

// Admin
productRouter.post("/create-product", authMiddleware, authorize("super_admin","admin"), createProductController) // create product


// product routes
productRouter.get("/all-products", getAllProductControler) // all produts list
productRouter.get("/product-details/:id", productDetailsControler) // all produts list
productRouter.get("/product", productFilterControler) // all produts list
// Prduct by category

// wishlists
productRouter.post("/add-wishlist", authMiddleware, createWishlistControler)
productRouter.get("/wishlists", authMiddleware, getWishlistControler)
productRouter.post("/remove-wishlists/", authMiddleware, deleteWishlistControler)

// carts
productRouter.post("/add-cart", authMiddleware, createCartsControler)
productRouter.get("/carts", authMiddleware, getCartsControler)
productRouter.delete("/carts", authMiddleware, deleteCartsControler) // all
productRouter.delete("/signle-cart", authMiddleware, deleteSingleCartControler) // all

// invoice
productRouter.post("/create-invoice", authMiddleware, createInvoiceControler)
productRouter.get("/invoices", authMiddleware, getInvoiceListControler)
productRouter.get("/invoice-items", authMiddleware, getInvoiceItemsControler)

productRouter.put("/payment-success/:trxID", authMiddleware, paymentSuccessControler)
productRouter.put("/payment-fail/:trxID", authMiddleware, paymentFailControler)
productRouter.put("/payment-cancel/:trxID", authMiddleware, paymentCancelControler)









export default productRouter
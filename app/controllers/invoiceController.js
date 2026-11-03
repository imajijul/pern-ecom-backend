import { dbconnect } from "../database/db.js"
import FormData from "form-data"
import axios from "axios"


export const createInvoiceControler = async (req, res)=>{
    try{

        // await dbconnect.query("BEGIN")
        let {id} = req.users

        // ======= step-01: Calculate total, payable, vat =======
        let cart_find = `SELECT p.price, p.size, p.color, c.product_id, c.qty FROM carts c 
            JOIN products p ON c.product_id = p.id
            WHERE user_id = $1
        `
        let cart_data = await dbconnect.query(cart_find, [id])
        
        if (cart_data.rows.length === 0) {
            return res.status(400).json({
            success: false,
            message: "Your cart is empty"
    });

}

        console.log(cart_data.rows[0])

        let total = 0
        cart_data.rows.forEach((element)=>{
            total += parseFloat(element["price"]) * parseFloat(element["qty"])
        })

        console.log(total)
        let vat = total * .05
        let payable = total+vat
       
        // ======= step-02: Customer details and Shipping details =======
        let ship_details_query = `SELECT full_address, state, city, zip_code FROM shipping_addresses WHERE user_id = $1`
        let ship_data = await dbconnect.query(ship_details_query, [id])

        let {full_address, state, city, zip_code}= ship_data.rows[0]
        
        let ship_details = `Full Address: ${full_address}, State: ${state}, City; ${city}, Zipcode: ${zip_code}`
        
        let cus_details = `Full Address: Rangpur, State: Bangladesh, City; Rangpur, Zipcode: 8272`

        // ======= step-03: Transaction id & Validation =======
        let tran_id = Math.floor(10000000+Math.random()*90000000)
        let val_id='0'

        // ======= step-04: Create Orders/Invoice =======

        let order_query = `INSERT INTO orders(user_id, total, vat, payable, tran_id, val_id, cus_details, ship_details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`

        let data = await dbconnect.query(order_query, [id, total, vat, payable, tran_id, val_id, cus_details, ship_details])
        
        // ======= step-05: Create Orders Products/Invoice Products =======
        let order_id = data.rows[0]["id"]
         cart_data.rows.forEach(async(element)=>{
            let item_query = `INSERT INTO order_items(user_id, product_id, order_id, color, size, qty) 
            VALUES($1, $2, $3, $4, $5, $6)`
            await dbconnect.query(item_query, [id, element.product_id, order_id, element.color, element.size, element.qty])
         })


        // ======= step-06: Remove Products from Carts =======
        let cart_del_query = `DELETE FROM carts WHERE user_id = $1`
        await dbconnect.query(cart_del_query, [id])

        // await dbconnect.query("COMMIT")

        // ======= step-07:Prepare SSL Payment =======
        let PaymentSettings= await dbconnect.query(`SELECT * FROM payment_settings`)
        let Profile = await dbconnect.query(`SELECT name, email, phone FROM users WHERE id=${id}`)

        const form=new FormData();
        form.append('store_id',PaymentSettings.rows[0]['store_id'])
        form.append('store_passwd',PaymentSettings.rows[0]['store_passwd'])
        form.append('total_amount',payable.toString())
        form.append('currency',PaymentSettings.rows[0]['currency'])
        form.append('tran_id',tran_id)

        form.append('success_url',`${PaymentSettings.rows[0]['success_url']}/${tran_id}`)
        form.append('fail_url',`${PaymentSettings.rows[0]['fail_url']}/${tran_id}`)
        form.append('cancel_url',`${PaymentSettings.rows[0]['cancel_url']}/${tran_id}`)
        form.append('ipn_url',`${PaymentSettings.rows[0]['ipn_url']}/${tran_id}`)

        form.append('cus_name',Profile.rows[0]['name'])
        form.append('cus_email',Profile.rows[0]['email'])
        form.append('cus_add1',"Dhaka, Bangladesh")
        form.append('cus_add2',"Dhaka Bangladesh")
        form.append('cus_city', "Dhaka")
        form.append('cus_state', "Dhaka")
        form.append('cus_postcode', "5450")
        form.append('cus_country', "Bangladesh")
        form.append('cus_phone', Profile.rows[0]['phone'])
        form.append('cus_fax', Profile.rows[0]['phone'])

        form.append('shipping_method',"YES")
        form.append('ship_name', "SteadFast")
        form.append('ship_add1', ship_data.rows[0]['full_address'])
        form.append('ship_add2',ship_data.rows[0]['full_address'])
        form.append('ship_city',ship_data.rows[0]['city'])
        form.append('ship_state',ship_data.rows[0]['state'])
        form.append('ship_country',ship_data.rows[0]['state'])
        form.append('ship_postcode',ship_data.rows[0]['zip_code'])

        form.append('product_name','According Invoice')
        form.append('product_category','According Invoice')
        form.append('product_profile','According Invoice')
        form.append('product_amount','According Invoice')

    let SSLRes=await axios.post("https://sandbox.sslcommerz.com/gwprocess/v4/api.php",form)

        return res.status(201).json({
            success: true,
            message: "Inovice Created Success",     
            data: SSLRes.data
        });

    }catch(err){
        // await dbconnect.query("ROLLBACK")
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}



export const getInvoiceListControler = async (req, res)=>{
    try{
        let {id} = req.users

        let fetch_query = `SELECT total, vat, payable, payment_status FROM orders
        WHERE user_id =$1
        `
        const result = await dbconnect.query(fetch_query, [id]);

        if(result.rows.length===0){
            return res.status(404).json({
                success: false,
                message: "No Orders Found"
            })
        }
        return res.status(201).json({
            success: true,
            message: "Your Orders List",
            data: result.rows
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}


export const getInvoiceItemsControler = async (req, res)=>{
    try{
        let {id} = req.users
        let {order_id} = req.body

        let fetch_query = `SELECT oi.id, oi u.name, u.email, u.phone, p.name AS product_name, p.price, c.name AS category FROM order_items oi

        JOIN users u ON oi.user_id = u.id
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id


        WHERE oi.user_id =$1 AND oi.order_id = $2
        `
        const result = await dbconnect.query(fetch_query, [id, order_id]);

        if(result.rows.length===0){q
            return res.status(404).json({
                success: false,
                message: "No Order Items Found"
            })
        }
        return res.status(201).json({
            success: true,
            message: "Your Order Items",
            data: result.rows
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}




export const paymentSuccessControler = async (req, res)=>{
    try{
        let {id} = req.users
        let {trxID} = req.params

        let fetch_query = `SELECT id, total, payment_status FROM orders
        WHERE user_id =$1 AND tran_id = $2
        `
        const result = await dbconnect.query(fetch_query, [id, trxID]);

        if(result.rows.length===0){
            return res.status(404).json({
                success: false,
                message: "No Orders Found"
            })
        }

        // Step 2: Check current status
        if (result.rows[0].payment_status === "success") {
            return res.status(400).json({
                success: false,
                message: "Payment already completed."
            });
        }

        if (result.rows[0].payment_status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This payment cannot be completed."
            });
        }


        // Step 3: Fetch order items
        
        let order_id = result.rows[0].id
        let order_fetch_query = `SELECT id, product_id, order_id, color, size, qty FROM order_items
            WHERE user_id = $1 AND order_id = $2
        `
        let order_items_data = await dbconnect.query(order_fetch_query, [id, order_id])
        
        if(order_items_data.rows.length===0){
            return res.status(404).json({
                success: false,
                message: "No Orders Item Found"
            })
        }
        order_items_data.rows.forEach(async(item)=>{
            console.log(item)

            const stock_query = `
                UPDATE products
                SET qty = qty - $1
                WHERE id = $2
                AND qty >= $1
                RETURNING id, qty
            `
            let stock_data = await dbconnect.query(stock_query, [item.qty, item.product_id])

            if(stock_data.rows.length===0){
            return res.status(404).json({
                success: false,
                message: `Insufficient stock: Product ${item.product_id}`
            })
        }
        })


        // Step 4: update order status
        let update_query = `UPDATE orders
            SET payment_status = $1,
                updated_at = NOW()
            WHERE tran_id = $2 AND user_id = $3
            RETURNING payment_status
        `
        let data = await dbconnect.query(update_query, ['success', trxID, id])

        if (data.rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Payment status has already changed."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Payment Success",
            data: data.rows[0]
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}


export const paymentFailControler = async (req, res)=>{
    try{
        let {id} = req.users
        let {trxID} = req.params

        // Step 1: Order check
        let fetch_query = `SELECT id, total, payment_status FROM orders
        WHERE user_id =$1 AND tran_id = $2`

        const result = await dbconnect.query(fetch_query, [id, trxID]);

        if(result.rows.length===0){
            return res.status(404).json({
                success: false,
                message: "No Orders Found"
            })
        }

        
        // Step 2: Check payment status
        if(result.rows[0]["payment_status"]==="success"){
            return res.status(400).json({
                success: false,
                message: "Payment already completed. Cannot mark as failed."
            })
        }


        if (result.rows[0].payment_status !== 'pending') {
            return res.status(400).json({
            success: false,
            message: "This payment cannot be marked as failed."
        });
        }

        // Step 3: Update payment status

        let update_query = `UPDATE orders
            SET payment_status = $1,
                updated_at = NOW()
            WHERE tran_id = $2 AND user_id = $3
            RETURNING payment_status
        `
        let data = await dbconnect.query(update_query, ['failed', trxID, id])

        if (data.rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Payment status has already changed."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Payment Failed",
            data: data.rows[0]
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const paymentCancelControler = async (req, res)=>{
    try{
        let {id} = req.users
        let {trxID} = req.params

        // Step 1: Order check
        let fetch_query = `SELECT id, total, payment_status FROM orders
        WHERE user_id =$1 AND tran_id = $2`

        const result = await dbconnect.query(fetch_query, [id, trxID]);

        if(result.rows.length===0){
            return res.status(404).json({
                success: false,
                message: "No Orders Found"
            })
        }

        
        // Step 2: Check payment status
        if(result.rows[0]["payment_status"]==="success"){
            return res.status(400).json({
                success: false,
                message: "Payment already completed. Cannot cancel"
            })
        }


        if (result.rows[0].payment_status !== 'pending') {
            return res.status(400).json({
            success: false,
            message: "This payment cannot be cancelled."
        });
        }

        // Step : Update payment status

        let update_query = `UPDATE orders
            SET payment_status = $1,
                updated_at = NOW()
            WHERE tran_id = $2 AND user_id=$3
            RETURNING payment_status
        `
        let data = await dbconnect.query(update_query, ['cancel', trxID, id])

        if (data.rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Payment status has already changed."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Payment Cancelled Successfully",
            data: data.rows[0]
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}
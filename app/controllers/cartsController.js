import { dbconnect } from "../database/db.js";

export const createCartsControler = async (req, res)=>{
    try{
        // Step 1: body theke data input
        const { product_id, qty } = req.body

        // Step 2: Login করা User-এর ID নেব
        const {id} = req.users

        // Step 3: Product আগে carts-এ আছে কি না check করব
        const check_carts = `
            SELECT id FROM carts
            WHERE user_id = $1 AND product_id = $2`

        const check = await dbconnect.query(check_carts, [id, product_id])

        // Step 4: আগে থেকেই থাকলে Add করব না
        if (check.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Already exist to wishlist"});
        }

        // Step 5: Carts-এ নতুন Product Add করব
        const insert_query = `
            INSERT INTO carts (
                user_id,
                product_id,
                qty
            ) VALUES ($1, $2, $3) RETURNING *`

        const result = await dbconnect.query(insert_query, [id, product_id, qty]);

        return res.status(201).json({
            success: true,
            message: "Added to Carts",
            data: result.rows[0]
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const getCartsControler = async (req, res)=>{
    try{
        let {id} = req.users

        let fetch_query = `SELECT p.name AS product_name, p.price, c.qty, cat.name AS category FROM carts c
        JOIN products p ON c.product_id = p.id
        JOIN categories cat ON p.category_id = cat.id
        WHERE user_id =$1
        `
        const result = await dbconnect.query(fetch_query, [id]);

        if(result.rows.length===0){
            return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }
        return res.status(201).json({
            success: true,
            message: "Product Carts",
            data: result.rows
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const deleteSingleCartControler = async (req, res)=>{
    try{
        // step-1: get product_id from body and user id from req.users
        let {cartId} = req.body
        let {id} = req.users
        let fetch_query = `SELECT * FROM carts WHERE user_id =$1 AND id = $2`
        const result = await dbconnect.query(fetch_query, [id, cartId])

        if(result.rows.length === 0){
             return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }
        let delete_query = `DELETE FROM carts WHERE user_id = $1 AND id=$2`
        
        // // step-2: finally remove from carts
        await dbconnect.query(delete_query,[id, cartId])
        return res.status(201).json({
            success: true,
            message: "Product removed from carts",
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const deleteCartsControler = async (req, res)=>{
    try{
        // step-1: get product_id from body and user id from req.users
        let {id} = req.users
        let fetch_query = `SELECT * FROM carts WHERE user_id =$1`
        const result = await dbconnect.query(fetch_query, [id])

        if(result.rows.length === 0){
             return res.status(404).json({
                success: false,
                message: "No Items On Carts"
            })
        }
        let delete_query = `DELETE FROM carts WHERE user_id = $1`
        
        // step-2: finally remove from carts
        await dbconnect.query(delete_query,[id])
        return res.status(201).json({
            success: true,
            message: "Cart List Cleared",
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}
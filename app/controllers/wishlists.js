import { dbconnect } from "../database/db.js"

export const createWishlistControler = async (req, res)=>{
    try{
        // let {product_id, product_variant_id} = req.body
  
        // let {id, email} = req.users
        // let find_query = `SELECT id, name, email FROM users WHERE id = $1 AND email = $2`
        // let find_user = await dbconnect.query(find_query, [id, email] )
        
        // if(find_user.rows.length === 0){
        //     res.status(404).json({success: false, message: "User not found"})
        // }

        // let add_query = `INSERT INTO wishlists (user_id, product_id, product_variant_id) VALUES ($1, $2, $3)`
        // let data = await dbconnect.query(add_query, [find_user.rows[0].id, product_id, product_variant_id])
        // res.status(200).json({success: true, message: "Product added to wishlist", data})
         // Step 1: Frontend থেকে product ID নেব

        const { product_id} = req.body;

        // Step 2: Login করা User-এর ID নেব
        const user_id = req.users.id;

        // Step 3: Product আগে Wishlist-এ আছে কি না check করব
        const check_query = `
            SELECT id FROM wishlists
            WHERE user_id = $1
            AND product_id = $2`

        const check = await dbconnect.query(check_query, [user_id, product_id]);

        // Step 4: আগে থেকেই থাকলে Add করব না
        if (check.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Already added to wishlist"});
        }

        // Step 5: Wishlist-এ নতুন Product Add করব
        const insert_query = `
            INSERT INTO wishlists (
                user_id,
                product_id  
            ) VALUES ($1, $2) RETURNING *`

        const result = await dbconnect.query(insert_query, [user_id, product_id]);

        return res.status(201).json({
            success: true,
            message: "Added to wishlist",
            data: result.rows[0]
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const getWishlistControler = async (req, res)=>{
    try{
        let {id} = req.users

        let fetch_query = `SELECT p.name AS product_name, p.price, p.qty, * FROM wishlists w
        JOIN products p ON w.product_id = p.id
        WHERE user_id =$1
        `
        const result = await dbconnect.query(fetch_query, [id]);

        return res.status(201).json({
            success: true,
            message: "Product Wishlists",
            data: result.rows[0]
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}


export const deleteWishlistControler = async (req, res)=>{
    try{
        // step-1: get id from body
        let {id} = req.body
        let fetch_query = `SELECT * FROM wishlists WHERE id =$1`
        const result = await dbconnect.query(fetch_query, [id]);

        // step-2: check on wishlist
        if(result.rows.length<=0){
            return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }
        
        let delete_query = `DELETE FROM wishlists WHERE id = $1`
        // step-3: finally remove from wishlist
        await dbconnect.query(delete_query, [result.rows[0].id])
        return res.status(201).json({
            success: true,
            message: "Product removed from whishlists"
        });

    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}
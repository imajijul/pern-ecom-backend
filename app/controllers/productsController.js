import { dbconnect } from "../database/db.js"

export const createProductController = async (req, res)=>{
    try{
        const {name, category_id, description, price, qty, color, size, status } = req.body
        const query =`INSERT INTO products (name, category_id, description, price, qty,  color, size, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`
        const data = await dbconnect.query(query, [name, category_id, description, price, qty, color, size, status])
        res.status(201).json({success: true, message: "product created", data: data.rows[0]})
    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const getAllProductControler = async (req, res)=>{
    try{
        let fetch_query = `SELECT p.name, p.description, p.price, p.color, p.size, p.qty, c.name AS category FROM products p JOIN categories c ON p.category_id = c.id`
        const data = await dbconnect.query(fetch_query)
        res.status(200).json({success: true, message: "All products", data: data.rows})
    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}


export const productDetailsControler = async (req, res)=>{
    try{
        let {id} = req.params
        
        let fetch_query = `SELECT p.name, p.description, p.price, p.qty, p.color, p.size, c.name AS category FROM products p JOIN categories c ON p.category_id = c.id  WHERE p.id = $1`
        
        const data = await dbconnect.query(fetch_query, [id])

        res.status(200).json({success: true, message: "All products", data: data.rows})
    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

// Dynamic Product Filter
export const productFilterControler = async (req, res)=>{
    try{
        let { 
            search,
            category_id,
            min_price,
            max_price,
            color,
            size,
            name_sort,
            price_sort
        } = req.query

        let fetch_query = `SELECT * FROM products WHERE 1=1`
        let values = []

        if (search) {
            values.push(`%${search}%`)
            fetch_query += ` AND (
            name ILIKE $${values.length}
            OR description ILIKE $${values.length}
            )`
        }

        if (category_id) {
            values.push(category_id);
            fetch_query += ` AND category_id = $${values.length}`
        }

        if (min_price) {
            values.push(min_price);
            fetch_query += ` AND price >= $${values.length}`
        }

        if (max_price) {
            values.push(max_price);
            fetch_query += ` AND price <= $${values.length}`
        }
        let sort_query = []

        // Sorting items
        if (price_sort === "low-high") {
            sort_query.push("price ASC")
        } else if (price_sort === "high-low") {
            sort_query.push("price DESC")
        }

        if (name_sort === "a-z") {
            sort_query.push("name ASC")
        } 
        else if (name_sort === "z-a") {
            sort_query.push("name DESC")
        }

        if(sort_query.length>0){
            fetch_query+= ` ORDER BY ${sort_query.join(",")}`
        }
        let data = await dbconnect.query(fetch_query, values)

        if(data.rows.length===0){
            return res.status(400).json({
                success: false,
                message: "No Products Found"
            })
        }
        res.status(200).json({success: true, message: "All products", total: data.rows.length, data: data.rows})
    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}
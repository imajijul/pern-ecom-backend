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
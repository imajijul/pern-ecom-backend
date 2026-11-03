import multer from "multer"

const storage = multer.diskStorage({
    filename: (req, file, cb)=>{
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName+file.originalname)
    },
    destination: (req, file, cb)=>{
        cb(null, "./app/uploads")
    }
})

const upload = multer({storage})

export default upload
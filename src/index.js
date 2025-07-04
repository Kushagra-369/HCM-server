const express = require("express")
const mongoose = require("mongoose")
const router = require("./Routes/Routes.js")
const dotenv = require("dotenv")
const URLnotfound = require("./middleware/URLnotfound.js")
const cors = require("cors")

dotenv.config()
const app = express()
app.use(cors())

app.use(express.json())
port = 6900

mongoose.connect(process.env.mongoosedburl)
.then(()=>console.log("monngodb connected successfully"))
.catch((e)=>console.log(e))

app.use("/",router)

app.use(URLnotfound)

app.listen(port,()=>console.log("server is running", port))

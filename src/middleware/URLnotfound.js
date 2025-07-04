const express = require("express")
const router = require("../Routes/Routes.js")

module.exports = (req,res)=>{
    res.status(500).send("URL not found");
}
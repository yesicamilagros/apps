const express =require("express");
const body_parser=require("body-parser");
const axios=require("axios");
require('dotenv').config();


axios.head('https://i.ibb.co/1tmxq19T/images-1.png')
  .then(res => {
    console.log('Headers:', res.headers);
  })
  .catch(err => {
    console.error('Error:', err.message);
  });

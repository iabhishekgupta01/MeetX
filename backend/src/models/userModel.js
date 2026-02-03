const { Schema } = require("mongoose");
const mongoose=require("mongoose");

const userSchema=new Schema({
    name:{
        type:String,
        require:true
    },
    username:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    token:{
        type:String,
        
    }
});

const User=mongoose.model("users",userSchema);

module.exports={User};
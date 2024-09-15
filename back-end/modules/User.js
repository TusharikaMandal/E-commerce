const mongoose = require("mongoose");
const{Schema,model}=mongoose;

const UserSchema=new Schema({
    name:{
        type:String
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})
const UserModel=model('Users',UserSchema);
module.exports=UserModel
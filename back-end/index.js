const port=4000;
const express= require("express");
const app=express();
const mongoose= require("mongoose");
const multer= require("multer");
const path= require("path");
const cors= require("cors");
const Product=require("./modules/Product");
const Users=require("./modules/User");
const jwt=require("jsonwebtoken");
const dotenv=require('dotenv');
const { error } = require("console");

app.use(express.json());
app.use(cors());
dotenv.config();

mongoose.connect(MONGOOSE_URL)

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

const storage=multer.diskStorage({
    destination:'./upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload=multer({storage:storage})

app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

app.post('/addproduct',async(req,res)=>{
    let products=await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id=last_product.id+1;
    }
    else{
        id=1;
    }
    const product=new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json(product);
})

app.post('/removeproduct' ,async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

app.get('/allproducts',async(req,res)=>{
    let products=await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

app.post('/signup',async(req,res)=>{
    let check=await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,error:"existing userId or emailId"});
    }

    let cart={};
    for (let i = 0; i < 300; i++) {
        cart[i]=0;
    }
    const user=new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
    await user.save();
    const data={
        user:{
            id:user._id
        }
    }
    const token=jwt.sign(data,'secret_ecom');
    res.json({success:true,token});
})

app.post('/login',async(req,res)=>{
    let user=await Users.findOne({email:req.body.email});
    if(user){
        const passCompare=req.body.password===user.password;
        if (passCompare) {
            const data={
                uder:{
                    id:user.id
                }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({seccess:true,token});
        }
        else{
            res.json({seccess:false,error:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,error:'Wrong emailId'});
    }
})

app.get('/newcollections',async(req,res)=>{
    let products= await Product.find({});
    let newcollection= products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

app.get('/popularinwomen',async(req,res)=>{
    let products=await Product.find({category:'women'});
    let popular_in_women=products.slice(0,4);
    console.log("Popular in women fetch");
    res.send(popular_in_women);
})

const fetchUser=async(req,res,next)=>{
    const token=req.header('auth-token');
    if(!token){
        res.status(401).send({error:"Please authentication user validity correctly"})
    }
    else{
        try {
            const data=jwt.verify(token,'secret_ecom');
            req.user=data.user;
            next();
        } catch (error) {
            res.status(401).send({error:"Please authenticate using a valid token"});
        }
    }
}

app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log(req.body,req.user);
    console.log("added",req.body.itemId);
    let userData= await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId]+=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added");
})

app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("removed",req.body.itemId);
    let userData=await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.item]>0){
        userData.cartData[req.body.itemId]-=1;
        await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
        res.send("Removed");  
    }
})

app.post('/getcart',fetchUser,async(req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if(!error){
        console.log("server running");
    }
    else{
        console.log("Error: "+error);
    }
});

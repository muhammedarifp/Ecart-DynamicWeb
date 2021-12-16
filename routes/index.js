var express = require('express');
const session = require('express-session');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')

  function verifyLogin (req,res,next){
    if(req.session.user){
      next()
    }else{
      res.redirect('/login')
    }
  }

router.get('/',async function(req, res, next) {

  let cartCount='login'
  console.log(req.session);
  if(req.session.user){
    cartCount=await userHelpers.CartCount(req.session.user._id)
  }
  
  productHelpers.getAllproduct().then((product)=>{
    let user = req.session.user
    res.render('user/view-product', { product, user, cartCount});
  })
});

router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{Error : req.session.LoggedErr})
    req.session.LoggedErr=false;
  }
})

router.get('/signup', (req,res)=>{
  res.render('user/signup')
})

router.post('/signup', (req,res)=>{
  //console.log(req.body)
  userHelpers.signupUser(req.body).then((respons)=>{
    if(respons.acknowledged){
      req.session.user.LoggedIn=true;
      //req.session.user=req.body;
      res.redirect('/login')
    }else{
      req.session.LoggedErr=true;
      res.redirect('/signup')
    }
    
  })
})

router.post('/login', (req,res)=>{
  userHelpers.loginUser(req.body).then((respons)=>{

    //console.log(respons)

    if(respons.status){
      req.session.user=respons.user
      req.session.user.LoggedIn=true
      
      res.redirect('/')
    }else{
      req.session.LoggedErr="Invalid username or password"
      
      res.redirect('/login')
    }

  })
})

router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let cartItems =await productHelpers.getCartProducts(req.session.user._id)
  //console.log(cartItems)
  let quntity=parseInt(cartItems.quantity)
  let Total = await userHelpers.totalAmount(req.session.user._id)
  let user=req.session.user
  res.render('user/cart',{cartItems,quntity,Total,user})
})

router.get('/add-to-cart/:id', (req,res)=>{
  let proId=req.params.id
  productHelpers.addToCart(req.session.user._id , proId).then(()=>{
    res.json({status:true})
  })
})
//......
router.post('/change-product-quntity', verifyLogin, (req,res)=>{
  userHelpers.CartCountButton(req.body).then(async (respons)=>{
    respons.total = await userHelpers.totalAmount(req.body.user)
    res.json({respons})
  })
  //console.log(req.body)
})
//.......
router.post('/cart-remove-item',(req,res)=>{
  //console.log(req.body.cart)
  ///console.log(req.body.product)

  userHelpers.cartProductRemove(req.body.cart,req.body.product).then((respons)=>{
    res.json({respons})
  })
})

router.get('/buy-product', verifyLogin, async(req,res)=>{
  let total = await userHelpers.totalAmount(req.session.user._id)
  //console.log(total)
  res.render('user/buy-product',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  console.log(req.body);
  let product = await userHelpers.getCartitems(req.session.user._id)
  let total = await userHelpers.totalAmount(req.session.user._id)
  userHelpers.Placeorder(req.body,product,total).then((orderId)=>{
    if(req.body['pay-meth']==='COD'){
      res.json({codSuccess:true})
    }else{
      userHelpers.genarateRazorpay(orderId,total).then((respons)=>{
        res.json(respons)
      })
    }
  })
})

router.get('/orders',verifyLogin, async(req,res)=>{
  let orders = await userHelpers.GetOrderProducts(req.session.user._id)
  //console.log(orders)
  res.render('user/orders', {orders,user:req.session.user})
})

router.get('/view-order-details/:id',(req,res)=>{
  let proId = req.params.id
  //console.log(proId)
  res.render('user/view-order-details')
})

router.get('/order-success', (req,res)=>{
  res.render('user/order-success')
})

router.post('/verify-order' ,(req,res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then((respons)=>{
    userHelpers.changeOrderStatus(req.body['order[receipt]']).then(()=>{
      res.json({statuz:true})
      console.log("success");
    })
  }).catch((err)=>{
    res.json({statuz:false})
    console.log("false");
  })
})

module.exports = router;
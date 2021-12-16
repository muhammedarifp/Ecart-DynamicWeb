var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

router.get('/', function(req, res, next) {
  productHelpers.getAllproduct().then((product)=>{
    res.render('admin/show-products', {product,admin:true})
  })
});

router.get('/add-product', function(req , res) {
  res.render('admin/add-product')
})

router.post('/add-product', (req,res)=>{
  productHelpers.Addproduct(req.body).then((id)=>{
    let image=req.files.Image
    image.mv('./public/Pro-imgs/'+id+'.jpg',(err)=>{
      if(!err){
        res.render('admin/add-product')
      }
    })
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let proId= req.params.id
  productHelpers.deleteProduct(proId).then((respons)=>{
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id', (req,res)=>{
  productHelpers.getProductDetails(req.params.id).then((product)=>{
    res.render('admin/edit-product',{product})
  })

})

router.post('/edit-product/:id', (req,res)=>{
  let proId=req.params.id
  productHelpers.editProduct(proId, req.body).then(()=>{
    res.redirect('/admin')

    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/Pro-imgs/'+proId+'.jpg')

    }
  })
})

router.get("/orders-view", async(req,res)=>{
  let orders =await productHelpers.viewOrdersAdmin()
  let DetailedOrder = await productHelpers.GetorderAllDetails(orders.userId)
  res.render('admin/orders-view',{admin:true, DetailedOrder})
})

router.post('/view-order-details', (req,res)=>{
  console.log(req.body);
})

router.get('/users-view', async(req,res)=>{
  let users = await productHelpers.getAllUsers()
  console.log(users);
  res.render('admin/users-view',{users})
})

router.post('/admin-ban-user', (req,res)=>{
  console.log(req.body);
  productHelpers.BanUser(req.body.userId).then((respons)=>{
    res.json(respons)
    console.log(respons);
  })
})

module.exports = router;

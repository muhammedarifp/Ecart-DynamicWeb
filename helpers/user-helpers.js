var db=require('../config/connection')
var collection=require('../config/collection')
var objectId=require('mongodb').ObjectId
var bcrypt=require('bcrypt')
var Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_x0mR1qXVydN98S',
    key_secret: '2YMPbdddS7b98Sw6C5FcatM7',
  });

module.exports={
    signupUser:(UserData)=>{
        return new Promise(async(resolve,reject)=>{
            UserData.Pwd =await bcrypt.hash(UserData.Pwd,10)
            //console.log(UserData.Pwd)
            db.get().collection(collection.USER_COLLECTION).insertOne(UserData).then((respons)=>{
                resolve(respons)
                console.log(respons)
            })
        })
    },

    loginUser:(UserData)=>{
        return new Promise(async(resolve,reject)=>{
            let respons={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:UserData.Email})
            if(user){
                bcrypt.compare(UserData.Pwd,user.Pwd).then((status)=>{
                    if(status){
                        respons.user=user
                        respons.status=true
                        resolve(respons)                   
                    }else{
                        resolve({status:false})
                    }
                })
            }
        })
    },

    CartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                Count=cart.products.length
                resolve(Count)
            }else{
                resolve(0)
            }
            
        })
    },

    //.......................................................

    CartCountButton:(Details)=>{

        Details.count=parseInt(Details.count)

        return new Promise((resolve,reject)=>{
            if(Details.quntity==1 && Details.count==-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(Details.cart)},
                {
                    $pull: {"products" : {"item" : objectId(Details.product)}}
                }
                ).then((respons)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(Details.cart), 'products.item':objectId(Details.product)},
                {
                    $inc:{'products.$.quantity':Details.count}
                }
                ).then((respons)=>{
                    resolve({inc:true})
                })
            }
        })
    },

    //..........................................................

    cartProductRemove:(cartId,proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne(
                {'_id':objectId(cartId)},
                {$pull: { "products" : {"item": objectId(proId)}}}, 

            ).then((respons)=>{
                resolve({remove:true})
            })
        })
    },

    totalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            //totalAmount=0
            let totalAmount = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:'$products'                                     
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                        }
                    },
                    {
                        $project: {
                            quntityInt: {$toInt : "$quantity"},
                            priceInt: {$toInt : "$product.Price"}
                        }
                    },
                    {
                        $group:{
                            _id:null,
                            total:{$sum:{$multiply:["$quntityInt","$priceInt"]}}
                        }
                    }
                ]).toArray()
                //console.log(totalAmount)
                resolve(totalAmount[0].total)
        })
        },

        Placeorder:(order,product,total)=>{
            return new Promise((resolve,reject)=>{

                let status=order['pay-meth']==='COD'?'Placed':'Pending'
                let OrderObj={
                    delivaryDetails:{
                        addrass:order.address,
                        number:order.number,
                        pincode:order.pincode
                    },
                    userId:order.userId,
                    paymentMethod:order['pay-meth'],
                    products:product,
                    total:total,
                    status:status,
                    date:new Date()
                }

                db.get().collection(collection.ORDER_COLLECTION).insertOne(OrderObj).then((respons)=>{
                    db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                    resolve(respons.insertedId)
                    //console.log(respons.insertedId)
                })
            })
        },

        getCartitems:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
                resolve(cart.products)
            })
        },

        GetOrderProducts:(userId)=>{
            return new Promise(async(resolve , reject)=>{
                let orders=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{userId:userId}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quntity:'$products.quantity',
                            Method:'$paymentMethod',
                            status:'$status',
                            date:'$date'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'orderItems'
                        }
                    },
                    {
                        $project:{
                            quntity:1,
                            Method:1,
                            status:1,
                            date:1,                       
                            orderItems:{$arrayElemAt:["$orderItems",0]}
                        }
                    }
                ]).toArray()
                //(orders)
                resolve(orders)
            })
        },

        genarateRazorpay:(orderId,total)=>{
            total=parseInt(total)
            return new Promise((resolve,reject)=>{
                var options = {
                    amount : total*100,
                    currency : "INR" ,
                    receipt : ""+orderId
                };
                instance.orders.create(options, function(err , order){
                    console.log(order);
                    if(err){
                        //console.log(err);
                    }else{
                        resolve(order)
                    }
                })
            })
        },

        verifyPayment:(details)=>{
            return new Promise((resolve,reject)=>{
                const crypto = require('crypto');
                const secret = '2YMPbdddS7b98Sw6C5FcatM7';
                let hash = crypto.createHmac('sha256', secret)
                hash.update(details['respons[razorpay_order_id]']+"|"+details['respons[razorpay_payment_id]'])
                hash=hash.digest('hex')

                if(hash===details['respons[razorpay_signature]']){
                    resolve()
                }else{
                    reject()
                }
            })
        },

        changeOrderStatus:(orderId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
                {
                    $set:{status:'Placed'}
                }
                ).then(()=>{
                    resolve()
                })
            })
        }
 }

 
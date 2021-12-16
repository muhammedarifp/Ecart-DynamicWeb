var db=require('../config/connection')
var collection=require('../config/collection')
var objectId=require('mongodb').ObjectId

module.exports={
    Addproduct:(product)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((respons)=>{
                //console.log(respons)
                resolve(respons.insertedId)
            })
        })
    },

    getAllproduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let product= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },

    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((respons)=>{
                resolve(true)
            })
        })
    },

    updateProduct:(proId,Details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{$set:{
                Name:Details.Name,
                Catogary:Details.Catogary,
                Discription:Details.Discription,
                Price:Details.Price
            }}).then(function(respons){
                resolve(respons)
            })
        })
    },

    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    editProduct:(proId,Details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{$set:{
                Name:Details.Name,
                Catogary:Details.Catogary,
                Discription:Details.Discription,
                Price:Details.Price
            }}).then((respons)=>{
                //console.log(respons)
                resolve(respons)
            })
        })
    },

    addToCart:(userId , proId)=>{

        let proObj={
            item:objectId(proId),
            quantity:1
        }

        return new Promise(async(resolve,reject)=>{

            let cartDetails =await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

            if(cartDetails){
                let proExist=cartDetails.products.findIndex(product=> product.item==proId)

                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })

                }else{
                    
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $push:{products:proObj}
                }
                ).then((respons)=>{
                    resolve()
                })
                }

            }else{
                let CartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
            db.get().collection(collection.CART_COLLECTION).insertOne(CartObj).then(()=>{
                resolve()
            })
            }
        })
    },

    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems =await db.get().collection(collection.CART_COLLECTION).aggregate([
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
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:["$product",0]}
                    }
                }
            ]).toArray()
            //console.log(cartItems[0].product)
            //console.log(cartItems)
            resolve(cartItems)
        })
    },

    viewOrdersAdmin:()=>{
        return new Promise(async(resolve,reject)=>{
           let orders =await db.get().collection(collection.ORDER_COLLECTION).findOne({status:"Placed"})
           resolve(orders);
           console.log(orders);
        })
    },

    GetorderAllDetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let products =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{userId:userId}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        DelivaryDetails:'$delivaryDetails',
                        userId:'$userId',
                        PayMethod:'$paymentMethod',
                        item:'$products.item',
                        itemQuntity:'$products.quantity',
                        total:'$total',
                        status:'$status',
                        date:'$date'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'proDetails'
                    }
                },
                {
                    $project:{
                        DelivaryDetails:1,
                        userId:1,
                        PayMethod:1,
                        item:1,
                        itemQuntity:1,
                        total:1,
                        status:1,
                        date:1,
                        proDetails:{$arrayElemAt:["$proDetails",0]}
                    }
                }
            ]).toArray()
            resolve(products)
            console.log(products);
        })
    },

    getAllUsers:(userId)=>{
        return new Promise((resolve,reject)=>{
            let users=db.get().collection(collection.USER_COLLECTION).find({}).toArray()
            resolve(users)
        })
    },

    BanUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(userId)}).then((respons)=>{
                resolve({ban:true})
            })
        })
    }

}



function addToCart(Id){
    $.ajax({
        url:"/add-to-cart/"+Id,
        method:'get',
        success:(respons)=>{
            if(respons.status){
                //console.log(respons.status)
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            }
        }
    })
}

function countButton(cartId,proId,userId,count){
    quntity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)
    $.ajax({
        url:"/change-product-quntity",
        data:{
            cart:cartId,
            product:proId,
            count:count,
            user:userId,
            quntity:quntity
        },
        method:'post',
        success:(respons)=>{
            //console.log(respons)
            if(respons.respons.removeProduct){
                location.reload()
                alert('product removed')
            }else{
                document.getElementById(proId).innerHTML=quntity+count
                document.getElementById("total-price").innerHTML=respons.respons.total
            }
        }
    })
}

function cartItemRemove(cartId,proId){
    $.ajax({
      url:'/cart-remove-item',
      data:{
        cart:cartId,
        product:proId
      },
      method:'post',
      success:(response)=>{
          if(response.respons.remove){
              location.reload()
              alert('product deleted')
          }
      }
    })
  }





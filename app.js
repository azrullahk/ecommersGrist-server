const express = require ('express')
const app = express()
const port = 5000
const User = require('./User.model.js')
const mongoose = require('mongoose')
const db = 'mongodb://localhost/ecomm'
const cors = require('cors')
const { response } = require('express')

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded ({ extended: false }))

app.get('/', (req, res) => {
    User.find( (err, users) => {
        if(err) {
            res.send(err)
        } else {
            let product = []
            users.forEach(user => {
                if(user.product.length > 0) {
                    user.product.forEach(el => {
                        product.push(el)
                    });
                }
            });
            res.send(product)
        }
    })
})

// login user 
app.post('/login', (req, res) => {
    // console.log(req.body)
    User.findOne({
        email: req.body.email
    }, (err, user) => {
        if(err) {
            res.send(err)
        } else {
            // console.log(user)
            if (!user) {
                res.status(400).json({
                 msg: 'wrong email/password'
                })
            } else {
                if(user.password === req.body.password) {
                    res.status(200).json(user)
                } else {
                    res.status(400).json({
                        msg: 'wrong email/password'   
                       })
                }
            }
        }
    })
})
// profile
app.get('/profile', (req, res) => {
    // console.log(req.headers)
    User.findOne(
        {_id: req.headers.id},
        (err, result) => {
            if(err) {
                res.send(err)
            } else {
                res.status(200).json(result)
            }
        }
    )
})
// add product
app.post('/add-product', (req, res) => {
    req.body._id = mongoose.Types.ObjectId()
    req.body.userId = mongoose.Types.ObjectId(req.headers.id)
    // console.log(req.headers.id)
    User.findOneAndUpdate(
        { _id: req.headers.id },
        { $push: { product: req.body }},
        (err, result) => {
            if(err) {
                res.send(err)
            } else {
                res.send(result)
            }
        }
    )
})
// add to cart
app.post('/add-to-cart/:id', (req, res) => {
    req.body._id = mongoose.Types.ObjectId()
    let productAdded = {
        productId: req.params.id,
        name: req.body.name,
        price: req.body.price,
        sellerId: req.body.sellerId,
        amount_product: 1,
    }
    User.findOne(
        { _id: req.headers.id },
        (err, results) => {
            if(err) {
                res.send(err)
            } else {
                // if cart was empty
                if(results.cart.length === 0) {
                    User.findOneAndUpdate(
                        { _id: req.headers.id },
                        { $push: { cart: productAdded }},
                        (err, result) => {
                            if(err) {
                                res.send(err)
                            } else {
                                res.send(result)
                            }
                        }
                    )
                } else {
                    // find product in cart
                    let exist = false
                    results.cart.forEach(item => {
                        // console.log(item, "ini id di item")
                        if(item.productId === req.params.id) {
                            item.amount_product++
                            exist = true
                        }
                    });
                    // if product its already exists in cart
                    if(exist) {
                        User.findOneAndUpdate(
                            { _id: req.headers.id },
                            { $set: { cart: results.cart }},
                            (err, result) => {
                                if(err) {
                                    res.send(err)
                                } else {
                                    res.send(result)
                                }
                            }
                        )
                    }
                    // if product its not exists in cart
                    if(!exist) {
                        User.findOneAndUpdate(
                            { _id: req.headers.id },
                            { $push: { cart: productAdded }},
                            (err, result) => {
                                if(err) {
                                    res.send(err)
                                } else {
                                    res.send(result)
                                }
                            }
                        )
                    }
                }
            }
        }
    )
})
// empty cart
app.patch('/cart', (req, res) => {
    User.findOneAndUpdate(
        { _id: req.headers.id },
        { $set: { cart: [] }},
        (err, result) => {
            if(err) {
                res.send(err)
            } else {
                res.send(result)
            }
        }
    )
})
// payment process and divide income to all seller
app.get('/pay', (req, res) => {
    User.findOne(
        {_id: req.headers.id},
        (err, result) => {
            if(err) {
                res.send(err)
            } else {
                let totalPrice = 0
                result.cart.forEach(item => {
                    totalPrice+= item.amount_product * item.price
                });
                if(totalPrice > result.saldo) {
                    res.status(400).json({
                        msg: 'maaf saldo anda tidak cukup'
                    })
                } else {
                    result.cart.forEach(item => {
                        User.findOne(
                            {_id: item.sellerId},
                            (err, result) => {
                                if(err) {
                                    console.log(err)
                                } else {
                                    result.saldo = parseInt(result.saldo) + (parseInt(item.price)*item.amount_product)
                                    User.findOneAndUpdate(
                                        {_id: item.sellerId},
                                        { $set: { saldo: result.saldo }},
                                        (err, response) => {
                                            if(err) {
                                                console.log(err)
                                            } console.log(response)
                                        }
                                    )
                                    // console.log(result.saldo)
                                    // console.log(result)
                                }
                            }
                        )
                    });
                    // subtract user saldo with total price
                    User.findOne(
                        {_id: req.headers.id},
                        (err, result) => {
                            if(err) {
                                console.log(err)
                            } else {
                                User.findOneAndUpdate(
                                    {_id: req.headers.id},
                                    {$set: { saldo: result.saldo - totalPrice }},
                                    (err, response) => {
                                        console.log(err)
                                        console.log(response)
                                    }
                                )
                            }
                        }
                    )
                    res.status(200).json({
                        msg: 'pembayaran sukses, terimakasih telah mempercayai kami'
                    })
                }
            }
        }
    )
})

app.listen(port, _ => {
    console.log('app listen on port', port)
})
var test = mongoose.Types.ObjectId()
// console.log(test)
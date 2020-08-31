const express = require ('express')
const app = express()
const port = 5000
const User = require('./User.model.js')
const mongoose = require('mongoose')
const db = 'mongodb://localhost/ecomm'
const cors = require('cors')

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
    console.log(req.body)
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
        userId: req.headers.id,
        amount_product: 1
    }
    User.findOne(
        { _id: req.headers.id },
        (err, results) => {
            if(err) {
                res.send(err)
            } else {
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

app.listen(port, _ => {
    console.log('app listen on port', port)
})
var test = mongoose.Types.ObjectId()
// console.log(test)
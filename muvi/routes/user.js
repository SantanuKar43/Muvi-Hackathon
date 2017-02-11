var router = require('express').Router(),
    MongoClient = require('mongodb').MongoClient,
    db;

MongoClient.connect("mongodb://localhost:27017/muvi",function(err,database){
    if(err){
        return console.log(err);
    }
    db = database;
    console.log('connected to database');
});

router.get('/admin',function(req,res,next){
    res.render('admin');
});

router.get('/',function(req,res,next){
    res.render('signup');
})

router.get('/dashboard',function(req,res,next){
    if(req.session && req.session.user){
        res.render('dashboard',req.session.user);
    }
});

router.get('/logout',function(req,res,next){
    req.session.reset();
    res.redirect('/');
});

router.post('/login',function(req,res,next){
    var email = req.body.email;
    var pwd = req.body.pwd;
    db.collection('users').findOne({email:email},function(err,user){
        if(!user){
            res.send('User not found');
        }
        else if(user.pwd==pwd){
            req.session.user = user;
            res.redirect('/user/dashboard');
        }
        else{
            res.send('Incorrect Password');
        }
    });
})

router.post('/signup',function(req,res,next){
    var user = {
        email:req.body.email,
        pwd:req.body.pwd,
        name:req.body.name,
        favourites:[],
        history:[] 
    }
    db.collection('users').save(user,function(){
        req.session.user=user;
        res.redirect('/user/dashboard');
    });
    
});

module.exports = router;
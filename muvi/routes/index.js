var express = require('express'),
    router = express.Router();

router.get('/',function(req,res,next){
    res.render('login');
});

module.exports = router;
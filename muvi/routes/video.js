var router = require('express').Router(),
    fs = require('fs'),
    MongoClient = require('mongodb').MongoClient,
    ObjectId = require('mongodb').ObjectID,
    db;

MongoClient.connect("mongodb://localhost:27017/muvi",function(err,database){
    if(err){
        return console.log(err);
    }
    db = database;
    console.log('connected to database');
});


router.get('/',function(req,res,next){
    db.collection('videos').find().toArray(function(err,videos){
        res.json(videos);
    });
});

router.get('/trending',function(req,res,next){
    db.collection('videos').find().sort({views:-1}).toArray(function(err,videos){
        res.json(videos);
    });
});

router.get('/history',function(req,res,next){
    var videos=[];
    db.collection('users').findOne({_id:ObjectId(req.session.user._id)},function(err,user){
        var i;
        for(i=0;i<user.history.length;i++){
             db.collection('videos').findOne({_id:ObjectId(user.history[i])},function(err,video){
                videos.push(video);
            });   
        }
        setTimeout(function(){
            res.json(videos);
        },1000);

    });
});

router.get('/favourites',function(req,res,next){
    var videos=[];
    db.collection('users').findOne({_id:ObjectId(req.session.user._id)},function(err,user){
        for(var i=0;i<user.favourites.length;i++){
            db.collection('videos').findOne({_id:ObjectId(user.favourites[i])},function(err,video){
                videos.push(video);
            });
        }
        setTimeout(function(){
            if(!videos) return res.sendStatus(404);
            res.json(videos);
        },1500);
        
    });
});

router.get('/info/:id',function(req,res,next){
    db.collection('videos').findOne({_id:ObjectId(req.params.id)},function(err,video){
        if(!video) return res.sendStatus(404);
        res.json(video);
    }); 
});

router.post('/upload',function(req,res,next){
    var video = { 
        name:req.body.name,
        fileUrl:'c:/videos/'+req.body.name+'.'+req.files.video.name.substring(req.files.video.name.lastIndexOf('.')+1),
        views:0,
        likes:0
    }
    fs.writeFile(video.fileUrl,req.files.video.data);
    db.collection('videos').save(video,function(){
        res.json(video);
    });
    
});

router.get('/play/:id',function(req,res,next){
    db.collection('videos').findOne({_id:ObjectId(req.params.id)},function(err,video){
        if(!video) res.sendStatus(404);
        var file=video.fileUrl;
        fs.stat(file,function(err,stats){
            if(err){
                res.sendStatus(404);
            }
            var range = req.headers.range;
            var positions = range.replace(/bytes=/,"").split("-");
            var start = parseInt(positions[0]);
            var total = stats.size;
            var end = positions[1] ? parseInt(positions[1],10):total-1;
            var byteSize = (end -start) + 1;
            var maxChunk = 1024 * 1024; // 1MB at a time
            if (byteSize > maxChunk) {
                end = start + maxChunk - 1;
                byteSize = (end - start) + 1;
            }

            res.writeHead(206,{
                'Accept-Ranges':'bytes',
                'Content-Range':'bytes '+start+'-'+end+'/'+total,
                'Content-type':'video/mp4',
                'Content-Length':byteSize
            });

            var stream = fs.createReadStream(file,{start:start,end:end})
            .on('open',function(){
                stream.pipe(res);
            }).on('error',function(err){
                res.send(err);
            });
        });

    });

});

router.get('/views/:id',function(req,res,next){
    var user = req.session.user;
    var watched_video_id = req.params.id;
    console.log(watched_video_id);
    db.collection('users').update({_id:ObjectId(user._id)},{$addToSet:{history:watched_video_id}},function(err,object){        
        if(err) console.log(err);
    });
    db.collection('videos').update({_id:ObjectId(req.params.id)},{$inc:{views:1}});
});

router.get('/player/:id',function(req,res,next){
    if(!req.session.user) return res.redirect('/');
    else{
        db.collection('users').findOne({_id:ObjectId(req.session.user._id)},function(err,user){
            req.session.user = user;
        });
        db.collection('users').update({_id:ObjectId(req.session.user._id)},{$addToSet:{history:req.params.id}},function(err,object){        
            if(err) console.log(err);
        });
    }
    db.collection('videos').findOne({_id:ObjectId(req.params.id)},function(err,video){
        if(!video) return res.sendStatus(404);
        db.collection('videos').update({_id:ObjectId(req.params.id)},{$inc:{views:1}});
        res.render('player',{id:video._id,name:req.session.user.name});
    });
    
});

router.get('/islike/:id',function(req,res,next){
    var video_id = req.params.id;
    var user = req.session.user;
    db.collection('users').findOne({_id:ObjectId(user._id)},function(err,user){
        req.session.user = user;
        if(user.favourites.indexOf(video_id)>=0) res.send('liked');
        else res.send('not liked');
    });
});

router.get('/like/:id',function(req,res,next){
    var user = req.session.user;
    var liked_video_id = req.params.id;
    
    db.collection('users').findOne({_id:ObjectId(user._id)},function(err,user){
        console.log(user.favourites.indexOf(liked_video_id));
        if(user.favourites.indexOf(liked_video_id)>=0){
            db.collection('videos').update({_id:ObjectId(req.params.id)},{$inc:{likes:-1}});
            db.collection('users').update({_id:ObjectId(user._id)},{$pull:{favourites:liked_video_id}});
            res.send('not liked');
        }
        else{
            db.collection('videos').update({_id:ObjectId(req.params.id)},{$inc:{likes:1}});
            db.collection('users').update({_id:ObjectId(user._id)},{$addToSet:{favourites:liked_video_id}});
            res.send('liked'); 
        }
    });

});

module.exports = router;
/**
 * Created by TONNIE on 3/6/2018.
 */
var router = require('express').Router();
var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var Basic = mongoose.model('Basic');
var auth = require('../auth');
var multer = require('multer');

// Preload video objects on routes with ':basic'
router.param('basic', function(req, res, next, slug) {
    Basic.findOne({ slug: slug})
        .populate('author')
        .then(function (basic) {
            if (!basic) { return res.sendStatus(404); }

            req.basic = basic;

            return next();
        }).catch(next);
});

// Post basic account video
router.post('/upload', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if (!user) { return res.sendStatus(401); }

        var basic = new Basic(req.body.basic);

        basic.author = user;

        return basic.save().then(function(){
            console.log(basic.author);
            return res.json({basic: basic.toJSONFor(user)});
        });
    }).catch(next);
});

// Post single video
router.post('/videoUpload', auth.required, function(req, res, next) {
    User.findById(req.payload.id).then(function(user){
        if (!user) { return res.sendStatus(401); }

        var storage = multer.diskStorage({ //multers disk storage settings
            destination: function (req, file, cb) {
                cb(null, './uploads/')
            },
            filename: function (req, file, cb) {
                var datetimestamp = Date.now();
                // cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])

                cb(null, file.originalname)
            },
            path: function () {
                
            }
        });

        var upload = multer({ //multer settings
            storage: storage
        }).single('file');

        upload(req,res,function(err){
            if(err){
                res.json({error_code:1, err_desc:err});
                return;
            }
            res.json({error_code:0, err_desc:null});
        });
    }).catch(next);
});

// Get videos
router.get('/reviews', auth.optional, function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;

    if(typeof req.query.limit !== 'undefined'){
        limit = req.query.limit;
    }

    if(typeof req.query.offset !== 'undefined'){
        offset = req.query.offset;
    }

    User.findById(req.payload.id).then(function(user) {
        if (!user) {
            return res.sendStatus(401);
        }

        Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(results){
            var author = results[0];

            if (author) {
                query.author = author._id;
            }

            return Promise.all([
                Basic.find({ author: user})
                    .limit(Number(limit))
                    .skip(Number(offset))
                    .sort({createdAt: 'desc'})
                    .populate('author')
                    .exec(),
                Basic.count({ author: user}).exec(),
                req.payload ? User.findById(req.payload.id) : null
            ]).then(function (results) {
                var reviews = results[0];
                var reviewsCount = results[1];
                var user = results[2];

                return res.json({
                    reviews: reviews.map(function (review) {
                        return review.toJSONFor(user);
                    }),
                    reviewsCount: reviewsCount
                });
            });
        }).catch(next);
   });
});

module.exports = router;
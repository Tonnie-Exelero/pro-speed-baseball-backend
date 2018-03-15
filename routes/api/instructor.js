/**
 * Created by TONNIE on 3/6/2018.
 */
var router = require('express').Router();
var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var Basic = mongoose.model('Basic');
var auth = require('../auth');
var download = require('download-file');
var path = require('path');

// Preload article objects on routes with ':instructor'
router.param('instructor', function(req, res, next, slug) {
    Basic.findOne({ slug: slug})
        .populate('author')
        .then(function (basic) {
            if (!basic) { return res.sendStatus(404); }

            req.basic = basic;

            return next();
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
                Basic.find(query)
                    .limit(Number(limit))
                    .skip(Number(offset))
                    .sort({createdAt: 'desc'})
                    .populate('author')
                    .exec(),
                Basic.count(query).exec(),
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

// return a video
router.get('/review', auth.optional, function(req, res, next) {
    var query = {};

    if (req.query.slug) {
        query.slug = req.query.slug
    }

    Basic.find({slug: query.slug})
        .populate('author')
        .then(function (results) {
            var review = results[0];
            var user = results[1];

            return res.json({review: review.toJSONFor(user)});
        }).catch(next);
});

// return past video reviews
router.get('/past_reviews', auth.optional, function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;

    if(typeof req.query.limit !== 'undefined'){
        limit = req.query.limit;
    }

    if(typeof req.query.offset !== 'undefined'){
        offset = req.query.offset;
    }

    if (req.query.author) {
        query.author = req.query.author
    }

    return Promise.all([
        Basic.find({name: query.author})
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        Basic.count({name: query.author}).exec(),
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
    }).catch(next);
});

// return pending video reviews
router.get('/pending_reviews', auth.optional, function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;

    if(typeof req.query.limit !== 'undefined'){
        limit = req.query.limit;
    }

    if(typeof req.query.offset !== 'undefined'){
        offset = req.query.offset;
    }

    return Promise.all([
        Basic.find({reviewed: false})
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        Basic.count({reviewed: false}).exec(),
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
    }).catch(next);
});

// return finished video reviews
router.get('/finished_reviews', auth.optional, function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;

    if(typeof req.query.limit !== 'undefined'){
        limit = req.query.limit;
    }

    if(typeof req.query.offset !== 'undefined'){
        offset = req.query.offset;
    }

    return Promise.all([
        Basic.find({reviewed: true})
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        Basic.count({reviewed: true}).exec(),
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
    }).catch(next);
});

// return finished video reviews
router.get('/students', auth.optional, function(req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;

    if(typeof req.query.limit !== 'undefined'){
        limit = req.query.limit;
    }

    if(typeof req.query.offset !== 'undefined'){
        offset = req.query.offset;
    }

    return Promise.all([
        User.find({role: 'Basic_User'})
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        User.count({role: 'Basic_User'}).exec(),
        req.payload ? User.findById(req.payload.id) : null
    ]).then(function (results) {
        var students = results[0];
        var studentsCount = results[1];

        return res.json({
            students: students.map(function (student) {
                return student.toJSON();
            }),
            studentsCount: studentsCount
        });
    }).catch(next);
});

router.get('/download', auth.optional, function(req, res, next) {
    var query = {};

    if (req.query.file) {
        query.file = req.query.file
    }

    var way = path.resolve(".") + '/uploads/' + query.file;

    return res.download(way, query.file); // download function
});

// update video
router.put('/update', auth.required, function(req, res, next) {
    var query = {};

    if (req.query.slug) {
        query.slug = req.query.slug
    }

    User.findById(req.payload.id).then(function(user) {
        if (!user) {
            return res.sendStatus(401);
        }

    Basic.find({slug: query.slug})
        .then(function(results){
        results[0].reviewed = req.body.basic.reviewed;

        results[0].reviewedBy = req.body.basic.reviewedBy;

        results[0].video2 = req.body.basic.video2;

        // var user = results[0].author;

        console.log(results[0]);

        return results[0].save().then(function(review){
            return res.json({review: review.toJSON()});
        }).catch(next);
    });
    });
});

module.exports = router;
/**
 * Created by TONNIE on 3/6/2018.
 */
var router = require('express').Router();
var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var Basic = mongoose.model('Basic');
var Master = mongoose.model('Master');
var auth = require('../auth');

// Preload article objects on routes with ':instructor'
router.param('master', function(req, res, next, slug) {
    Basic.findOne({ slug: slug})
        .populate('author')
        .then(function (basic) {
            if (!basic) { return res.sendStatus(404); }

            req.basic = basic;

            return next();
        }).catch(next);
});

// return month video count
router.get('/this_month', auth.optional, function(req, res, next) {
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
        Basic.find()
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        Basic.count().exec(),
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

// return completed video count
router.get('/completed', auth.optional, function(req, res, next) {
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
            completed: reviews.map(function (review) {
                return review.toJSONFor(user);
            }),
            completedCount: reviewsCount
        });
    }).catch(next);
});

// return instructors
router.get('/instructors', auth.optional, function(req, res, next) {
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
        User.find({role: 'All_Instructor_User'})
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        User.count({role: 'All_Instructor_User'}).exec(),
        req.payload ? User.findById(req.payload.id) : null
    ]).then(function (results) {
        var instructors = results[0];
        var instructorsCount = results[1];

        return res.json({
            instructors: instructors.map(function (instructor) {
                return instructor.toJSON();
            }),
            instructorsCount: instructorsCount
        })
    }).catch(next);
});

// return an instructor
router.get('/singleInstructor', auth.optional, function(req, res, next) {
    var query = {};

    if (req.query.name) {
        query.name = req.query.name
    }

    User.find({username: query.name})
        .populate('author')
        .then(function (results) {
            var instructor = results[0];

            return res.json({instructor: instructor.toJSON()});
        }).catch(next);
});

// return completed video count for single instructor
router.get('/instructorCompleted', auth.optional, function(req, res, next) {
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
        Basic.find({reviewed: true, reviewedBy: query.author}).count()
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        Basic.count({reviewed: true, reviewedBy: query.author}).count().exec(),
        req.payload ? User.findById(req.payload.id) : null
    ]).then(function (results) {
        var reviews = results[0];
        var reviewsCount = results[1];
        var user = results[2];

        return res.json({
            completedCount: reviewsCount
        });
    }).catch(next);
});

// return finished instructor numbers
router.get('/instructorNumbers', auth.optional, function(req, res, next) {
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
        User.find({role: 'Master_User'})
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        User.count({role: 'Master_User'}).exec(),
        req.payload ? User.findById(req.payload.id) : null
    ]).then(function (results) {
        var instructors = results[0];
        var instructorsCount = results[1];

        var inst = instructors.map(function (instructor) {
            return instructor.username;
        });

        for (var i=0; i<inst.length; i++){
            if (inst[i]){
                var ins = inst[i];

                Basic.count({name: ins}, function (err, results) {
                    var reviewsCount = results;

                    // console.log(reviewsCount);

                    // console.log(ins + ': ' + reviewsCount);
                    console.log(ins + ': ' + reviewsCount);

                    return reviewsCount;

                    /*return ({
                     completedCount: reviewsCount
                     });*/
                });

                // console.log(ins + ': ' + count);
            }
        }

        return res.json({
            instructors: instructors.map(function (instructor) {
                return instructor.toJSON();
            }),
            instructorsCount: instructorsCount
        })
    }).catch(next);
});

//Get all users
router.get('/allUsers', auth.optional, function(req, res, next) {
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
        User.find()
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({createdAt: 'desc'})
            .populate('author')
            .exec(),
        User.count().exec(),
        req.payload ? User.findById(req.payload.id) : null
    ]).then(function (results) {
        var users = results[0];
        var usersCount = results[1];

        return res.json({
            users: users.map(function (user) {
                return user.toJSON();
            }),
            usersCount: usersCount
        })
    }).catch(next);
});

router.put('/update', auth.required, function(req, res, next) {
    var query = {};

    if (req.query.id) {
        query.id = req.query.id
    }

    /*User.findById(req.payload.id).then(function(user) {
        if (!user) {
            return res.sendStatus(401);
        }
*/
        User.find({_id: query.id})
            .then(function(results){
                results[0].active = req.body.user.active;

                console.log(results[0]);

                return results[0].save().then(function(user){
                    return res.json({user: user.toProfileJSONFor(user)});
                }).catch(next);
            });
    // });
});

module.exports = router;
/**
 * Created by TONNIE on 3/6/2018.
 */
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var User = mongoose.model('User');

var BasicSchema = new mongoose.Schema({
    slug: {type: String, lowercase: true, unique: true},
    category: String,
    video: Array,
    video2: String,
    notes: String,
    notes2: String,
    name: String,
    reviewed: Boolean,
    reviewedBy: String,
    reviewChecked: Boolean,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {timestamps: true});

BasicSchema.plugin(uniqueValidator, {message: 'is already taken'});

BasicSchema.pre('validate', function(next){
    if(!this.slug)  {
        this.slugify();
    }

    next();
});

BasicSchema.methods.slugify = function() {
    this.slug = (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

BasicSchema.methods.toJSONFor = function(user){
    return {
        slug: this.slug,
        category: this.category,
        video: this.video,
        video2: this.video2,
        notes: this.notes,
        notes2: this.notes2,
        name: this.name,
        reviewed: this.reviewed,
        reviewedBy: this.reviewedBy,
        reviewChecked: this.reviewChecked,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        author: this.author.toProfileJSONFor(user)
    };
};

mongoose.model('Basic', BasicSchema);
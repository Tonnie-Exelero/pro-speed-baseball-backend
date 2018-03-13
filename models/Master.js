/**
 * Created by TONNIE on 3/6/2018.
 */
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var User = mongoose.model('User');

var MasterSchema = new mongoose.Schema({
    slug: {type: String, lowercase: true, unique: true},
    category: String,
    video: String,
    notes: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {timestamps: true});

MasterSchema.plugin(uniqueValidator, {message: 'is already taken'});

MasterSchema.pre('validate', function(next){
    if(!this.slug)  {
        this.slugify();
    }

    next();
});

MasterSchema.methods.slugify = function() {
    this.slug = (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

MasterSchema.methods.toJSONFor = function(user){
    return {
        slug: this.slug,
        category: this.category,
        video: this.video,
        notes: this.notes,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        author: this.author.toProfileJSONFor(user)
    };
};

mongoose.model('Master', MasterSchema);

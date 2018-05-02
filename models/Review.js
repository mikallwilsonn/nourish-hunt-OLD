const mongoose = require( 'mongoose' );
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an Author.'
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must supply a Store.'
    },
    text: {
        type: String,
        required: 'You review must say something.'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
});

function autoPopulate( next ) {
    this.populate( 'author' );
    next();
}

reviewSchema.pre( 'find', autoPopulate );
reviewSchema.pre( 'findOne', autoPopulate );

module.exports = mongoose.model( 'Review', reviewSchema );
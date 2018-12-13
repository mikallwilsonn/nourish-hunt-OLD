const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require( 'md5' );
const validator = require( 'validator' );
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );
const passportLocalMongoose = require( 'passport-local-mongoose' );

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address'],
        require: 'Please supply a valid email address'
    },
    username: {
        type: String,
        trim: true, 
        unique: true,
        required: 'Please supply a username for the account.'
    },
    name: {
        type: String,
        required: 'Please supply a name for the account.',
        trim: true
    },
    profile: {
        type: String,
        trim: true
    },
    social_facebook: {
        type: String,
        trim: true
    },
    social_twitter: {
        type: String,
        trim: true
    },
    social_instagram: {
        type: String,
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [
        { type: mongoose.Schema.ObjectId, ref: 'Store' }
    ],
    role: {
        type: String,
        defualt: 'member'
    }
});

userSchema.virtual( 'gravatar' ).get( function() {
    const hash = md5( this.email );
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin( passportLocalMongoose, { usernameField: 'email' } );
userSchema.plugin( mongodbErrorHandler );

module.exports = mongoose.model( 'User', userSchema );

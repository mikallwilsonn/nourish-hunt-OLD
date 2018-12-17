const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require( 'md5' );
const validator = require( 'validator' );
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );
const passportLocalMongoose = require( 'passport-local-mongoose' );

const inviteSchema = new Schema({
    key: {
        type: String,
        trim: true, 
        unique: true
    },
    email: {
        type: String,
        trim: true,
        unique: true
    },
    request: {
        type: Boolean
    }
});

inviteSchema.plugin( mongodbErrorHandler );
module.exports = mongoose.model( 'Invite', inviteSchema );
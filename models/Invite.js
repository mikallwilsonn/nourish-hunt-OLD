const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );

const inviteSchema = new Schema({
    key: {
        type: String
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
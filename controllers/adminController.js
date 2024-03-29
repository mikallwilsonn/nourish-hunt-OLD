const passport = require( 'passport' );
const crypto = require( 'crypto' );
const mongoose = require( 'mongoose' );
const User = mongoose.model( 'User' );
const Invite = mongoose.model( 'Invite' );
const Store = mongoose.model( 'Store' );
const Review = mongoose.model( 'Review' );
const promisify = require( 'es6-promisify' );
const uuidv5 = require( 'uuid/v5' );
const cloudinary = require( 'cloudinary' );

// ----
// Check if current user is role: admin
exports.isAdminCheck = async ( req, res, next ) => {
    if ( req.user.role === 'admin' ) {
        next();
    } else {
        req.flash( 'error', 'Sorry, you need to be an admin to access this page.' );
        res.redirect( '/' );
        return;
    }
}


// ----
// Display Form to generate invite key
exports.generateInviteKeyForm = ( req, res ) => {
    res.render( 'generateInvite', {
        title: 'Generate new invite key'
    });
}


// ----
// Create invite key from email
exports.createInviteKey = async ( req, res ) => {

    if ( req.user.role === 'admin' ) {

        const user_exists_check = await User.findOne({ email: req.body.email });

        if ( !user_exists_check ){
            const invite_check = await Invite.findOne({ email: req.body.email });

            if ( !invite_check ) {
                const new_key = await uuidv5( req.body.email, uuidv5.URL );
    
                const invite = {
                    key: new_key,
                    email: req.body.email,
                    request: false
                }
    
                const newInvite = new Invite( invite );
                await newInvite.save();
    
                req.flash( 'success', 'You sucessfully created a new invite key.' );
                res.render( 'admin',  {
                    title: 'Admin',
                    invite: invite
                });
                return;
    
            } else {
                req.flash( 'error', `You have already generated a key for this user. Invite key: ${invite_check.key}` );
                res.redirect( 'back' );
                return;
            }
        } else {
            req.flash( 'error', `There is alreadty a user with that email: ${req.body.email}` );
            res.redirect( 'back' );
            return;
        }
    } else {
        req.flash( 'error', 'Sorry. You need to be a user admin to complete this action.' );
        res.redirect( '/' );
        return;
    }

}


// ----
// Display Request Form
exports.requestForm = ( req, res ) => {
    res.render( 'request', {
        title: 'Request An Invite'
    });
}


// ----
// Generate a new invite request
exports.generateRequest = async ( req, res ) => {
    const user_exists_check = await User.findOne({ email: req.body.email });

    if ( !user_exists_check ){
        const invite_check = await Invite.findOne({ email: req.body.email });

        if ( !invite_check ) {

            const invite = {
                key: '',
                email: req.body.email,
                request: true
            }

            const newInvite = new Invite( invite );
            await newInvite.save();

            req.flash( 'success', 'You sucessfully submitted your invite request. You will be notified by email if you\'re request has been accepted.' );
            res.redirect( '/');
            return;

        } else {
            req.flash( 'error', `There is already a pending invite request for this email.` );
            res.redirect( 'back' );
            return;
        }

    } else {
        req.flash( 'error', `There is alreadty a user with that email: ${req.body.email}` );
        res.redirect( 'back' );  
        return;
    }
}


// ----
// Get all invite requests
exports.getInviteRequests = async ( req, res ) => {
    const requests = await Invite.find({ request: true });
    res.render( 'inviteRequests', {
        title: 'Requests For Invite',
        requests: requests
    });
}


// ----
// Accept Invite Request
exports.acceptInviteRequest = async ( req, res ) => {
    const inviteCheck = await Invite.findOne({ _id: req.params.request_id });

    if ( !inviteCheck ) {

        req.flash( 'error', 'An error occured trying to locate the invite.' );
        res.redirect( 'back' );

    } else {

        const new_key = await uuidv5( inviteCheck.email, uuidv5.URL );
    
        const updates = {
            key: new_key,
            email: inviteCheck.email,
            request: false
        }
    
        const invite = await Invite.findOneAndUpdate( 
            { _id: req.params.request_id },
            { $set: updates }, 
            { 
                new: true, 
                runValidators: true, 
                context: 'query' 
            }
        );
    
        req.flash( 'success', 'You sucessfully created a new invite key.' );
        res.redirect( 'back' ); 
    }

}


// ----
// Reject Invite Request
exports.rejectInviteRequest = async ( req, res ) => {
    await Invite.findOneAndDelete({ _id: req.params.request_id });

    req.flash( 'success', 'You sucessfully rejected and deleted the invite request.' );
    res.redirect( 'back' );
}


// ----
// Manage Invites
exports.manageInvites = async ( req, res ) => {
    const invites = await Invite.find({ request: false });
    res.render( 'manageInvites', {
        title: 'Manage Invites',
        invites: invites
    });  
}


// ----
// Manage Users
exports.manageUsers = async ( req, res ) => {
    const users = await User.find();
    res.render( 'manageUsers',  {
        title: 'Manage Users',
        users: users
    });
}


// ----
// Delete User
exports.deleteUser = async ( req, res ) => {

    if ( req.user._id === req.params.user_id ) {
        req.flash( 'error', 'You cannot delete your own account.' );
        res.redirect( 'back' );
        return;
    } else {

        const userToDelete = await User.findOne({ _id: req.params.user_id });

        if ( !userToDelete ) {

            req.flash( 'error', 'There was an error finding the user you are attempting to delete. Please try again.' );
            res.redirect( 'back' );
            return;

        } else {

            await User.findOneAndDelete({ _id: req.params.user_id });
            await Review

            await cloudinary.v2.api.delete_resources( userToDelete.avatar_id,
                function( error, result ) {
                    if ( error ) {
                        req.flash( 'error', 'This users avatar could not be deleted. You will have to go and delete it manually.' );
                    }
                }
            );
    
            req.flash( 'success', `You successfully deleted the user account for ${userToDelete.name}` );
            res.redirect( 'back' );
            return;

        }
    }
}


// ----
// Manage Stores
exports.manageStores = async ( req, res ) => {
    const stores = await Store.find();
    res.render( 'manageStores', {
        title: 'Manage Stores',
        stores: stores
    });
}


// ----
// Delete Store
exports.deleteStore = async ( req, res ) => {

    const storeToDelete = await Store.findOne({ _id: req.params.store_id });

    if ( !storeToDelete ) {

        req.flash( 'error', 'There was an error finding the store you are attempting to delete. Please try again.' );
        res.redirect( 'back' );
        return;

    } else {

        await Store.findOneAndDelete({ _id: req.params.store_id });
        await Review.deleteMany({ store: req.params.store_id });

        await cloudinary.v2.api.delete_resources( storeToDelete.photo_id,
            function( error, result ) {
                if ( error ) {
                    req.flash( 'error', 'This users avatar could not be deleted. You will have to go and delete it manually.' );
                }
            }
        );

        req.flash( 'success', `You successfully deleted the store: ${storeToDelete.name}` );
        res.redirect( 'back' );
        return;

    }
}


// ----
// Manage Reviews
exports.manageReviews = async ( req, res ) => {
    const reviews = await Review
        .find()
        .populate( 'author' )
        .populate( 'store' );

    res.render( 'manageReviews', {
        title: 'Manage Reviews',
        reviews: reviews
    });
} 

// ----
// Delete Reviews
exports.deleteReview = async ( req, res ) => {
    const reviewToDelete = await Review.findOne({ _id: req.params.review_id });

    if ( !reviewToDelete ) {

        req.flash( 'error', 'There was an error finding the review you are attempting to delete. Please try again.' );
        res.redirect( 'back' );
        return;

    } else {

        await Review.findOneAndDelete({ _id: req.params.review_id });

        req.flash( 'success', `You successfully deleted the review.` );
        res.redirect( 'back' );
        return;

    }
}
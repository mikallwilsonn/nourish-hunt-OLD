const passport = require( 'passport' );
const crypto = require( 'crypto' );
const mongoose = require( 'mongoose' );
const User = mongoose.model( 'User' );
const Invite = mongoose.model( 'Invite' );
const promisify = require( 'es6-promisify' );
const uuidv5 = require( 'uuid/v5' );


exports.admin = async ( req, res ) => {
    if ( req.user.role === 'admin' ) {
        res.render( 'admin', {
            title: 'Admin'
        });
    } else {
        req.flash( 'error', 'Sorry, you need to be an admin to access this page.' );
        res.redirect( '/' );
    }
}

exports.createInviteKey = async ( req, res ) => {

    if ( req.user.role === 'admin' ) {

        const user_exists_check = await User.findOne({ email: req.body.email });

        if ( !user_exists_check ){
            const invite_check = await Invite.findOne({ email: req.body.email });

            if ( !invite_check ) {
                const new_key = await uuidv5( req.body.email, uuidv5.URL );
    
                const invite = {
                    key: new_key,
                    email: req.body.email
                }
    
                const newInvite = new Invite( invite );
                await newInvite.save();
    
                req.flash( 'success', 'You sucessfully created a new invite key.' );
                res.render( 'admin',  {
                    title: 'Admin',
                    invite: invite
                });
    
            } else {
                req.flash( 'error', `You have already generated a key for this user. Invite key: ${invite_check.key}` );
                res.redirect( 'back' );
            }
        } else {
            req.flash( 'error', `There is alreadty a user with that email: ${req.body.email}` );
            res.redirect( 'back' );
        }
    } else {
        req.flash( 'error', 'Sorry. You need to be a user admin to complete this action.' );
        res.redirect( '/' );
    }

}


exports.requestForm = ( req, res ) => {
    res.render( 'request', {
        title: 'Request An Invite'
    });
}

exports.generateRequest = async ( req, res ) => {
    const user_exists_check = await User.findOne({ email: req.body.email });

    if ( !user_exists_check ){
        const invite_check = await Invite.findOne({ email: req.body.email });

        if ( !invite_check ) {

            const invite = {
                email: req.body.email,
                request: true
            }

            const newInvite = new Invite( invite );
            await newInvite.save();

            req.flash( 'success', 'You sucessfully submitted your invite request. You will be notified by email if you\'re request has been accepted.' );
            res.redirect( '/');

        } else {
            req.flash( 'error', `There is already a pending invite request for this email.` );
            res.redirect( 'back' );
        }

    } else {
        req.flash( 'error', `There is alreadty a user with that email: ${req.body.email}` );
        res.redirect( 'back' );  
    }
}
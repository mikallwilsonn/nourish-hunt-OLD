const mongoose = require( 'mongoose' );
const User = mongoose.model( 'User' );
const Store = mongoose.model( 'Store' );
const Invite = mongoose.model( 'Invite' );
const promisify = require( 'es6-promisify' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );
const cloudinary = require( 'cloudinary' );


const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: ( req, file, next ) => {
        const isPhoto = file.mimetype.startsWith('image/');
        if( isPhoto ) {
            next( null, true);
        } else {
            next( {message: 'That filetype isn\'t allowed!'}, false );
        }
    }
};

exports.loginForm = ( req, res ) => {
    res.render( 'login', { title: 'Login Form' } );
};

exports.registerForm = ( req, res ) => {
    res.render( 'register', { title: 'Register' } );
};

exports.preRegisterCheckIfExists = async ( req, res, next ) => {

    const invite_check = await Invite.findOne({ key: req.body.key, email: req.body.email });

    if ( !invite_check ) {

        req.flash( 'error', `Sorry, but looks like the invite key or the email you provided was not valid. Please try again or request a new key.` );
        res.render( 'register', {
            title: 'Register',
            body: req.body,
            flashes: req.flash()
        });

    } else {

        const email_check = await User.findOne({ email: req.body.email });

        if ( email_check ) {
            req.flash( 'error', `Sorry, but an account associated with the email ${req.body.email} already exists.` );
            res.render( 'register', {
                title: 'Register',
                body: req.body,
                flashes: req.flash()
            });
        }
    
        const username_check = await User.findOne({ username: req.body.username });
    
        if ( username_check ) {
            req.flash( 'error', `Sorry, but the username '${req.body.username}' already exists.` );
            res.render( 'register', {
                title: 'Register',
                body: req.body,
                flashes: req.flash()
            });
        }
    
        next();

    }

}

exports.validateRegister = ( req, res, next ) => {
    req.sanitizeBody( 'name' );
    req.checkBody( 'name', 'You must supply a name!').notEmpty();
    req.sanitizeBody( 'username' );
    req.checkBody( 'username', 'You must supply a username!').notEmpty();
    req.sanitizeBody( 'profile' );
    req.sanitizeBody( 'social_facebook' );
    req.sanitizeBody( 'social_twitter' );
    req.sanitizeBody( 'social_instagram' );
    req.checkBody( 'email', 'That Email is not valid!').isEmail();
    req.sanitizeBody( 'email' ).normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });

    req.checkBody( 'password', 'Password cannot be blank!').notEmpty();
    req.checkBody( 'password-confirm', 'Confirm Password cannot be empty').notEmpty();
    req.checkBody( 'password-confirm', 'Oops! Your passwords do not match!' ).equals( req.body.password );

    const errors = req.validationErrors();
    if( errors ) {
        req.flash('error', errors.map( err => err.msg ) );
        res.render( 'register', { title: 'Register', body: req.body, flashes: req.flash() });
        return;
    }
    next();
};

exports.getUserAvatar = multer( multerOptions ).single( 'avatar' );
exports.optimizeUserAvatar = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const avatar = await jimp.read( req.file.buffer );
    await avatar.resize( 500, jimp.AUTO );
    await avatar.quality( 80 );

    avatar.getBuffer( req.file.mimetype, function( error, result ) {
        if ( error ) {
            req.flash( 'error', 'Uh oh. There was an error uploading your image. Please try again in a moment.' );
            res.render( 'register', {
                title: 'Register',
                body: req.body,
                flashes: req.flash()
            });
            return;
        }
        req.body.userAvatar_resized = result;
        next();
    });
}
exports.uploadUserAvatar = async ( req, res, next ) => {

    cloudinaryOptions = {
        resource_type: 'image',
        folder: 'nourish-hunt/users',
        user_filename: true, 
        unique_filename: true
    }

    await cloudinary.v2.uploader.upload_stream( cloudinaryOptions, 
        (error, result) => {
            if ( error ) {
                req.flash( 'error', 'Uh oh. There was an error uploading your image. Please try again in a moment.' );
                res.render( 'register', {
                    title: 'Register',
                    body: req.body,
                    flashes: req.flash()
                });
                return;
            }

            req.body.uploadedUserAvatar = result;
            next();
        }
    ).end( req.body.userAvatar_resized );
}


exports.register = async ( req, res, next ) => {
    const user = new User({
        email: req.body.email,
        name: req.body.name,
        username: req.body.username,
        profile: req.body.profile,
        social_facebook: req.body.social_facebook,
        social_twitter: req.body.social_twitter,
        social_instagram: req.body.social_instagram,
        role: 'member',
        avatar: req.body.uploadedUserAvatar.secure_url,
        avatar_id: req.body.uploadedUserAvatar.public_id
    });
    const register = promisify( User.register, User );
    await register( user, req.body.password );

    await Invite.deleteOne({ key: req.body.key });

    next();
};

exports.account = ( req, res ) => {
    res.render( 'account', { title: 'Edit Your Account'} );
}

exports.updateAccount = async ( req, res ) => {
    const updates = {
        name: req.body.name,
        email: req.body.email,
        profile: req.body.profile,
        social_facebook: req.body.social_facebook,
        social_twitter: req.body.social_twitter,
        social_instagram: req.body.social_instagram
    };

    const user = await User.findOneAndUpdate( 
        { _id: req.user._id },
        { $set: updates }, 
        { 
            new: true, 
            runValidators: true, 
            context: 'query' 
        }
    );
    req.flash('success', 'You successfully updated your account! 👊')
    res.redirect('back')
}


exports.optimizeUpdatedUserAvatar = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.resize( 500, jimp.AUTO );
    await photo.quality( 80 );

    photo.getBuffer( req.file.mimetype, function( error, result ) {
        if ( error ) {
            req.flash( 'error', 'Uh oh. There was an error uploading your image. Please try again in a moment.' );
            res.render( 'register', {
                title: 'Register',
                body: req.body,
                flashes: req.flash()
            });
            return;
        }
        req.body.userAvatar_resized = result;
        next();
    });
}
exports.uploadUpdatedUserAvatar = async ( req, res, next ) => {

    cloudinaryOptions = {
        resource_type: 'image',
        folder: 'nourish-hunt/users',
        user_filename: true, 
        unique_filename: true
    }

    await cloudinary.v2.uploader.upload_stream( cloudinaryOptions, 
        (error, result) => {
            if ( error ) {
                req.flash( 'error', 'Uh oh. There was an error uploading your image. Please try again in a moment.' );
                res.render( 'register', {
                    title: 'Register',
                    body: req.body,
                    flashes: req.flash()
                });
                return;
            }

            cloudinary.v2.api.delete_resources( req.user.avatar_id,
                function( error, result ) {
                    console.log( result );
                }
            );

            req.body.uploadedUserAvatar = result;
            next();
        }
    ).end( req.body.userAvatar_resized );
}

exports.saveNewUserAvatar = async ( req, res ) => {
    const updates = {
        avatar: req.body.uploadedUserAvatar.secure_url,
        avatar_id: req.body.uploadedUserAvatar.public_id 
    }

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        {
            new: true, 
            runValidators: true,
            context: 'query'
        }
    );

    req.flash( 'success', 'You successfully uploaded a new avatar.' );
    res.redirect( 'back' );

}


// ----
// Browse Users
exports.getUsers = async ( req, res ) => {
    const page = req.params.page || 1;
    const limit = 6;
    const skip = ( page * limit ) - limit;

    const usersPromise = User
        .find()
        .skip( skip )
        .limit( limit )
        .sort( {created: 'desc'} );

    const countPromise = User.count();

    const [users, count] = await Promise.all([usersPromise, countPromise]);

    const pages = Math.ceil( count / limit );
    if( !users.length && skip ) {
        req.flash( 'info', `Hey! You requested ${page}. But, that doesn't exist. Here is the final page currently available: Page ${pages}`);
        res.redirect( `/users/page/${pages}` );
        return;
    }

    res.render( 'users', { title: 'Users', users, page, pages, count } );
}


// ----
// Get User
exports.getUser = async ( req, res ) => {
    const account = await User.findOne({ username: req.params.username });

    if ( !account ) {
        req.flash( 'error', 'Sorry, could there was an issue finding stores for that user. Please double check the URL you are visiting and try again in a moment.' );
        res.redirect( '/' );
    }

    const stores = await Store.find({ author: account._id });

    if ( !stores ) {
        req.flash( 'error', 'Sorry, no stores could be located for that user.' );
        res.redirect( '/' );
    }

    res.render( 'user', {
        title: `Locations hunted by ${account.name}`,
        account: account,
        stores: stores
    });
}
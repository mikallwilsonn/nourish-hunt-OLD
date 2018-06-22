const mongoose = require( 'mongoose' );
const User = mongoose.model( 'User' );
const promisify = require( 'es6-promisify' );

exports.loginForm = ( req, res ) => {
    res.render( 'login', { title: 'Login Form' } );
};

exports.registerForm = ( req, res ) => {
    res.render( 'register', { title: 'Register' } );
};

exports.validateRegister = ( req, res, next ) => {
    req.sanitizeBody( 'name' );
    req.checkBody( 'name', 'You must supply a name!').notEmpty();
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

exports.register = async ( req, res, next ) => {
    const user = new User({
        email: req.body.email,
        name: req.body.name,
        profile: req.body.profile,
        social_facebook: req.body.social_facebook,
        social_twitter: req.body.social_twitter,
        social_instagram: req.body.social_instagram
    });
    const register = promisify( User.register, User );
    await register( user, req.body.password );
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

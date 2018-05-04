const mongoose = require( 'mongoose' );
const Store = mongoose.model( 'Store' );
const User = mongoose.model( 'User' );
const Review = mongoose.model( 'Review' );

exports.home = async ( req, res ) => {
    //1. Query the database for a list of all stores
    const storesPromise = Store
        .find()
        .limit( 4 )
        .sort( {created: 'desc'} );

    const countPromise = Store.count();

    const numOfStores = Store.count({}, function(err, count) {
        if ( err || undefined ) {
            console.log(numOfStores);
            return 'N/A';
        }
        return count;
    });
    const numOfReviews = Review.count({}, function(err, count) {
        if ( err || undefined) {
            console.log(numOfReviews);
            return 'N/A';
        }

        return count;
    });
    const numOfUsers = User.count({}, function(err, count) {
        if ( err || undefined ) {
            console.log(numOfUsers);
            return 'N/A';
        }

        return count;
    });

    const [stores, count, storesNum, reviewsNum, usersNum] = await Promise.all([storesPromise, countPromise, numOfStores, numOfReviews, numOfUsers]);

    res.render( 'home', { title: 'Home', stores, storesNum, reviewsNum, usersNum } );
};
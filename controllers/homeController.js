const mongoose = require( 'mongoose' );
const Store = mongoose.model( 'Store' );
const User = mongoose.model( 'User' );

exports.home = async ( req, res ) => {
    //1. Query the database for a list of all stores
    const storesPromise = Store
        .find()
        .limit( 4 )
        .sort( {created: 'desc'} );

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    res.render( 'home', { title: 'Home', stores} );
};
const mongoose = require( 'mongoose' );
const Store = mongoose.model( 'Store' );
const User = mongoose.model( 'User' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );
const uuid = require( 'uuid' );
const cloudinary = require( 'cloudinary' );

const mbxGeocoding = require( '@mapbox/mapbox-sdk/services/geocoding' );
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_KEY });

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

exports.homePage = ( req, res ) => {
    console.log(req.name);
    res.render( 'index' );
};

exports.addStore = ( req, res ) => {
    res.render( 'editStore', { title: 'Add Store' } );
};

/* -- OLD IMAGE UPLOAD */
exports.upload = multer( multerOptions ).single( 'photo' );

exports.resize = async ( req, res, next ) => {
    // check if there is no new file
    if( !req.file ) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`; 
    // Now we resize
    const photo = await jimp.read( req.file.buffer );
    await photo.resize( 800, jimp.AUTO );
    await photo.write(`./public/uploads/${req.body.photo}`);
    // Once we have written the photo to our filesystem, keep going...
    next();
};
/* -- */


exports.getStoreCover = multer( multerOptions ).single( 'photo' );
exports.optimizeStoreCover = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.resize( 800, jimp.AUTO );
    await photo.quality( 80 );
    //const photoMIME = photo.getMIME();

    photo.getBuffer( req.file.mimetype, function( error, result ) {
        if ( error ) {
            req.flash( 'error', 'Uh oh. There was an error uploading your image. Please try again in a moment.' );
            res.render( 'editStore', {
                title: 'Add Store',
                body: req.body,
                flashes: req.flash()
            });
            return;
        }
        req.body.storeCover_resized = result;
        next();
    });
}

exports.uploadStoreCover = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    cloudinaryOptions = {
        resource_type: 'image',
        folder: 'nourish-hunt/stores',
        user_filename: true, 
        unique_filename: true
    }

    await cloudinary.v2.uploader.upload_stream( cloudinaryOptions, 
        (error, result) => {
            if ( error ) {
                req.flash( 'error', 'Uh oh. There was an error uploading your image. Please try again in a moment.' );
                res.render( 'editStore', {
                    title: 'Add Store',
                    body: req.body,
                    flashes: req.flash()
                });
                return;
            }

            req.body.uploadedStoreCover = result;
            next();
        }
    ).end( req.body.storeCover_resized );
}

exports.createStore = async ( req, res ) => {

    let storeCover;
    let storeCover_id;

    if ( req.body.uploadedStoreCover ) {
        storeCover = req.body.uploadedStoreCover.secure_url;
        storeCover_id = req.body.uploadedStoreCover.public_id;
    } else {
        storeCover = '/images/photos/defaultStoreCover.jpg';
        storeCover_id = 'default';
    }

    let match;
    await geocodingClient
        .forwardGeocode({
            query: req.body.location_address
    })
    .send()
    .then( response => {
        match = response.body;
    })
    .catch((error) => {
        if ( error ) {
            req.flash( 'error', 'Uh oh. An error has occured. Please wait a moment then try again..' );
            res.render( 'editStore', {
                title: 'Add Store',
                body: req.body,
                flashes: req.flash()
            });
            return;
        }
    });

    req.body.location = {
        coordinates: match.features[0].geometry.coordinates,
        address: req.body.location_address
    }

    req.body.photo = storeCover;
    req.body.photo_id = storeCover_id;
    req.body.author = req.user._id;
    
    const store = await (new Store( req.body )).save();
    await store.save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect( `/stores/${store.slug}` );
};


exports.createTest = async ( req, res ) => {
    let storeCover;
    let storeCover_id;

    if ( req.body.uploadedStoreCover ) {
        storeCover = req.body.uploadedStoreCover.secure_url;
        storeCover_id = req.body.uploadedStoreCover.public_id;
    } else {
        storeCover = '/images/photos/defaultStoreCover.jpg';
        storeCover_id = 'default';
    }

    let match;
    
    await geocodingClient
        .forwardGeocode({
            query: req.body.location
    })
    .send()
    .then( response => {
        match = response.body;
    })
    .catch((error) => {
        match = error;
    });


    req.body.geocode_match = match;

    req.body.photo = storeCover;
    req.body.photo_id = storeCover_id;
    req.body.author = req.user._id;

    req.body.coordinates = match.features[0].geometry.coordinates;

    const the_dump = req.body;

    res.render( 'dump', { the_dump });
}

exports.getStores = async ( req, res ) => {
    const page = req.params.page || 1
    const limit = 6;
    const skip = (page * limit) - limit;

    //1. Query the database for a list of all stores
    const storesPromise = Store
        .find()
        .skip( skip )
        .limit( limit )
        .sort( {created: 'desc'} );

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil( count / limit );
    if(!stores.length && skip) {
        req.flash('info', `Hey! You requested page ${page}. But, that doesn't exists. Here is the final page currently available: Page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render( 'stores', { title: 'Stores', stores, page, pages, count } );
};


const confirmOwner = ( store, user) => {
    if ( !store.author.equals(user._id) ) {
        throw Error('error', 'You must own THE store in order to edit it.' );
    }
};

exports.editStore = async ( req, res ) => {
    //1. Find the store given the id
    const store = await Store.findOne( { _id: req.params.id } );
    //2. Confirm they are the owner of the store
    confirmOwner( store, req.user );
    //3. Render out the edit form so the user can update it
    res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async ( req, res ) => {
    // Set the location data to be a pount
    req.body.location.type = 'Point';
    //find and update store
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, { 
        new: true, // return the new store instead of old
        runValidators: true, 
    }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store -></a>`);
    res.redirect( `/stores/${store.slug}` );
    // redirect to store and tell them it worked
}

exports.getStoreBySlug = async ( req, res, next ) => {
    const store = await Store.findOne( { slug: req.params.slug } ).populate( 'author reviews' );
    if( !store ) return next();
    res.render('store', {store, title: store.name})
}

exports.getStoresByTag = async ( req, res, next ) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true }
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find( { tags: tagQuery } );
    const [tags, stores] = await Promise.all( [tagsPromise, storesPromise] );
    res.render('tag', { tags, title: 'Tags', tag, stores} );
};

exports.searchStores = async ( req, res ) => {
    const stores = await Store
    // first find the stores
    .find({
        $text: {
            $search: req.query.q,   
        }
    }, {
        score: { $meta: 'textScore' }
    })
    // then sort them
    .sort({
        score: { $meta: 'textScore' }
    })
    // Only show top 5 results
    .limit(10);
    res.json( stores );
};

exports.mapStores = async ( req, res ) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point', 
                    coordinates
                },
                //$maxDistance: 10000 // 10km radius
            }
        }
    }

    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json( stores );
};


exports.mapPage = ( req, res ) => {
    res.render( 'map', { title: 'Map' } );
};

exports.heartStore = async ( req, res ) => {
    const hearts = req.user.hearts.map( obj => obj.toString());
    const operator = hearts.includes( req.params.id ) ? `$pull` : `$addToSet`;
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { [operator]: { hearts: req.params.id}},
        { new: true } 
    );
    res.json(user);
};

exports.getHearts = async ( req, res ) => {
    const stores = await Store.find({
        _id: { $in: req.user.hearts }
    });
    res.render('stores', { title: 'Hearted Stores', stores});
};

exports.getTopStores = async ( req, res ) => {
    const stores = await Store.getTopStores();
    res.render( 'topStores', { stores, title: 'Highest Rated Stores!' } );
};
const express = require( 'express' );
const router = express.Router();
const homeController = require( '../controllers/homeController' );
const storeController = require( '../controllers/storeController' );
const userController = require( '../controllers/userController' );
const authController = require( '../controllers/authController' );
const reviewController = require( '../controllers/reviewController' );
const adminController = require( '../controllers/adminController' );

const { catchErrors } = require( '../handlers/errorHandlers' );

//router.get( '/', catchErrors( storeController.getStores ) );
router.get( '/', catchErrors( homeController.home ));
router.get( '/stores', catchErrors( storeController.getStores ) );
router.get( '/stores/page/:page', catchErrors( storeController.getStores ) );
router.get( '/add', 
    authController.isLoggedIn,
    storeController.addStore 
);


router.post( '/add',
    storeController.getStoreCover,
    catchErrors( storeController.optimizeStoreCover ),
    catchErrors( storeController.uploadStoreCover ),
    catchErrors( storeController.createStore )
);

//router.post( '/add', storeController.createTest );


router.post( '/add/:id', 
    storeController.upload,
    catchErrors( storeController.resize ),
    catchErrors( storeController.updateStore ) 
);

router.get( '/stores/:id/edit', catchErrors( storeController.editStore ) );

router.get( '/stores/:slug', catchErrors( storeController.getStoreBySlug ) );

router.get( '/tags', catchErrors( storeController.getStoresByTag ) );
router.get( '/tags/:tag', catchErrors( storeController.getStoresByTag ) );

// Users
router.get( '/login', userController.loginForm );
router.post( '/login', authController.login );

router.get( '/register', userController.registerForm );

// 1. Validate the registration data
// 2. Register the user
// 3. We need to log them in
router.post( '/register', 
    userController.preRegisterCheckIfExists,
    userController.validateRegister,
    userController.register,
    authController.login
);

router.get('/logout', authController.logout );

router.get( '/account', 
    authController.isLoggedIn, 
    userController.account 
);

router.post( '/account', catchErrors( userController.updateAccount ) );
router.post( '/account/forgot', catchErrors( authController.forgot ) );
router.get( '/account/reset/:token', catchErrors( authController.reset ) );

router.post( '/account/reset/:token', 
    authController.confirmedPasswords,
    catchErrors( authController.update )
);

router.get( '/hearts', 
    authController.isLoggedIn, 
    catchErrors( storeController.getHearts )
);

router.post( '/reviews/:id', 
    authController.isLoggedIn, 
    catchErrors( reviewController.addReview )
);

router.get( '/top', catchErrors( storeController.getTopStores ));

// ----
// Browse Users
router.get( '/users', catchErrors( userController.getUsers ) );
router.get( '/users/page/:page', catchErrors( userController.getUsers ) );

router.get( '/users/@:username', catchErrors( userController.getUser ));


// ----
// Admin
router.get( '/admin', catchErrors( adminController.admin ));
router.post( '/create-invite-key', catchErrors( adminController.createInviteKey ));

/* 
    API endpionts
*/

router.get( '/api/search', catchErrors( storeController.searchStores ));
router.get( '/api/stores/near', catchErrors( storeController.mapStores ));
router.post( '/api/stores/:id/heart', catchErrors( storeController.heartStore ));

module.exports = router;

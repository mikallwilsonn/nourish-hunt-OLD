const mongoose = require( 'mongoose' );

// import environmental variables from our variables.env file
require( 'dotenv' ).config({ path: 'variables.env' });

// Connect to our Database and handle any bad connections
mongoose.connect( process.env.DATABASE, { useNewUrlParser: true });
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on( 'error', ( err ) => {
  console.error( `🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// READY?! Let's go!

// Import all of our models
require( './models/Store' );
require( './models/User' );
require( './models/Review' );
require( './models/Invite' );


// Start our app!
const app = require( './app' );
app.set( 'port', process.env.PORT || process.env.PORT_LOCAL );
const server = app.listen( app.get( 'port' ), () => {
  console.log( `Express running → PORT ${server.address().port}` );
});

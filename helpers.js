/*
  This is a file of data and helper functions that we can expose and use in our templating function
*/

// FS is a built in module to node that let's us read files from the system we're running on
const fs = require( 'fs' );

// moment.js is a handy library for displaying dates. We need this in our templates to display things like "Posted 5 minutes ago"
exports.moment = require( 'moment' );

// Dump is a handy debugging function we can use to sort of "console.log" our data
exports.dump = ( obj ) => JSON.stringify( obj, null, 2 );

// Making a static map is really long - this is a handy helper function to make one
exports.staticMap = ([lng, lat]) => `https://api.mapbox.com/styles/v1/mapbox/streets-v10/static/pin-m-marker+ff3b00(${lng},${lat})/${lng},${lat},16.0,0,0/800x250@2x?access_token=${process.env.MAPBOX_KEY}`;


// inserting an SVG
exports.icon = ( name ) => fs.readFileSync( `./public/images/icons/${name}.svg` );

// Some details about the site
exports.siteName = `Nourish Hunt`;

exports.menu = [
  { slug: '/stores', title: 'Stores', icon: 'spoon-knife2', },
  { slug: '/users', title: 'Users', icon: 'users'},
  { slug: '/tags', title: 'Tags', icon: 'tags', },
  { slug: '/top', title: 'Top', icon: 'trophy', },
  { slug: '/add', title: 'Add', icon: 'plus-square', }
];


// Time Formatting
const moment = require( 'moment' );
exports.formatTime = ( date ) => moment( date ).format( 'dddd, MMMM Do YYYY' );


// Line breaks
exports.lineBreaks = ( text ) => {
  text = text.replace( /(\r\n|\n|\r)/gm, '<br />' );
  return text;
}


// Trim String
exports.trimString = ( passedString, limit ) => {
  passedString = passedString.toString();
  let trimmedString = passedString.substring( 0, limit );

  if ( passedString.length >= limit ) {
    trimmedString = trimmedString + '...';
  }

  return trimmedString;
}
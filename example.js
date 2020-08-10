
const moment = require('moment');
const turf = require('@turf/turf');

const { generateIndexOfTiles, query } = require('./index.js');

const bboxOfRandomizedPoints = [ 5.9559, 45.818, 10.4921, 47.8084 ];    // Swiss
//const bboxOfRandomizedPoints = [ -5.47, 41.18, 10.49, 51.23 ];          // France
//const bboxOfRandomizedPoints = [ -180, -90, 180, 90 ];                  // World
const numberOfRandomizedPoints = 500;
const randomizedPoints = turf.randomPoint( numberOfRandomizedPoints, { bbox: bboxOfRandomizedPoints } ).features;
/*
const randomizedPoints = [
    {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [ 6.86440, 45.83250 ],
        },
        properties: {
            name: "top of Mont Blanc"
        },
    },
];*/

/**
 * Test
 */
generateIndexOfTiles()
    .then(() => {
        randomizedPoints.forEach( async ( point ) => {
            const startOfQuery = moment().valueOf();
            const elevation = await query( point.geometry.coordinates[ 0 ], point.geometry.coordinates[ 1 ] );
            const endOfQuery = moment().valueOf();
            console.log( ( endOfQuery - startOfQuery ) + " ms | " + elevation + " meters", point.geometry.coordinates.join( ", " ) );
        });
    });
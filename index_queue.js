const { exec } = require('child_process');
const DemReader = require('dem-reader');
const turf = require('@turf/turf');
const path = require('path');
const fs = require('fs');
const asyncJS = require('async');

//const pathToData = "./data/GTOPO30/";

//const pathToData = "./data/GMTED2010/";
const pathToData = "/dataset/";
const concurrentTasks = 25;

module.exports = {


    /**
     * Pool
     */
    pool: asyncJS.queue(( task, taskCallback ) => {
        const tile = module.exports.getTheTile( module.exports.tiles, task.longitude, task.latitude );
        const cmd = "gdallocationinfo " + pathToData + tile.file + " -wgs84 " + task.longitude + " " + task.latitude;
        exec( cmd, ( err, stdout, stderr ) => {
            if ( err ) {
                console.error( 'exec error: ' + err );
                return;
            }
            const splittedAltitudeRow = stdout.split( "\n" )[ 3 ];
            const splittedAltitudeValue = splittedAltitudeRow ? splittedAltitudeRow.split( ": " )[ 1 ] : null;
            if ( !splittedAltitudeValue ) {
                return taskCallback( null );
            }
            return taskCallback( !isNaN( Number( splittedAltitudeValue ) ) ? Number( splittedAltitudeValue ) : null );
        });
    }, concurrentTasks ),


    /**
     * Preloaded tiles
     */
    tiles: [],

    /**
     * Qury elevation in tiles
     */
    query: ( longitude, latitude, outputProjection = "EPSG:4326" ) => {
        return new Promise(( resolve, reject ) => {
            if (
                longitude === null || longitude === undefined
                || latitude === null || latitude === undefined
                || isNaN( longitude ) || isNaN( latitude )
            ) {
                return resolve( null );
            }
            module.exports.pool.push({ longitude, latitude }, ( output ) => {
                console.log( "output:", output );
                resolve( output );
            });
        });
    },

    /**
     * Get the tile that contain elevation of target coordinates
     */
    getTheTile: ( tiles, longitude, latitude ) => {
        if (
            !tiles
            || !Array.isArray( tiles )
            || ( Array.isArray( tiles ) && tiles.length === 0 )
            //
            || longitude === null || longitude === undefined
            || latitude === null || latitude === undefined
            || isNaN( longitude ) || isNaN( latitude )
        ) {
            return null;
        }
        const point = turf.point( [ longitude, latitude ] );
        for ( const tile of tiles ) {
            const intersect = turf.booleanPointInPolygon( point, tile.geojsonOfBbox );
            if ( intersect === true ) {
                return tile;
            }
        }
        return null;
    },

    /**
     * Prepare the tiles
     */
    //GMTED2010
    //generateIndexOfTiles: async ( pathToFiles = "./data/GTOPO30", ignoreFiles = [ "gt30antarcps.tif" ], showErrors = false ) => {
    generateIndexOfTiles: async ( pathToFiles = pathToData, ignoreFiles = [], showErrors = false ) => {
        return new Promise(( resolve, reject ) => {
            const files = fs.readdirSync( pathToFiles );
            let countTotalFiles = files.length;
            let countProcessedFiles = 0;
            files.forEach( async ( file ) => {
                if ( !ignoreFiles.includes( file ) ) {
                    const pathToFile = path.join( pathToFiles, file );
                    let dem = null;
                    try {
                        dem = await DemReader.fromFile( pathToFile );
                        const bbox = dem._image.getBoundingBox();
                        const tilePayload = {
                            bbox: bbox,
                            geojsonOfBbox: turf.bboxPolygon( bbox ),
                            file: file,
                            name: file.replace( ".tif", "" ),
                        };
                        module.exports.tiles.push( tilePayload );
                    }
                    catch( demError ) {
                        if ( showErrors === true ) {
                            console.error( "demError:", demError );
                        }
                    }
                    countProcessedFiles += 1;
                    if ( countTotalFiles === countProcessedFiles ) {
                        resolve( module.exports.tiles );
                    }
                } else {
                    countTotalFiles -= 1;
                }
            });
        });
    },

};
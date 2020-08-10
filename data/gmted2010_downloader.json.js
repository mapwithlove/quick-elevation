const fs = require('fs');
const async = require('async');
const axios = require('axios').default;

const { features } = require("./gmted2010_catalogue.js");
const baseOfRessources = "https://edcintl.cr.usgs.gov/downloads/sciweb1/shared/topo/downloads/GMTED/";

const tasks = [];
let countDownloads = 0;

features.forEach(( feature ) => {
    const bboxPolygon = feature.geometry.rings;
    const pathTo300ArcSeconds = feature.attributes.MAX300;

    if ( pathTo300ArcSeconds && pathTo300ArcSeconds !== " " ) {
        const url = baseOfRessources + pathTo300ArcSeconds;
        const fileName = url.split( "/" ).slice( -1 )[ 0 ];

        countDownloads += 1;

        tasks.push(( callback ) => {
            axios({
                method: "get",
                url: url,
                responseType: "stream"
            })
            .then(( response ) => {
                const stream = response.data.pipe( fs.createWriteStream( "./GMTED2010/" + fileName ) );
                stream.on( "finish", () => {
                    console.log( "========================================" );
                    console.log( "DOWNLOADED FILE:", fileName );
                    callback( null, fileName );
                });
            })
            .catch(( error ) => {
                console.log( "========================================" );
                console.error( "DOWNLOAD ERROR ON FILE:", fileName );
                console.error( "ERROR:", error );
                callback( error, null );
            })
        });

    }
});

const processingTasks = ( t, p ) => {
    async.parallelLimit( t, p, ( err, results ) => {
        // the results array will equal ['one','two'] even though
        // the second function had a shorter timeout.
    });
}

setTimeout(() => {
    console.log( "START DOWNLOADS..." );
    processingTasks( tasks, 2 );
}, 1000 * 10 );
const Path = require('path');
const Hapi = require('hapi');
const Joi = require('joi');
const Inert = require('inert');
const Vision = require('vision');
const Handlebars = require('handlebars');

const server = Hapi.server({
    port: 3000,
    routes: {
        files: {
            relativeTo: Path.join(__dirname, 'public')
        }
    }
});

const start = async () => {
    await server.register(Inert);
    await server.register(Vision);

    server.views({
        engines: { 
            hbs: Handlebars },
        relativeTo: Path.join(__dirname, 'templates'),
        isCached: false,
        partialsPath: 'partials',
        helpersPath: 'helpers',
        layout:true      

    });

    server.route({
        method: 'POST',
        path: '/login',
        handler: (request, h) => {
            return h.view('/login')
        }
    });

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                index: true
            }
        }
    });

    await server.start();
    console.log("Hapi is running on port", server.info.uri);
};

start();
const cds = require('@sap/cds');
const debug = require('debug')('srv:server');
const odatav2adapterproxy = require('@sap/cds-odata-v2-adapter-proxy');

cds.on('bootstrap', app => app.use((req, res, next) => {
    app.use(odatav2adapterproxy());
    next();
}));


module.exports = cds.server;
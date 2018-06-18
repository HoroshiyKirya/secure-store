const app   = require('../app');
const debug = require('debug')('securestore:server');
const http  = require('http');

const mongo_cfg   = require('../config/db')
const MongoClient = require('mongodb').MongoClient;
const DataBase    = require('../db')
///////////////////////////////////////////////////////////////////////////////////

function normalizePort(val) { var port = parseInt(val, 10); if (isNaN(port)) { return val; } if (port >= 0) { return port; } return false;} 
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var server = http.createServer(app);

MongoClient.connect(mongo_cfg.url, (err, client) => {
  if (err) return console.log('DB connect error: ', err)

  const db = new DataBase({ client, name: 'securestore' })
  app.use('/api', require('../routes/api')(app, db))
  require('../config/passport')(app, db)

  server.listen(port, () => console.log('Listening on ' + port))
})





///////////////////////////////////////////////////////////////////////////////////
server.on('error', onError);
function onError(error) {
  if (error.syscall !== 'listen') { throw error; }
  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {  // handle specific listen errors with friendly messages
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
server.on('listening', onListening);
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

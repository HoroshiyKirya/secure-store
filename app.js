const createError   = require('http-errors')
const express       = require('express')
const path          = require('path')
const cookieParser  = require('cookie-parser')
const bodyParser    = require('body-parser')
const logger        = require('morgan')
const history       = require('connect-history-api-fallback')
const cors          = require('cors')
const session       = require('express-session')
const passport      = require('passport')

const app = express()

app.use(history({ rewrites: [
  {from:/^\/api\//, to: context => context.parsedUrl.pathname },
  {from:/^\/uploads\//, to: context => context.parsedUrl.pathname },
]}))
app.use(cors())
app.use(session({ secret: 'uzdhgudthghdzg', resave: true, saveUninitialized: true, }))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
//app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'html')
//app.use(logger('dev'));
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'dist')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;  // set locals, only providing error in development
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);   // render the error page
  res.render('error');
});

module.exports = app;
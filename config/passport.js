const passport      = require('passport')
const LocalStrategy = require('passport-local')

//https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
//https://github.com/jaredhanson/passport-local
module.exports = function (app, db) {
  passport.serializeUser((user, done) => {
    done(null, user.login)
  })
  passport.deserializeUser((login, done) => {
    db.models.user.findByLogin(login, res => {
      if(res) {
        let user = { ...res }
        delete user.password
        done(null, user)
      }
      else done(err, null)
      //if (err) done(err, null)
      //else done(null, user)
    })
  })
  passport.use(new LocalStrategy({ usernameField: 'login', passwordField:'password' },(login, password, done) =>
    db.models.user.findByLogin(login, res => {
      if(res === null) return done(null, false)
      else return db.models.user.assertPasswords(password, res.password) ? done(null, res) : done(null, false)
    })
  ))
}
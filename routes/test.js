var express = require('express');
var router = express.Router();
var User = require('../models/index').User;

router.get('/', function(req, res) {
  if (!req.loggedIn) {
    res.redirect('/loggedout');
    return;
  }

  var sessionUser = req.session.auth.google.user;

  User.findOne({ where: { googleId: sessionUser.id } })
    .then(function(user, err) {
      var toSend = [];
      toSend.push({ name: 'nodebot' });
      toSend.push({ name: user.email });
      console.log('sending bots '+ toSend);
      res.render('test', {
        bots: toSend,
      });
  });
});

module.exports = router;

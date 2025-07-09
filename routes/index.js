var express = require('express');
var router = express.Router();
const userModel = require('./users');
const passport = require('passport');
const localStreategy = require('passport-local')
const upload = require('./multer')
const postModel = require('./post')

passport.use(new localStreategy(userModel.authenticate()))
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {nav: false});
});
router.get('/register', function(req, res){
  res.render('register', {nav: false});
})
router.get('/profile', isLoggedIn ,async function(req, res){
  const user = await userModel
              .findOne({username: req.session.passport.user})
              .populate("posts")
  res.render("profile", {user, nav: true})
})
router.get('/show/posts', isLoggedIn ,async function(req, res){
  const user = await userModel
              .findOne({username: req.session.passport.user})
              .populate("posts")
  res.render("show", {user, nav: true})
})
router.get('/feed', isLoggedIn ,async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user})
 const posts = await postModel.find().populate("user")

 res.render('feed', {user, posts, nav: true})
})
router.get('/add', isLoggedIn ,async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user})
  // res.send(user)
  res.render("add", {user, nav: true})
})
router.post('/createpost', isLoggedIn , upload.single("postimage"),async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  })

  user.posts.push(post._id)
  await user.save()
  res.redirect('/profile')

})

router.post('/register', function(req, res){
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
    name: req.body.name,


  })
  userModel.register(data, req.body.password).then(function(){
    passport.authenticate("local")(req, res, function(){
      res.redirect('/profile')
    })
  })
})
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err); // handle technical error
    }
    if (!user) {
      return res.render('index', { error: 'Invalid username or password', nav: false }); // show custom error
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err); // handle login error
      }
      return res.redirect('/profile');
    });
  })(req, res, next);
});


router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next()
  }
  res.redirect("/")
}

router.post("/fileupload", isLoggedIn, upload.single('image'), async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/profile");
  } catch (err) {
    next(err); // proper error handling
  }
});


module.exports = router;

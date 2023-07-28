var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    flash        = require("connect-flash")
    User        = require("./models/user"),
    session = require("express-session"),
    methodOverride = require("method-override");
	router = express.Router(),
	MongoClient = require("mongodb").MongoClient;
    axios = require('axios');
    cors = require('cors');

mongoose.Promise = global.Promise;

mongoose.connect("mongodb+srv://danish:jRRyezykn9p1zYwo@conf-mate.shxow.mongodb.net/findr?retryWrites=true&w=majority",{useNewUrlParser: true ,useUnifiedTopology: true });

const hereApiKey = '2eVNeWl1rYoEXMchyVmcQVuHRThuwUQArC9fB_3WtD8';

app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));

app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Hello, welcome to Findr",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});


app.get("/", function(req,res){
    res.render("landing")
});

app.get("/login", function(req,res){
	res.render("login");
})

app.post("/login", passport.authenticate("local", 
    {
        successRedirect: ("/location"),
        failureRedirect: "/login" 
    }), function(req, res){
});

app.get("/signup",function(req,res){
	res.render("signup");
})

app.post("/signup",function(req,res){
	 var newUser = new User({username: req.body.username});
     User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
			req.flash("error","User already exists with given username");
            return res.render("signup");
        }
        req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
		res.redirect("/login");
    });
})

app.get("/location", function(req, res) {
	if(req.isAuthenticated())
	{
		var user = req.user;
		res.render("location", {user:user})
	}
	else
	{
		req.flash("error", "You must be signed in to do that!");
		res.redirect("/login");
	}
});


app.get('/restaurants', async (req, res) => {
    User.findOne({ username: req.user.username })
    .exec()
    .then((user) => {
        if (!user) {
            console.log('User not found.');
        } else {
            const { lat, lng } = req.query;

            var newLocation = lat +" "+lng 

            var maxLocations = 10;
            if (user.location.length >= maxLocations) {
                user.location.shift();
            }

            user.location.push(newLocation);

            return user.save();
        }
    })
    .then(() => {
        console.log('Location appended successfully!');
    })
    .catch((err) => {
        console.log('Error:', err);
    });
    console.log(req.user)
    console.log("API Called")
    try {
      const { lat, lng } = req.query;
      const response = await axios.get(
        `https://discover.search.hereapi.com/v1/discover?at=${lat},${lng}&q=restaurant&limit=100&apiKey=${hereApiKey}`
      );
      res.json(response.data);
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Error fetching nearby restaurants data' });
    }
  });

app.get("/logout", function(req, res){
    req.logout(function(err,data){
        if(err){
            console.log(err)
        }
    });
    req.flash("success", "See you later!");
    res.redirect("/");
 });

app.get("*",function(req,res){
	res.send("The Page You Are Looking For is Not Found!")
})

port = process.env.PORT || 3000

app.listen(port, function(){
   console.log("The Server Has Started!");
});
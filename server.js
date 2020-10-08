var _ = require("lodash");
var path = require("path");
var crypto = require('crypto');
var uuid = require('node-uuid');
var request = require("request");
var express = require("express");
var jsonfile = require("jsonfile");
var bodyParser = require("body-parser");

var file = "cloudhole.json";
var surge = require("surge")({ default: "publish" })

var saveClearances = function() {
  jsonfile.writeFile(file, clearances, {spaces: 2}, function(err) {
    if (err != null) {
      console.error(err);
    }
    else {
      surge([".", "cloudhole.surge.sh"]);
    }
  });
};

var clearances = [];
try {
  clearances = jsonfile.readFileSync(file);
}
catch(e) {
  var url = "https://cloudhole.surge.sh/cloudhole.json"
  request({
      url: url,
      json: true
  }, function (error, response, data) {
    if (!error && response.statusCode === 200) {
      clearances = data;
    }
  });
}

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Initialize the app.
var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});

// CLEARANCES API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.error("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

app.get("/key", function(req, res) {
  try {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var hash = crypto.createHmac('sha256', process.env['SURGE_TOKEN'] || "DevCloudHole")
                     .update(ip)
                     .digest('hex');
    res.status(200).json({'key': hash.substr(0, 7).toUpperCase()});
  }
  catch(e) {
    res.status(500).json(e.message);
  }
});

/*  "/clearances"
 *    GET: finds all clearances
 *    POST: creates a new clearance
 */

app.get("/clearances", function(req, res) {
  try {
    var key = req.headers.authorization || req.params.key;
    var results = _.filter(clearances, {'key': key});
    res.status(200).json(results);
  }
  catch(e) {
    res.status(204).json(e.message);
  }
});

app.post("/clearances", function(req, res) {
  var newClearance = req.body;
  newClearance.createDate = new Date();

  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (req.headers.authorization == undefined) {
    handleError(res, "API key required", "Must provide an API key", 403);
    return;
  }

  if (!(req.body.userAgent && req.body.cookies)) {
    handleError(res, "Invalid user input", "Must provide a User Agent and Cookies.", 400);
    return;
  }

  if (_.findIndex(clearances, {cookies: req.body.cookies}) != -1) {
    handleError(res, "Duplicate clearance", "UserAgent and cookies already exist.", 409);
    return;
  }

  try {
    newClearance._id = uuid.v4();
    newClearance.key = req.headers.authorization;
    clearances.push(newClearance);
    saveClearances();
    res.status(201).json(newClearance);
  }
  catch(err) {
    handleError(res, "Failed to create new clearance.", err.message, 500);
  }
});

app.post("/load", function(req, res) {
  for (var i = 0; i < req.body.length; i++) {
    var clearance = req.body[i];
    if (!clearance.userAgent || !clearance.cookies || !clearance.key) {
      continue;
    }
    if (_.findIndex(clearances, {cookies: clearance.cookies}) == -1) {
      if (!clearance._id) {
        clearance._id = uuid.v4();
      }
      clearances.push(clearance);
    }
  }
  saveClearances();
  res.status(201).end();
});

/*  "/clearances/:id"
 *    GET: find clearance by id
 *    PUT: update clearance by id
 *    DELETE: deletes clearance by id
 */

app.get("/clearances/:id", function(req, res) {
  try {
    var index = _.findIndex(clearances, {_id: req.params.id});
    res.status(200).json(clearances[index]);
  }
  catch(err) {
    handleError(res, "Failed to get clearance", err.message, 500);
  }
});

app.put("/clearances/:id", function(req, res) {
  var updateDoc = req.body;

  try {
    var index = _.findIndex(clearances, {_id: req.params.id, key: req.headers.authorization});
    if (index == -1) {
      handleError(res, "Unable to find clearance", "ID or Key not found.", 500);
      return;
    }
    clearances[index] = updateDoc;
    saveClearances();
    res.status(204).end();
  }
  catch(err) {
    handleError(res, "Failed to update clearance", err.message, 500);
  }
});

app.delete("/clearances/:id", function(req, res) {
  try {
    var index = _.findIndex(clearances, {_id: req.params.id, key: req.headers.authorization});
    if (index == -1) {
      handleError(res, "Unable to find clearance", "ID or Key not found.", 500);
      return;
    }
    clearances.splice(index, 1);
    saveClearances();
    res.status(204).end();
  }
  catch(err) {
    handleError(res, "Failed to delete clearance", err.message, 500);
  }
});

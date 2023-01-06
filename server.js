// create api using jsonsever

const fs = require("fs");
const bodyParser = require("body-parser");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");

const server = jsonServer.create();
const router = jsonServer.router("./db.json");
const userdb = JSON.parse(fs.readFileSync("./users.json", "UTF-8"));

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());

const SECRET_KEY = "123456789";

const expiresIn = "1h";

function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

function isAuthenticated({ email, password }) {
  return (
    userdb.users.findIndex((user) => user.email === email && user.password === password) !== -1
  );
}

server.post("/auth/login", (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const { email, password } = req.body;

  //validate email
  if (!email.includes("@")) {
    const status = 422;
    const message = "Email must include @";
    res.status(status).json({ status, message });
    return;
  }
  //validate password
  if (password.length < 8) {
    const status = 422;
    const message = "Password must be at least 8 characters long";
    res.status(status).json({ status, message });
    return;
  }
  //validate password contains spaces
  if (password.includes(" ")) {
    const status = 422;
    const message = "Password must not contain spaces";
    res.status(status).json({ status, message });
    return;
  }
  if (isAuthenticated({ email, password }) === false) {
    const status = 403;
    const message = "Incorrect email or password";
    res.status(status).json({ status, message });
    return;
  }
  //verify password
  let user =  userdb.users.find((user) => user.email === email && user.password === password) 
  // get user with password
  user= {...user, password: undefined}
  console.log(user);
  const access_token = createToken({ email });
  console.log("Access Token:" + access_token);
  res.status(200).json({ access_token , user});
});

server.post("/auth/register", (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const { email, username, password } = req.body;
  if (isAuthenticated({ email, password }) === true) {
    const status = 409;
    const message = "Email  already exist";
    res.status(status).json({ status, message });
    return;
  }
  //validate password
  if (password.length < 8) {
    const status = 422;
    const message = "Password must be at least 8 characters long";
    res.status(status).json({ status, message });
    return;
  }
  //validate email
  if (!email.includes("@")) {
    const status = 422;
    const message = "Email must include @";
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile("./users.json", (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
    var last_item_id = data.users[data.users.length - 1].id;

    //Add new user
    const new_user = { id: last_item_id + 1, username: username, email: email, password: password };
    data.users.push({ id: last_item_id + 1, username: username, email: email, password: password }); //add some data
    var writeData = fs.writeFile("./users.json", JSON.stringify(data), (err, result) => {
      // WRITE
      if (err) {
        const status = 401;
        const message = err;
        res.status(status).json({ status, message });
        return;
      }
    });

    res.status(200).json({ new_user });
  });
});
server.get("/users", async (req, res) => {
 
  
  try {
    
    res.status(200).json({ userdb });
  } catch (err) {
    res.status(401).json({ err });
  }
});
// server.post("/auth/verify", async (req, res) => {
//   // verify token
//   const token = req.body.access_token;
//   try {
//     const payload = await verifyToken(token);
//     res.status(200).json({ payload });
//   } catch (err) {
//     res.status(401).json({ err });
//   }
// });

server.use(router);

server.listen(3000, () => {
  console.log("Run Auth API Server");
});

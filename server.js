let express = require('express');
const app = express();
require('dotenv').config();

const bcrypt = require('bcrypt');
const jwtSecret = process.env.jwtSecret;

let fs = require('fs');

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication failed. Token not provided.' });
  }
  
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Authentication failed. Invalid token.' });
    }
    
    req.user = decoded;
    next();
  });
};



app.get('/',(req,res)=>{
    res.json('Go to /api route')
})
app.get('/api',(req, res)=>{
    fs.readFile('data.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading JSON file', err);
          res.sendStatus(500);
        } else {
          const jsonData = JSON.parse(data);
          res.json(jsonData);
        }
      });
})

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file', err);
      res.sendStatus(500);
    } else {
      let users = [];
      if (data) {
        users = JSON.parse(data);
      }

      const user = users.find((user) => user.username === username);
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed. User not found.' });
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error('Error comparing passwords', err);
          return res.sendStatus(500);
        }

        if (!result) {
          return res.status(401).json({ message: 'Authentication failed. Invalid password.' });
        }

        const token = jwt.sign({ username }, jwtSecret, { expiresIn: '1h' });
        res.json({ token });
      });
    }
  });
});



app.post('/signup',authenticateToken, (req, res) => {
  const { username, password } = req.body;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error hashing password', err);
      res.sendStatus(500);
    } else {
      const newUser = { username, password: hash };

      fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading JSON file', err);
          res.sendStatus(500);
        } else {
          let users = [];
          if (data) {
            users = JSON.parse(data);
          }

          users.push(newUser);

          fs.writeFile('users.json', JSON.stringify(users), 'utf8', (err) => {
            if (err) {
              console.error('Error writing to JSON file', err);
              res.sendStatus(500);
            } else {
              res.sendStatus(200);
            }
          });
        }
      });
    }
  });
});


app.use(express.json());

app.post('/api',authenticateToken, (req, res) => {
  const newData = req.body;
  
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file', err);
      res.sendStatus(500);
    } else {
      const jsonData = JSON.parse(data);
      jsonData.push(newData);

      fs.writeFile('data.json', JSON.stringify(jsonData), 'utf8', (err) => {
        if (err) {
          console.error('Error writing to JSON file', err);
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      });
    }
  })
})



const PORT = 3000;

app.listen(PORT, ()=>{
    console.log(`App is listening on port ${PORT}`);
})
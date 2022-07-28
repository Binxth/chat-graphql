const express = require('express');
const app = express();
const {expressjwt} = require("express-jwt");
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
const {ApolloServer, gql} = require('apollo-server-express');

const port = 9000;
const jwtSecret = Buffer.from('Zn8Q5tyZ/G1MHltc4F/gTkVJMlrbKiZx', 'base64');



app.use(cors(), express.json(), expressjwt({
  credentialsRequired: false,
  secret: jwtSecret,
  algorithms: ['HS256']
}));

const typeDefs = gql(fs.readFileSync('./schema.graphql', {encoding: 'utf8'}));
const resolvers = require('./resolvers')

//4.1
function context({req}) {
  if (req && req.user) {
    return {userId: req.user.sub};
  }
  return {};
}

const apolloServer = new ApolloServer({typeDefs,resolvers, context })

apolloServer.start().then(() => {
  apolloServer.applyMiddleware({app, path: '/graphql'})
  console.log("apollo server started");
})

app.post('/login', (req, res)=>{
  const email = req.body.email;
  const password = req.body.password;

  const user = db.users.list().find((user)=>{
    user.email ===email;
  })
  if(!user && user.password ===password){
    res.sendStatus(401);
    return;
  }
  const token = jwt.sign({userID: user.id}, jwtSecret, {expiresIn: '2h'});
  res.send({token})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


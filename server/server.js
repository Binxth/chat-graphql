import express from 'express';
import {expressjwt} from 'express-jwt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import db from './db.js';
// const db = require('./db');
// const fs = require('fs');
import fs from 'fs';
// const {ApolloServer, gql} = require('apollo-server-express');
import {ApolloServer, gql} from 'apollo-server-express';

// const http = require('http');
import http from 'http';

import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import resolvers from './resolvers.js';

const app = express();

const port = 9000;
const jwtSecret = Buffer.from('Zn8Q5tyZ/G1MHltc4F/gTkVJMlrbKiZx', 'base64');



app.use(cors(), express.json(), expressjwt({
  credentialsRequired: false,
  secret: jwtSecret,
  algorithms: ['HS256']
}));

const typeDefs = gql(fs.readFileSync('./schema.graphql', {encoding: 'utf8'}));
// const resolvers = require('./resolvers')


// function context({req}) {

//   console.log(connection)
//   // console.log(Object.keys(params))
//   if (req && req.auth) {
//     return {userId: req.auth.userID};
//   }
//   if(connection){
//     console.log(connection.context.accessToken)
//     const decodedToken =  jwt.verify(connection.context.accessToken, jwtSecret);
//     return {userId: decodedToken.userID};
//   }
//   return {};
// }

function context(params) {
  // console.log(req.auth);
  console.log(params.req.auth);
  console.log(Object.keys(params));

  if (params && params.req.auth) {
    return {userId: params.req.auth.userID};
  }
  if(connection){
    console.log(connection.context.accessToken)
    const decodedToken =  jwt.verify(connection.context.accessToken, jwtSecret);
    return {userId: decodedToken.userID};
  }
  return {};
}



const schema = makeExecutableSchema({ typeDefs, resolvers });


// const apolloServer = new ApolloServer({typeDefs,resolvers, context })


const httpServer =  http.createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer({ schema }, wsServer);

const apolloServer = new ApolloServer({
  schema,
  context: context,
  csrfPrevention: true,
  cache: "bounded",
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
  ],
});


apolloServer.start().then(() => {
  apolloServer.applyMiddleware({app, path: '/graphql'})
  console.log("apollo server started");
})  

app.post('/login', (req, res)=>{
  const name = req.body.name;
  const password = req.body.password;

  const user = db.users.get(name);

  console.log(user.id);
  if(!user && user.password == password){
    res.sendStatus(401);
    return;
  }
  const token = jwt.sign({userID: user.id}, jwtSecret, {expiresIn: '2h'});
  res.send({token})
})


// apolloServer.installSubscriptionHandlers(httpServer); 


httpServer.listen(port, () => {
  console.log(`App listening on port ${port}`)
});
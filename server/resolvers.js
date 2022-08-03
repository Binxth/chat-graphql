// const db = require("./db");
import db from "./db.js";
import { PubSub } from "graphql-subscriptions";
const pubSub = new PubSub();

const MESSAGE_ADDED = "MESSAGE_ADDED";

function requireAuth(userId) {
  if (!userId) {
    throw new Error("Unauthorized");
  }
}

const Query = {
  messages: (_root, _args, context) => {
    requireAuth(context.userId);
    return db.messages.list();
  },
};

const Mutation = {
  addMessage: (_root, { input }, { userId }) => {
    requireAuth(userId);
    const messageId = db.messages.create({ from: userId, text: input.text });
    const message = db.messages.get(messageId);
    pubSub.publish(MESSAGE_ADDED, { messageAdded: message });
    return message;
  },
};

const Subscription = {
  messageAdded: {
    subscribe: () => {
      // requireAuth(context.userId);
      return pubSub.asyncIterator(MESSAGE_ADDED);
    },
  },
};

// module.exports = { Query, Mutation };
export default { Query, Mutation, Subscription };

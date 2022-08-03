// const { DataStore } = require('notarealdb');
import { DataStore } from 'notarealdb';

const store = new DataStore('./data');

export default {
  messages: store.collection('messages'),
  users: store.collection('users')
};

// export default store;
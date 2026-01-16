const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String
    fullName: String
    avatar: String
    bio: String
    followersCount: Int
    role: String
    posts(limit: Int): [Post]
  }

  type Post {
    id: ID!
    caption: String
    content: String
    imageUrl: String
    author: User!
    likeCount: Int
    commentCount: Int
    createdAt: String
    comments(limit: Int): [Comment]
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    createdAt: String
  }

  type Query {
    me: User
    user(id: ID!): User
    feed(limit: Int, offset: Int): [Post]
    post(id: ID!): Post
  }

  type Mutation {
    createPost(caption: String!, imageUrl: String): Post
    likePost(postId: ID!): Boolean
  }
`;

module.exports = typeDefs;

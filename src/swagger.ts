import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Liav & Noam Backend API",
      version: "1.0.0",
      description: "API documentation for the backend server",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT bearer authorization header for authorization",
            },
        },
        schemas: {
            User: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        description: "The auto-generated id of the user",
                    },
                    username: {
                        type: "string",
                        description: "The username of the user",
                    },
                    email: {
                        type: "string",
                        description: "The email of the user",
                    },
                    password: {
                        type: "string",
                        description: "The password of the user",
                    },
                    profileImage: {
                        type: "string",
                        description: "The ID of the user's profile image",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the user was created",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the user was updated",
                    },
                },
                example: {
                    _id: "60d0fe4f5311236168a109ca",
                    username: "johndoe",
                    email: "johndoe@example.com",
                    password: "password123",
                    profileImage: "60d0fe4f5311236168a109cd",
                    createdAt: "2021-06-21T18:30:00.000Z",
                    updatedAt: "2021-06-21T18:30:00.000Z",
                },
            },
            Post: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        description: "The auto-generated id of the post",
                    },
                    message: {
                        type: "string",
                        description: "The content of the post",
                    },
                    author: {
                        type: "string",
                        description: "The user id of the author",
                    },
                    image: {
                        type: "string",
                        description: "The ID of the post image",
                    },
                    likeCount: {
                        type: "integer",
                        description: "Number of likes",
                    },
                    isLiked: {
                        type: "boolean",
                        description: "Whether the current user has liked this post (only when request is authenticated)",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the post was created",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the post was updated",
                    },
                },
                example: {
                    _id: "60d0fe4f5311236168a109cb",
                    message: "This is a test post",
                    author: "60d0fe4f5311236168a109ca",
                    image: "60d0fe4f5311236168a109ce",
                    likeCount: 12,
                    createdAt: "2021-06-21T18:30:00.000Z",
                    updatedAt: "2021-06-21T18:30:00.000Z",
                },
            },
            Comment: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        description: "The auto-generated id of the comment",
                    },
                    body: {
                        type: "string",
                        description: "The content of the comment",
                    },
                    postId: {
                        type: "string",
                        description: "The id of the post the comment belongs to",
                    },
                    author: {
                        type: "string",
                        description: "The user id of the author",
                    },
                    upCount: {
                        type: "integer",
                        description: "Number of upvotes",
                    },
                    downCount: {
                        type: "integer",
                        description: "Number of downvotes",
                    },
                    userVote: {
                        type: "integer",
                        nullable: true,
                        enum: [1, -1, null],
                        description: "Current user's vote: 1 upvote, -1 downvote, null no vote (only when request is authenticated)",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the comment was created",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the comment was updated",
                    },
                },
                example: {
                    _id: "60d0fe4f5311236168a109cc",
                    body: "This is a test comment",
                    postId: "60d0fe4f5311236168a109cb",
                    author: "60d0fe4f5311236168a109ca",
                    upCount: 10,
                    downCount: 5,
                    userVote: 1,
                    createdAt: "2021-06-21T18:30:00.000Z",
                    updatedAt: "2021-06-21T18:30:00.000Z",
                },
            },
            Image: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        description: "The auto-generated id of the image",
                    },
                    filename: {
                        type: "string",
                        description: "The unique filename stored on server",
                    },
                    originalName: {
                        type: "string",
                        description: "The original filename uploaded by user",
                    },
                    mimetype: {
                        type: "string",
                        description: "The MIME type of the image",
                    },
                    size: {
                        type: "number",
                        description: "The size of the image in bytes",
                    },
                    path: {
                        type: "string",
                        description: "The file path on server",
                    },
                    uploadedBy: {
                        type: "string",
                        description: "The user id of the uploader",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the image was uploaded",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "The date the image metadata was updated",
                    },
                },
                example: {
                    _id: "60d0fe4f5311236168a109cd",
                    filename: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
                    originalName: "vacation-photo.jpg",
                    mimetype: "image/jpeg",
                    size: 1024000,
                    path: "uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
                    uploadedBy: "60d0fe4f5311236168a109ca",
                    createdAt: "2021-06-21T18:30:00.000Z",
                    updatedAt: "2021-06-21T18:30:00.000Z",
                },
            },
        },
    },
  },
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

const specs = swaggerJsDoc(options);

export const swaggerSetup = (app: Express) => {
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
};

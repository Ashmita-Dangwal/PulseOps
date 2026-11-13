import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "PulseOps API",
      version: "1.0.0",
      description: "API documentation for the PulseOps monitoring platform"
    },

    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server"
      }
    ]
  },

  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
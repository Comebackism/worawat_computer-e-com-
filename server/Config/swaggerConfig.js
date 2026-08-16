const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Product Store API',
    version: '1.0.0',
    description: 'API Documentation สำหรับโปรเจค e-commerce (product-store)',
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'authtoken'
      }
    },
    schemas: {
      Product: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          id: { type: 'integer', description: 'The auto-generated id of the product' },
          name: { type: 'string', description: 'The product name' },
          brand: { type: 'string', description: 'The product brand' },
          price: { type: 'number', description: 'The product price' },
          category: { type: 'string', description: 'The product category' },
          memory: { type: 'string', description: 'The product memory' },
          description: { type: 'string', description: 'The product description' },
          image: { type: 'string', description: 'The product image url' },
          stock: { type: 'integer', description: 'The product stock' },
          specs: { type: 'string', description: 'The product specifications' }
        }
      }
    }
  },
  security: [
    {
      ApiKeyAuth: []
    }
  ],
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = { swaggerUi, swaggerSpec };

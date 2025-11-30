/**
 * Configurações da API
 * 
 * Valores podem ser sobrescritos por variáveis de ambiente:
 * - MONGODB_URI
 * - MONGODB_DATABASE
 * - PORT
 */

module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:your_admin_password@localhost:27017',
    database: process.env.MONGODB_DATABASE || 'hackathon'
  },
  server: {
    port: process.env.PORT || 3000
  }
};


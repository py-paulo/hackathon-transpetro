const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const config = require('./config');

const app = express();

// Configurações
const PORT = config.server.port;
const MONGODB_URI = config.mongodb.uri;
const DATABASE_NAME = config.mongodb.database;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão MongoDB
let db;
let client;

async function connectToMongoDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('✅ Conectado ao MongoDB');
    console.log(`📂 Database: ${DATABASE_NAME}`);
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

// ============================================
// ROTAS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: DATABASE_NAME
  });
});

// Lista todas as collections disponíveis
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json({
      success: true,
      data: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CONSUMO MENSAL
// ============================================

// GET /api/consumo-mensal - Lista todos os registros de consumo mensal
app.get('/api/consumo-mensal', async (req, res) => {
  try {
    const { navio, limit = 100, skip = 0 } = req.query;
    
    const filter = {};
    if (navio) filter.shipName = new RegExp(navio, 'i');
    
    const data = await db.collection('consumo_mensal')
      .find(filter)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('consumo_mensal').countDocuments(filter);
    
    res.json({
      success: true,
      total,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/consumo-mensal/navios - Lista navios únicos
app.get('/api/consumo-mensal/navios', async (req, res) => {
  try {
    const navios = await db.collection('consumo_mensal')
      .distinct('shipName');
    
    res.json({
      success: true,
      count: navios.length,
      data: navios.sort()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/consumo-mensal/:navio - Consumo de um navio específico
app.get('/api/consumo-mensal/:navio', async (req, res) => {
  try {
    const { navio } = req.params;
    
    const data = await db.collection('consumo_mensal')
      .find({ shipName: new RegExp(`^${navio}$`, 'i') })
      .sort({ ano: 1, mes: 1 })
      .toArray();
    
    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `Navio '${navio}' não encontrado` 
      });
    }
    
    res.json({
      success: true,
      navio: data[0].shipName,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DETERIORAÇÃO
// ============================================

// GET /api/deterioracao - Lista dados de deterioração por período
app.get('/api/deterioracao', async (req, res) => {
  try {
    const { navio, limit = 100 } = req.query;
    
    const filter = {};
    if (navio) filter.navio = new RegExp(navio, 'i');
    
    const data = await db.collection('deterioracao')
      .find(filter)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('deterioracao').countDocuments(filter);
    
    res.json({
      success: true,
      total,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/deterioracao/:navio - Deterioração de um navio específico
app.get('/api/deterioracao/:navio', async (req, res) => {
  try {
    const { navio } = req.params;
    
    const data = await db.collection('deterioracao')
      .find({ navio: new RegExp(`^${navio}$`, 'i') })
      .sort({ numero_periodo: 1 })
      .toArray();
    
    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `Dados de deterioração para '${navio}' não encontrados` 
      });
    }
    
    res.json({
      success: true,
      navio: data[0].navio,
      periodos: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/deterioracao/ranking/top - Top navios com maior deterioração
app.get('/api/deterioracao/ranking/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const data = await db.collection('deterioracao')
      .find({ taxa_deterioracao_mes: { $gt: 0 } })
      .sort({ taxa_deterioracao_mes: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.json({
      success: true,
      descricao: 'Navios com maior taxa de deterioração (ton/nm/mês)',
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// IWS DETERIORAÇÃO (Cruzamento IWS + Deterioração)
// ============================================

// GET /api/iws-deterioracao - Lista dados cruzados IWS + Deterioração
app.get('/api/iws-deterioracao', async (req, res) => {
  try {
    const { navio, limit = 100 } = req.query;
    
    const filter = {};
    if (navio) filter.navio = new RegExp(navio, 'i');
    
    const data = await db.collection('iws_deterioracao')
      .find(filter)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('iws_deterioracao').countDocuments(filter);
    
    res.json({
      success: true,
      total,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/iws-deterioracao/:navio - IWS + Deterioração de um navio
app.get('/api/iws-deterioracao/:navio', async (req, res) => {
  try {
    const { navio } = req.params;
    
    const data = await db.collection('iws_deterioracao')
      .find({ navio: new RegExp(`^${navio}$`, 'i') })
      .sort({ data_inspecao: 1 })
      .toArray();
    
    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `Dados IWS para '${navio}' não encontrados` 
      });
    }
    
    res.json({
      success: true,
      navio: data[0].navio,
      inspecoes: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// IWS POR NAVIO (Resumo)
// ============================================

// GET /api/iws-por-navio - Resumo IWS por navio
app.get('/api/iws-por-navio', async (req, res) => {
  try {
    const data = await db.collection('iws_por_navio')
      .find({})
      .sort({ score_medio: -1 })
      .toArray();
    
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/iws-por-navio/:navio - Resumo IWS de um navio
app.get('/api/iws-por-navio/:navio', async (req, res) => {
  try {
    const { navio } = req.params;
    
    const data = await db.collection('iws_por_navio')
      .findOne({ navio: new RegExp(`^${navio}$`, 'i') });
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: `Resumo IWS para '${navio}' não encontrado` 
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// IWS POR TIPO (Estatísticas por tipo de incrustação)
// ============================================

// GET /api/iws-por-tipo - Estatísticas por tipo de incrustação
app.get('/api/iws-por-tipo', async (req, res) => {
  try {
    const data = await db.collection('iws_por_tipo')
      .find({})
      .toArray();
    
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROTA GENÉRICA PARA QUALQUER COLLECTION
// ============================================

// GET /api/data/:collection - Acessa qualquer collection
app.get('/api/data/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { limit = 100, skip = 0, ...filters } = req.query;
    
    // Verifica se a collection existe
    const collections = await db.listCollections({ name: collection }).toArray();
    if (collections.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `Collection '${collection}' não encontrada` 
      });
    }
    
    const data = await db.collection(collection)
      .find(filters)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection(collection).countDocuments(filters);
    
    res.json({
      success: true,
      collection,
      total,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ESTATÍSTICAS GERAIS
// ============================================

// GET /api/stats - Estatísticas gerais do banco
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      consumo_mensal: await db.collection('consumo_mensal').countDocuments(),
      deterioracao: await db.collection('deterioracao').countDocuments(),
      iws_deterioracao: await db.collection('iws_deterioracao').countDocuments(),
      iws_por_navio: await db.collection('iws_por_navio').countDocuments(),
      iws_por_tipo: await db.collection('iws_por_tipo').countDocuments()
    };
    
    const navios = await db.collection('deterioracao').distinct('navio');
    
    res.json({
      success: true,
      database: DATABASE_NAME,
      collections: stats,
      total_navios: navios.length,
      navios: navios.sort()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// INICIALIZAÇÃO
// ============================================

async function startServer() {
  await connectToMongoDB();
  
  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 API Hackathon Transpetro');
    console.log('═══════════════════════════════════════');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log('');
    console.log('📋 Endpoints disponíveis:');
    console.log('   GET /api/health');
    console.log('   GET /api/stats');
    console.log('   GET /api/collections');
    console.log('');
    console.log('   GET /api/consumo-mensal');
    console.log('   GET /api/consumo-mensal/navios');
    console.log('   GET /api/consumo-mensal/:navio');
    console.log('');
    console.log('   GET /api/deterioracao');
    console.log('   GET /api/deterioracao/:navio');
    console.log('   GET /api/deterioracao/ranking/top');
    console.log('');
    console.log('   GET /api/iws-deterioracao');
    console.log('   GET /api/iws-deterioracao/:navio');
    console.log('');
    console.log('   GET /api/iws-por-navio');
    console.log('   GET /api/iws-por-navio/:navio');
    console.log('');
    console.log('   GET /api/iws-por-tipo');
    console.log('');
    console.log('   GET /api/data/:collection (genérico)');
    console.log('═══════════════════════════════════════');
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Fechando conexões...');
  if (client) await client.close();
  process.exit(0);
});

startServer();


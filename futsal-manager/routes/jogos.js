const express = require('express');
const router = express.Router();

// Rota de teste para verificar se o módulo está a funcionar
router.get('/teste', (req, res) => {
  res.json({ 
    mensagem: 'Rotas dos jogos estão a funcionar!',
    timestamp: new Date().toISOString()
  });
});

// Middleware para log das requisições
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Rota POST para registar um novo jogo
router.post('/', (req, res) => {
  console.log('POST /jogos recebido');
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  
  try {
    // Verificar se req.body existe
    if (!req.body) {
      return res.status(400).json({ erro: 'Dados do formulário não recebidos' });
    }

    // Processar os dados do formulário
    const { equipa_casa, equipa_fora, data_jogo, golos_casa, golos_fora } = req.body;
    
    // Validações básicas
    if (!equipa_casa || !equipa_fora) {
      return res.status(400).json({ erro: 'Equipas são obrigatórias' });
    }
    
    // Adicionar aqui a lógica para guardar o jogo na base de dados
    console.log('Novo jogo registado:', req.body);
    
    // Responder com sucesso em vez de redirect para debug
    res.status(200).json({ 
      sucesso: true, 
      mensagem: 'Jogo registado com sucesso',
      dados: req.body 
    });
    
  } catch (error) {
    console.error('Erro ao registar jogo:', error);
    res.status(500).json({ erro: 'Erro interno do servidor', detalhes: error.message });
  }
});

// Rota GET para mostrar a lista de jogos
router.get('/', (req, res) => {
  console.log('GET /jogos recebido');
  try {
    // Adicionar lógica para buscar jogos da base de dados
    res.json({ 
      mensagem: 'Lista de jogos',
      jogos: [] // Temporário para teste
    });
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    res.status(500).json({ erro: 'Erro ao buscar jogos' });
  }
});

// Rota GET para mostrar o formulário de novo jogo
router.get('/novo', (req, res) => {
  res.render('novo_jogo');
});

// Rota GET para mostrar detalhes de um jogo específico
router.get('/:id', (req, res) => {
  const jogoId = req.params.id;
  
  // Dados temporários para teste - substituir pela consulta à base de dados
  const jogo = {
    id: jogoId,
    data: '2025-01-15',
    equipa1_golos: 3,
    equipa2_golos: 2,
    equipa1: 'Sporting',
    equipa2: 'Benfica'
  };
  
  const equipa1 = []; // Dados dos jogadores da equipa 1
  const equipa2 = []; // Dados dos jogadores da equipa 2
  
  res.render('detalhe_jogo', { jogo, equipa1, equipa2 });
});

console.log('Módulo de rotas dos jogos carregado com sucesso');
module.exports = router;

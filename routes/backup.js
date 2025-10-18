const express = require('express');
const router = express.Router();
const { db, USE_POSTGRES } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const archiver = require('archiver');
const path = require('path');

// Rota para fazer backup de todos os dados
router.get('/backup', requireAdmin, async (req, res) => {
  console.log('💾 Iniciando backup completo da base de dados...');

  try {
    // Definir nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `backup_futsal_${timestamp}.zip`;

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Criar arquivo ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 } // Máxima compressão
    });

    // Pipe do arquivo para a resposta
    archive.pipe(res);

    // Função auxiliar para converter array para CSV
    function arrayToCSV(data, headers) {
      if (!data || data.length === 0) return headers.join(',') + '\n';
      
      const csvRows = [headers.join(',')];
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Escapar aspas e vírgulas
          if (value === null || value === undefined) return '';
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
            ? `"${escaped}"` 
            : escaped;
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    }

    // Queries para exportar todas as tabelas
    const queries = [
      {
        name: 'jogadores',
        sql: 'SELECT * FROM jogadores ORDER BY id',
        headers: ['id', 'nome', 'suspenso']
      },
      {
        name: 'jogos',
        sql: 'SELECT * FROM jogos ORDER BY data DESC, id',
        headers: ['id', 'data', 'equipa1_golos', 'equipa2_golos', 'observacoes']
      },
      {
        name: 'presencas',
        sql: 'SELECT * FROM presencas ORDER BY jogo_id, jogador_id',
        headers: ['id', 'jogo_id', 'jogador_id', 'equipa']
      },
      {
        name: 'coletes',
        sql: 'SELECT * FROM coletes ORDER BY data_levou DESC',
        headers: ['id', 'jogador_id', 'data_levou', 'data_devolveu']
      },
      {
        name: 'convocatoria',
        sql: 'SELECT * FROM convocatoria ORDER BY posicao',
        headers: ['id', 'jogador_id', 'tipo', 'posicao', 'confirmado', 'data_confirmacao']
      },
      {
        name: 'convocatoria_config',
        sql: 'SELECT * FROM convocatoria_config',
        headers: ['id', 'max_convocados', 'created_at']
      },
      {
        name: 'faltas_historico',
        sql: 'SELECT * FROM faltas_historico ORDER BY data_falta DESC',
        headers: ['id', 'jogador_id', 'data_falta', 'created_at']
      },
      {
        name: 'users',
        sql: 'SELECT id, username, role, created_at FROM users ORDER BY id',
        headers: ['id', 'username', 'role', 'created_at']
      }
    ];

    // Estatísticas para arquivo JSON
    const stats = {
      backup_date: new Date().toISOString(),
      database_type: USE_POSTGRES ? 'PostgreSQL' : 'SQLite',
      environment: process.env.NODE_ENV || 'development',
      tables: {}
    };

    // Processar todas as queries
    let completed = 0;

    for (const query of queries) {
      await new Promise((resolve, reject) => {
        db.query(query.sql, [], (err, rows) => {
          if (err) {
            console.error(`❌ Erro ao exportar ${query.name}:`, err);
            stats.tables[query.name] = { error: err.message, count: 0 };
            resolve();
            return;
          }

          const count = rows ? rows.length : 0;
          stats.tables[query.name] = { count, exported: true };
          
          console.log(`✅ ${query.name}: ${count} registos`);

          // Converter para CSV e adicionar ao ZIP
          const csv = arrayToCSV(rows, query.headers);
          archive.append(csv, { name: `${query.name}.csv` });

          completed++;
          resolve();
        });
      });
    }

    // Adicionar arquivo de estatísticas (JSON)
    const statsJson = JSON.stringify(stats, null, 2);
    archive.append(statsJson, { name: 'backup_info.json' });

    // Adicionar README com instruções
    const readme = `# Backup Futsal Manager
    
Data: ${new Date().toLocaleString('pt-PT')}
Tipo de Base de Dados: ${USE_POSTGRES ? 'PostgreSQL' : 'SQLite'}

## Conteúdo do Backup

${Object.entries(stats.tables).map(([table, info]) => 
  `- ${table}.csv: ${info.count} registos`
).join('\n')}

## Como Restaurar

### SQLite (Local):
1. Abrir DB Browser for SQLite
2. File → Import → Table from CSV file
3. Importar cada ficheiro CSV

### PostgreSQL (Render):
1. Aceder ao dashboard do Render
2. Abrir o Database service
3. Usar ferramenta de import ou psql

## Notas
- Senhas dos utilizadores estão encriptadas (bcrypt)
- Datas em formato ISO 8601
- Encoding: UTF-8
`;

    archive.append(readme, { name: 'README.txt' });

    // Finalizar arquivo
    await archive.finalize();

    console.log(`✅ Backup completo criado: ${filename}`);
    console.log(`📦 Total de tabelas exportadas: ${completed}/${queries.length}`);

  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    res.status(500).send('Erro ao criar backup');
  }
});

// Rota para obter informações sobre a base de dados (para mostrar na página admin)
router.get('/info', requireAdmin, async (req, res) => {
  try {
    const info = {
      type: USE_POSTGRES ? 'PostgreSQL' : 'SQLite',
      environment: process.env.NODE_ENV || 'development',
      tables: {}
    };

    const queries = [
      { name: 'jogadores', sql: 'SELECT COUNT(*) as total FROM jogadores' },
      { name: 'jogos', sql: 'SELECT COUNT(*) as total FROM jogos' },
      { name: 'presencas', sql: 'SELECT COUNT(*) as total FROM presencas' },
      { name: 'users', sql: 'SELECT COUNT(*) as total FROM users' },
      { name: 'convocatoria', sql: 'SELECT COUNT(*) as total FROM convocatoria' },
      { name: 'coletes', sql: 'SELECT COUNT(*) as total FROM coletes' },
    ];

    for (const query of queries) {
      await new Promise((resolve) => {
        db.query(query.sql, [], (err, result) => {
          if (!err && result && result[0]) {
            info.tables[query.name] = result[0].total || result[0].Total || result[0].count || 0;
          } else {
            info.tables[query.name] = 0;
          }
          resolve();
        });
      });
    }

    res.json(info);
  } catch (error) {
    console.error('❌ Erro ao obter info:', error);
    res.status(500).json({ error: 'Erro ao obter informações' });
  }
});

module.exports = router;

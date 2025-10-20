const fs = require('fs');
const path = require('path');

const viewsPath = path.join(__dirname, 'views');
const files = [
  'convocatoria.ejs',
  'estatisticas.ejs',
  'jogadores.ejs',
  'detalhe_jogo.ejs',
  'novo_jogo.ejs',
  'admin-dashboard.ejs'
];

const mobileCSS = `
  <link rel="stylesheet" href="/mobile.css?v=<%= Date.now() %>">
  <link rel="stylesheet" href="/mobile-fix.css?v=<%= Date.now() %>">
  <link rel="stylesheet" href="/mobile-final.css?v=<%= Date.now() %>">`;

const criticalCSS = `
  <style>
    @media (max-width: 768px) {
      body { padding-top: 65px !important; }
      header.header { position: fixed !important; top: 0 !important; z-index: 9999 !important; background: #2c3e50 !important; }
      #mobileMenuToggle { display: flex !important; z-index: 10000 !important; }
      #navbarMenu { position: fixed !important; left: -100% !important; z-index: 9998 !important; background: #34495e !important; }
      #navbarMenu.active { left: 0 !important; }
      #mobileMenuOverlay { display: none; z-index: 9997 !important; }
      #mobileMenuOverlay.active { display: block !important; background: rgba(0,0,0,0.6) !important; }
      body.menu-open #share-whatsapp-btn { display: none !important; }
    }
  </style>`;

files.forEach(file => {
  const filePath = path.join(viewsPath, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} não encontrado`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Verificar se já tem mobile.css
  if (content.includes('mobile.css') || content.includes('mobile-final.css')) {
    console.log(`✓ ${file} já tem CSS mobile`);
    return;
  }

  // Encontrar primeira ocorrência de link stylesheet e adicionar depois
  const styleRegex = /(<link rel="stylesheet" href="\/style\.css[^>]*>)/;
  if (styleRegex.test(content)) {
    content = content.replace(styleRegex, `$1${mobileCSS}${criticalCSS}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} atualizado com CSS mobile`);
  } else {
    console.log(`⚠️  ${file} - não foi possível encontrar link CSS`);
  }
});

console.log('\n✅ Atualização concluída!');

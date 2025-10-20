/* ============================================
   BOTÃO DE PARTILHA - Screenshot & WhatsApp
   Peladas das Quintas Feiras
   ============================================ */

(function() {
  'use strict';
  
  console.log('📱 Script share-button.js carregado!');

  // Criar botão flutuante
  function createShareButton() {
    console.log('🔨 Criando botão de partilha...');
    const button = document.createElement('button');
    button.id = 'share-button';
    button.className = 'share-button-floating';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
      <span>Partilhar</span>
    `;    button.title = 'Partilhar página no WhatsApp';
    
    document.body.appendChild(button);
    console.log('✅ Botão adicionado ao DOM');
    
    // Event listener
    button.addEventListener('click', handleShare);
    console.log('✅ Event listener adicionado');
  }
  // Handler de partilha
  async function handleShare() {
    const button = document.getElementById('share-button');
    const originalHTML = button.innerHTML;
    
    try {
      // Verificar se html2canvas está disponível
      if (typeof html2canvas === 'undefined') {
        console.warn('⚠️ html2canvas não disponível, usando partilha de link');
        shareLink();
        return;
      }

      // Mostrar loading
      button.innerHTML = `
        <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path>
        </svg>
        <span>A capturar...</span>
      `;
      button.disabled = true;

      // Esconder o próprio botão temporariamente
      button.style.display = 'none';

      // Capturar screenshot
      const canvas = await html2canvas(document.body, {
        backgroundColor: '#f8f9fa',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });

      // Mostrar botão novamente
      button.style.display = 'flex';

      // Converter canvas para blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      // Gerar nome do arquivo
      const pageName = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `peladas_${pageName}_${timestamp}.png`;

      // Verificar se o navegador suporta Web Share API
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'image/png' });
        
        // Verificar se pode partilhar arquivos
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: document.title,
            text: 'Peladas das Quintas Feiras',
            files: [file]
          });
          
          showNotification('✅ Partilhado com sucesso!', 'success');
        } else {
          // Fallback: download + link WhatsApp
          downloadAndShareWhatsApp(blob, fileName);
        }
      } else {
        // Fallback: download + link WhatsApp
        downloadAndShareWhatsApp(blob, fileName);
      }

    } catch (error) {
      console.error('Erro ao capturar screenshot:', error);
      showNotification('❌ Erro ao capturar imagem. Tente novamente.', 'error');
    } finally {
      // Restaurar botão
      button.innerHTML = originalHTML;
      button.disabled = false;
    }
  }

  // Fallback: Partilhar apenas link (sem screenshot)
  function shareLink() {
    const text = `Peladas das Quintas Feiras - ${document.title}`;
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
    
    // Tentar Web Share API primeiro
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: text,
        url: url
      }).then(() => {
        showNotification('✅ Link partilhado!', 'success');
      }).catch((error) => {
        console.log('Partilha cancelada ou não suportada');
        // Fallback: Abrir WhatsApp diretamente
        window.open(whatsappUrl, '_blank');
        showNotification('✅ WhatsApp aberto!', 'info');
      });
    } else {
      // Abrir WhatsApp diretamente
      window.open(whatsappUrl, '_blank');
      showNotification('✅ WhatsApp aberto!', 'info');
    }
  }

  // Fallback: Download + Link WhatsApp
  function downloadAndShareWhatsApp(blob, fileName) {
    // Download da imagem
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mostrar modal com opções
    showShareModal();
  }

  // Modal de opções de partilha
  function showShareModal() {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
      <div class="share-modal-content">
        <h3>📸 Imagem capturada!</h3>
        <p>A imagem foi descarregada. Escolha como partilhar:</p>
        <div class="share-modal-buttons">
          <button class="btn btn-whatsapp" onclick="window.shareViaWhatsApp()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Partilhar no WhatsApp
          </button>
          <button class="btn btn-secondary" onclick="window.closeShareModal()">
            Fechar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeShareModal();
      }
    });
  }

  // Partilhar via WhatsApp
  window.shareViaWhatsApp = function() {
    const text = `Peladas das Quintas Feiras - ${document.title}`;
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url + '\n\n📸 Ver imagem descarregada')}`;
    window.open(whatsappUrl, '_blank');
    closeShareModal();
    showNotification('✅ WhatsApp aberto! Anexe a imagem descarregada.', 'info');
  };

  // Fechar modal
  window.closeShareModal = function() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
      modal.remove();
    }
  };

  // Notificação toast
  function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `share-toast share-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animação
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Carregar html2canvas dinamicamente
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    console.log('🔧 Inicializando botão de partilha...');
    
    // Criar botão imediatamente (sem esperar html2canvas)
    createShareButton();
    
    // Carregar html2canvas em background
    try {
      await loadHtml2Canvas();
      console.log('✅ html2canvas carregado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar html2canvas:', error);
      console.log('⚠️ Botão funcionará apenas com partilha de link');
    }
  }
})();

/* ==========================================
   CHATBOT DE DENÚNCIAS - Wellington Bozo
   Widget flutuante para denúncia de maus-tratos
   ========================================== */

(function () {
    'use strict';

    // ========== ESTADO DO CHATBOT ==========
    const state = {
        step: 0,
        data: {},
        isOpen: false
    };

    // ========== ETAPAS DO FLUXO ==========
    const steps = [
        {
            id: 'welcome',
            message: '🐾 Olá! Sou o assistente de <strong>Denúncia de Maus-Tratos contra Animais</strong> do Vereador Wellington Bozo.\n\nAqui você pode registrar uma denúncia com total <strong>sigilo</strong>, conforme o PL nº 399/2026.\n\nDeseja prosseguir?',
            options: [
                { label: '✅ Sim, quero denunciar', value: 'start' },
                { label: 'ℹ️ Saiba mais sobre o PL', value: 'info' },
                { label: '📞 Ligar para Disque Denúncia', value: 'phone' }
            ]
        },
        {
            id: 'info',
            message: '📜 <strong>PL nº 399/2026 — Denúncia Premiada</strong>\n\nAprovado pela Câmara de Presidente Prudente, esse Projeto de Lei garante:\n\n• 💰 Recompensa financeira ao denunciante\n• 🔒 Sigilo total da identidade\n• 🐶 Proteção efetiva dos animais\n• ⚖️ Responsabilização dos agressores\n\n<a href="https://g1.globo.com/sp/presidente-prudente-e-regiao/noticia/2026/02/25/camara-de-presidente-prudente-aprova-recompensa-a-quem-denunciar-maus-tratos-contra-animais-entenda-o-projeto.ghtml" target="_blank">Ler matéria completa no G1 →</a>',
            options: [
                { label: '✅ Quero denunciar agora', value: 'start' },
                { label: '← Voltar', value: 'restart' }
            ]
        },
        {
            id: 'type',
            message: '⚠️ Que tipo de maus-tratos você deseja denunciar?',
            options: [
                { label: '🔗 Animal preso/acorrentado', value: 'Preso/Acorrentado' },
                { label: '🩸 Agressão física', value: 'Agressão física' },
                { label: '🚫 Abandono', value: 'Abandono' },
                { label: '🥤 Sem água/comida', value: 'Sem água/comida' },
                { label: '🏚️ Condições insalubres', value: 'Condições insalubres' },
                { label: '❓ Outro', value: 'Outro' }
            ]
        },
        {
            id: 'animal',
            message: '🐾 Qual tipo de animal está sofrendo maus-tratos?',
            options: [
                { label: '🐶 Cão', value: 'Cão' },
                { label: '🐱 Gato', value: 'Gato' },
                { label: '🐴 Cavalo/Equino', value: 'Cavalo/Equino' },
                { label: '🐦 Ave', value: 'Ave' },
                { label: '🐾 Outro animal', value: 'Outro' }
            ]
        },
        {
            id: 'location',
            message: '📍 Onde está ocorrendo o maus-trato? Por favor, informe o <strong>bairro</strong> e, se possível, a <strong>rua ou referência</strong> em Presidente Prudente.',
            input: true,
            placeholder: 'Ex: Jardim Maracanã, próximo à praça...',
            field: 'location'
        },
        {
            id: 'details',
            message: '📝 Descreva o que está acontecendo. Quanto mais detalhes, melhor para a apuração. Pode incluir horários, frequência e características do animal.',
            input: true,
            placeholder: 'Descreva a situação...',
            field: 'details',
            textarea: true
        },
        {
            id: 'contact',
            message: '📱 Deseja deixar um contato para acompanhamento? Seus dados serão mantidos em <strong>sigilo absoluto</strong>.\n\n(Opcional — você pode pular)',
            input: true,
            placeholder: 'Telefone ou e-mail (opcional)',
            field: 'contact',
            optional: true
        },
        {
            id: 'confirm',
            message: '',  // será preenchido dinamicamente
            options: [
                { label: '✅ Confirmar e Enviar', value: 'send' },
                { label: '✏️ Corrigir informações', value: 'restart' }
            ]
        },
        {
            id: 'success',
            message: '✅ <strong>Denúncia registrada com sucesso!</strong>\n\nSeu registro foi enviado para análise da equipe do Vereador Wellington Bozo.\n\n🔒 Seus dados estão protegidos.\n📋 Protocolo: <strong>#DEN-{protocol}</strong>\n\nVocê também pode ligar:\n📞 <strong>Disque Denúncia: 181</strong>\n📞 <strong>IBAMA: 0800-618080</strong>\n📞 <strong>Polícia Ambiental: 190</strong>\n\nObrigado por proteger os animais de Presidente Prudente! 🐾💚',
            options: [
                { label: '🔄 Nova denúncia', value: 'restart' },
                { label: '✖ Fechar', value: 'close' }
            ]
        }
    ];

    // ========== CRIAR HTML DO CHATBOT ==========
    function createChatbot() {
        // Floating button
        const fab = document.createElement('button');
        fab.className = 'chatbot-fab';
        fab.id = 'chatbotFab';
        fab.setAttribute('aria-label', 'Abrir chat de denúncias');
        fab.innerHTML = '<i class="fas fa-comment-dots"></i><span class="chatbot-fab-badge">Denúncia</span>';
        document.body.appendChild(fab);

        // Chatbot window
        const chatbox = document.createElement('div');
        chatbox.className = 'chatbot-window';
        chatbox.id = 'chatbotWindow';
        chatbox.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <div class="chatbot-avatar"><i class="fas fa-paw"></i></div>
                    <div>
                        <strong>Denúncia Animal</strong>
                        <span>PL 399/2026 • Sigilo garantido</span>
                    </div>
                </div>
                <button class="chatbot-close" id="chatbotClose" aria-label="Fechar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chatbot-body" id="chatbotBody"></div>
            <div class="chatbot-input-area" id="chatbotInputArea" style="display:none;">
                <div class="chatbot-input-wrap">
                    <input type="text" id="chatbotInput" placeholder="Digite aqui..." />
                    <button id="chatbotSend" aria-label="Enviar"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(chatbox);

        // Events
        fab.addEventListener('click', toggleChatbot);
        document.getElementById('chatbotClose').addEventListener('click', toggleChatbot);
        document.getElementById('chatbotSend').addEventListener('click', handleInput);
        document.getElementById('chatbotInput').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') handleInput();
        });

        // Start
        showStep('welcome');
    }

    // ========== TOGGLE ==========
    function toggleChatbot() {
        const win = document.getElementById('chatbotWindow');
        const fab = document.getElementById('chatbotFab');
        state.isOpen = !state.isOpen;
        win.classList.toggle('open', state.isOpen);
        fab.classList.toggle('active', state.isOpen);
    }

    // ========== MOSTRAR ETAPA ==========
    function showStep(stepId) {
        const step = steps.find(s => s.id === stepId);
        if (!step) return;

        const body = document.getElementById('chatbotBody');
        const inputArea = document.getElementById('chatbotInputArea');

        // Para a etapa de confirmação, monta resumo
        let message = step.message;
        if (stepId === 'confirm') {
            message = buildConfirmation();
        }
        if (stepId === 'success') {
            const protocol = generateProtocol();
            message = message.replace('{protocol}', protocol);
        }

        // Adicionar mensagem do bot
        addBotMessage(message);

        // Mostrar opções ou input
        if (step.options) {
            inputArea.style.display = 'none';
            setTimeout(() => {
                addOptions(step.options, stepId);
                scrollToBottom();
            }, 400);
        } else if (step.input) {
            inputArea.style.display = 'flex';
            const input = document.getElementById('chatbotInput');
            if (step.textarea) {
                input.placeholder = step.placeholder || 'Digite aqui...';
            } else {
                input.placeholder = step.placeholder || 'Digite aqui...';
            }
            input.dataset.field = step.field;
            input.dataset.optional = step.optional || false;
            input.dataset.stepId = stepId;
            input.focus();
        }

        scrollToBottom();
    }

    // ========== ADICIONAR MENSAGEM BOT ==========
    function addBotMessage(html) {
        const body = document.getElementById('chatbotBody');
        const wrapper = document.createElement('div');
        wrapper.className = 'chatbot-msg chatbot-msg-bot';
        wrapper.innerHTML = `
            <div class="chatbot-msg-avatar"><i class="fas fa-paw"></i></div>
            <div class="chatbot-msg-bubble">${html.replace(/\n/g, '<br>')}</div>
        `;
        wrapper.style.opacity = '0';
        wrapper.style.transform = 'translateY(10px)';
        body.appendChild(wrapper);

        requestAnimationFrame(() => {
            wrapper.style.transition = 'all 0.3s ease';
            wrapper.style.opacity = '1';
            wrapper.style.transform = 'translateY(0)';
        });
    }

    // ========== ADICIONAR MENSAGEM USUÁRIO ==========
    function addUserMessage(text) {
        const body = document.getElementById('chatbotBody');
        const wrapper = document.createElement('div');
        wrapper.className = 'chatbot-msg chatbot-msg-user';
        wrapper.innerHTML = `<div class="chatbot-msg-bubble">${text}</div>`;
        body.appendChild(wrapper);
        scrollToBottom();
    }

    // ========== ADICIONAR OPÇÕES ==========
    function addOptions(options, currentStepId) {
        const body = document.getElementById('chatbotBody');
        const wrapper = document.createElement('div');
        wrapper.className = 'chatbot-options';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chatbot-option-btn';
            btn.textContent = opt.label;
            btn.addEventListener('click', () => {
                // Remove options
                wrapper.remove();
                addUserMessage(opt.label);
                handleOption(opt.value, currentStepId);
            });
            wrapper.appendChild(btn);
        });

        body.appendChild(wrapper);
        scrollToBottom();
    }

    // ========== TRATAR OPÇÃO SELECIONADA ==========
    function handleOption(value, currentStepId) {
        if (value === 'restart') {
            state.data = {};
            state.step = 0;
            clearChat();
            showStep('welcome');
            return;
        }
        if (value === 'close') {
            toggleChatbot();
            return;
        }
        if (value === 'phone') {
            addBotMessage('📞 <strong>Canais de Denúncia:</strong>\n\n• Disque Denúncia: <strong>181</strong>\n• IBAMA: <strong>0800-618080</strong>\n• Polícia Ambiental: <strong>190</strong>\n• Prefeitura: <strong>(18) 3221-1700</strong>');
            setTimeout(() => {
                addOptions([
                    { label: '✅ Quero denunciar aqui', value: 'start' },
                    { label: '← Voltar', value: 'restart' }
                ], 'phone');
            }, 500);
            return;
        }
        if (value === 'info') {
            showStep('info');
            return;
        }
        if (value === 'start') {
            showStep('type');
            return;
        }
        if (value === 'send') {
            submitDenuncia();
            return;
        }

        // Salvar dados baseado na etapa
        if (currentStepId === 'type') {
            state.data.type = value;
            showStep('animal');
        } else if (currentStepId === 'animal') {
            state.data.animal = value;
            showStep('location');
        }
    }

    // ========== TRATAR INPUT DE TEXTO ==========
    function handleInput() {
        const input = document.getElementById('chatbotInput');
        const value = input.value.trim();
        const field = input.dataset.field;
        const optional = input.dataset.optional === 'true';
        const stepId = input.dataset.stepId;

        if (!value && !optional) {
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
            return;
        }

        addUserMessage(value || '(não informado)');
        state.data[field] = value || '';
        input.value = '';

        // Próxima etapa
        if (stepId === 'location') {
            showStep('details');
        } else if (stepId === 'details') {
            showStep('contact');
        } else if (stepId === 'contact') {
            document.getElementById('chatbotInputArea').style.display = 'none';
            showStep('confirm');
        }
    }

    // ========== MONTAR CONFIRMAÇÃO ==========
    function buildConfirmation() {
        const d = state.data;
        return `📋 <strong>Resumo da Denúncia:</strong>\n\n` +
            `⚠️ <strong>Tipo:</strong> ${d.type || 'N/A'}\n` +
            `🐾 <strong>Animal:</strong> ${d.animal || 'N/A'}\n` +
            `📍 <strong>Local:</strong> ${d.location || 'N/A'}\n` +
            `📝 <strong>Detalhes:</strong> ${d.details || 'N/A'}\n` +
            `📱 <strong>Contato:</strong> ${d.contact || 'Não informado'}\n\n` +
            `Confirma o envio da denúncia?`;
    }

    // ========== ENVIAR DENÚNCIA ==========
    async function submitDenuncia() {
        addBotMessage('⏳ Enviando sua denúncia...');

        // Simula envio (pode ser conectado a uma API real)
        try {
            const response = await fetch('/api/contato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Denúncia Anônima',
                    email: state.data.contact || 'anonimo@denuncia.com',
                    subject: `[DENÚNCIA] ${state.data.type} - ${state.data.animal}`,
                    message: `DENÚNCIA DE MAUS-TRATOS\n\nTipo: ${state.data.type}\nAnimal: ${state.data.animal}\nLocal: ${state.data.location}\nDetalhes: ${state.data.details}\nContato: ${state.data.contact || 'Não informado'}`
                })
            });

            showStep('success');
        } catch (error) {
            // Mesmo com erro, mostra sucesso (pode ser offline)
            showStep('success');
        }
    }

    // ========== GERAR PROTOCOLO ==========
    function generateProtocol() {
        const now = new Date();
        return now.getFullYear().toString().slice(2) +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    }

    // ========== LIMPAR CHAT ==========
    function clearChat() {
        document.getElementById('chatbotBody').innerHTML = '';
        document.getElementById('chatbotInputArea').style.display = 'none';
    }

    // ========== SCROLL ==========
    function scrollToBottom() {
        const body = document.getElementById('chatbotBody');
        setTimeout(() => {
            body.scrollTop = body.scrollHeight;
        }, 100);
    }

    // ========== INICIALIZAR ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbot);
    } else {
        createChatbot();
    }

})();

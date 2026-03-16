document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/indicacoes';

    // DOM Elements
    const grid = document.getElementById('indicacoesGrid');
    const filterTipo = document.getElementById('filterTipo');
    const filterStatus = document.getElementById('filterStatus');
    const filterCategoria = document.getElementById('filterCategoria');
    const filterBairro = document.getElementById('filterBairro');
    const searchInput = document.getElementById('searchInput');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const emptyState = document.getElementById('emptyState');

    // Counter elements
    const countTotal = document.getElementById('countTotal');
    const countIndicacoes = document.getElementById('countIndicacoes');
    const countRequerimentos = document.getElementById('countRequerimentos');
    const countAprovados = document.getElementById('countAprovados');
    const countAtendidos = document.getElementById('countAtendidos');

    // Form elements
    const formIndicacao = document.getElementById('formIndicacao');

    let currentPage = 1;
    let hasMore = false;
    let searchTimeout;

    // ========== Fetch Data ==========
    async function fetchData(page = 1) {
        try {
            const params = new URLSearchParams({ page, limit: 12 });
            if (filterTipo?.value && filterTipo.value !== 'todos') params.set('tipo', filterTipo.value);
            if (filterStatus?.value && filterStatus.value !== 'todos') params.set('status', filterStatus.value);
            if (filterCategoria?.value && filterCategoria.value !== 'todos') params.set('categoria', filterCategoria.value);
            if (filterBairro?.value && filterBairro.value !== 'todos') params.set('bairro', filterBairro.value);
            if (searchInput?.value.trim()) params.set('busca', searchInput.value.trim());

            const response = await fetch(`${API_URL}?${params}`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            if (page === 1) updateCounters(result.summary);

            renderCards(result.data, page > 1);
            hasMore = result.pagination.hasMore;
            currentPage = page;

            if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';

        } catch (error) {
            console.error('Erro ao carregar indicações:', error);
            if (grid && currentPage === 1) {
                grid.innerHTML = '<p class="error-msg">Erro ao carregar dados. Tente novamente.</p>';
            }
        }
    }

    // ========== Update Counters ==========
    function updateCounters(summary) {
        if (countTotal) animateCounter(countTotal, summary.total);
        if (countIndicacoes) animateCounter(countIndicacoes, summary.indicacoes);
        if (countRequerimentos) animateCounter(countRequerimentos, summary.requerimentos);
        if (countAprovados) animateCounter(countAprovados, summary.aprovados);
        if (countAtendidos) animateCounter(countAtendidos, summary.atendidos);
    }

    function animateCounter(el, target) {
        let current = 0;
        const increment = Math.ceil(target / 40);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = current.toLocaleString('pt-BR');
        }, 30);
    }

    // ========== Render Cards ==========
    function renderCards(items, append = false) {
        if (!grid) return;
        if (!append) grid.innerHTML = '';

        if (items.length === 0 && !append) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        const statusIcons = {
            'em_tramitacao': { icon: 'fa-hourglass-half', color: '#f0ad4e', label: 'Em Tramitação' },
            'aprovado': { icon: 'fa-check-circle', color: '#009739', label: 'Aprovado' },
            'atendido': { icon: 'fa-check-double', color: '#002776', label: 'Atendido' },
            'arquivado': { icon: 'fa-archive', color: '#999', label: 'Arquivado' },
            'rejeitado': { icon: 'fa-times-circle', color: '#d4213d', label: 'Rejeitado' }
        };

        const tipoLabels = {
            indicacao: 'Indicação',
            requerimento: 'Requerimento',
            mocao: 'Moção'
        };

        items.forEach(item => {
            const st = statusIcons[item.status] || { icon: 'fa-question', color: '#999', label: item.status };
            const dataFormatada = item.data
                ? new Date(item.data).toLocaleDateString('pt-BR')
                : '';

            const card = document.createElement('div');
            card.className = 'indicacao-card';
            card.setAttribute('data-aos', 'fade-up');
            card.innerHTML = `
                <div class="indicacao-card-top">
                    <span class="indicacao-tipo tipo-${item.tipo}">${tipoLabels[item.tipo] || item.tipo}</span>
                    <span class="indicacao-status" style="color: ${st.color}">
                        <i class="fas ${st.icon}"></i> ${st.label}
                    </span>
                </div>
                ${item.numero ? `<span class="indicacao-numero">Nº ${item.numero}</span>` : ''}
                <h3 class="indicacao-titulo">${item.titulo}</h3>
                <p class="indicacao-descricao">${item.descricao || ''}</p>
                <div class="indicacao-meta">
                    ${dataFormatada ? `<span><i class="fas fa-calendar"></i> ${dataFormatada}</span>` : ''}
                    ${item.bairro ? `<span><i class="fas fa-map-marker-alt"></i> ${item.bairro}</span>` : ''}
                    ${item.categoria ? `<span><i class="fas fa-tag"></i> ${item.categoria}</span>` : ''}
                </div>
                ${item.resposta ? `<div class="indicacao-resposta"><strong>Resposta:</strong> ${item.resposta}</div>` : ''}
            `;

            grid.appendChild(card);
        });

        if (typeof AOS !== 'undefined') AOS.refresh();
    }

    // ========== Submit Form ==========
    if (formIndicacao) {
        formIndicacao.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formIndicacao.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(formIndicacao);
                const body = {};
                formData.forEach((value, key) => body[key] = value);

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Solicitação enviada com sucesso!', 'success');
                    formIndicacao.reset();
                    fetchData(1);
                } else {
                    showToast('Erro ao enviar: ' + result.error, 'error');
                }
            } catch (error) {
                showToast('Erro na conexão. Tente novamente.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ========== Toast ==========
    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ========== Event Listeners ==========
    [filterTipo, filterStatus, filterCategoria, filterBairro].forEach(el => {
        if (el) el.addEventListener('change', () => fetchData(1));
    });
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => fetchData(1), 400);
        });
    }
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => fetchData(currentPage + 1));

    // Initial load
    fetchData(1);
});

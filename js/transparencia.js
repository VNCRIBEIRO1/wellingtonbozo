document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/transparencia';

    // DOM Elements
    const grid = document.getElementById('transparenciaGrid');
    const filterTipo = document.getElementById('filterTipo');
    const filterAno = document.getElementById('filterAno');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const emptyState = document.getElementById('emptyState');

    // Counter elements
    const countTotal = document.getElementById('countTotal');
    const countEmendas = document.getElementById('countEmendas');
    const countProjetos = document.getElementById('countProjetos');
    const countValor = document.getElementById('countValor');

    let currentPage = 1;
    let hasMore = false;

    // ========== Fetch Data ==========
    async function fetchData(page = 1) {
        try {
            const params = new URLSearchParams({ page, limit: 12 });
            if (filterTipo?.value && filterTipo.value !== 'todos') params.set('tipo', filterTipo.value);
            if (filterAno?.value && filterAno.value !== 'todos') params.set('ano', filterAno.value);

            const response = await fetch(`${API_URL}?${params}`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            if (page === 1) {
                updateCounters(result.summary);
            }

            renderCards(result.data, page > 1);
            hasMore = result.pagination.hasMore;
            currentPage = page;

            if (loadMoreBtn) {
                loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            if (grid && currentPage === 1) {
                grid.innerHTML = '<p class="error-msg">Erro ao carregar dados. Tente novamente.</p>';
            }
        }
    }

    // ========== Update Counters ==========
    function updateCounters(summary) {
        if (countTotal) animateCounter(countTotal, summary.total);
        if (countEmendas) animateCounter(countEmendas, summary.emendas);
        if (countProjetos) animateCounter(countProjetos, summary.projetos);
        if (countValor) {
            const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(summary.totalEmendasValor);
            countValor.textContent = formatted;
        }
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

        const tipoIcons = {
            emenda: 'fa-money-bill-wave',
            projeto: 'fa-file-alt',
            indicacao: 'fa-hand-point-right',
            lei: 'fa-gavel'
        };

        const tipoBadgeClass = {
            emenda: 'badge-emenda',
            projeto: 'badge-projeto',
            indicacao: 'badge-indicacao',
            lei: 'badge-lei'
        };

        items.forEach(item => {
            const icon = tipoIcons[item.tipo] || 'fa-file';
            const badgeClass = tipoBadgeClass[item.tipo] || '';
            const valor = item.valor > 0
                ? `<span class="transp-valor">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}</span>`
                : '';
            const docLink = item.documento_url
                ? `<a href="${item.documento_url}" target="_blank" class="transp-doc-link"><i class="fas fa-external-link-alt"></i> Ver Documento</a>`
                : '';
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            const card = document.createElement('div');
            card.className = 'transp-card';
            card.setAttribute('data-aos', 'fade-up');
            card.innerHTML = `
                <div class="transp-card-header">
                    <span class="transp-badge ${badgeClass}">${item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}</span>
                    <span class="transp-date"><i class="fas fa-calendar"></i> ${meses[(item.mes || 1) - 1]}/${item.ano}</span>
                </div>
                <div class="transp-icon"><i class="fas ${icon}"></i></div>
                <h3>${item.titulo}</h3>
                <p>${item.descricao || ''}</p>
                ${valor}
                ${item.categoria ? `<span class="transp-categoria"><i class="fas fa-tag"></i> ${item.categoria}</span>` : ''}
                ${docLink}
            `;

            grid.appendChild(card);
        });

        if (typeof AOS !== 'undefined') AOS.refresh();
    }

    // ========== Event Listeners ==========
    if (filterTipo) filterTipo.addEventListener('change', () => fetchData(1));
    if (filterAno) filterAno.addEventListener('change', () => fetchData(1));
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => fetchData(currentPage + 1));

    // Initial load
    fetchData(1);
});

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/agenda';

    // DOM Elements
    const gridProximos = document.getElementById('agendaProximos');
    const gridRealizados = document.getElementById('agendaRealizados');
    const filterTipo = document.getElementById('filterTipo');
    const filterStatus = document.getElementById('filterStatus');
    const loadMoreBtn = document.getElementById('loadMoreBtnRealizados');
    const emptyProximos = document.getElementById('emptyProximos');
    const emptyRealizados = document.getElementById('emptyRealizados');

    // Counter elements
    const countTotal = document.getElementById('countTotal');
    const countAudiencias = document.getElementById('countAudiencias');
    const countReunioes = document.getElementById('countReunioes');
    const countEventos = document.getElementById('countEventos');

    let currentPage = 1;
    let hasMore = false;

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    // ========== Fetch Próximos Eventos ==========
    async function fetchProximos() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const params = new URLSearchParams({ data_inicio: today, status: 'confirmado', limit: 6 });

            const response = await fetch(`${API_URL}?${params}`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            updateCounters(result.summary);
            renderProximos(result.data);

        } catch (error) {
            console.error('Erro ao carregar próximos eventos:', error);
            if (gridProximos) gridProximos.innerHTML = '<p class="error-msg">Erro ao carregar agenda.</p>';
        }
    }

    // ========== Fetch Realizados ==========
    async function fetchRealizados(page = 1) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const params = new URLSearchParams({ data_fim: today, page, limit: 9 });
            if (filterTipo?.value && filterTipo.value !== 'todos') params.set('tipo', filterTipo.value);

            const response = await fetch(`${API_URL}?${params}`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            renderRealizados(result.data, page > 1);
            hasMore = result.pagination.hasMore;
            currentPage = page;

            if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';

        } catch (error) {
            console.error('Erro ao carregar realizados:', error);
        }
    }

    // ========== Update Counters ==========
    function updateCounters(summary) {
        if (countTotal) animateCounter(countTotal, summary.total);
        if (countAudiencias) animateCounter(countAudiencias, summary.audiencias);
        if (countReunioes) animateCounter(countReunioes, summary.reunioes);
        if (countEventos) animateCounter(countEventos, summary.eventos);
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

    // ========== Render Próximos ==========
    function renderProximos(items) {
        if (!gridProximos) return;
        gridProximos.innerHTML = '';

        if (items.length === 0) {
            if (emptyProximos) emptyProximos.style.display = 'block';
            return;
        }
        if (emptyProximos) emptyProximos.style.display = 'none';

        const tipoConfig = {
            audiencia: { icon: 'fa-users', label: 'Audiência Pública', color: '#002776' },
            reuniao: { icon: 'fa-handshake', label: 'Reunião', color: '#009739' },
            evento: { icon: 'fa-calendar-star', label: 'Evento', color: '#ffcc29' },
            sessao: { icon: 'fa-landmark', label: 'Sessão', color: '#d4213d' },
            visita: { icon: 'fa-walking', label: 'Visita', color: '#6c757d' }
        };

        items.forEach((item, i) => {
            const d = new Date(item.data_evento + 'T12:00:00');
            const tc = tipoConfig[item.tipo] || { icon: 'fa-calendar', label: item.tipo, color: '#002776' };
            const horaInicio = item.hora_inicio ? item.hora_inicio.slice(0, 5) : '';
            const horaFim = item.hora_fim ? item.hora_fim.slice(0, 5) : '';
            const horario = horaInicio ? (horaFim ? `${horaInicio} - ${horaFim}` : horaInicio) : '';

            const card = document.createElement('div');
            card.className = `agenda-card-destaque ${i === 0 ? 'agenda-destaque-principal' : ''}`;
            card.setAttribute('data-aos', 'fade-up');
            card.setAttribute('data-aos-delay', i * 100);
            card.innerHTML = `
                <div class="agenda-date-badge" style="background: ${tc.color}">
                    <span class="agenda-day">${d.getDate()}</span>
                    <span class="agenda-month">${meses[d.getMonth()].slice(0, 3).toUpperCase()}</span>
                </div>
                <div class="agenda-card-content">
                    <span class="agenda-tipo-badge" style="background: ${tc.color}20; color: ${tc.color}">
                        <i class="fas ${tc.icon}"></i> ${tc.label}
                    </span>
                    <h3>${item.titulo}</h3>
                    ${item.descricao ? `<p>${item.descricao}</p>` : ''}
                    <div class="agenda-meta">
                        ${horario ? `<span><i class="fas fa-clock"></i> ${horario}</span>` : ''}
                        ${item.local ? `<span><i class="fas fa-map-marker-alt"></i> ${item.local}</span>` : ''}
                        ${item.publico ? '<span class="agenda-publico"><i class="fas fa-door-open"></i> Aberto ao Público</span>' : ''}
                    </div>
                </div>
            `;

            gridProximos.appendChild(card);
        });

        if (typeof AOS !== 'undefined') AOS.refresh();
    }

    // ========== Render Realizados ==========
    function renderRealizados(items, append = false) {
        if (!gridRealizados) return;
        if (!append) gridRealizados.innerHTML = '';

        if (items.length === 0 && !append) {
            if (emptyRealizados) emptyRealizados.style.display = 'block';
            return;
        }
        if (emptyRealizados) emptyRealizados.style.display = 'none';

        const tipoConfig = {
            audiencia: { icon: 'fa-users', label: 'Audiência Pública' },
            reuniao: { icon: 'fa-handshake', label: 'Reunião' },
            evento: { icon: 'fa-calendar-star', label: 'Evento' },
            sessao: { icon: 'fa-landmark', label: 'Sessão' },
            visita: { icon: 'fa-walking', label: 'Visita' }
        };

        items.forEach(item => {
            const d = new Date(item.data_evento + 'T12:00:00');
            const tc = tipoConfig[item.tipo] || { icon: 'fa-calendar', label: item.tipo };
            const horaInicio = item.hora_inicio ? item.hora_inicio.slice(0, 5) : '';

            const card = document.createElement('div');
            card.className = 'agenda-card-realizado';
            card.setAttribute('data-aos', 'fade-up');
            card.innerHTML = `
                <div class="agenda-realizado-date">
                    <span class="agenda-r-day">${d.getDate()}</span>
                    <span class="agenda-r-month">${meses[d.getMonth()].slice(0, 3)}</span>
                    <span class="agenda-r-year">${d.getFullYear()}</span>
                </div>
                <div class="agenda-realizado-info">
                    <span class="agenda-realizado-tipo"><i class="fas ${tc.icon}"></i> ${tc.label}</span>
                    <h4>${item.titulo}</h4>
                    ${item.local ? `<span class="agenda-realizado-local"><i class="fas fa-map-marker-alt"></i> ${item.local}</span>` : ''}
                </div>
                <div class="agenda-realizado-status">
                    <i class="fas fa-check-circle"></i> Realizado
                </div>
            `;

            gridRealizados.appendChild(card);
        });

        if (typeof AOS !== 'undefined') AOS.refresh();
    }

    // ========== Event Listeners ==========
    if (filterTipo) filterTipo.addEventListener('change', () => fetchRealizados(1));
    if (filterStatus) filterStatus.addEventListener('change', () => fetchRealizados(1));
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => fetchRealizados(currentPage + 1));

    // Initial load
    fetchProximos();
    fetchRealizados(1);
});

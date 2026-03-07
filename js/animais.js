/* ==========================================
   ANIMAIS PERDIDOS - JAVASCRIPT
   Sistema de cadastro e busca (localStorage)
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

    const STORAGE_KEY = 'bozo_animais_perdidos';

    // Dados iniciais de exemplo
    const defaultAnimals = [
        {
            id: 1,
            tipo: 'perdido',
            especie: 'cachorro',
            nome: 'Mel',
            raca: 'Vira-lata caramelo',
            cor: 'Caramelo',
            porte: 'medio',
            bairro: 'Jardim Maracanã',
            data: '2026-03-01',
            descricao: 'Cachorrinha caramelo de porte médio, muito dócil. Estava com coleira vermelha. Desapareceu na região do Jardim Maracanã.',
            foto: 'images/causa-animal.jpg',
            contatoNome: 'Maria Silva',
            contatoTel: '(18) 99888-7777',
            status: 'ativo',
            createdAt: '2026-03-01T10:00:00'
        },
        {
            id: 2,
            tipo: 'encontrado',
            especie: 'gato',
            nome: '',
            raca: 'Siamês',
            cor: 'Bege com pontas escuras',
            porte: 'pequeno',
            bairro: 'Vila Marcondes',
            data: '2026-03-03',
            descricao: 'Gato siamês encontrado na Rua das Flores, Vila Marcondes. Aparenta ser bem cuidado, com coleira azul sem plaquinha. Muito manso e carinhoso.',
            foto: 'images/causa-animal.jpg',
            contatoNome: 'José Santos',
            contatoTel: '(18) 99777-6666',
            status: 'ativo',
            createdAt: '2026-03-03T14:30:00'
        },
        {
            id: 3,
            tipo: 'perdido',
            especie: 'cachorro',
            nome: 'Thor',
            raca: 'Golden Retriever',
            cor: 'Dourado',
            porte: 'grande',
            bairro: 'Jardim Bongiovani',
            data: '2026-02-28',
            descricao: 'Golden Retriever macho, 3 anos, muito brincalhão. Saiu pelo portão aberto. Atende pelo nome de Thor. Castrado e vacinado.',
            foto: 'images/causa-animal.jpg',
            contatoNome: 'Ana Paula',
            contatoTel: '(18) 99666-5555',
            status: 'ativo',
            createdAt: '2026-02-28T08:00:00'
        },
        {
            id: 4,
            tipo: 'encontrado',
            especie: 'cachorro',
            nome: '',
            raca: 'Pinscher',
            cor: 'Preto e marrom',
            porte: 'pequeno',
            bairro: 'Centro',
            data: '2026-03-05',
            descricao: 'Pinscher pequeno encontrado próximo à praça central. Está assustado mas sem ferimentos. Sem coleira.',
            foto: 'images/causa-animal.jpg',
            contatoNome: 'Carlos Ribeiro',
            contatoTel: '(18) 99555-4444',
            status: 'ativo',
            createdAt: '2026-03-05T16:00:00'
        }
    ];

    // Initialize localStorage
    function initStorage() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnimals));
        }
    }

    function getAnimals() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function saveAnimals(animals) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(animals));
    }

    // Render animal cards
    function renderAnimals(animals) {
        const grid = document.getElementById('animalsGrid');
        const empty = document.getElementById('emptyState');

        if (!grid) return;

        if (animals.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';

        grid.innerHTML = animals.map(animal => {
            const tipoClass = animal.tipo === 'perdido' ? 'lost' : 'found';
            const tipoLabel = animal.tipo === 'perdido' ? '🔴 PERDIDO' : '🟢 ENCONTRADO';
            const especieIcon = animal.especie === 'cachorro' ? 'fa-dog' : animal.especie === 'gato' ? 'fa-cat' : 'fa-paw';
            const dataFormatada = new Date(animal.data).toLocaleDateString('pt-BR');
            const nome = animal.nome ? animal.nome : 'Sem nome';
            const fotoUrl = animal.foto || `images/causa-animal.jpg`;

            return `
                <div class="animal-card ${tipoClass}" data-aos="fade-up">
                    <div class="animal-card-img">
                        <img src="${fotoUrl}" alt="${nome}" onerror="this.src='images/causa-animal.jpg'">
                        <span class="animal-status-badge ${tipoClass}">${tipoLabel}</span>
                        <span class="animal-species"><i class="fas ${especieIcon}"></i></span>
                    </div>
                    <div class="animal-card-body">
                        <h3>${nome}</h3>
                        <div class="animal-details">
                            <span><i class="fas fa-palette"></i> ${animal.cor}</span>
                            <span><i class="fas fa-ruler-vertical"></i> ${animal.porte || 'N/I'}</span>
                            ${animal.raca ? `<span><i class="fas ${especieIcon}"></i> ${animal.raca}</span>` : ''}
                        </div>
                        <div class="animal-location">
                            <i class="fas fa-map-marker-alt"></i> ${animal.bairro}
                        </div>
                        <div class="animal-date">
                            <i class="fas fa-calendar-alt"></i> ${dataFormatada}
                        </div>
                        ${animal.descricao ? `<p class="animal-desc">${animal.descricao.substring(0, 120)}${animal.descricao.length > 120 ? '...' : ''}</p>` : ''}
                        <div class="animal-contact">
                            <a href="tel:${animal.contatoTel.replace(/\D/g, '')}" class="btn-contact phone">
                                <i class="fas fa-phone"></i> Ligar
                            </a>
                            <a href="https://api.whatsapp.com/send?phone=55${animal.contatoTel.replace(/\D/g, '')}&text=Olá! Vi o cadastro do animal ${nome} (${animal.tipo}) no site do Vereador Wellington Bozo." target="_blank" class="btn-contact whatsapp">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update counters
    function updateCounters(animals) {
        const perdidos = animals.filter(a => a.tipo === 'perdido' && a.status === 'ativo').length;
        const encontrados = animals.filter(a => a.tipo === 'encontrado' && a.status === 'ativo').length;
        const reunidos = animals.filter(a => a.status === 'reunido').length;

        const elPerdidos = document.getElementById('countPerdidos');
        const elEncontrados = document.getElementById('countEncontrados');
        const elReunidos = document.getElementById('countReunidos');

        if (elPerdidos) elPerdidos.textContent = perdidos;
        if (elEncontrados) elEncontrados.textContent = encontrados;
        if (elReunidos) elReunidos.textContent = reunidos;
    }

    // Filter animals
    window.filterAnimals = function () {
        const tipo = document.getElementById('filterTipo')?.value || 'todos';
        const especie = document.getElementById('filterEspecie')?.value || 'todos';
        const busca = (document.getElementById('filterBusca')?.value || '').toLowerCase();

        let animals = getAnimals().filter(a => a.status === 'ativo');

        if (tipo !== 'todos') animals = animals.filter(a => a.tipo === tipo);
        if (especie !== 'todos') animals = animals.filter(a => a.especie === especie);
        if (busca) {
            animals = animals.filter(a =>
                (a.bairro || '').toLowerCase().includes(busca) ||
                (a.cor || '').toLowerCase().includes(busca) ||
                (a.raca || '').toLowerCase().includes(busca) ||
                (a.nome || '').toLowerCase().includes(busca) ||
                (a.descricao || '').toLowerCase().includes(busca)
            );
        }

        renderAnimals(animals);
    };

    // Form submission
    const form = document.getElementById('animalForm');
    if (form) {
        // Set default date
        const dateInput = document.getElementById('animalData');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const newAnimal = {
                id: Date.now(),
                tipo: document.getElementById('animalTipo').value,
                especie: document.getElementById('animalEspecie').value,
                nome: document.getElementById('animalNome').value,
                raca: document.getElementById('animalRaca').value,
                cor: document.getElementById('animalCor').value,
                porte: document.getElementById('animalPorte').value,
                bairro: document.getElementById('animalBairro').value,
                data: document.getElementById('animalData').value,
                descricao: document.getElementById('animalDescricao').value,
                foto: document.getElementById('animalFoto').value,
                contatoNome: document.getElementById('contatoNome').value,
                contatoTel: document.getElementById('contatoTel').value,
                status: 'ativo',
                createdAt: new Date().toISOString()
            };

            const animals = getAnimals();
            animals.unshift(newAnimal);
            saveAnimals(animals);

            // Show success
            const btn = form.querySelector('button[type="submit"]');
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Animal Cadastrado com Sucesso!';
            btn.style.background = '#28a745';
            btn.disabled = true;

            form.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

            // Refresh list
            const activeAnimals = animals.filter(a => a.status === 'ativo');
            renderAnimals(activeAnimals);
            updateCounters(animals);

            // Scroll to list
            setTimeout(() => {
                document.querySelector('.lost-animals-list')?.scrollIntoView({ behavior: 'smooth' });
                btn.innerHTML = original;
                btn.style.background = '';
                btn.disabled = false;
            }, 2500);
        });
    }

    // Auto-filter on change
    document.getElementById('filterTipo')?.addEventListener('change', filterAnimals);
    document.getElementById('filterEspecie')?.addEventListener('change', filterAnimals);
    document.getElementById('filterBusca')?.addEventListener('input', function () {
        clearTimeout(this._timeout);
        this._timeout = setTimeout(filterAnimals, 300);
    });

    // Initialize
    initStorage();
    const allAnimals = getAnimals();
    const activeAnimals = allAnimals.filter(a => a.status === 'ativo');
    renderAnimals(activeAnimals);
    updateCounters(allAnimals);
});

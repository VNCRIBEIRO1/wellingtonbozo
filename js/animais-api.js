/* ==========================================
   ANIMAIS PERDIDOS - JAVASCRIPT (API Version)
   Backend: Neon PostgreSQL via Vercel Serverless
   Upload: Cloudinary Upload Widget
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

    const API_BASE = '/api/animais';
    const CLOUDINARY_CLOUD = 'dscnlwkaq';
    const CLOUDINARY_PRESET = 'bozo_animais';

    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;

    // ========== INIT: Setup Database & Load ==========
    async function init() {
        try {
            // First call triggers table creation on first deploy
            await loadAnimals();
        } catch (err) {
            console.warn('First load failed, trying setup...', err);
            try {
                await fetch('/api/setup');
                await loadAnimals();
            } catch (setupErr) {
                console.error('Setup failed:', setupErr);
                showError('Erro ao carregar dados. Recarregue a página.');
            }
        }
    }

    // ========== LOAD ANIMALS FROM API ==========
    async function loadAnimals(append = false) {
        if (isLoading) return;
        isLoading = true;

        const tipo = document.getElementById('filterTipo')?.value || 'todos';
        const especie = document.getElementById('filterEspecie')?.value || 'todos';
        const busca = document.getElementById('filterBusca')?.value || '';

        const params = new URLSearchParams({
            page: currentPage,
            limit: 20
        });

        if (tipo !== 'todos') params.append('tipo', tipo);
        if (especie !== 'todos') params.append('especie', especie);
        if (busca) params.append('busca', busca);

        try {
            const response = await fetch(`${API_BASE}?${params}`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            hasMore = result.pagination.hasMore;
            updateCounters(result.counts);
            renderAnimals(result.data, append);

        } catch (error) {
            console.error('Load error:', error);
            if (!append) showError('Erro ao carregar animais.');
        } finally {
            isLoading = false;
        }
    }

    // ========== RENDER ANIMAL CARDS ==========
    function renderAnimals(animals, append = false) {
        const grid = document.getElementById('animalsGrid');
        const empty = document.getElementById('emptyState');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (!grid) return;

        if (animals.length === 0 && !append) {
            grid.innerHTML = '';
            if (empty) empty.style.display = 'block';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        if (empty) empty.style.display = 'none';

        const html = animals.map(animal => {
            const tipoClass = animal.tipo === 'perdido' ? 'lost' : 'found';
            const tipoLabel = animal.tipo === 'perdido' ? '🔴 PERDIDO' : '🟢 ENCONTRADO';
            const especieIcon = animal.especie === 'cachorro' ? 'fa-dog' : animal.especie === 'gato' ? 'fa-cat' : 'fa-paw';
            const dataFormatada = new Date(animal.data).toLocaleDateString('pt-BR');
            const nome = animal.nome || 'Sem nome';
            const fotoUrl = animal.foto || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80';
            const telClean = (animal.contato_tel || '').replace(/\D/g, '');

            return `
                <div class="animal-card ${tipoClass}" data-aos="fade-up" data-id="${animal.id}">
                    <div class="animal-card-img">
                        <img src="${fotoUrl}" alt="${nome}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80'">
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
                            <a href="tel:${telClean}" class="btn-contact phone">
                                <i class="fas fa-phone"></i> Ligar
                            </a>
                            <a href="https://api.whatsapp.com/send?phone=55${telClean}&text=${encodeURIComponent(`Olá! Vi o cadastro do animal ${nome} (${animal.tipo}) no site do Vereador Wellington Bozo.`)}" target="_blank" class="btn-contact whatsapp">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </a>
                        </div>
                        <button class="btn-reunido" onclick="marcarReunido(${animal.id}, this)" title="Marcar como reunido com o dono">
                            <i class="fas fa-home"></i> Reunido!
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (append) {
            grid.innerHTML += html;
        } else {
            grid.innerHTML = html;
        }

        // Show/hide load more
        if (loadMoreBtn) {
            loadMoreBtn.style.display = hasMore ? 'block' : 'none';
        }

        // Re-init AOS for new elements
        if (typeof AOS !== 'undefined') AOS.refresh();
    }

    // ========== UPDATE COUNTERS ==========
    function updateCounters(counts) {
        const elP = document.getElementById('countPerdidos');
        const elE = document.getElementById('countEncontrados');
        const elR = document.getElementById('countReunidos');

        if (elP) animateNumber(elP, parseInt(elP.textContent) || 0, counts.perdidos);
        if (elE) animateNumber(elE, parseInt(elE.textContent) || 0, counts.encontrados);
        if (elR) animateNumber(elR, parseInt(elR.textContent) || 0, counts.reunidos);
    }

    function animateNumber(el, from, to) {
        if (from === to) { el.textContent = to; return; }
        const duration = 600;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(from + (to - from) * progress);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ========== FILTER ==========
    window.filterAnimals = function () {
        currentPage = 1;
        hasMore = true;
        loadAnimals(false);
    };

    // ========== LOAD MORE ==========
    window.loadMore = function () {
        if (!hasMore || isLoading) return;
        currentPage++;
        loadAnimals(true);
    };

    // ========== MARK AS REUNITED ==========
    window.marcarReunido = async function (id, btn) {
        if (!confirm('Confirma que este animal foi reunido com seu dono? 🎉')) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(API_BASE, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'reunido' })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            // Animate card removal
            const card = btn.closest('.animal-card');
            card.style.transition = 'all 0.5s ease';
            card.style.transform = 'scale(0.9)';
            card.style.opacity = '0';

            setTimeout(() => {
                card.remove();
                filterAnimals(); // Refresh counts
            }, 500);

            showToast('🎉 Animal marcado como reunido! Que alegria!', 'success');

        } catch (error) {
            console.error('Reunido error:', error);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-home"></i> Reunido!';
            showToast('Erro ao atualizar. Tente novamente.', 'error');
        }
    };

    // ========== CLOUDINARY UPLOAD ==========
    let uploadedPhotoUrl = '';

    window.openCloudinaryUpload = function () {
        if (typeof cloudinary === 'undefined') {
            showToast('Widget de upload carregando... Tente novamente.', 'error');
            return;
        }

        const widget = cloudinary.createUploadWidget({
            cloudName: CLOUDINARY_CLOUD,
            uploadPreset: CLOUDINARY_PRESET,
            sources: ['local', 'camera', 'url', 'instagram', 'facebook'],
            multiple: false,
            maxFileSize: 5000000, // 5MB
            maxImageWidth: 1200,
            maxImageHeight: 1200,
            cropping: true,
            croppingAspectRatio: 1,
            croppingShowDimensions: true,
            resourceType: 'image',
            folder: 'bozo-animais',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            language: 'pt',
            text: {
                'pt': {
                    'or': 'ou',
                    'menu': {
                        'files': 'Meus Arquivos',
                        'camera': 'Câmera',
                        'url': 'URL da Imagem',
                        'instagram': 'Instagram',
                        'facebook': 'Facebook'
                    },
                    'local': {
                        'browse': 'Escolher Foto',
                        'dd_title_single': 'Arraste a foto aqui',
                    },
                    'camera': {
                        'capture': 'Tirar Foto',
                        'note': 'Aponte a câmera para o animal'
                    },
                    'crop': {
                        'title': 'Recortar Foto',
                        'crop_btn': 'Recortar',
                        'skip_btn': 'Pular'
                    },
                    'queue': {
                        'title': 'Upload Concluído',
                        'done_btn': 'Feito'
                    }
                }
            },
            styles: {
                palette: {
                    window: '#FFFFFF',
                    windowBorder: '#1a3a6b',
                    tabIcon: '#c41e3a',
                    menuIcons: '#1a3a6b',
                    textDark: '#212529',
                    textLight: '#FFFFFF',
                    link: '#c41e3a',
                    action: '#1a3a6b',
                    inactiveTabIcon: '#6c757d',
                    error: '#c41e3a',
                    inProgress: '#f0c040',
                    complete: '#28a745',
                    sourceBg: '#f8f9fa'
                },
                fonts: {
                    default: null,
                    "'Montserrat', sans-serif": {
                        url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap',
                        active: true
                    }
                }
            }
        }, (error, result) => {
            if (!error && result && result.event === 'success') {
                uploadedPhotoUrl = result.info.secure_url;
                const preview = document.getElementById('photoPreview');
                const urlInput = document.getElementById('animalFoto');
                const uploadArea = document.getElementById('uploadArea');

                if (urlInput) urlInput.value = uploadedPhotoUrl;

                if (preview) {
                    preview.innerHTML = `
                        <img src="${uploadedPhotoUrl}" alt="Foto do animal">
                        <button type="button" class="remove-photo" onclick="removePhoto()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    preview.style.display = 'block';
                }

                if (uploadArea) uploadArea.classList.add('has-photo');
                showToast('📸 Foto enviada com sucesso!', 'success');
            }
        });

        widget.open();
    };

    window.removePhoto = function () {
        uploadedPhotoUrl = '';
        const preview = document.getElementById('photoPreview');
        const urlInput = document.getElementById('animalFoto');
        const uploadArea = document.getElementById('uploadArea');

        if (urlInput) urlInput.value = '';
        if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
        if (uploadArea) uploadArea.classList.remove('has-photo');
    };

    // ========== FORM SUBMISSION ==========
    const form = document.getElementById('animalForm');
    if (form) {
        // Set default date
        const dateInput = document.getElementById('animalData');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            btn.disabled = true;

            const payload = {
                tipo: document.getElementById('animalTipo').value,
                especie: document.getElementById('animalEspecie').value,
                nome: document.getElementById('animalNome').value,
                raca: document.getElementById('animalRaca').value,
                cor: document.getElementById('animalCor').value,
                porte: document.getElementById('animalPorte').value,
                bairro: document.getElementById('animalBairro').value,
                data: document.getElementById('animalData').value,
                descricao: document.getElementById('animalDescricao').value,
                foto: uploadedPhotoUrl || document.getElementById('animalFoto').value,
                contato_nome: document.getElementById('contatoNome').value,
                contato_tel: document.getElementById('contatoTel').value
            };

            try {
                const response = await fetch(API_BASE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!result.success) throw new Error(result.error);

                // Success
                btn.innerHTML = '<i class="fas fa-check"></i> Animal Cadastrado com Sucesso!';
                btn.style.background = '#28a745';

                showToast('🐾 Animal cadastrado com sucesso! Obrigado por ajudar!', 'success');

                form.reset();
                uploadedPhotoUrl = '';
                removePhoto();
                if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

                // Refresh list
                currentPage = 1;
                await loadAnimals(false);

                // Scroll to list
                setTimeout(() => {
                    document.querySelector('.lost-animals-list')?.scrollIntoView({ behavior: 'smooth' });
                    btn.innerHTML = originalHtml;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 2500);

            } catch (error) {
                console.error('Submit error:', error);
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                showToast('Erro ao cadastrar. Tente novamente.', 'error');
            }
        });
    }

    // ========== TOAST NOTIFICATIONS ==========
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function showError(message) {
        const grid = document.getElementById('animalsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Recarregar
                    </button>
                </div>
            `;
        }
    }

    // ========== PHONE MASK ==========
    const telInput = document.getElementById('contatoTel');
    if (telInput) {
        telInput.addEventListener('input', function (e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 6) {
                v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            } else if (v.length > 2) {
                v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            } else if (v.length > 0) {
                v = `(${v}`;
            }
            e.target.value = v;
        });
    }

    // ========== FILTER EVENT LISTENERS ==========
    document.getElementById('filterTipo')?.addEventListener('change', filterAnimals);
    document.getElementById('filterEspecie')?.addEventListener('change', filterAnimals);

    let searchTimeout;
    document.getElementById('filterBusca')?.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAnimals, 400);
    });

    // ========== INITIALIZE ==========
    init();
});

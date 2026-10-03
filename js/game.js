        // ==================== DADOS: SKINS (15 Moto, 15 Piloto) ====================
        const BIKE_SKINS = [
            { id:0, name:"Clássica Vermelha", c1:"#ff7a3d", c2:"#ff5722", c3:"#c62828", rim:"#ffd23f", neon:"#ff5722", price:0 },
            { id:1, name:"Cruiser Turquesa", c1:"#3fd6d6", c2:"#1fb8b8", c3:"#0f7a80", rim:"#eaeaea", neon:"#3fd6d6", price:100 },
            { id:2, name:"Urbana Azul", c1:"#5fb0ec", c2:"#3d8fd6", c3:"#245a94", rim:"#f0f0f0", neon:"#5fb0ec", price:200 },
            { id:3, name:"Vespa de Ouro", c1:"#2a2a2a", c2:"#1a1a1a", c3:"#111111", rim:"#ffc93c", neon:"#ffc93c", price:300 },
            { id:4, name:"Zona Radioativa", c1:"#1e7a3c", c2:"#145214", c3:"#0b3d0b", rim:"#39ff14", neon:"#39ff14", price:400 }
        ];

        const RIDER_SKINS = [
            { id:0, name:"Piloto Padrão", helmet:"#ff2e63", jacket:"#171420", pants:"#211a35", price:0 },
            { id:1, name:"Ciborgue", helmet:"#00f0ff", jacket:"#111111", pants:"#222222", price:100 },
            { id:2, name:"Holograma", helmet:"#ff007f", jacket:"#2a0845", pants:"#00e5ff", price:200 },
            { id:3, name:"Sombra", helmet:"#ffc93c", jacket:"#050505", pants:"#0a0a0a", price:300 }
        ];
        let selectedBikeSkin = 0;
        let selectedRiderSkin = 0;
        let unlockedBikeSkins = [0];
        let unlockedRiderSkins = [0];
        let coins = 0;

        

        // Lista de missões disponíveis na cidade aberta
        const CITY_MISSIONS = [
            { id: 'grau_1min', title: 'Rei do Grau', desc: 'Mantenha o grau por 1 minuto sem deixar a roda tocar o chão.' },
            { id: 'uber_moto', title: 'Uber Moto', desc: 'Leve o passageiro até o destino marcado no minimapa antes que o tempo acabe.' },
            { id: 'corrida_tempo', title: 'Corrida Contra o Tempo', desc: 'Passe por todos os checkpoints espalhados pela cidade no menor tempo possível.' }
        ];

        let activeTotems = [];
        let nearbyTotem = null;
        
         let stats = { totalScore:0, totalTime:0, totalFails:0, totalCoinsCollected:0, playedMaps: new Set() };


        // ==================== PERSISTÊNCIA (MOEDAS E SKINS) ====================
        function loadProgress() {
            try {
                coins = parseInt(localStorage.getItem('grauSim_coins'), 10);
                if (isNaN(coins)) coins = 0;
                const savedBike = JSON.parse(localStorage.getItem('grauSim_bikeUnlocked'));
                const savedRider = JSON.parse(localStorage.getItem('grauSim_riderUnlocked'));
                unlockedBikeSkins = Array.isArray(savedBike) && savedBike.length ? savedBike : [0];
                unlockedRiderSkins = Array.isArray(savedRider) && savedRider.length ? savedRider : [0];
                const savedSelBike = parseInt(localStorage.getItem('grauSim_selectedBike'), 10);
                const savedSelRider = parseInt(localStorage.getItem('grauSim_selectedRider'), 10);
                selectedBikeSkin = !isNaN(savedSelBike) ? savedSelBike : 0;
                selectedRiderSkin = !isNaN(savedSelRider) ? savedSelRider : 0;
                const savedTotalCoins = parseInt(localStorage.getItem('grauSim_totalCoins'), 10);
                stats.totalCoinsCollected = !isNaN(savedTotalCoins) ? savedTotalCoins : 0;
            } catch (e) {
                coins = 0; unlockedBikeSkins = [0]; unlockedRiderSkins = [0];
                selectedBikeSkin = 0; selectedRiderSkin = 0; stats.totalCoinsCollected = 0;
            }
            if (!unlockedBikeSkins.includes(0)) unlockedBikeSkins.push(0);
            if (!unlockedRiderSkins.includes(0)) unlockedRiderSkins.push(0);
            if (!unlockedBikeSkins.includes(selectedBikeSkin)) selectedBikeSkin = 0;
            if (!unlockedRiderSkins.includes(selectedRiderSkin)) selectedRiderSkin = 0;
            selectedBikeSkin = 0; selectedRiderSkin = 0; // menu de skins removido: sempre o visual padrão
        }

        function saveProgress() {
            try {
                localStorage.setItem('grauSim_coins', String(coins));
                localStorage.setItem('grauSim_bikeUnlocked', JSON.stringify(unlockedBikeSkins));
                localStorage.setItem('grauSim_riderUnlocked', JSON.stringify(unlockedRiderSkins));
                localStorage.setItem('grauSim_selectedBike', String(selectedBikeSkin));
                localStorage.setItem('grauSim_selectedRider', String(selectedRiderSkin));
                localStorage.setItem('grauSim_totalCoins', String(stats.totalCoinsCollected));
            } catch (e) { /* armazenamento indisponível, ignora */ }
        }

        function updateCoinHud() {
            const els = document.querySelectorAll('.coin-balance-value');
            els.forEach(el => el.innerText = Math.floor(coins));
        }

        

        function tryBuySkin(kind, i) {
            const list = kind === 'bike' ? BIKE_SKINS : RIDER_SKINS;
            const unlockedList = kind === 'bike' ? unlockedBikeSkins : unlockedRiderSkins;
            const skin = list[i];
            const price = skin.price || 0;
            if (coins >= price) {
                coins -= price;
                unlockedList.push(i);
                if (kind === 'bike') selectedBikeSkin = i; else selectedRiderSkin = i;
                applySkins();
                checkAch("skin", 1);
    
                saveProgress();
                updateCoinHud();
                showNotification('🎉', `Skin "${skin.name}" comprada e equipada!`);
                renderSkinsMenu();
            } else {
                showNotification('🪙', `Faltam ${Math.ceil(price - coins)} moedas para "${skin.name}"`);
            }
        }

        // ==================== DADOS: MAPAS ====================
        const MAPS = [
            { id:0, name:"Pôr do Sol (Retrô)", desc:"Cores análogas quentes, fim de tarde synthwave.", sky:['#2b1055','#7597de','#f69d3c','#eb4242','#ffc93c'], ground:"#150e1f", curve: (z) => Math.sin(z / -150) * 12, accent:"#ff2e63", decor:"retro", stars:true, tags:["Synthwave","Montanhas","Sol Retrô"] },
            { id:1, name:"Metrópole Cyber", desc:"Alto contraste com neon e arranha-céus.", sky:['#020111','#20124d','#000022','#00f0ff','#ff003c'], ground:"#07050a", curve: (z) => Math.sin(z / -200) * 8, accent:"#00f0ff", decor:"cyber", stars:true, tags:["Neon","Cidade","Chuva de Luz"] },
            { id:2, name:"Deserto do Éden", desc:"Dunas, cactos e mesas de pedra ao entardecer.", sky:['#4a154b','#8b2942','#d65a31','#ff9a3c','#ffc93c'], ground:"#241515", curve: (z) => Math.sin(z / -250) * 20, accent:"#ffc93c", decor:"desert", stars:false, tags:["Dunas","Cactos","Mesas"] }
        ];
        let selectedMap = 0;

        // ==================== DADOS: CONQUISTAS ====================
        const ACHIEVEMENTS = [];
        function addAch(id, title, desc, max, type) { ACHIEVEMENTS.push({ id, title, desc, max, current: 0, unlocked: false, type }); }
        
        addAch(1, "Primeiros Passos", "Faça 1.000 pontos", 1000, "score");
        addAch(2, "Estagiário do Grau", "Faça 5.000 pontos", 5000, "score");
        addAch(3, "Profissional", "Faça 20.000 pontos", 20000, "score");
        addAch(4, "Rei do Asfalto", "Faça 50.000 pontos", 50000, "score");
        addAch(5, "Lenda Viva", "Faça 100.000 pontos", 100000, "score");
        addAch(6, "Deus do Grau", "Faça 250.000 pontos", 250000, "score");
        addAch(7, "Equilíbrio", "10 seg totais empinando", 10, "time");
        addAch(8, "Controle", "30 seg totais empinando", 30, "time");
        addAch(9, "Domínio", "60 seg totais empinando", 60, "time");
        addAch(10, "Imparável", "5 min totais empinando", 300, "time");
        addAch(11, "Viciado", "10 min totais empinando", 600, "time");
        addAch(12, "Sem Roda Dianteira", "30 min totais empinando", 1800, "time");
        addAch(13, "Acelerado", "Chegue a 100 km/h", 100, "speed");
        addAch(14, "Foguete", "Chegue a 150 km/h", 150, "speed");
        addAch(15, "Sônico", "Chegue a 200 km/h", 200, "speed");
        addAch(16, "Velocidade da Luz", "Chegue a 240 km/h", 240, "speed");
        addAch(17, "Sem Freio", "Passe de 150 km/h sem frear", 1, "custom");
        addAch(18, "Aquecido", "Complete 5 voltas", 5, "lap");
        addAch(19, "No Ritmo", "Complete 15 voltas", 15, "lap");
        addAch(20, "Piloto Fuga", "Complete 30 voltas", 30, "lap");
        addAch(21, "Turbo Ativado", "Complete 50 voltas", 50, "lap");
        addAch(22, "Lenda da Pista", "Complete 100 voltas", 100, "lap");
        addAch(23, "Rala Placa", "Caia por empinar demais", 1, "crash");
        addAch(25, "Paraquedas", "Caia no void (fora da pista)", 1, "void");
        addAch(26, "Desastrado", "Caia 10 vezes no total", 10, "fails");
        addAch(27, "Teimoso", "Caia 50 vezes no total", 50, "fails");
        addAch(28, "Borrachão", "Caia 100 vezes no total", 100, "fails");
        addAch(30, "Viajante", "Jogue em 3 mapas diferentes", 3, "maps");
        addAch(31, "Catador de Moedas", "Colete 100 moedas", 100, "coins");
        addAch(32, "Cofre Cheio", "Colete 1.000 moedas", 1000, "coins");
        addAch(33, "Magnata da Pista", "Colete 5.000 moedas", 5000, "coins");

       
        // ==================== LÓGICA DE UI E MENUS ====================
        let appState = 'menu';

        function showScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            if(id) document.getElementById(id).classList.remove('hidden');
        }

        function renderSkinsMenu() {
            if (!document.getElementById('bike-skins-grid')) return; // tela de skins removida
            updateCoinHud();
            const bGrid = document.getElementById('bike-skins-grid');
            bGrid.innerHTML = '';
            BIKE_SKINS.forEach((s, i) => {
                const div = document.createElement('div');
                const active = i === selectedBikeSkin;
                const unlocked = unlockedBikeSkins.includes(i);
                div.className = `skin-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
                div.style.setProperty('--skin-glow', s.neon);
                let badge = '';
                if (active) badge = '<div class="skin-badge">Em uso</div>';
                else if (!unlocked) badge = `<div class="skin-badge locked">🔒 ${s.price}</div>`;
                div.innerHTML = `
                    ${badge}
                    <div class="skin-preview-wrap">
                        <div class="skin-preview" style="background: linear-gradient(135deg, ${s.c1} 0%, ${s.c2} 55%, ${s.c3} 100%);">
                            <div class="glow-strip" style="background:${s.neon}; box-shadow:0 0 8px ${s.neon};"></div>
                            <div class="rim-dot" style="left:8px; background:${s.rim}; color:${s.rim};"></div>
                            <div class="rim-dot" style="right:8px; background:${s.rim}; color:${s.rim};"></div>
                        </div>
                    </div>
                    <div class="skin-name">${s.name}</div>
                    ${!unlocked ? '<div class="skin-buy-hint">Toque para comprar</div>' : ''}`;
                div.onclick = () => {
                    if (unlockedBikeSkins.includes(i)) {
                        selectedBikeSkin = i; applySkins(); checkAch("skin", 1); saveProgress(); renderSkinsMenu();
                    } else {
                        tryBuySkin('bike', i);
                    }
                };
                bGrid.appendChild(div);
            });

            const rGrid = document.getElementById('rider-skins-grid');
            rGrid.innerHTML = '';
            RIDER_SKINS.forEach((s, i) => {
                const div = document.createElement('div');
                const active = i === selectedRiderSkin;
                const unlocked = unlockedRiderSkins.includes(i);
                div.className = `skin-card ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
                div.style.setProperty('--skin-glow', s.helmet);
                let badge = '';
                if (active) badge = '<div class="skin-badge">Em uso</div>';
                else if (!unlocked) badge = `<div class="skin-badge locked">🔒 ${s.price}</div>`;
                div.innerHTML = `
                    ${badge}
                    <div class="skin-preview-wrap">
                        <div class="rider-preview" style="background: linear-gradient(180deg, ${s.jacket} 0%, ${s.jacket} 55%, ${s.pants} 55%, ${s.pants} 100%);">
                            <div class="helmet-dome" style="background:${s.helmet}; box-shadow: 0 0 10px ${s.helmet};"></div>
                            <div class="visor"></div>
                        </div>
                    </div>
                    <div class="skin-name">${s.name}</div>
                    ${!unlocked ? '<div class="skin-buy-hint">Toque para comprar</div>' : ''}`;
                div.onclick = () => {
                    if (unlockedRiderSkins.includes(i)) {
                        selectedRiderSkin = i; applySkins(); saveProgress(); renderSkinsMenu();
                    } else {
                        tryBuySkin('rider', i);
                    }
                };
                rGrid.appendChild(div);
            });
        }

        function renderMapsMenu() {
            const mList = document.getElementById('maps-list');
            mList.innerHTML = '';
            MAPS.forEach((m, i) => {
                const div = document.createElement('div');
                const active = i === selectedMap;
                div.className = `map-card ${active ? 'active' : ''}`;
                const skyGrad = `linear-gradient(180deg, ${m.sky[0]} 0%, ${m.sky[1]} 35%, ${m.sky[2]} 60%, ${m.sky[3]} 100%)`;
                let stars = '';
                if (m.stars) {
                    for (let s = 0; s < 10; s++) {
                        stars += `<div class="thumb-star" style="left:${Math.round(Math.random()*90)}%; top:${Math.round(Math.random()*55)}%; opacity:${(0.4 + Math.random()*0.6).toFixed(2)}"></div>`;
                    }
                }
                const tags = (m.tags || []).map(t => `<span class="map-tag">${t}</span>`).join('');
                div.innerHTML = `
                    <div class="map-info">
                        <h3>${active ? '📍 ' : ''}${m.name}</h3>
                        <p>${m.desc}</p>
                        <div class="map-tags">${tags}</div>
                    </div>
                    <div class="map-thumb" style="background:${skyGrad};">
                        ${stars}
                        <div class="thumb-sun" style="background: radial-gradient(circle, ${m.sky[4] || m.sky[3]} 0%, ${m.sky[3]} 70%, transparent 100%); top:30%; box-shadow:0 0 14px ${m.sky[4] || m.sky[3]};"></div>
                        <div class="thumb-ground" style="background:${m.ground}; box-shadow: 0 -1px 0 ${m.accent} inset;"></div>
                    </div>`;
                div.onclick = () => { 
                    selectedMap = i; 
                    stats.playedMaps.add(i); checkAch("maps", stats.playedMaps.size);
                    applyMap(i); renderMapsMenu(); 
                };
                mList.appendChild(div);
            });
        }

        function renderAchievements() {
            const list = document.getElementById('ach-list');
            list.innerHTML = '';
            ACHIEVEMENTS.forEach(a => {
                const div = document.createElement('div');
                div.className = `achievement-item ${a.unlocked ? 'unlocked' : ''}`;
                const prog = a.unlocked ? a.max : Math.floor(a.current);
                div.innerHTML = `
                    <div class="ach-info"><h4>${a.title}</h4><p>${a.desc}</p></div>
                    <div class="ach-status">${prog} / ${a.max}</div>
                `;
                list.appendChild(div);
            });
        }

        function checkAch(type, value) {
            ACHIEVEMENTS.forEach(a => {
                if(!a.unlocked && a.type === type) {
                    a.current = Math.max(a.current, value);
                    if(a.current >= a.max) {
                        a.unlocked = true;
                        a.current = a.max;
                        showAchievementPopup(a.title);
                        renderAchievements();
                    }
                }
            });
        }

        function showNotification(icon, text) {
            const popup = document.getElementById('ach-notification');
            document.getElementById('ach-icon').innerText = icon;
            document.getElementById('ach-text').innerText = text;
            popup.style.top = '20px';
            clearTimeout(showNotification._t);
            showNotification._t = setTimeout(() => { popup.style.top = '-100px'; }, 3000);
        }
        function showAchievementPopup(title) {
            showNotification('🏆', title);
        }

        // ==================== DEFINIÇÃO DA FASE ÚNICA (LOOP INFINITO) ====================
        const PHASES = [
            { label: 'Fase 1 - Infinita', finishDistance: 5000, maxSpeed: 92, coinCount: 40 },
        ];
        // A fase 1 é a única fase do jogo: ao chegar no fim dela, o percurso
        // simplesmente se repete (loop), sem linha de chegada e sem fim de jogo.
        const PHASE_LENGTH = PHASES[0].finishDistance;
        const MALUCO_FINISH_DISTANCE = Math.round(PHASE_LENGTH * 0.75); // Grau Maluco: pista 25% menor
        const BASE_MAX_SPEED = PHASES[0].maxSpeed;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 4000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffb98c, 0.55); scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffd9a0, 0.95); dirLight.position.set(120, 90, 60); dirLight.castShadow = true; scene.add(dirLight);
        const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.18); fillLight.position.set(-80, 40, -60); scene.add(fillLight);

        // ==================== CONFIGURAÇÕES E QUALIDADE GRÁFICA ====================
        const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const Settings = (function () {
            const s = { volume: 0.9, quality: 'auto', sensitivity: 1, camera: 0, vibrate: true, ghost: true, hintsAlways: false };
            try { Object.assign(s, JSON.parse(localStorage.getItem('grauSim_settings') || '{}')); } catch (e) {}
            Object.defineProperty(s, 'save', { enumerable: false, value() { try { localStorage.setItem('grauSim_settings', JSON.stringify(s)); } catch (e) {} } });
            return s;
        })();
        function applyQuality() {
            let q = Settings.quality; if (q === 'auto') q = 'alta'; // padrão = visual original
            const cfg = { baixa: { pr: 1, shadow: false, map: 512 }, media: { pr: 1.5, shadow: true, map: 512 }, alta: { pr: 2, shadow: true, map: 512 } }[q] || { pr: 1.5, shadow: true, map: 512 };
            const shadowChanged = renderer.shadowMap.enabled !== cfg.shadow;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.pr));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = cfg.shadow; dirLight.castShadow = cfg.shadow;
            if (dirLight.shadow.mapSize.x !== cfg.map) { dirLight.shadow.mapSize.set(cfg.map, cfg.map); if (dirLight.shadow.map) { dirLight.shadow.map.dispose(); dirLight.shadow.map = null; } }
            if (shadowChanged) scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
        }
        applyQuality();

        // ==================== MATERIAIS DINÂMICOS ====================
        const paintMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const rimAccentMat = new THREE.MeshBasicMaterial({ color: 0xffc93c });
        const underglowMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.85 });
        const underglowLight = new THREE.PointLight(0x00e5ff, 1.1, 3.5);
        
        const helmetMat = new THREE.MeshLambertMaterial({ color: 0xff3d7f });
        const jacketMat = new THREE.MeshLambertMaterial({ color: 0x1b1030 });
        const jeansMat = new THREE.MeshLambertMaterial({ color: 0x24202e });

        const groundMat = new THREE.MeshLambertMaterial({ color: 0x1c1824 });
        const sideMat = new THREE.MeshLambertMaterial({ color: 0x352b4a });
        let skyDome, sunSprite;

        let gsxrSkinHook = null; // preenchido quando o modelo da GSX-R termina de carregar
        function applySkins() {
            const b = BIKE_SKINS[selectedBikeSkin];
            const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, b.c1); grad.addColorStop(0.45, b.c2); grad.addColorStop(1, b.c3);
            ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
            paintMat.map = new THREE.CanvasTexture(canvas); paintMat.needsUpdate = true;
            rimAccentMat.color.set(b.rim);
            underglowMat.color.set(b.neon); underglowLight.color.set(b.neon);

            if (gsxrSkinHook) gsxrSkinHook(b);
        }

        // ==================== CONSTRUTOR DO MUNDO (MAPAS) ====================
        const skyGroup = new THREE.Group(); scene.add(skyGroup);
        const worldGroup = new THREE.Group(); scene.add(worldGroup);
        const decorGroup = new THREE.Group(); scene.add(decorGroup);
        let pathLine = null;

        function makeSunTexture(map) {
            const c = document.createElement('canvas'); c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');
            const cx = 128, cy = 128, r = 118;
            const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.25, map.sky[4] || map.sky[3]);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            if (map.decor === 'retro') {
                ctx.save();
                ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.clip();
                ctx.fillStyle = map.sky[0];
                for (let y = cy - 20; y < cy + r; y += 14) {
                    const h = Math.max(2, 10 - (y - cy) * 0.05);
                    ctx.fillRect(0, y, 256, h);
                }
                ctx.restore();
            }
            return new THREE.CanvasTexture(c);
        }

        function buildStars(count, tint) {
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 0.7) - 0.35);
                const r = 420 + Math.random() * 30;
                positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
                positions[i*3+1] = Math.abs(r * Math.cos(phi)) * 0.9 + 20;
                positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({ color: tint, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0.85 });
            return new THREE.Points(geo, mat);
        }

        function applyMap(mapIndex) {
            clearInfiniteChunks();
            const map = MAPS[mapIndex];
            while(skyGroup.children.length > 0) skyGroup.remove(skyGroup.children[0]);
            
            const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            map.sky.forEach((col, i) => grad.addColorStop(i / (map.sky.length-1), col));
            ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            skyDome = new THREE.Mesh(new THREE.SphereGeometry(480, 24, 16), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.BackSide }));
            skyGroup.add(skyDome);

            const sunMat = new THREE.SpriteMaterial({ map: makeSunTexture(map), transparent: true, depthWrite: false });
            const sunSpr = new THREE.Sprite(sunMat);
            sunSpr.scale.set(220, 220, 1);
            sunSpr.position.set(0, 55, -650);
            skyGroup.add(sunSpr);

            if (map.stars) {
                skyGroup.add(buildStars(700, map.decor === 'cyber' ? 0xbfe9ff : 0xffe3c2));
            }
            
            scene.background = new THREE.Color(map.sky[3]);
            scene.fog = null;
            groundMat.color.set(map.ground);

            buildTrack(map.curve);
            buildDecorations(map);
        }

        const trackWidth = 35; const platformThickness = 12; const trackLength = PHASE_LENGTH + 100; const groundCenterZ = -trackLength / 2;
        
        function buildTrack(curveFunc) {
            while(worldGroup.children.length > 0) {
                const child = worldGroup.children[0];
                worldGroup.remove(child);
                if(child.geometry) child.geometry.dispose();
            }

            const groundGeo = new THREE.BoxGeometry(trackWidth, platformThickness, trackLength, 1, 1, Math.round(trackLength / 10));
            const posAttr = groundGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                const localZ = posAttr.getZ(i);
                const worldZ = localZ + groundCenterZ;
                posAttr.setX(i, posAttr.getX(i) + curveFunc(worldZ));
            }
            groundGeo.computeVertexNormals();

            const ground = new THREE.Mesh(groundGeo, [sideMat, sideMat, groundMat, sideMat, sideMat, sideMat]);
            ground.position.set(0, -platformThickness / 2, groundCenterZ);
            ground.receiveShadow = true;
            worldGroup.add(ground);

            const pathPoints = [];
            for (let i = 0; i < Math.ceil(trackLength / 5); i++) {
                const z = i * -5;
                pathPoints.push(new THREE.Vector3(curveFunc(z), 0.05, z));
            }
            pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pathPoints), new THREE.LineDashedMaterial({ color: 0xffc93c, linewidth: 2, dashSize: 3, gapSize: 4 }));
            pathLine.computeLineDistances();
            worldGroup.add(pathLine);

            const railMat = new THREE.MeshStandardMaterial({ color: 0x3a3448, metalness: 0.4, roughness: 0.5, emissive: 0x000000 });
            [-1, 1].forEach(side => {
                const railGeo = new THREE.BoxGeometry(0.5, 1.1, trackLength, 1, 1, Math.round(trackLength / 8));
                const rp = railGeo.attributes.position;
                for (let i = 0; i < rp.count; i++) {
                    const worldZ = rp.getZ(i) + groundCenterZ;
                    rp.setX(i, rp.getX(i) + curveFunc(worldZ) + side * (trackWidth / 2 + 0.3));
                }
                railGeo.computeVertexNormals();
                const rail = new THREE.Mesh(railGeo, railMat);
                rail.position.set(0, 0.85, groundCenterZ);
                worldGroup.add(rail);

                const stripGeo = new THREE.BoxGeometry(0.08, 0.15, trackLength, 1, 1, Math.round(trackLength / 8));
                const sp = stripGeo.attributes.position;
                for (let i = 0; i < sp.count; i++) {
                    const worldZ = sp.getZ(i) + groundCenterZ;
                    sp.setX(i, sp.getX(i) + curveFunc(worldZ) + side * (trackWidth / 2 + 0.3));
                }
                stripGeo.computeVertexNormals();
                const strip = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: MAPS[selectedMap].accent }));
                strip.position.set(0, 1.35, groundCenterZ);
                worldGroup.add(strip);
            });

        }

        function getTrackCenterX(z) { return MAPS[selectedMap].curve(z); }

        // ==================== PISTA INFINITA (GRAU INFINITO) ====================
        const CHUNK_LENGTH = 200;
        const CHUNKS_AHEAD = 7;
        const CHUNKS_BEHIND_KEEP = 1;
        let infiniteChunks = new Map();
        let trackMode = 'static';

        function stepPositionsInRange(start, step, rangeStart, rangeEnd) {
            const results = [];
            if (!step) return results;
            let k = Math.max(0, Math.ceil((rangeStart - start) / step));
            let z = start + k * step;
            while (z > rangeStart) { k++; z = start + k * step; }
            while (z > rangeEnd) { results.push(z); k++; z = start + k * step; }
            return results;
        }

        function buildInfiniteChunk(index) {
            const map = MAPS[selectedMap];
            const curveFunc = map.curve;
            const chunkStartZ = -index * CHUNK_LENGTH;
            const chunkEndZ = chunkStartZ - CHUNK_LENGTH;
            const centerZ = (chunkStartZ + chunkEndZ) / 2;
            const group = new THREE.Group();

            const ownGeometries = [];
            const ownMaterials = [];

            const segs = Math.max(4, Math.round(CHUNK_LENGTH / 10));
            const groundGeo = new THREE.BoxGeometry(trackWidth, platformThickness, CHUNK_LENGTH, 1, 1, segs);
            ownGeometries.push(groundGeo);
            let posAttr = groundGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                const worldZ = posAttr.getZ(i) + centerZ;
                posAttr.setX(i, posAttr.getX(i) + curveFunc(worldZ));
            }
            groundGeo.computeVertexNormals();
            const ground = new THREE.Mesh(groundGeo, [sideMat, sideMat, groundMat, sideMat, sideMat, sideMat]);
            ground.position.set(0, -platformThickness / 2, centerZ);
            ground.receiveShadow = true;
            group.add(ground);

            const linePoints = [];
            for (let z = chunkStartZ; z > chunkEndZ; z -= 5) linePoints.push(new THREE.Vector3(curveFunc(z), 0.05, z));
            linePoints.push(new THREE.Vector3(curveFunc(chunkEndZ), 0.05, chunkEndZ));
            const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
            const lineMat = new THREE.LineDashedMaterial({ color: 0xffc93c, linewidth: 2, dashSize: 3, gapSize: 4 });
            ownGeometries.push(lineGeo); ownMaterials.push(lineMat);
            const lineSeg = new THREE.Line(lineGeo, lineMat);
            lineSeg.computeLineDistances();
            group.add(lineSeg);

            const railMat = new THREE.MeshStandardMaterial({ color: 0x3a3448, metalness: 0.4, roughness: 0.5, emissive: 0x000000 });
            ownMaterials.push(railMat);
            [-1, 1].forEach(side => {
                const railGeo = new THREE.BoxGeometry(0.5, 1.1, CHUNK_LENGTH, 1, 1, Math.max(2, Math.round(CHUNK_LENGTH / 8)));
                ownGeometries.push(railGeo);
                let rp = railGeo.attributes.position;
                for (let i = 0; i < rp.count; i++) {
                    const worldZ = rp.getZ(i) + centerZ;
                    rp.setX(i, rp.getX(i) + curveFunc(worldZ) + side * (trackWidth / 2 + 0.3));
                }
                railGeo.computeVertexNormals();
                const rail = new THREE.Mesh(railGeo, railMat);
                rail.position.set(0, 0.85, centerZ);
                group.add(rail);

                const stripGeo = new THREE.BoxGeometry(0.08, 0.15, CHUNK_LENGTH, 1, 1, Math.max(2, Math.round(CHUNK_LENGTH / 8)));
                ownGeometries.push(stripGeo);
                let sp = stripGeo.attributes.position;
                for (let i = 0; i < sp.count; i++) {
                    const worldZ = sp.getZ(i) + centerZ;
                    sp.setX(i, sp.getX(i) + curveFunc(worldZ) + side * (trackWidth / 2 + 0.3));
                }
                stripGeo.computeVertexNormals();
                const stripMat = new THREE.MeshBasicMaterial({ color: map.accent });
                ownMaterials.push(stripMat);
                const strip = new THREE.Mesh(stripGeo, stripMat);
                strip.position.set(0, 1.35, centerZ);
                group.add(strip);
            });

            const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2438, metalness: 0.3, roughness: 0.6 });
            const globeMat = new THREE.MeshBasicMaterial({ color: map.accent });
            ownMaterials.push(lampMat, globeMat);
            stepPositionsInRange(-80, -140, chunkStartZ, chunkEndZ).forEach(z => {
                const kIndex = Math.round((z - (-80)) / -140);
                const side = (kIndex % 2 === 0) ? 1 : -1;
                const x = curveFunc(z) + side * (trackWidth / 2 + 2.4);
                const pole = new THREE.Mesh(lampPoleGeo, lampMat); pole.position.set(x, 2.75, z);
                const arm = new THREE.Mesh(lampArmGeo, lampMat); arm.rotation.z = Math.PI / 2; arm.position.set(x - side * 0.8, 5.3, z);
                const globe = new THREE.Mesh(lampGlobeGeo, globeMat); globe.position.set(x - side * 1.6, 5.3, z);
                group.add(pole, arm, globe);
            });

            if (map.decor === 'retro') {
                const trunkMat = new THREE.MeshBasicMaterial({ color: 0x1a1030 });
                const leafMat = new THREE.MeshBasicMaterial({ color: map.accent });
                ownMaterials.push(trunkMat, leafMat);
                stepPositionsInRange(-80, -55, chunkStartZ, chunkEndZ).forEach(z => {
                    if (rngHash(z * 1.7) > 0.55) return;
                    const side = rngHash(z * 2.3) > 0.5 ? 1 : -1;
                    const x = curveFunc(z) + side * (trackWidth / 2 + 4 + rngHash(z) * 6);
                    const dGroup = new THREE.Group();
                    const trunk = new THREE.Mesh(palmTrunkGeo, trunkMat);
                    trunk.position.y = 2.5; dGroup.add(trunk);
                    for (let l = 0; l < 5; l++) {
                        const leaf = new THREE.Mesh(palmLeafGeo, leafMat);
                        leaf.position.y = 5; leaf.rotation.z = Math.PI / 2; leaf.rotation.y = (l / 5) * Math.PI * 2;
                        leaf.position.x = Math.cos((l/5)*Math.PI*2) * 0.7; leaf.position.z += Math.sin((l/5)*Math.PI*2) * 0.7;
                        dGroup.add(leaf);
                    }
                    dGroup.position.set(x, 0, z);
                    group.add(dGroup);
                });
            } else if (map.decor === 'cyber') {
                const winTex = buildingWindowTexture(map.accent);
                const buildingMat = new THREE.MeshBasicMaterial({ map: winTex, color: 0x8892a8 });
                ownMaterials.push(buildingMat);
                stepPositionsInRange(-80, -45, chunkStartZ, chunkEndZ).forEach(z => {
                    [-1, 1].forEach(side => {
                        if (rngHash(z * side * 3.1) > 0.7) return;
                        const h = 30 + rngHash(z * side) * 90;
                        const w = 10 + rngHash(z * side + 5) * 14;
                        const b = new THREE.Mesh(buildingGeo, buildingMat);
                        b.scale.set(w, h, w);
                        const minOffset = trackWidth / 2 + w / 2 + 20;
                        b.position.set(curveFunc(z) + side * (minOffset + rngHash(z * side) * 30), h / 2 - 6, z);
                        group.add(b);
                    });
                });
            } else if (map.decor === 'desert') {
                const mesaMat = new THREE.MeshLambertMaterial({ color: 0x6b3f2a });
                const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2f6b3c });
                ownMaterials.push(mesaMat, cactusMat);
                stepPositionsInRange(-100, -260, chunkStartZ, chunkEndZ).forEach(z => {
                    [-1, 1].forEach(side => {
                        const s = 3 + rngHash(z * side) * 3.5;
                        const m = new THREE.Mesh(mesaGeo, mesaMat);
                        m.scale.set(s, 1 + rngHash(z) * 1.6, s);
                        m.position.set(curveFunc(z) + side * (90 + rngHash(z * 3) * 80), 2, z);
                        group.add(m);
                    });
                });
                stepPositionsInRange(-80, -60, chunkStartZ, chunkEndZ).forEach(z => {
                    if (rngHash(z * 4.2) > 0.5) return;
                    const side = rngHash(z * 1.3) > 0.5 ? 1 : -1;
                    const x = curveFunc(z) + side * (trackWidth / 2 + 3 + rngHash(z) * 8);
                    const dGroup = new THREE.Group();
                    const trunk = new THREE.Mesh(cactusGeo, cactusMat); trunk.position.y = 2.1; dGroup.add(trunk);
                    const arm1 = new THREE.Mesh(cactusArmGeo, cactusMat); arm1.position.set(0.55, 2.6, 0); arm1.rotation.z = Math.PI / 2.6; dGroup.add(arm1);
                    const arm2 = new THREE.Mesh(cactusArmGeo, cactusMat); arm2.position.set(-0.55, 3.1, 0); arm2.rotation.z = -Math.PI / 2.6; dGroup.add(arm2);
                    dGroup.position.set(x, 0, z);
                    group.add(dGroup);
                });
            }

            const coinEntries = [];
            const coinCountThisChunk = 2;
            for (let i = 0; i < coinCountThisChunk; i++) {
                const z = chunkStartZ - 8 - Math.random() * (CHUNK_LENGTH - 16);
                const lateral = (Math.random() - 0.5) * (trackWidth - 5);
                const x = curveFunc(z) + lateral;
                const isBig = Math.random() < 0.12;
                const mesh = new THREE.Mesh(coinGeo, isBig ? coinBigMat : coinMat);
                const scale = isBig ? 1.6 : 1.0;
                mesh.scale.set(scale, scale, scale);
                mesh.position.set(x, 1.5, z);
                mesh.rotation.x = Math.PI / 2;
                group.add(mesh);
                coinEntries.push({ x, z, radius: 1.7 * scale, mesh, value: isBig ? 5 : 1, collected: false, bobPhase: Math.random() * Math.PI * 2, chunkIndex: index });
            }

            worldGroup.add(group);
            coinItems.push(...coinEntries);
            infiniteChunks.set(index, { group, coinEntries, ownGeometries, ownMaterials });
        }

        function disposeInfiniteChunk(index) {
            const chunk = infiniteChunks.get(index);
            if (!chunk) return;
            worldGroup.remove(chunk.group);
            chunk.ownGeometries.forEach(g => g.dispose());
            chunk.ownMaterials.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
            });
            coinItems = coinItems.filter(c => c.chunkIndex !== index);
            infiniteChunks.delete(index);
        }

        function clearInfiniteChunks() {
            Array.from(infiniteChunks.keys()).forEach(disposeInfiniteChunk);
        }

        function updateInfiniteTrack(playerZ) {
            const currentChunkIndex = Math.floor(-playerZ / CHUNK_LENGTH);
            const neededMin = currentChunkIndex - CHUNKS_BEHIND_KEEP;
            const neededMax = currentChunkIndex + CHUNKS_AHEAD;
            for (let i = neededMin; i <= neededMax; i++) {
                if (!infiniteChunks.has(i)) buildInfiniteChunk(i);
            }
            Array.from(infiniteChunks.keys()).forEach(i => {
                if (i < neededMin || i > neededMax) disposeInfiniteChunk(i);
            });
        }

        function setupInfiniteTrack() {
            clearInfiniteChunks();
            while (worldGroup.children.length > 0) {
                const c = worldGroup.children[0];
                worldGroup.remove(c);
                if (c.geometry) c.geometry.dispose();
            }
            while (decorGroup.children.length > 0) decorGroup.remove(decorGroup.children[0]);
            while (coinsGroup.children.length > 0) coinsGroup.remove(coinsGroup.children[0]);
            coinItems = [];
            trackMode = 'infinite';
            updateInfiniteTrack(0);
        }

        // ==================== DECORAÇÃO DA PISTA ====================
        const lampPoleGeo = new THREE.CylinderGeometry(0.12, 0.16, 5.5, 8);
        const lampArmGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6);
        const lampGlobeGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const palmTrunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 5, 7);
        const palmLeafGeo = new THREE.ConeGeometry(1.6, 0.3, 4);
        const cactusGeo = new THREE.CylinderGeometry(0.5, 0.6, 4.2, 9);
        const cactusArmGeo = new THREE.CylinderGeometry(0.28, 0.32, 1.8, 8);
        const mesaGeo = new THREE.CylinderGeometry(4.5, 6.5, 6, 6);
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        const mountainGeo = new THREE.ConeGeometry(1, 1, 4);

        function buildingWindowTexture(tint) {
            const c = document.createElement('canvas'); c.width = 64; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#0a0812'; ctx.fillRect(0, 0, 64, 128);
            ctx.fillStyle = tint;
            for (let y = 6; y < 122; y += 10) {
                for (let x = 6; x < 58; x += 12) {
                    if (Math.random() > 0.35) ctx.fillRect(x, y, 5, 6);
                }
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        function rngHash(seed) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }

        function buildDecorations(map) {
            while (decorGroup.children.length > 0) {
                const c = decorGroup.children[0];
                decorGroup.remove(c);
            }
            const startZ = -80, endZ = -trackLength + 200;
            const rng = rngHash;

            const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2438, metalness: 0.3, roughness: 0.6 });
            const globeMat = new THREE.MeshBasicMaterial({ color: map.accent });
            let li = 0;
            for (let z = startZ; z > endZ; z -= 140) {
                const side = (li++ % 2 === 0) ? 1 : -1;
                const x = map.curve(z) + side * (trackWidth / 2 + 2.4);
                const pole = new THREE.Mesh(lampPoleGeo, lampMat); pole.position.set(x, 2.75, z);
                const arm = new THREE.Mesh(lampArmGeo, lampMat); arm.rotation.z = Math.PI / 2; arm.position.set(x - side * 0.8, 5.3, z);
                const globe = new THREE.Mesh(lampGlobeGeo, globeMat); globe.position.set(x - side * 1.6, 5.3, z);
                decorGroup.add(pole, arm, globe);
            }

            if (map.decor === 'retro') {
                for (let z = startZ; z > endZ; z -= 55) {
                    if (rng(z * 1.7) > 0.55) continue;
                    const side = rng(z * 2.3) > 0.5 ? 1 : -1;
                    const x = map.curve(z) + side * (trackWidth / 2 + 4 + rng(z) * 6);
                    const group = new THREE.Group();
                    const trunk = new THREE.Mesh(palmTrunkGeo, new THREE.MeshBasicMaterial({ color: 0x1a1030 }));
                    trunk.position.y = 2.5; group.add(trunk);
                    for (let l = 0; l < 5; l++) {
                        const leaf = new THREE.Mesh(palmLeafGeo, new THREE.MeshBasicMaterial({ color: map.accent }));
                        leaf.position.y = 5; leaf.rotation.z = Math.PI / 2; leaf.rotation.y = (l / 5) * Math.PI * 2;
                        leaf.position.x = Math.cos((l/5)*Math.PI*2) * 0.7; leaf.position.z += Math.sin((l/5)*Math.PI*2) * 0.7;
                        group.add(leaf);
                    }
                    group.position.set(x, 0, z);
                    decorGroup.add(group);
                }
            } else if (map.decor === 'cyber') {
                const winTex = buildingWindowTexture(map.accent);
                const buildingMat = new THREE.MeshBasicMaterial({ map: winTex, color: 0x8892a8 });
                for (let z = startZ; z > endZ; z -= 45) {
                    [-1, 1].forEach(side => {
                        if (rng(z * side * 3.1) > 0.7) return;
                        const h = 30 + rng(z * side) * 90;
                        const w = 10 + rng(z * side + 5) * 14;
                        const b = new THREE.Mesh(buildingGeo, buildingMat);
                        b.scale.set(w, h, w);
                        const minOffset = trackWidth / 2 + w / 2 + 20;
                        b.position.set(map.curve(z) + side * (minOffset + rng(z * side) * 30), h / 2 - 6, z);
                        decorGroup.add(b);
                    });
                }
            } else if (map.decor === 'desert') {
                const mesaMat = new THREE.MeshLambertMaterial({ color: 0x6b3f2a });
                for (let z = -100; z > -trackLength - 300; z -= 260) {
                    [-1, 1].forEach(side => {
                        const s = 3 + rng(z * side) * 3.5;
                        const m = new THREE.Mesh(mesaGeo, mesaMat);
                        m.scale.set(s, 1 + rng(z) * 1.6, s);
                        m.position.set(map.curve(z) + side * (90 + rng(z * 3) * 80), 2, z);
                        decorGroup.add(m);
                    });
                }
                const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2f6b3c });
                for (let z = startZ; z > endZ; z -= 60) {
                    if (rng(z * 4.2) > 0.5) continue;
                    const side = rng(z * 1.3) > 0.5 ? 1 : -1;
                    const x = map.curve(z) + side * (trackWidth / 2 + 3 + rng(z) * 8);
                    const group = new THREE.Group();
                    const trunk = new THREE.Mesh(cactusGeo, cactusMat); trunk.position.y = 2.1; group.add(trunk);
                    const arm1 = new THREE.Mesh(cactusArmGeo, cactusMat); arm1.position.set(0.55, 2.6, 0); arm1.rotation.z = Math.PI / 2.6; group.add(arm1);
                    const arm2 = new THREE.Mesh(cactusArmGeo, cactusMat); arm2.position.set(-0.55, 3.1, 0); arm2.rotation.z = -Math.PI / 2.6; group.add(arm2);
                    group.position.set(x, 0, z);
                    decorGroup.add(group);
                }
            }
        }

              function spawnMissionTotems() {
                // Limpa totens anteriores caso existam
                activeTotems.forEach(t => worldGroup.remove(t.group));
                activeTotems = [];

                // Materiais do Totem
                const baseMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8, roughness: 0.2 });
                const crystalMat = new THREE.MeshStandardMaterial({ color: 0xffc93c, emissive: 0xff6b00, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 });
                const crystalGeo = new THREE.OctahedronGeometry(0.8, 0);

                CITY_MISSIONS.forEach((mission, index) => {
                    const totemGroup = new THREE.Group();

                    // Base do Totem
                    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.5, 8), baseMat);
                    base.position.y = 0.75;
                    totemGroup.add(base);

                    // Cristal flutuante
                    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
                    crystal.position.y = 2.5;
                    totemGroup.add(crystal);

                    // Luz para destaque
                    const light = new THREE.PointLight(0xffc93c, 1, 10);
                    light.position.y = 2.5;
                    totemGroup.add(light);

                    // Posição espalhada (ajuste o raio 100 e 200 de acordo com o tamanho do seu mapa aberto)
                    const range = 200; 
                    const posX = (Math.random() - 0.5) * range;
                    const posZ = (Math.random() - 0.5) * range;
                    
                    totemGroup.position.set(posX, 0, posZ);
                    worldGroup.add(totemGroup);

                    activeTotems.push({
                        group: totemGroup,
                        crystal: crystal,
                        mission: mission,
                        x: posX,
                        z: posZ
                    });
                });
            }

            function updateTotemsInteraction(playerZ, playerX) {
                if (trackMode !== 'cidade') return; // Executa apenas no modo cidade

                nearbyTotem = null;
                let closestDistance = 8.0; // Distância mínima para interagir (em metros)

                activeTotems.forEach(totem => {
                    // Animação do cristal (flutuando e girando)
                    totem.crystal.rotation.y += 0.02;
                    totem.crystal.position.y = 2.5 + Math.sin(Date.now() * 0.003) * 0.2;

                    // Distância Euclidiana entre jogador e totem
                    const dist = Math.hypot(playerX - totem.x, playerZ - totem.z);
                    if (dist < closestDistance) {
                        closestDistance = dist;
                        nearbyTotem = totem;
                    }
                });

                const promptUI = document.getElementById('interaction-prompt');
                
                // Mostra/Oculta o prompt "Pressione E"
                if (nearbyTotem && document.getElementById('mission-modal').style.display === 'none') {
                    promptUI.style.display = 'block';
                } else {
                    promptUI.style.display = 'none';
                }
            }

        // ==================== CRIAÇÃO DA MOTO E PILOTO ====================
        function createBone(p1, p2, radius, material) {
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, p1.distanceTo(p2), 12), material);
            mesh.position.copy(p1).lerp(p2, 0.5);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
            return mesh;
        }

        const bikeContainer = new THREE.Group(); bikeContainer.scale.set(1.8, 1.8, 1.8); scene.add(bikeContainer);
        const wheeliePivot = new THREE.Group(); wheeliePivot.position.set(0, 0.4, 0); bikeContainer.add(wheeliePivot);
        const bikeBody = new THREE.Group(); bikeBody.position.set(0, -0.4, -1.2); wheeliePivot.add(bikeBody);

        const rubberMat = new THREE.MeshLambertMaterial({ color: 0x15121c });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, metalness: 0.7, roughness: 0.25 });
        const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.85 });
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x101018, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.75 });

        function addWheel(pos) {
            const group = new THREE.Group();
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.26, 24), rubberMat); tire.rotation.z = Math.PI/2; group.add(tire);
            const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 6, 24), rimAccentMat); stripe.rotation.y = Math.PI/2; group.add(stripe);
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 12), chromeMat); hub.rotation.z = Math.PI/2; group.add(hub);
            for (let s = 0; s < 6; s++) {
                const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 4), chromeMat);
                spoke.rotation.z = Math.PI / 2; spoke.rotation.x = (s / 6) * Math.PI * 2;
                group.add(spoke);
            }
            const disc = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.018, 6, 20), chromeMat); disc.rotation.y = Math.PI/2; disc.position.x = 0.11; group.add(disc);
            // Paralama arredondado e robusto por cima do pneu, com a cara "brinquedo/cartoon" das motos de referência
            const fender = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.34, 16, 1, true, -Math.PI * 0.62, Math.PI * 1.24), paintMat);
            fender.rotation.z = Math.PI / 2; fender.position.y = 0.05; group.add(fender);
            group.position.copy(pos); bikeBody.add(group); return group;
        }
        const frontWheel = addWheel(new THREE.Vector3(0, 0.46, -1.5));
        const rearWheel = addWheel(new THREE.Vector3(0, 0.46, 1.2));

        bikeBody.add(createBone(new THREE.Vector3(0.16, 1.1, -1.55), new THREE.Vector3(0.16, 0.42, -1.5), 0.06, chromeMat));
        bikeBody.add(createBone(new THREE.Vector3(-0.16, 1.1, -1.55), new THREE.Vector3(-0.16, 0.42, -1.5), 0.06, chromeMat));
        bikeBody.add(createBone(new THREE.Vector3(-0.42, 1.32, -1.55), new THREE.Vector3(0.42, 1.32, -1.55), 0.055, chromeMat));
        
        [-1, 1].forEach(s => {
            const stalk = createBone(new THREE.Vector3(s*0.42, 1.32, -1.55), new THREE.Vector3(s*0.5, 1.55, -1.62), 0.025, chromeMat); bikeBody.add(stalk);
            const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), glassMat); mirror.scale.set(1, 0.6, 0.4); mirror.position.set(s*0.55, 1.58, -1.65); bikeBody.add(mirror);
            const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10), rubberMat); grip.rotation.z = Math.PI/2; grip.position.set(s*0.49, 1.32, -1.55); bikeBody.add(grip);
        });

        // Farol grande e redondo — bem no estilo "cartoon/brinquedo" das fotos de referência
        const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 16), headlightMat); headlight.scale.set(1, 1, 0.65); headlight.position.set(0, 0.97, -1.7); bikeBody.add(headlight);
        const headlightRim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 20), chromeMat); headlightRim.position.set(0, 0.97, -1.68); bikeBody.add(headlightRim);
        const headlightGlow = new THREE.PointLight(0xfff2c9, 0.5, 4); headlightGlow.position.copy(headlight.position); bikeBody.add(headlightGlow);

        // Tanque bem mais volumoso e arredondado (a "barriga" característica das motos de brinquedo)
        const tank = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 18), paintMat); tank.scale.set(1.05, 0.92, 1.55); tank.position.set(0, 1.12, -0.6); bikeBody.add(tank);
        const tankStripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.9), rimAccentMat); tankStripe.position.set(0, 1.18, -0.6); tankStripe.rotation.z = 0.02; bikeBody.add(tankStripe);
        const seat = createBone(new THREE.Vector3(0, 1.0, 0.3), new THREE.Vector3(0, 1.15, 1.55), 0.22, paintMat); bikeBody.add(seat);

        bikeBody.add(createBone(new THREE.Vector3(0.22, 0.75, 0.2), new THREE.Vector3(0.3, 0.42, 1.55), 0.1, chromeMat));
        const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), rimAccentMat); exhaustTip.rotation.x = Math.PI/2; exhaustTip.position.set(0.3, 0.42, 1.62); bikeBody.add(exhaustTip);
        exhaustTip.position.set(0.3, 0.42, 1.8);
        exhaustTip.rotation.x = Math.PI / 2;
        bikeBody.add(exhaustTip);
        const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.05), underglowMat); taillight.position.set(0, 1.1, 1.66); bikeBody.add(taillight);
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.02), new THREE.MeshLambertMaterial({ color: 0xdddddd })); plate.position.set(0, 0.9, 1.72); bikeBody.add(plate);

        const underglowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.6), underglowMat); underglowStrip.position.set(0, 0.08, 0.1); bikeBody.add(underglowStrip);
        underglowLight.position.set(0, 0.15, 0.2); bikeBody.add(underglowLight);


        // ==================== PILOTO MOTOCROSS (cores neutras) ====================
        // Referência: macacão de motocross com capacete cross (viseira/pala), óculos, jersey, luvas, calça com joelheiras e botas.
        const _riderBackTex = (function () {
            const c = document.createElement('canvas'); c.width = 256; c.height = 256;
            const x = c.getContext('2d');
            x.fillStyle = '#d6d6da'; x.fillRect(0, 0, 256, 256);
            x.fillStyle = '#1e1e22';                                   // ombros pretos
            x.beginPath(); x.moveTo(0, 0); x.lineTo(256, 0); x.lineTo(256, 70); x.lineTo(190, 46); x.lineTo(66, 46); x.lineTo(0, 70); x.fill();
            x.fillStyle = '#8c8c92';                                   // faixa cinza diagonal
            x.beginPath(); x.moveTo(0, 256); x.lineTo(0, 150); x.lineTo(40, 190); x.lineTo(40, 256); x.fill();
            x.beginPath(); x.moveTo(256, 256); x.lineTo(256, 150); x.lineTo(216, 190); x.lineTo(216, 256); x.fill();
            x.fillStyle = '#1e1e22'; x.textAlign = 'center';
            x.font = 'bold 38px Arial, sans-serif'; x.fillText('RACING', 128, 112);
            x.font = 'bold 96px Arial, sans-serif'; x.fillText('69', 128, 205);
            const t = new THREE.CanvasTexture(c); t.encoding = THREE.LinearEncoding; return t;
        })();
        const _RM = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
        const riderMats = {
            jersey: _RM(0xd6d6da), sleeve: _RM(0x1e1e22), pants: _RM(0xbdbdc2), pantsDark: _RM(0x1f1f23),
            boot: _RM(0x2a2a2e), bootTrim: _RM(0x9a9aa0), glove: _RM(0x18181b), cuff: _RM(0xcfcfd4),
            helm: _RM(0xececee), helmDark: _RM(0x222226), lens: _RM(0x7d838d),
            back: _RM(0xffffff, { map: _riderBackTex })
        };

        // pose = { hip, sh, head, hand (x>0), foot (x>0) }  — tudo em coordenadas do bikeBody
        function buildMotoRider(pose) {
            const g = new THREE.Group(), V = (x, y, z) => new THREE.Vector3(x, y, z), m = riderMats;
            const ball = (r, mat, p, sc) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 14), mat); o.position.copy(p); if (sc) o.scale.set(sc[0], sc[1], sc[2]); g.add(o); return o; };
            const { hip, sh, head, hand, foot } = pose;

            // tronco (jersey) + pélvis
            g.add(createBone(hip, sh, 0.2, m.jersey));
            ball(0.2, m.pants, hip, [1.05, 0.8, 1.05]);
            ball(0.17, m.jersey, sh.clone().add(V(0, -0.03, 0)), [1.2, 0.8, 0.9]);
            // número / grafismo nas costas
            const d = sh.clone().sub(hip), n = V(0, -d.z, d.y).normalize();
            const back = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.44), m.back);
            back.position.copy(hip).lerp(sh, 0.55).addScaledVector(n, 0.208);
            back.rotation.x = -Math.atan2(-d.z, d.y); g.add(back);

            [1, -1].forEach(sx => {
                // braços: ombro → cotovelo → punho (manga preta) + luva
                const sp = sh.clone().setX(sx * 0.2), hnd = hand.clone().setX(sx * hand.x);
                const elbow = sp.clone().lerp(hnd, 0.5).add(V(sx * 0.14, 0.06, 0));
                const wrist = elbow.clone().lerp(hnd, 0.82);
                ball(0.125, m.sleeve, sp);
                g.add(createBone(sp, elbow, 0.095, m.sleeve)); ball(0.095, m.sleeve, elbow);
                g.add(createBone(elbow, wrist, 0.085, m.sleeve));
                g.add(createBone(elbow.clone().lerp(hnd, 0.62), elbow.clone().lerp(hnd, 0.74), 0.092, m.cuff));
                ball(0.1, m.glove, hnd, [1, 0.9, 1.25]);

                // pernas: quadril → joelho → tornozelo, joelheira, bota
                const hp = hip.clone().setX(sx * 0.12), ft = foot.clone().setX(sx * foot.x);
                const knee = hp.clone().lerp(ft, 0.5).add(V(sx * 0.05, 0.03, -0.17)), ankle = ft.clone().add(V(0, 0.1, 0));
                g.add(createBone(hp, knee, 0.125, m.pants)); ball(0.125, m.pants, knee);
                g.add(createBone(hp.clone().add(V(sx * 0.105, 0, 0)), knee.clone().add(V(sx * 0.105, 0, 0)), 0.035, m.pantsDark)); // listra lateral
                ball(0.135, m.pantsDark, knee.clone().add(V(0, 0.01, -0.07)), [1, 1, 0.65]);                                       // joelheira
                g.add(createBone(knee, ankle, 0.1, m.pants));
                g.add(createBone(ankle.clone().lerp(knee, 0.05), ankle.clone().lerp(knee, 0.5), 0.118, m.boot));                   // cano da bota
                g.add(createBone(ankle.clone().lerp(knee, 0.34), ankle.clone().lerp(knee, 0.42), 0.126, m.bootTrim));              // fivela/faixa
                const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.36), m.boot); boot.position.copy(ft).add(V(0, 0, -0.03)); g.add(boot);
                const toe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.12), m.bootTrim); toe.position.copy(ft).add(V(0, 0.01, -0.2)); g.add(toe);
            });

            // capacete cross: casco, queixo, óculos com tira, pala e faixa
            const hg = new THREE.Group(); hg.position.copy(head);
            const part = (geo, mat, p, sc, rx, ry) => { const o = new THREE.Mesh(geo, mat); o.position.set(p[0], p[1], p[2]); if (sc) o.scale.set(sc[0], sc[1], sc[2]); if (rx) o.rotation.x = rx; if (ry) o.rotation.y = ry; hg.add(o); return o; };
            part(new THREE.SphereGeometry(0.235, 24, 20), m.helm, [0, 0, 0], [1, 1.02, 1.12]);
            part(new THREE.SphereGeometry(0.13, 16, 12), m.helm, [0, -0.13, -0.19], [1.05, 0.85, 1.0]);                 // queixeira
            part(new THREE.BoxGeometry(0.1, 0.05, 0.05), m.helmDark, [0, -0.1, -0.31]);                                  // grade de ventilação
            part(new THREE.TorusGeometry(0.236, 0.03, 8, 28), m.helmDark, [0, 0.02, 0.02], [1, 1.12, 1], Math.PI / 2);   // tira do óculos
            part(new THREE.BoxGeometry(0.35, 0.13, 0.1), m.helmDark, [0, 0.02, -0.2]);                                   // armação do óculos
            part(new THREE.BoxGeometry(0.29, 0.09, 0.02), m.lens, [0, 0.02, -0.255]);                                    // lente
            part(new THREE.BoxGeometry(0.3, 0.02, 0.22), m.helmDark, [0, 0.15, -0.25], null, 0.2);                       // pala
            [-0.035, 0.035].forEach(x => part(new THREE.TorusGeometry(0.238, 0.012, 6, 28), m.helmDark, [x, 0, 0], [1, 1.02, 1.12], 0, Math.PI / 2)); // faixa central
            g.add(hg);
            return g;
        }

        // Piloto (versão da moto procedural, usada só se o modelo GSX-R não carregar)
        const rider = buildMotoRider({ hip: new THREE.Vector3(0, 1.15, 0.4), sh: new THREE.Vector3(0, 1.7, 0.1), head: new THREE.Vector3(0, 2.05, 0.0),
            hand: new THREE.Vector3(0.42, 1.32, -1.5), foot: new THREE.Vector3(0.3, 0.82, 0.05) });
        bikeBody.add(rider); window.activeRider = rider;

        // ==================== MODELO 3D: SUZUKI GSX-R ====================
        // Troca a moto procedural pelo modelo GLB embutido. Se algo falhar, a moto antiga continua valendo.
        (function loadGsxrBike() {
            if (typeof GSXR_GLB_BASE64 === 'undefined' || !THREE.GLTFLoader) return;
            const procParts = bikeBody.children.filter(c => c !== rider && c !== frontWheel && c !== rearWheel && c !== underglowStrip && !c.isLight);
            const bin = atob(GSXR_GLB_BASE64), bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            new THREE.GLTFLoader().parse(bytes.buffer, '', gltf => {
                try { installGsxr(gltf); } catch (e) { console.warn('GSX-R não pôde ser instalada:', e); }
            }, err => console.warn('Falha ao carregar o modelo GSX-R:', err));

            function installGsxr(gltf) {
                const body = gltf.scene.getObjectByName('BODY'), wF = gltf.scene.getObjectByName('WHEEL_F'), wR = gltf.scene.getObjectByName('WHEEL_R');
                if (!body || !wF || !wR) throw new Error('nós do modelo ausentes');
                const mats = {};
                gltf.scene.traverse(o => {
                    if (!o.isMesh) return;
                    [].concat(o.material).forEach(m => {
                        mats[m.name] = m;
                        // O jogo renderiza em espaço linear sem correção de gama: evita escurecer as texturas.
                        if (m.map) m.map.encoding = THREE.LinearEncoding;
                        if (m.emissiveMap) m.emissiveMap.encoding = THREE.LinearEncoding;
                        // Sem mapa de ambiente, metal puro fica preto: suaviza.
                        m.metalness = Math.min(m.metalness === undefined ? 0 : m.metalness, 0.3);
                        m.roughness = Math.max(m.roughness === undefined ? 0.5 : m.roughness, 0.35);
                        if (m.name === 'glass') { m.transparent = true; m.opacity = 0.4; m.color.set(0x1a2230); m.metalness = 0; m.roughness = 0.1; m.depthWrite = false; }
                        m.needsUpdate = true;
                    });
                });

                // Medidas do modelo (roda traseira na origem; roda dianteira a 2,348 à frente, em -Z)
                const wb = new THREE.Box3().setFromObject(wR);
                const R = (wb.max.y - wb.min.y) / 2, WHEELBASE = 2.348;
                procParts.forEach(c => { c.visible = false; });
                [frontWheel, rearWheel].forEach(g => g.children.slice().forEach(c => { c.visible = false; }));
                rearWheel.position.set(0, R, 1.2);
                frontWheel.position.set(0, R, 1.2 - WHEELBASE);
                wR.position.set(0, 0, 0); wF.position.set(0, 0, 0);
                rearWheel.add(wR); frontWheel.add(wF);   // as rodas continuam girando pelo código do jogo
                body.position.set(0, R, 1.2);
                bikeBody.add(body);
                headlightGlow.position.set(0, 1.4, -1.7);

                // Piloto refeito para a postura de esportiva (quadril no banco, mãos no guidão, pés nas pedaleiras)
                rider.visible = false;
                const r2 = buildMotoRider({ hip: new THREE.Vector3(0, 1.58, 0.75), sh: new THREE.Vector3(0, 2.08, 0.40), head: new THREE.Vector3(0, 2.40, 0.28),
                    hand: new THREE.Vector3(0.36, 1.51, -0.65), foot: new THREE.Vector3(0.44, 0.58, 0.30) });
                bikeBody.add(r2); window.activeRider = r2;

                // Passageiro (missão moto-táxi) na garupa da nova moto
                passengerMesh.scale.setScalar(1.25);
                passengerMesh.position.set(0, 1.50, 0.775);

                // Skins: pintura (decalques do carenado recoloridos), peças lisas e aros seguem a skin escolhida
                const store = {}; let lastKey = '';
                const rgb2hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2; let h = 0, s = 0; if (d > 0) { s = d / (1 - Math.abs(2 * l - 1)); if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; } return [h, s, l]; };
                const hsl2rgb = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, hp = h * 6, x = c * (1 - Math.abs(hp % 2 - 1)); let r = 0, g = 0, b = 0; if (hp < 1) { r = c; g = x; } else if (hp < 2) { r = x; g = c; } else if (hp < 3) { g = c; b = x; } else if (hp < 4) { g = x; b = c; } else if (hp < 5) { r = x; b = c; } else { r = c; b = x; } const m = l - c / 2; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
                function recolorLivery(m, tgt) {
                    if (!m || !m.map || !m.map.image) return;
                    let st = store[m.name];
                    if (!st) {
                        const img = m.map.image, w = Math.min(1024, img.width), h = Math.round(img.height * w / img.width);
                        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
                        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, w, h);
                        st = store[m.name] = { cv, cx, w, h, src: cx.getImageData(0, 0, w, h).data, tex: null, orig: m.map };
                    }
                    const out = st.cx.createImageData(st.w, st.h), src = st.src, dst = out.data;
                    for (let i = 0; i < src.length; i += 4) {
                        const r = src[i], g = src[i + 1], b = src[i + 2];
                        const [h, s, l] = rgb2hsl(r, g, b);
                        const wgt = Math.min(1, Math.max(0, (s - 0.4) / 0.25)); // só pinta o que é colorido (azul); prata/preto/branco ficam
                        if (wgt <= 0) { dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = src[i + 3]; continue; }
                        const [nr, ng, nb] = hsl2rgb(tgt.h, Math.min(1, s * tgt.s), Math.min(1, l * tgt.l / 0.5));
                        dst[i] = r + (nr - r) * wgt; dst[i + 1] = g + (ng - g) * wgt; dst[i + 2] = b + (nb - b) * wgt; dst[i + 3] = src[i + 3];
                    }
                    st.cx.putImageData(out, 0, 0);
                    if (!st.tex) {
                        st.tex = new THREE.CanvasTexture(st.cv);
                        st.tex.flipY = false; st.tex.encoding = THREE.LinearEncoding;
                        st.tex.wrapS = st.orig.wrapS; st.tex.wrapT = st.orig.wrapT; st.tex.anisotropy = st.orig.anisotropy || 1;
                        m.map = st.tex; m.needsUpdate = true;
                    } else st.tex.needsUpdate = true;
                }
                gsxrSkinHook = (b) => {
                    const key = b.c2 + '|' + b.rim; if (key === lastKey) return; lastKey = key;
                    ['right.001', 'left.001'].forEach(n => { if (mats[n]) mats[n].color.set(b.c2); });
                    if (mats['body.001']) mats['body.001'].color.set(b.rim);
                    const c = new THREE.Color(b.c2), hsl = {}; c.getHSL(hsl);
                    const tgt = { h: hsl.h, s: hsl.s, l: hsl.l };
                    recolorLivery(mats['left'], tgt); recolorLivery(mats['right'], tgt);
                };
                applySkins(); // aplica a skin atual já na nova moto
            }
        })();

        // ==================== CIDADE ABERTA ====================
        const cityGroup = new THREE.Group();
        let cityBuilt = false, cityHalf = 0;
        let cityRoadPositions = [], cityRoadHalfWidth = 7, cityOnRoad = true;
        const cityBlockColliders = [];
        function isOnRoad(x, z) {
            for (let i = 0; i < cityRoadPositions.length; i++) {
                const rp = cityRoadPositions[i];
                if (Math.abs(x - rp) <= cityRoadHalfWidth || Math.abs(z - rp) <= cityRoadHalfWidth) return true;
            }
            return false;
        }
        function roundedSquareShape(half, corner) {
            const s = new THREE.Shape(); const h = half, c = corner;
            s.moveTo(-h + c, -h); s.lineTo(h - c, -h); s.quadraticCurveTo(h, -h, h, -h + c);
            s.lineTo(h, h - c); s.quadraticCurveTo(h, h, h - c, h);
            s.lineTo(-h + c, h); s.quadraticCurveTo(-h, h, -h, h - c);
            s.lineTo(-h, -h + c); s.quadraticCurveTo(-h, -h, -h + c, -h);
            return s;
        }
        function pushOutRoundedBox(p, cx, cz, half, corner, marginR) {
            const dx = p.x - cx, dz = p.z - cz;
            const hx = half - corner, hz = half - corner;
            const qx = Math.abs(dx) - hx, qz = Math.abs(dz) - hz;
            if (qx < 0 && qz < 0) {
                const gapX = hx - Math.abs(dx), gapZ = hz - Math.abs(dz);
                if (gapX < gapZ) p.x = cx + Math.sign(dx || 1) * (hx + corner + marginR);
                else p.z = cz + Math.sign(dz || 1) * (hz + corner + marginR);
                return { nx: gapX < gapZ ? Math.sign(dx || 1) : 0, nz: gapX < gapZ ? 0 : Math.sign(dz || 1) };
            }
            const cxp = Math.max(-hx, Math.min(hx, dx)), czp = Math.max(-hz, Math.min(hz, dz));
            const ddx = dx - cxp, ddz = dz - czp, dist = Math.hypot(ddx, ddz), minD = corner + marginR;
            if (dist < minD) {
                const f = dist > 0.0001 ? minD / dist : 1;
                p.x = cx + cxp + ddx * f; p.z = cz + czp + ddz * f;
                return dist > 0.0001 ? { nx: ddx / dist, nz: ddz / dist } : { nx: 1, nz: 0 };
            }
            return null;
        }
        function makeHouseTexture(baseColorHex) {
            const c = document.createElement('canvas'); c.width = 64; c.height = 64;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#' + baseColorHex.toString(16).padStart(6, '0'); ctx.fillRect(0, 0, 64, 64);
            ctx.fillStyle = 'rgba(40,50,70,0.85)';
            ctx.fillRect(9, 9, 15, 15); ctx.fillRect(40, 9, 15, 15);
            ctx.fillStyle = 'rgba(80,50,35,0.9)'; ctx.fillRect(25, 34, 14, 26);
            return new THREE.CanvasTexture(c);
        }
        function makeBench() {
            const g = new THREE.Group();
            const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a5a34 });
            const metalMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.5), woodMat); seat.position.y = 0.45; g.add(seat);
            const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.1), woodMat); back.position.set(0, 0.72, -0.22); g.add(back);
            [-0.75, 0.75].forEach(x => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), metalMat); leg.position.set(x, 0.22, 0); g.add(leg); });
            g.scale.setScalar(1.8); // compatível com o tamanho da moto/piloto
            return g;
        }
        const TRASH_SCALE = 3.8;
        function makeTrashCan() {
            const g = new THREE.Group();
            const can = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.55, 10), new THREE.MeshLambertMaterial({ color: 0x2f6b3c }));
            can.position.y = 0.3; g.add(can);
            const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), new THREE.MeshLambertMaterial({ color: 0x1c1824 }));
            lid.position.y = 0.58; g.add(lid);
            g.scale.setScalar(TRASH_SCALE); // lixeira grande, proporcional à moto/piloto
            return g;
        }
        let cityMission = null, cityWheelieMs = 0, cityRaceMs = 0;
        // Posições dos totens (cruzamentos): usadas tanto para desenhar quanto para detectar. Antes eram diferentes.
        const CITY_TOTEMS = {
            wheelie: { x: 68,   z: 0,    label: 'Missão Grau: mantenha o grau por 60s' },
            pickup:  { x: -68,  z: 0,    label: 'Missão Uber Moto: leve o passageiro' },
            dropoff: { x: 0,    z: 136,  label: 'Entrega' },
            race:    { x: 0,    z: -68,  label: 'Missão Corrida: 62s contra o tempo' },
        };
        const cityMarkers = {};
        let cityTraffic = [];
        const cityStaticColliders = [];
        // Passageiro da missão Uber Moto: um bonequinho 3D sentado na garupa (torso, cabeça,
        // braços segurando a cintura do piloto e pernas até os pedais), não mais um ponto amarelo.
        const passengerMesh = new THREE.Group();
        const pJacketMat = new THREE.MeshLambertMaterial({ color: 0x2255aa });
        const pSkinMat = new THREE.MeshLambertMaterial({ color: 0xffd27a });
        const pPantsMat = new THREE.MeshLambertMaterial({ color: 0x24242c });
        const pHelmetMat = new THREE.MeshLambertMaterial({ color: 0xdd3355 });
        const pHip = new THREE.Vector3(0, 0, 0.5), pShoulder = new THREE.Vector3(0, 0.5, 0.2);
        passengerMesh.add(createBone(pHip, pShoulder, 0.14, pJacketMat)); // torso
        const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), pHelmetMat);
        pHead.position.set(0, 0.68, 0.12); passengerMesh.add(pHead);
        const pVisor = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), new THREE.MeshLambertMaterial({ color: 0x101018 }));
        pVisor.rotation.x = Math.PI; pVisor.position.set(0, 0.66, 0.03); passengerMesh.add(pVisor);
        [-1, 1].forEach(s => { // braços segurando a cintura do piloto (à frente)
            passengerMesh.add(createBone(new THREE.Vector3(s * 0.13, 0.46, 0.22), new THREE.Vector3(s * 0.14, 0.15, -0.32), 0.05, pJacketMat));
            passengerMesh.add(createBone(pHip.clone().setX(s * 0.09), new THREE.Vector3(s * 0.24, -0.38, 0.22), 0.08, pPantsMat)); // pernas até os pedais
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
            foot.position.set(s * 0.24, -0.42, 0.3); passengerMesh.add(foot);
        });
        passengerMesh.position.set(0, 1.15, 1.15);
        passengerMesh.visible = false; bikeBody.add(passengerMesh);

        function makeIconSprite(emoji) {
            const c = document.createElement('canvas'); c.width = 128; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.font = '92px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 64, 70);
            const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
            spr.scale.set(4.5, 4.5, 1);
            return spr;
        }

        function makeBeacon(color, emoji) {
            const g = new THREE.Group();
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 18, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 }));
            beam.position.y = 9; g.add(beam);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 8, 24), new THREE.MeshBasicMaterial({ color }));
            ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; g.add(ring);
            const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.14, 8, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 }));
            ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.65; g.add(ring2);
            const icon = makeIconSprite(emoji);
            icon.position.y = 11.5; g.add(icon);
            g.userData.ring = ring; g.userData.ring2 = ring2; g.userData.icon = icon;
            return g;
        }

        // Veículos com formato mais próximo do real: carroceria + cabine + para-brisa + rodas + faróis/lanternas.
        function makeCar(color) {
            const g = new THREE.Group();
            const bodyMat = new THREE.MeshLambertMaterial({ color });
            const glassMat2 = new THREE.MeshStandardMaterial({ color: 0x1a2430, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.78 });
            const tireMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            const lower = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 4.4), bodyMat); lower.position.y = 0.55; g.add(lower);
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.2), bodyMat); cabin.position.set(0, 1.15, -0.2); g.add(cabin);
            const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.55, 2.05), glassMat2); windshield.position.set(0, 1.16, -0.2); g.add(windshield);
            [[-0.85, -1.5], [0.85, -1.5], [-0.85, 1.5], [0.85, 1.5]].forEach(([wx, wz]) => {
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 14), tireMat);
                wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, 0.42, wz); g.add(wheel);
            });
            const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
            const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
            [-0.65, 0.65].forEach(sx => {
                const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.1), headMat); headL.position.set(sx, 0.6, -2.22); g.add(headL);
                const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.08), tailMat); tailL.position.set(sx, 0.6, 2.22); g.add(tailL);
            });
            const bumperMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.35, 0.3), bumperMat); bumperF.position.set(0, 0.32, -2.25); g.add(bumperF);
            const bumperR = bumperF.clone(); bumperR.position.z = 2.25; g.add(bumperR);
            g.scale.set(2.8, 3.6, 3.1);
            return g;
        }

        // Moto de trânsito realista: proporções de moto de rua (entre-eixos ~1,3 m, roda ~0,6 m, assento a ~0,8 m),
        // com garfo, guidão, farol, tanque/carenagem, motor, escapamento, balança, lanterna, placa, piloto completo.
        // 4 modelos: 'street' (tipo CG/Fan, com baú de entrega às vezes), 'naked' (esportiva), 'scooter' (tipo Biz/PCX), 'trail' (tipo Bros/XRE).
        const MOTO_SCALE = 2.7; // 1 m do modelo = 2,7 unid. do mundo (mesma proporção da moto do jogador)
        function makeMoto(color) {
            const style = ['street', 'naked', 'scooter', 'trail'][Math.floor(Math.random() * 4)];
            const g = new THREE.Group();
            const body = new THREE.Group(); g.add(body);
            const paint = new THREE.MeshLambertMaterial({ color });
            const black = new THREE.MeshLambertMaterial({ color: 0x141418 });
            const dark = new THREE.MeshLambertMaterial({ color: 0x3a3d44 });
            const metal = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 0.75, roughness: 0.3 });
            const tireM = new THREE.MeshLambertMaterial({ color: 0x0d0d10 });
            const lightM = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
            const tailM = new THREE.MeshBasicMaterial({ color: 0xff2020 });
            const blinkM = new THREE.MeshBasicMaterial({ color: 0xffa020 });
            const V = (x, y, z) => new THREE.Vector3(x, y, z);
            const add = (m) => { body.add(m); return m; };
            const box = (w, h, d, mat, x, y, z, rx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (rx) m.rotation.x = rx; return add(m); };
            const sph = (r, mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat); m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); return add(m); };
            const tube = (a, b, r, mat) => add(createBone(a, b, r, mat));

            const scooter = style === 'scooter', trail = style === 'trail', naked = style === 'naked';
            const WR = scooter ? 0.22 : (trail ? 0.34 : 0.31);      // raio da roda
            const HALF_WB = scooter ? 0.62 : 0.67;                    // metade do entre-eixos
            const seatY = trail ? 0.86 : (scooter ? 0.76 : 0.80);

            // ---- Rodas: pneu, aro, raios, disco de freio ----
            const wheels = [];
            function wheel(z) {
                const w = new THREE.Group();
                const tyre = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, scooter ? 0.12 : 0.10, 22), tireM); tyre.rotation.z = Math.PI / 2; w.add(tyre);
                const rim = new THREE.Mesh(new THREE.CylinderGeometry(WR * 0.66, WR * 0.66, 0.108, 18), metal); rim.rotation.z = Math.PI / 2; w.add(rim);
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.13, 10), dark); hub.rotation.z = Math.PI / 2; w.add(hub);
                for (let k = 0; k < 5; k++) {
                    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.022, WR * 1.25, 0.03), dark); sp.rotation.x = (k / 5) * Math.PI; w.add(sp);
                }
                const disc = new THREE.Mesh(new THREE.CylinderGeometry(WR * 0.55, WR * 0.55, 0.012, 16), dark); disc.rotation.z = Math.PI / 2; disc.position.x = 0.06; w.add(disc);
                w.position.set(0, WR, z); body.add(w); wheels.push(w); return w;
            }
            wheel(-HALF_WB); wheel(HALF_WB);
            function fender(z, mat, lift, span) {
                const f = new THREE.Mesh(new THREE.CylinderGeometry(WR + lift, WR + lift, 0.115, 16, 1, true, Math.PI / 2 - span, span * 2), mat);
                f.material.side = THREE.DoubleSide; f.rotation.z = Math.PI / 2; f.position.set(0, WR, z); add(f);
            }
            fender(-HALF_WB, trail ? black : paint, trail ? 0.10 : 0.035, trail ? 0.85 : 1.1);
            fender(HALF_WB + 0.02, black, 0.04, 0.8);

            // ---- Garfo, mesa e guidão ----
            const headTop = V(0, 0.90, -0.46), headTopY = trail ? 0.98 : 0.92;
            [-1, 1].forEach(sx => {
                tube(V(sx * 0.10, headTopY, -0.47), V(sx * 0.075, WR, -HALF_WB), 0.024, metal);
                tube(V(sx * 0.10, headTopY + 0.02, -0.47), V(sx * 0.10, headTopY - 0.24, -0.53), 0.033, dark);
            });
            const barY = headTopY + 0.12, barZ = -0.44;
            tube(V(-0.37, barY, barZ), V(0.37, barY, barZ), 0.014, dark);
            [-1, 1].forEach(sx => {
                const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), black); grip.rotation.z = Math.PI / 2; grip.position.set(sx * 0.335, barY, barZ); add(grip);
                if (!scooter) { tube(V(sx * 0.16, barY, barZ), V(sx * 0.20, barY + 0.16, barZ + 0.02), 0.008, dark); sph(0.05, dark, sx * 0.20, barY + 0.17, barZ + 0.02, 1, 0.6, 0.35); }
                sph(0.022, blinkM, sx * 0.30, barY - 0.02, barZ - 0.08);
            });

            // ---- Farol / carenagem ----
            if (scooter) {
                box(0.36, 0.52, 0.14, paint, 0, 0.62, -0.50);                         // painel frontal
                box(0.20, 0.10, 0.03, new THREE.MeshLambertMaterial({ color: 0xffffff }), 0, 0.98, -0.585);
                sph(0.075, lightM, 0, 0.99, -0.60, 1.4, 0.7, 0.4);
                box(0.34, 0.06, 0.55, dark, 0, 0.27, -0.02);                          // assoalho
                box(0.32, 0.30, 0.34, paint, 0, 0.58, 0.02);                          // cofre central
                box(0.30, 0.30, 0.70, paint, 0, 0.55, 0.50);                          // carenagem traseira
            } else if (naked) {
                box(0.22, 0.17, 0.10, dark, 0, 1.02, -0.54);
                box(0.15, 0.09, 0.03, lightM, 0, 1.02, -0.605);
                box(0.12, 0.06, 0.03, lightM, 0, 0.93, -0.60);
            } else {
                sph(0.105, lightM, 0, 0.99, -0.58, 1, 1, 0.65);
                const rimH = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 6, 18), metal); rimH.position.set(0, 0.99, -0.585); add(rimH);
                sph(0.12, dark, 0, 0.99, -0.53, 1, 1, 0.8);
            }

            // ---- Tanque, motor, quadro ----
            if (!scooter) {
                sph(0.16, paint, 0, 0.88, -0.17, 1.05, trail ? 0.85 : (naked ? 0.8 : 0.9), 2.0);
                box(0.24, 0.26, 0.36, dark, 0, 0.42, 0.03);                                           // bloco do motor
                const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.24, 12), dark); cyl.position.set(0, 0.55, -0.09); cyl.rotation.x = -0.35; add(cyl);
                for (let f = 0; f < 4; f++) { const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.012, 12), metal); fin.position.set(0, 0.47 + f * 0.05, -0.115 - f * 0.014); fin.rotation.x = -0.35; add(fin); }
                tube(V(0, headTopY - 0.02, -0.46), V(0, 0.55, 0.22), 0.024, dark);
                tube(V(0, headTopY - 0.04, -0.46), V(0, 0.32, -0.10), 0.02, dark);
                box(0.09, 0.09, 0.16, metal, 0.13, 0.32, 0.12);                                       // pedal/estribo do motor
            } else {
                box(0.16, 0.14, 0.2, metal, 0.13, 0.30, 0.05);
            }

            // ---- Balança, amortecedor, escapamento ----
            [-1, 1].forEach(sx => tube(V(sx * 0.09, 0.32, 0.12), V(sx * 0.09, WR, HALF_WB), 0.02, dark));
            tube(V(0.075, seatY - 0.12, 0.34), V(0.075, 0.34, 0.50), 0.018, metal);
            tube(V(-0.075, seatY - 0.12, 0.34), V(-0.075, 0.34, 0.50), 0.018, metal);
            tube(V(0.14, 0.30, -0.03), V(0.15, 0.34, 0.55), 0.03, metal);
            const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.42, 12), metal); muffler.rotation.x = Math.PI / 2; muffler.position.set(0.16, 0.37, 0.78); add(muffler);
            if (naked) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 12), black); cap.rotation.x = Math.PI / 2; cap.position.set(0.16, 0.37, 1.0); add(cap); }

            // ---- Banco, rabeta, lanterna, placa, setas ----
            if (naked) {
                box(0.24, 0.08, 0.50, black, 0, seatY, 0.18);
                box(0.19, 0.13, 0.42, paint, 0, seatY + 0.07, 0.72, -0.18);
            } else if (scooter) {
                box(0.26, 0.09, 0.66, black, 0, seatY, 0.34);
            } else {
                box(0.26, 0.09, 0.66, black, 0, seatY, 0.30);
                box(0.16, 0.03, 0.30, black, 0, seatY - 0.06, 0.80, 0.08);
            }
            const tailZ = naked ? 0.97 : 1.00, tailY = naked ? 0.83 : (scooter ? 0.70 : 0.74);
            box(0.14, 0.06, 0.04, tailM, 0, tailY, tailZ);
            box(0.20, 0.14, 0.01, new THREE.MeshLambertMaterial({ color: 0xdcdcdc }), 0, tailY - 0.13, tailZ + 0.01, 0.15);
            [-1, 1].forEach(sx => sph(0.022, blinkM, sx * 0.12, tailY, tailZ - 0.01));
            [-1, 1].forEach(sx => { const m = tube(V(sx * 0.25, barY + 0.05, barZ + 0.02), V(sx * 0.31, barY + 0.15, barZ + 0.02), 0.008, dark); });

            // ---- Baú de entrega (motoboy) ----
            const delivery = (style === 'street' && Math.random() < 0.5) || (scooter && Math.random() < 0.35);
            if (delivery) {
                const boxCols = [0xd02020, 0xf0b010, 0x151515, 0x2050c0];
                box(0.34, 0.03, 0.34, dark, 0, seatY + 0.14, 0.86);
                box(0.42, 0.36, 0.44, new THREE.MeshLambertMaterial({ color: boxCols[Math.floor(Math.random() * boxCols.length)] }), 0, seatY + 0.34, 0.86);
            }

            // ---- Piloto ----
            const jackets = [0x1e2a44, 0x2b2b2b, 0xb02020, 0xe8a020, 0x2a6a3a, 0xdddddd, 0x3a3f8a];
            const helmets = [0x111111, 0xf0f0f0, 0xd02020, 0x2050c0, 0xf0c020, 0x333333];
            const jacketM = new THREE.MeshLambertMaterial({ color: jackets[Math.floor(Math.random() * jackets.length)] });
            const helmetM = new THREE.MeshLambertMaterial({ color: helmets[Math.floor(Math.random() * helmets.length)] });
            const pantsM = new THREE.MeshLambertMaterial({ color: Math.random() < 0.6 ? 0x2a3350 : 0x222226 });
            const lean = naked ? 0.16 : (scooter || trail ? 0.02 : 0.08);
            const hip = V(0, seatY + 0.07, 0.34), shoulder = V(0, 1.34, 0.22 - lean * 1.6), head = V(0, 1.53, 0.16 - lean * 2.2);
            tube(hip, shoulder, 0.125, jacketM);
            sph(0.13, helmetM, head.x, head.y, head.z, 1, 1.05, 1.15);
            const visor = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), new THREE.MeshLambertMaterial({ color: 0x0c0c12 }));
            visor.rotation.x = Math.PI / 2 + 0.25; visor.position.set(head.x, head.y - 0.005, head.z - 0.055); visor.scale.set(1, 1, 1.05); add(visor);
            if (delivery) box(0.30, 0.34, 0.16, new THREE.MeshLambertMaterial({ color: 0xd02020 }), 0, 1.16, 0.40);
            [-1, 1].forEach(sx => {
                const sh = V(sx * 0.17, shoulder.y - 0.03, shoulder.z), el = V(sx * 0.27, 1.14, -0.06), gr = V(sx * 0.335, barY, barZ);
                tube(sh, el, 0.045, jacketM); tube(el, gr, 0.04, jacketM); sph(0.05, black, gr.x, gr.y, gr.z);
                const th = V(sx * 0.14, seatY + 0.06, 0.32), kn = V(sx * 0.21, seatY - 0.02, -0.04), ft = V(sx * 0.19, 0.34, scooter ? -0.20 : 0.10);
                tube(th, kn, 0.075, pantsM); tube(kn, ft, 0.058, pantsM); box(0.10, 0.09, 0.22, black, ft.x, ft.y - 0.03, ft.z - 0.05);
            });

            body.rotation.y = 0;
            g.scale.setScalar(MOTO_SCALE);
            g.userData.wheels = wheels; g.userData.wheelR = WR * MOTO_SCALE;
            return g;
        }

        function buildCitySky() {
            // Céu da cidade aberta igual ao dos outros modos: pôr do sol laranja, sol retrô e estrelas (usa o mapa Retrô).
            const map = MAPS[0];
            while (skyGroup.children.length > 0) skyGroup.remove(skyGroup.children[0]);
            const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            map.sky.forEach((col, i) => grad.addColorStop(i / (map.sky.length - 1), col));
            ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
            skyDome = new THREE.Mesh(new THREE.SphereGeometry(480, 24, 16), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.BackSide }));
            skyGroup.add(skyDome);
            const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSunTexture(map), transparent: true, depthWrite: false }));
            sunSpr.scale.set(220, 220, 1); sunSpr.position.set(0, 55, -650); skyGroup.add(sunSpr);
            skyGroup.add(buildStars(700, 0xffe3c2));
            scene.background = new THREE.Color(map.sky[3]);
            scene.fog = null;
        }

        function buildCity() {
            if (cityBuilt) return;
            buildCitySky();
            // Ruas LARGAS (26) para manobras; calçadas ESTREITAS (3,6) e lotadas de objetos urbanos.
            const N = 10, BLOCK = 68, ROAD = 26;
            const half = N * BLOCK / 2; cityHalf = half;
            const SW = 0.15, plotHalf = BLOCK / 2 - ROAD / 2, plotCorner = 6, WALK = 3.6;
            cityRoadHalfWidth = ROAD / 2;
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(N * BLOCK + 140, N * BLOCK + 140), new THREE.MeshLambertMaterial({ color: 0x7d838d }));
            ground.rotation.x = -Math.PI / 2; cityGroup.add(ground);
            const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x26232e });
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xffc93c });
            const edgeLineMat = new THREE.MeshBasicMaterial({ color: 0xe8e8e8 });
            const curbMat = new THREE.MeshLambertMaterial({ color: 0xb3b6bd });
            const roadPositions = [];
            const roadLen = N * BLOCK + ROAD;
            // Faixas tracejadas com espaçamento uniforme e centralizado (sem sobra torta nas
            // pontas), desenhadas em TODAS as ruas — inclusive as de borda — pra não ficar
            // faltando faixa nem "bagunçado" perto do limite do mapa.
            const dashLen = 4, dashPitch = 14;
            const dashCount = Math.floor((N * BLOCK) / dashPitch);
            const dashStart = -(dashCount * dashPitch) / 2 + dashPitch / 2;
            for (let i = 0; i <= N; i++) {
                const pos = -half + i * BLOCK; roadPositions.push(pos);
                const roadV = new THREE.Mesh(new THREE.PlaneGeometry(ROAD, roadLen), asphaltMat);
                roadV.rotation.x = -Math.PI / 2; roadV.position.set(pos, 0.02, 0); cityGroup.add(roadV);
                const roadH = new THREE.Mesh(new THREE.PlaneGeometry(roadLen, ROAD), asphaltMat);
                roadH.rotation.x = -Math.PI / 2; roadH.position.set(0, 0.02, pos); cityGroup.add(roadH);
                [-1, 1].forEach(sd => {
                    const eV = new THREE.Mesh(new THREE.PlaneGeometry(0.3, N * BLOCK), edgeLineMat);
                    eV.rotation.x = -Math.PI / 2; eV.position.set(pos + sd * (ROAD / 2 - 0.7), 0.03, 0); cityGroup.add(eV);
                    const eH = new THREE.Mesh(new THREE.PlaneGeometry(N * BLOCK, 0.3), edgeLineMat);
                    eH.rotation.x = -Math.PI / 2; eH.position.set(0, 0.03, pos + sd * (ROAD / 2 - 0.7)); cityGroup.add(eH);
                });
                for (let k = 0; k < dashCount; k++) {
                    const d = dashStart + k * dashPitch;
                    const dashV = new THREE.Mesh(new THREE.PlaneGeometry(0.4, dashLen), lineMat);
                    dashV.rotation.x = -Math.PI / 2; dashV.position.set(pos, 0.04, d); cityGroup.add(dashV);
                    const dashH = new THREE.Mesh(new THREE.PlaneGeometry(dashLen, 0.4), lineMat);
                    dashH.rotation.x = -Math.PI / 2; dashH.position.set(d, 0.04, pos); cityGroup.add(dashH);
                }
            }
            cityRoadPositions = roadPositions;

            // ---- Objetos de calçada (InstancedMesh: centenas de objetos sem pesar) ----
            const dummy = new THREE.Object3D();
            const inst = { trunk: [], leaf: [], pole: [], arm: [], globe: [], bollard: [], hydrant: [], trashBody: [], trashLid: [], signPole: [], signBoard: [], planter: [] };
            function pushInst(list, x, y, z, sx, sy, sz, ry) {
                dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(0, ry || 0, 0); dummy.updateMatrix(); list.push(dummy.matrix.clone());
            }
            function flush(list, geo, mat) {
                if (!list.length) return;
                const im = new THREE.InstancedMesh(geo, mat, list.length);
                list.forEach((m, k) => im.setMatrixAt(k, m));
                im.instanceMatrix.needsUpdate = true; cityGroup.add(im);
            }
            let benchCount = 0;
            const ringD = plotHalf - WALK / 2, span = plotHalf - plotCorner - 1.5;
            function sidewalkProps(cx, cz) {
                [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([nx, nz]) => {
                    const tx = Math.abs(nz), tz = Math.abs(nx);
                    let k = 0;
                    for (let t = -span; t <= span + 0.01; t += 5.4, k++) {
                        const jt = t + (Math.random() - 0.5) * 1.0;
                        const x = cx + nx * ringD + tx * jt + nx * (Math.random() - 0.5) * 0.6;
                        const z = cz + nz * ringD + tz * jt + nz * (Math.random() - 0.5) * 0.6;
                        const facing = Math.atan2(nx, nz);
                        let r = Math.random();
                        if (k === 2 && Math.random() < 0.75) r = 0.5; // quase toda calçada tem um poste
                        if (r < 0.45) {
                            const s = 1.5 + Math.random() * 0.7;
                            pushInst(inst.trunk, x, SW + 1.7, z, 1, 1, 1, 0);
                            pushInst(inst.leaf, x, SW + 4.5 + s * 0.3, z, s, s * 0.9, s, Math.random() * 3);
                        } else if (r < 0.58) {
                            pushInst(inst.pole, x, SW + 4.5, z, 1, 1, 1, 0);
                            pushInst(inst.arm, x + nx * 1.1, SW + 9.0, z + nz * 1.1, 1, 1, 1, Math.atan2(-nz, nx));
                            pushInst(inst.globe, x + nx * 2.1, SW + 8.85, z + nz * 2.1, 1, 1, 1, 0);
                        } else if (r < 0.70) {
                            pushInst(inst.bollard, x, SW + 0.65, z, 1, 1, 1, 0);
                        } else if (r < 0.76) {
                            pushInst(inst.hydrant, x, SW + 0.55, z, 1, 1, 1, 0);
                        } else if (r < 0.88) {
                            pushInst(inst.trashBody, x, SW + 0.3 * TRASH_SCALE, z, TRASH_SCALE, TRASH_SCALE, TRASH_SCALE, 0);
                            pushInst(inst.trashLid, x, SW + 0.58 * TRASH_SCALE, z, TRASH_SCALE, TRASH_SCALE, TRASH_SCALE, 0);
                        } else if (r < 0.94) {
                            pushInst(inst.signPole, x, SW + 2.0, z, 1, 1, 1, 0);
                            pushInst(inst.signBoard, x, SW + 3.9, z, 1, 1, 1, facing);
                        } else if (benchCount < 70) {
                            const b = makeBench(); b.position.set(x, SW, z); b.rotation.y = facing; cityGroup.add(b); benchCount++;
                        } else {
                            pushInst(inst.planter, x, SW + 0.5, z, 1, 1, 1, Math.atan2(-nz, nx));
                        }
                    }
                });
            }

            const winTex = buildingWindowTexture('#ffe08a');
            const winTex2 = buildingWindowTexture('#8ad9ff');
            const houseColors = [0xd98c5f, 0xc9a15c, 0x8fae8c, 0xb06a5a, 0x9aa66b, 0xe0a6a1, 0x8bb0c9];
            const accentColors = [0x2ec4b6, 0xff6f59, 0xf4b942];
            for (let bx = 0; bx < N; bx++) for (let bz = 0; bz < N; bz++) {
                const cx = -half + BLOCK * bx + BLOCK / 2, cz = -half + BLOCK * bz + BLOCK / 2;
                const platform = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedSquareShape(plotHalf, plotCorner), { depth: SW, bevelEnabled: false, curveSegments: 6 }), curbMat);
                platform.rotation.x = -Math.PI / 2; platform.position.set(cx, 0, cz); cityGroup.add(platform);
                cityBlockColliders.push({ cx, cz, half: plotHalf, corner: plotCorner });
                sidewalkProps(cx, cz);
                const distCenter = Math.hypot(bx - N / 2 + 0.5, bz - N / 2 + 0.5);
                const isHouse = distCenter > 2.6;
                const roll = Math.random();
                if (isHouse) {
                    const f = 19 + Math.random() * 7, h = 5.5 + Math.random() * 3.5, rot = (Math.random() - 0.5) * 0.25;
                    const hColor = houseColors[(bx + bz) % houseColors.length];
                    const house = new THREE.Mesh(buildingGeo, new THREE.MeshLambertMaterial({ color: hColor, map: makeHouseTexture(hColor) }));
                    house.scale.set(f, h, f); house.position.set(cx, h / 2 + SW, cz); house.rotation.y = rot; cityGroup.add(house);
                    const roof = new THREE.Mesh(mountainGeo, new THREE.MeshLambertMaterial({ color: 0x5c3a2e }));
                    roof.scale.set(f * 0.83, 3.2, f * 0.83); roof.rotation.y = Math.PI / 4 + rot; roof.position.set(cx, h + 1.5 + SW, cz); cityGroup.add(roof);
                } else if (roll < 0.13) {
                    const park = new THREE.Mesh(new THREE.CircleGeometry(plotHalf - WALK - 0.5, 20), new THREE.MeshLambertMaterial({ color: 0x3f7a4a }));
                    park.rotation.x = -Math.PI / 2; park.position.set(cx, SW + 0.01, cz); cityGroup.add(park);
                    pushInst(inst.trunk, cx, SW + 1.7, cz, 1.5, 1.6, 1.5, 0);
                    pushInst(inst.leaf, cx, SW + 7.2, cz, 3.2, 2.8, 3.2, 0);
                    const bench = makeBench(); bench.rotation.y = Math.random() * Math.PI * 2; bench.position.set(cx + 6, SW, cz + 3); cityGroup.add(bench);
                    pushInst(inst.trashBody, cx - 6, SW + 0.3 * TRASH_SCALE, cz - 4, TRASH_SCALE, TRASH_SCALE, TRASH_SCALE, 0);
                    pushInst(inst.trashLid, cx - 6, SW + 0.58 * TRASH_SCALE, cz - 4, TRASH_SCALE, TRASH_SCALE, TRASH_SCALE, 0);
                } else if (roll < 0.4) {
                    const w = 15;
                    [-1, 1].forEach(side => {
                        const h = 24 + Math.random() * 65;
                        const b = new THREE.Mesh(buildingGeo, new THREE.MeshBasicMaterial({ map: Math.random() > 0.5 ? winTex : winTex2, color: 0x9aa2b8 }));
                        const bx2 = cx + side * 8.7;
                        b.scale.set(w, h, w); b.position.set(bx2, h / 2 + SW, cz); cityGroup.add(b);
                        const trim = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.6, w * 1.02), new THREE.MeshBasicMaterial({ color: accentColors[(bx + bz) % 3] }));
                        trim.position.set(bx2, h + SW + 0.3, cz); cityGroup.add(trim);
                    });
                } else {
                    const w = 24 + Math.random() * 5, h = 26 + Math.random() * 80;
                    const b = new THREE.Mesh(buildingGeo, new THREE.MeshBasicMaterial({ map: Math.random() > 0.5 ? winTex : winTex2, color: 0x9aa2b8 }));
                    b.scale.set(w, h, w); b.position.set(cx, h / 2 + SW, cz); cityGroup.add(b);
                    const trim = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.7, w * 1.02), new THREE.MeshBasicMaterial({ color: accentColors[(bx + bz) % 3] }));
                    trim.position.set(cx, h + SW + 0.35, cz); cityGroup.add(trim);
                }
            }
            flush(inst.trunk, new THREE.CylinderGeometry(0.28, 0.4, 3.4, 7), new THREE.MeshLambertMaterial({ color: 0x4a3524 }));
            flush(inst.leaf, new THREE.SphereGeometry(1, 9, 8), new THREE.MeshLambertMaterial({ color: 0x3f8a4f }));
            const lampMatC = new THREE.MeshStandardMaterial({ color: 0x2a2438, metalness: 0.3, roughness: 0.6 });
            flush(inst.pole, new THREE.CylinderGeometry(0.16, 0.24, 9, 8), lampMatC);
            flush(inst.arm, new THREE.BoxGeometry(2.2, 0.2, 0.2), lampMatC);
            flush(inst.globe, new THREE.SphereGeometry(0.55, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff2c9 }));
            flush(inst.bollard, new THREE.CylinderGeometry(0.24, 0.24, 1.3, 8), new THREE.MeshLambertMaterial({ color: 0xf2c230 }));
            flush(inst.hydrant, new THREE.CylinderGeometry(0.34, 0.4, 1.1, 8), new THREE.MeshLambertMaterial({ color: 0xd02a2a }));
            flush(inst.trashBody, new THREE.CylinderGeometry(0.28, 0.24, 0.55, 10), new THREE.MeshLambertMaterial({ color: 0x2f6b3c }));
            flush(inst.trashLid, new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), new THREE.MeshLambertMaterial({ color: 0x1c1824 }));
            flush(inst.signPole, new THREE.BoxGeometry(0.14, 4.0, 0.14), new THREE.MeshLambertMaterial({ color: 0x555a63 }));
            flush(inst.signBoard, new THREE.BoxGeometry(1.7, 1.7, 0.12), new THREE.MeshLambertMaterial({ color: 0x2e6bd6 }));
            flush(inst.planter, new THREE.BoxGeometry(2.4, 1.0, 1.1), new THREE.MeshLambertMaterial({ color: 0x8c8f96 }));

            // ---- Trânsito (mão direita, de frente para o sentido em que anda) ----
            const carColors = [0xff2e63, 0x00e5ff, 0xffc93c, 0x39ff14, 0xffffff, 0xff8800, 0x2050c0, 0x8a8a90];
            for (let i = 0; i < 18; i++) {
                const axis = Math.random() > 0.5 ? 'x' : 'z';
                const lane = roadPositions[Math.floor(Math.random() * roadPositions.length)];
                const dir = Math.random() > 0.5 ? 1 : -1;
                const isCar = Math.random() > 0.45;
                const veh = isCar ? makeCar(carColors[i % carColors.length]) : makeMoto(carColors[(i + 3) % carColors.length]);
                const startPos = (Math.random() - 0.5) * (N * BLOCK);
                const off = ROAD / 4;
                if (axis === 'x') { veh.position.set(startPos, 0, lane + dir * off); veh.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
                else { veh.position.set(lane - dir * off, 0, startPos); veh.rotation.y = dir > 0 ? Math.PI : 0; }
                cityGroup.add(veh);
                cityTraffic.push({ veh, axis, dir, speed: (isCar ? 9 : 13) + Math.random() * 8, r: isCar ? 4.0 : 2.4 });
            }

            const railMatP = new THREE.MeshStandardMaterial({ color: 0x3a3448, metalness: 0.4, roughness: 0.5 });
            const edgeR = half + ROAD / 2 + 0.6;
            [1, -1].forEach(side => {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(N * BLOCK + ROAD * 2, 1.3, 0.6), railMatP);
                rail.position.set(0, 0.65, side * edgeR); cityGroup.add(rail);
                const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, N * BLOCK + ROAD * 2), railMatP);
                rail2.position.set(side * edgeR, 0.65, 0); cityGroup.add(rail2);
            });
            cityMarkers.wheelie = makeBeacon(0xffc93c, '🏍️'); cityMarkers.wheelie.position.set(CITY_TOTEMS.wheelie.x, 0, CITY_TOTEMS.wheelie.z); cityGroup.add(cityMarkers.wheelie);
            cityMarkers.pickup = makeBeacon(0x00e5ff, '🛺'); cityMarkers.pickup.position.set(CITY_TOTEMS.pickup.x, 0, CITY_TOTEMS.pickup.z); cityGroup.add(cityMarkers.pickup);
            cityMarkers.dropoff = makeBeacon(0x00e5a8, '📍'); cityMarkers.dropoff.position.set(CITY_TOTEMS.dropoff.x, 0, CITY_TOTEMS.dropoff.z); cityMarkers.dropoff.visible = false; cityGroup.add(cityMarkers.dropoff);
            cityMarkers.race = makeBeacon(0xff2e63, '🏁'); cityMarkers.race.position.set(CITY_TOTEMS.race.x, 0, CITY_TOTEMS.race.z); cityGroup.add(cityMarkers.race);
            scene.add(cityGroup);
            cityBuilt = true;
        }

        function disposeCity() {
            scene.remove(raceGroup); cityRaceActive = false;
            clearCityRouteLine();
            if (!cityBuilt) return;
            scene.remove(cityGroup);
            while (cityGroup.children.length > 0) cityGroup.remove(cityGroup.children[0]);
            cityTraffic = []; cityStaticColliders.length = 0; cityBlockColliders.length = 0; cityBuilt = false;
        }

        let cityNearMarker = null;
        let cityRouteLine = null;

        function clearCityRouteLine() {
            if (cityRouteLine) {
                scene.remove(cityRouteLine);
                if (cityRouteLine.geometry) cityRouteLine.geometry.dispose();
                if (cityRouteLine.material) cityRouteLine.material.dispose();
                cityRouteLine = null;
            }
        }

        function updateCityRouteLine3D() {
            clearCityRouteLine();
            if (cityMission !== 'dropoff' || gameMode !== 'cidade' || cityRaceActive) return;
            const p = bikeContainer.position;
            const dest = CITY_TOTEMS.dropoff;
            const path = buildGridPath(p.x, p.z, dest.x, dest.z);
            const pts = path.map(pt => new THREE.Vector3(pt.x, 0.35, pt.z));
            // densifica um pouco para a linha acompanhar melhor
            const dens = [];
            for (let i = 0; i < pts.length - 1; i++) {
                dens.push(pts[i]);
                dens.push(pts[i].clone().lerp(pts[i + 1], 0.5));
            }
            dens.push(pts[pts.length - 1]);
            const geo = new THREE.BufferGeometry().setFromPoints(dens);
            const mat = new THREE.LineDashedMaterial({
                color: 0x00e5a8,
                dashSize: 3,
                gapSize: 1.5,
                linewidth: 2,
                transparent: true,
                opacity: 0.95
            });
            cityRouteLine = new THREE.Line(geo, mat);
            cityRouteLine.computeLineDistances();
            scene.add(cityRouteLine);
        }

        // Sorteia um destino aleatório do moto-táxi em um cruzamento do mapa.
        // Evita pontos perto demais da moto e perto dos totens de missão.
        const TAXI_MIN_DISTANCE = 150;
        function pickRandomTaxiDestination(fromPos) {
            const roads = cityRoadPositions.length ? cityRoadPositions : [-340, -272, -204, -136, -68, 0, 68, 136, 204, 272, 340];
            const totemKeys = ['wheelie', 'pickup', 'race'];
            const candidates = [];
            for (const x of roads) for (const z of roads) {
                if (Math.hypot(x - fromPos.x, z - fromPos.z) < TAXI_MIN_DISTANCE) continue;
                if (totemKeys.some(k => Math.hypot(x - CITY_TOTEMS[k].x, z - CITY_TOTEMS[k].z) < 40)) continue;
                candidates.push({ x, z });
            }
            if (!candidates.length) { // fallback: qualquer cruzamento diferente do atual
                for (const x of roads) for (const z of roads) {
                    if (Math.hypot(x - fromPos.x, z - fromPos.z) > 30) candidates.push({ x, z });
                }
            }
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        function setRandomTaxiDestination() {
            const d = pickRandomTaxiDestination(bikeContainer.position);
            CITY_TOTEMS.dropoff.x = d.x;
            CITY_TOTEMS.dropoff.z = d.z;
            if (cityMarkers.dropoff) cityMarkers.dropoff.position.set(d.x, 0, d.z);
            return d;
        }

        function setCancelMissionBtn(show) {
            const b = document.getElementById('btnCancelCityMission');
            if (b) b.style.display = show ? 'block' : 'none';
        }
        (function setupCancelMissionBtn() {
            const b = document.getElementById('btnCancelCityMission');
            if (!b) return;
            // mousedown sem foco: evita que ESPAÇO (controle do grau) "clique" no botão
            b.addEventListener('mousedown', ev => ev.preventDefault());
            b.addEventListener('click', ev => {
                ev.preventDefault(); ev.stopPropagation();
                b.blur();
                if (cityMission === 'wheelie') {
                    resetCityMission();
                    showNotification('✖', 'Missão cancelada');
                }
            });
        })();

        function resetCityMission() {
            cityMission = null; setCancelMissionBtn(false); cityWheelieMs = 0; cityRaceMs = 0; cityNearMarker = null;
            pendingMissionKey = null;
            clearCityRouteLine();
            if (isMissionModalOpen) {
                isMissionModalOpen = false;
                const modalEl = document.getElementById('mission-modal');
                if (modalEl) modalEl.style.display = 'none';
            }
            passengerMesh.visible = false;
            if (cityMarkers.dropoff) cityMarkers.dropoff.visible = false;
            if (cityMarkers.pickup) cityMarkers.pickup.visible = true;
            if (cityMarkers.race) cityMarkers.race.visible = true;
            const el = document.getElementById('cityMissionText');
            if (el) el.innerText = 'Procure os totens de missão';
            const btn = document.getElementById('cityAcceptBtn');
            if (btn) btn.style.display = 'none';
            const promptEl = document.getElementById('interaction-prompt');
            if (promptEl) promptEl.style.display = 'none';
        }

        const MISSION_INFO = {
            wheelie: {
                title: 'Missão Grau',
                description: 'Empine a moto e mantenha o grau por 60 segundos consecutivos. Se a roda dianteira tocar o chão, o cronômetro zera. Recompensa: +150 moedas.'
            },
            pickup: {
                title: 'Missão Uber Moto',
                description: 'Pegue o passageiro neste ponto e leve-o até o marcador verde na cidade. Cuidado com o tráfego e as calçadas. Recompensa: +100 moedas.'
            },
            race: {
                title: 'Missão Corrida',
                description: 'Corra até a linha de chegada em até 62 segundos. Desvie dos obstáculos no caminho — bater ou cair do mapa encerra a corrida. Recompensa: +500 moedas.'
            }
        };

        let isMissionModalOpen = false;
        let pendingMissionKey = null; // missão escolhida no modal (não depende mais da distância)

        function openMissionModal(missionKey) {
            if (!missionKey || cityMission || isMissionModalOpen) return;
            if (gameMode !== 'cidade') return;
            const info = MISSION_INFO[missionKey];
            if (!info) return;
            pendingMissionKey = missionKey;
            isMissionModalOpen = true;
            const promptEl = document.getElementById('interaction-prompt');
            if (promptEl) promptEl.style.display = 'none';
            const titleEl = document.getElementById('modalTitle');
            const descEl = document.getElementById('modalDescription');
            const modalEl = document.getElementById('mission-modal');
            if (titleEl) titleEl.innerText = info.title;
            if (descEl) descEl.innerText = info.description;
            if (modalEl) modalEl.style.display = 'flex';
            // Congela a moto enquanto o modal está aberto
            speed = 0;
            keys.w = keys.s = keys.a = keys.d = keys.space = false;
        }

        function closeMissionModal() {
            const modalEl = document.getElementById('mission-modal');
            if (modalEl) modalEl.style.display = 'none';
            isMissionModalOpen = false;
            // Mantém pendingMissionKey só se for fechar sem aceitar → limpa
            // (acceptCityMission limpa depois de usar)
            if (!cityMission) pendingMissionKey = null;
        }

        function acceptCityMission() {
            // Usa a chave salva no modal; fallback para cityNearMarker
            const marker = pendingMissionKey || cityNearMarker;
            if (!marker || cityMission) {
                closeMissionModal();
                return;
            }
            isMissionModalOpen = false;
            pendingMissionKey = null;
            cityNearMarker = null;
            const modalEl = document.getElementById('mission-modal');
            if (modalEl) modalEl.style.display = 'none';
            const promptEl = document.getElementById('interaction-prompt');
            if (promptEl) promptEl.style.display = 'none';

            if (marker === 'wheelie') {
                cityMission = 'wheelie';
                cityWheelieMs = 0;
                setCancelMissionBtn(true);
                document.getElementById('cityMissionText').innerText = 'Empine e segure por 60s!';
            } else if (marker === 'pickup') {
                cityMission = 'dropoff';
                setRandomTaxiDestination(); // novo ponto de chegada aleatório a cada corrida
                passengerMesh.visible = true;
                if (cityMarkers.pickup) cityMarkers.pickup.visible = false;
                if (cityMarkers.dropoff) cityMarkers.dropoff.visible = true;
                document.getElementById('cityMissionText').innerText = 'Leve o passageiro ao marcador verde!\nSiga a linha no minimapa';
                updateCityRouteLine3D();
            } else if (marker === 'race') {
                cityMission = 'race';
                if (cityMarkers.race) cityMarkers.race.visible = false;
                enterRace();
            }
            const acceptBtn = document.getElementById('cityAcceptBtn');
            if (acceptBtn) acceptBtn.style.display = 'none';
        }

        function setupMissionModalButtons() {
            const btnStart = document.getElementById('btnStartMission');
            const btnClose = document.getElementById('btnCloseMission');
            const modalEl = document.getElementById('mission-modal');
            if (btnStart) {
                btnStart.onclick = (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    acceptCityMission();
                };
            }
            if (btnClose) {
                btnClose.onclick = (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    closeMissionModal();
                };
            }
            // Clique no fundo escuro fecha o modal
            if (modalEl) {
                modalEl.onclick = (ev) => {
                    if (ev.target === modalEl) closeMissionModal();
                };
            }
        }
        setupMissionModalButtons();

        function nearPoint(pos, x, z, r) { return (pos.x - x) ** 2 + (pos.z - z) ** 2 < r * r; }

        // ---- Mapa exclusivo e reto para a missão "Corrida contra o Tempo" ----
        const raceGroup = new THREE.Group();
        let raceBuilt = false, cityRaceActive = false, raceResultShown = false, pendingRaceSuccess = false;
        let raceObstacles = [];
        const raceReturnPos = new THREE.Vector3();
        const RACE_LENGTH = 4325, RACE_WIDTH = 34;

        function buildRaceWorld() {
            if (raceBuilt) return;
            const rGround = new THREE.Mesh(new THREE.PlaneGeometry(RACE_WIDTH, RACE_LENGTH + 40), new THREE.MeshLambertMaterial({ color: 0x26232e }));
            rGround.rotation.x = -Math.PI / 2; rGround.position.set(0, 0.01, -RACE_LENGTH / 2); raceGroup.add(rGround);
            const lineMat2 = new THREE.MeshBasicMaterial({ color: 0xffc93c });
            for (let z = -10; z > -RACE_LENGTH; z -= 14) {
                const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 5), lineMat2);
                dash.rotation.x = -Math.PI / 2; dash.position.set(0, 0.02, z); raceGroup.add(dash);
            }
            const railMat2 = new THREE.MeshStandardMaterial({ color: 0x3a3448, metalness: 0.4, roughness: 0.5 });
            [-1, 1].forEach(side => {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, RACE_LENGTH + 40), railMat2);
                rail.position.set(side * (RACE_WIDTH / 2 + 0.3), 0.6, -RACE_LENGTH / 2); raceGroup.add(rail);
            });
            const obstCount = Math.round((RACE_LENGTH - 40) / 38);
            for (let i = 1; i <= obstCount; i++) {
                const def = MALUCO_OBST_TYPES[i % 3];
                const m = new THREE.Mesh(def.geo, def.mat);
                const z = -20 - i * (RACE_LENGTH - 40) / obstCount;
                const x = (Math.random() - 0.5) * (RACE_WIDTH - def.radius * 3);
                m.position.set(x, def.y, z); raceGroup.add(m);
                raceObstacles.push({ x, z, radius: def.radius });
            }
            const finishTex = createCheckeredTexture(); finishTex.repeat.set(6, 1);
            const finishStripe = new THREE.Mesh(new THREE.PlaneGeometry(RACE_WIDTH, 5), new THREE.MeshBasicMaterial({ map: finishTex }));
            finishStripe.rotation.x = -Math.PI / 2; finishStripe.position.set(0, 0.05, -RACE_LENGTH); raceGroup.add(finishStripe);
            const poleGeo2 = new THREE.CylinderGeometry(0.4, 0.5, 14, 10);
            const poleMat2 = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.6, roughness: 0.35 });
            [-1, 1].forEach(side => { const pole = new THREE.Mesh(poleGeo2, poleMat2); pole.position.set(side * (RACE_WIDTH / 2 + 1), 7, -RACE_LENGTH); raceGroup.add(pole); });
            const bannerTex2 = createCheckeredTexture(); bannerTex2.repeat.set(10, 2);
            const banner2 = new THREE.Mesh(new THREE.BoxGeometry(RACE_WIDTH + 2, 2.2, 0.4), new THREE.MeshBasicMaterial({ map: bannerTex2 }));
            banner2.position.set(0, 13.5, -RACE_LENGTH); raceGroup.add(banner2);
            raceBuilt = true;
        }

        function enterRace() {
            buildRaceWorld();
            raceReturnPos.copy(bikeContainer.position);
            scene.remove(cityGroup); scene.add(raceGroup);
            bikeContainer.position.set(0, 0, -5); bikeContainer.rotation.set(0, 0, 0); speed = 0;
            cityRaceActive = true; cityRaceMs = 62000;
            document.getElementById('cityMissionText').innerText = 'Corrida: 62s até a linha de chegada, bem lá longe!';
        }

        function exitRace(success) {
            scene.remove(raceGroup); scene.add(cityGroup);
            bikeContainer.position.copy(raceReturnPos); bikeContainer.rotation.set(0, 0, 0); speed = 0;
            cityRaceActive = false;
            if (success) { coins += 500; saveProgress(); updateCoinHud(); }
            resetCityMission();
        }

        function showRaceResult(success, reasonText) {
            if (raceResultShown) return;
            raceResultShown = true;
            cityRaceActive = false;
            speed = 0; stopWheelie();
            pendingRaceSuccess = success;
            document.getElementById('raceResultTitle').innerText = success ? 'VOCÊ VENCEU!' : 'CORRIDA FALHOU';
            document.getElementById('raceResultTitle').style.color = success ? '#00e5a8' : '#ff2e63';
            document.getElementById('raceResultSub').innerText = reasonText + (success ? ' +500 moedas' : '');
            // Ao vencer não há o que continuar; só ao perder (tempo, obstáculo ou cair do mapa) o botão aparece.
            document.getElementById('raceContinueBtn').style.display = success ? 'none' : 'block';
            document.getElementById('raceResultOverlay').classList.remove('hidden');
        }

        // Recomeça a mesma corrida do zero (mesma pista/obstáculos), sem voltar para a cidade.
        function continueRaceAttempt() {
            document.getElementById('raceResultOverlay').classList.add('hidden');
            raceResultShown = false;
            bikeContainer.position.set(0, 0, -5); bikeContainer.rotation.set(0, 0, 0);
            speed = 0; stopWheelie();
            cityRaceActive = true; cityRaceMs = 62000;
            document.getElementById('cityMissionText').innerText = 'Corrida: 62s até a linha de chegada, bem lá longe!';
        }

        function updateCityRace(delta) {
            cityRaceMs -= delta * 1000;
            document.getElementById('cityMissionText').innerText = 'Corrida: ' + Math.max(0, Math.ceil(cityRaceMs / 1000)) + 's restantes';
            const p = bikeContainer.position;
            // Passar da mureta lateral (ou cair por baixo da pista, se algum dia houver buraco) = caiu do mapa.
            if (Math.abs(p.x) > RACE_WIDTH / 2 + 0.6 || p.y < -4) { showRaceResult(false, 'Você caiu do mapa.'); return; }
            raceObstacles.forEach(o => { if (nearPoint(p, o.x, o.z, o.radius + 1.6)) showRaceResult(false, 'Você bateu em um obstáculo.'); });
            if (p.z <= -RACE_LENGTH + 2) showRaceResult(true, 'Você cruzou a linha de chegada!');
            else if (cityRaceMs <= 0) showRaceResult(false, 'O tempo esgotou.');
        }

        // ==================== MINI MAPA ====================
        const minimapCanvas = document.getElementById('minimap');
        const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
        const minimapWrap = document.getElementById('minimap-wrap');
        const minimapHint = document.getElementById('minimap-hint');
        const minimapLabel = document.getElementById('minimap-label');

        function setMinimapVisible(on) {
            if (!minimapWrap) return;
            if (on) minimapWrap.classList.add('visible');
            else minimapWrap.classList.remove('visible');
        }

        // Caminho em grade (ruas em cruz): vai primeiro no eixo X até o destino, depois no Z (ou o inverso se for mais curto visualmente)
        function buildGridPath(fromX, fromZ, toX, toZ) {
            const pts = [{ x: fromX, z: fromZ }];
            // Preferência: alinhar no eixo da rua mais próxima do jogador
            pts.push({ x: toX, z: fromZ });
            pts.push({ x: toX, z: toZ });
            return pts;
        }

        function worldToMinimap(x, z, originX, originZ, scale, cx, cy) {
            // Mapa com +Z para baixo na tela (estilo mapa de cima); rotação aplicada depois em torno do jogador
            return {
                x: cx + (x - originX) * scale,
                y: cy + (z - originZ) * scale
            };
        }

        function drawMinimapArrow(ctx, x, y, angle, color, size) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.7, size * 0.75);
            ctx.lineTo(0, size * 0.35);
            ctx.lineTo(-size * 0.7, size * 0.75);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        function drawMinimapDot(ctx, x, y, r, fill, stroke) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
            if (stroke) {
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        function updateMinimap() {
            if (!minimapCtx || !minimapCanvas || gameMode !== 'cidade' || appState !== 'playing') {
                setMinimapVisible(false);
                return;
            }
            setMinimapVisible(true);

            const w = minimapCanvas.width;
            const h = minimapCanvas.height;
            const cx = w / 2, cy = h / 2;
            const p = bikeContainer.position;
            const heading = bikeContainer.rotation.y; // 0 = -Z no mundo three

            minimapCtx.clearRect(0, 0, w, h);

            // Fundo
            minimapCtx.fillStyle = '#0c0a12';
            minimapCtx.fillRect(0, 0, w, h);

            // Escala: quantas unidades do mundo cabem no raio do mapa
            const viewRadius = cityRaceActive ? 220 : 160;
            const scale = (Math.min(w, h) * 0.42) / viewRadius;

            minimapCtx.save();
            // Centraliza no jogador e gira o mapa para o "norte" do jogador ficar para cima
            // No Three.js, frente da moto é -Z local; rotation.y positivo gira para a esquerda.
            // Na tela queremos a frente da moto apontando para cima.
            minimapCtx.translate(cx, cy);
            minimapCtx.rotate(heading); // alinha o mapa com a orientação da moto
            minimapCtx.translate(-cx, -cy);

            function project(wx, wz) {
                return {
                    x: cx + (wx - p.x) * scale,
                    y: cy + (wz - p.z) * scale
                };
            }

            if (cityRaceActive) {
                // ---- Minimap da corrida (pista reta) ----
                const trackHalf = RACE_WIDTH / 2;
                const z0 = 10, z1 = -RACE_LENGTH - 10;
                const a = project(-trackHalf, z0);
                const b = project(trackHalf, z0);
                const c = project(trackHalf, z1);
                const d = project(-trackHalf, z1);
                minimapCtx.beginPath();
                minimapCtx.moveTo(a.x, a.y); minimapCtx.lineTo(b.x, b.y); minimapCtx.lineTo(c.x, c.y); minimapCtx.lineTo(d.x, d.y);
                minimapCtx.closePath();
                minimapCtx.fillStyle = '#26232e';
                minimapCtx.fill();
                minimapCtx.strokeStyle = '#ffc93c';
                minimapCtx.lineWidth = 1.5;
                minimapCtx.stroke();

                // Linha central tracejada
                minimapCtx.strokeStyle = 'rgba(255,201,60,0.45)';
                minimapCtx.setLineDash([6, 6]);
                minimapCtx.beginPath();
                const midA = project(0, z0), midB = project(0, z1);
                minimapCtx.moveTo(midA.x, midA.y);
                minimapCtx.lineTo(midB.x, midB.y);
                minimapCtx.stroke();
                minimapCtx.setLineDash([]);

                // Rota até a chegada
                minimapCtx.strokeStyle = '#00e5a8';
                minimapCtx.lineWidth = 3;
                minimapCtx.lineCap = 'round';
                minimapCtx.beginPath();
                const rp = project(p.x, p.z);
                const rf = project(0, -RACE_LENGTH);
                minimapCtx.moveTo(rp.x, rp.y);
                minimapCtx.lineTo(rf.x, rf.y);
                minimapCtx.stroke();

                // Linha de chegada
                drawMinimapDot(minimapCtx, rf.x, rf.y, 6, '#ff2e63', '#fff');
                if (minimapLabel) minimapLabel.innerText = 'CORRIDA';
                if (minimapHint) {
                    const distM = Math.max(0, Math.round((-RACE_LENGTH) - p.z));
                    minimapHint.innerText = 'Chegada em ~' + distM + ' m';
                }
            } else {
                // ---- Minimap da cidade ----
                // Desenha grade de ruas (só as próximas)
                const roads = cityRoadPositions || [];
                const roadW = (cityRoadHalfWidth || 13) * scale * 2;
                minimapCtx.strokeStyle = '#3a3548';
                minimapCtx.lineWidth = Math.max(2, roadW * 0.35);
                minimapCtx.lineCap = 'butt';
                const extent = (cityHalf || 340) + 40;
                for (let i = 0; i < roads.length; i++) {
                    const rp = roads[i];
                    // Rua vertical (constante X)
                    const v0 = project(rp, -extent), v1 = project(rp, extent);
                    minimapCtx.beginPath();
                    minimapCtx.moveTo(v0.x, v0.y);
                    minimapCtx.lineTo(v1.x, v1.y);
                    minimapCtx.stroke();
                    // Rua horizontal (constante Z)
                    const h0 = project(-extent, rp), h1 = project(extent, rp);
                    minimapCtx.beginPath();
                    minimapCtx.moveTo(h0.x, h0.y);
                    minimapCtx.lineTo(h1.x, h1.y);
                    minimapCtx.stroke();
                }

                // Marcadores de missão
                const markers = [
                    { key: 'wheelie', color: '#ffc93c', show: !cityMission },
                    { key: 'pickup',  color: '#00e5ff', show: !cityMission },
                    { key: 'race',    color: '#ff2e63', show: !cityMission },
                    { key: 'dropoff', color: '#00e5a8', show: cityMission === 'dropoff' },
                ];
                markers.forEach(mk => {
                    if (!mk.show) return;
                    const t = CITY_TOTEMS[mk.key];
                    if (!t) return;
                    const pt = project(t.x, t.z);
                    drawMinimapDot(minimapCtx, pt.x, pt.y, 5, mk.color, '#fff');
                });

                // Rota da missão Uber (moto-táxi) até o dropoff
                if (cityMission === 'dropoff') {
                    const dest = CITY_TOTEMS.dropoff;
                    const path = buildGridPath(p.x, p.z, dest.x, dest.z);
                    minimapCtx.strokeStyle = '#00e5a8';
                    minimapCtx.lineWidth = 3;
                    minimapCtx.lineCap = 'round';
                    minimapCtx.lineJoin = 'round';
                    minimapCtx.setLineDash([7, 5]);
                    minimapCtx.beginPath();
                    path.forEach((pt, i) => {
                        const s = project(pt.x, pt.z);
                        if (i === 0) minimapCtx.moveTo(s.x, s.y);
                        else minimapCtx.lineTo(s.x, s.y);
                    });
                    minimapCtx.stroke();
                    minimapCtx.setLineDash([]);
                    const dp = project(dest.x, dest.z);
                    drawMinimapDot(minimapCtx, dp.x, dp.y, 7, '#00e5a8', '#fff');
                    // Anel pulsante no destino
                    const pulse = 9 + Math.sin(clock.elapsedTime * 4) * 2.5;
                    minimapCtx.beginPath();
                    minimapCtx.arc(dp.x, dp.y, pulse, 0, Math.PI * 2);
                    minimapCtx.strokeStyle = 'rgba(0,229,168,0.7)';
                    minimapCtx.lineWidth = 2;
                    minimapCtx.stroke();
                    if (minimapLabel) minimapLabel.innerText = 'ENTREGA';
                    if (minimapHint) {
                        const distM = Math.round(Math.hypot(dest.x - p.x, dest.z - p.z));
                        minimapHint.innerText = 'Destino a ~' + distM + ' m — siga a linha verde';
                    }
                } else if (cityMission === 'wheelie') {
                    if (minimapLabel) minimapLabel.innerText = 'GRAU';
                    if (minimapHint) minimapHint.innerText = 'Mantenha o grau por 60s';
                } else if (cityMission === 'race') {
                    // Aguardando entrar na corrida (logo após aceitar)
                    if (minimapLabel) minimapLabel.innerText = 'CORRIDA';
                    if (minimapHint) minimapHint.innerText = 'Preparando pista...';
                } else {
                    if (minimapLabel) minimapLabel.innerText = 'MAPA';
                    if (minimapHint) minimapHint.innerText = 'Totens: amarelo=grau · ciano=uber · vermelho=corrida';
                }
            }

            minimapCtx.restore();

            // Jogador sempre no centro, apontando para cima (mapa já rotacionado)
            drawMinimapArrow(minimapCtx, cx, cy, 0, '#ffffff', 9);

            // Borda interna sutil
            minimapCtx.strokeStyle = 'rgba(255,201,60,0.25)';
            minimapCtx.lineWidth = 2;
            minimapCtx.strokeRect(1, 1, w - 2, h - 2);
        }

        function updateCity(delta) {
            // Missão do grau: os veículos saem do mapa; ao terminar/cancelar, voltam entrando pelas bordas.
            const clearTraffic = cityMission === 'wheelie';
            const trafficEdge = cityHalf + 15;
            cityTraffic.forEach(t => {
                if (clearTraffic) {
                    if (t.gone) return;
                    const mv = t.dir * t.speed * 2.5 * delta; // acelera para sair logo do mapa
                    if (t.axis === 'x') t.veh.position.x += mv; else t.veh.position.z += mv;
                    const c = t.axis === 'x' ? t.veh.position.x : t.veh.position.z;
                    if (c > trafficEdge || c < -trafficEdge) { t.gone = true; t.veh.visible = false; }
                    return;
                }
                if (t.gone) { // volta ao tráfego pela borda de onde começaria a andar
                    t.gone = false; t.veh.visible = true;
                    if (t.axis === 'x') t.veh.position.x = t.dir > 0 ? -trafficEdge : trafficEdge;
                    else t.veh.position.z = t.dir > 0 ? -trafficEdge : trafficEdge;
                }
                const move = t.dir * t.speed * delta;
                if (t.veh.userData.wheels) t.veh.userData.wheels.forEach(w => { w.rotation.x -= (t.speed * delta) / t.veh.userData.wheelR; });
                if (t.axis === 'x') {
                    t.veh.position.x += move;
                    if (t.veh.position.x > cityHalf + 15) t.veh.position.x = -cityHalf - 15;
                    if (t.veh.position.x < -cityHalf - 15) t.veh.position.x = cityHalf + 15;
                } else {
                    t.veh.position.z += move;
                    if (t.veh.position.z > cityHalf + 15) t.veh.position.z = -cityHalf - 15;
                    if (t.veh.position.z < -cityHalf - 15) t.veh.position.z = cityHalf + 15;
                }
            });
            Object.values(cityMarkers).forEach(m => {
                if (!m || !m.visible || !m.userData) return;
                if (m.userData.ring) m.userData.ring.rotation.z += delta * 2;
                if (m.userData.ring2) m.userData.ring2.rotation.z -= delta * 1.4;
                if (m.userData.icon) {
                    const pulse = 4.5 + Math.sin(clock.elapsedTime * 3) * 0.4;
                    m.userData.icon.scale.set(pulse, pulse, 1);
                }
            });
            const p = bikeContainer.position;
            const bikeR = 1.2;
            function resolveCollision(cx, cz, minD, dampMin, dampMax) {
                const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
                if (d < minD && d > 0.0001) {
                    const nx = dx / d, nz = dz / d;
                    const tx = cx + nx * minD, tz = cz + nz * minD;
                    p.x += (tx - p.x) * 0.55; p.z += (tz - p.z) * 0.55;
                    const fx = -Math.sin(bikeContainer.rotation.y), fz = -Math.cos(bikeContainer.rotation.y);
                    const headOn = Math.abs(fx * nx + fz * nz);
                    speed *= dampMin + (dampMax - dampMin) * (1 - headOn);
                    if (wheelieAngle > 0.1) forceDropWheelie(); // colisão: desce o grau rápido, sem zerar no frame
                }
            }
            cityStaticColliders.forEach(c => resolveCollision(c.x, c.z, c.r + bikeR, 0.55, 0.97));
            cityTraffic.forEach(t => { if (!t.gone) resolveCollision(t.veh.position.x, t.veh.position.z, t.r + bikeR, 0.45, 0.95); });
            const edge = cityHalf + cityRoadHalfWidth - 1.5;
            p.x = Math.max(-edge, Math.min(edge, p.x));
            p.z = Math.max(-edge, Math.min(edge, p.z));
            // Quarteirões (calçada + prédios) são "paredes" arredondadas: a moto DESLIZA na lateral em vez de parar.
            const fwdX = -Math.sin(bikeContainer.rotation.y), fwdZ = -Math.cos(bikeContainer.rotation.y);
            for (let bi = 0; bi < cityBlockColliders.length; bi++) {
                const bc = cityBlockColliders[bi];
                if (Math.abs(p.x - bc.cx) > bc.half + 8 || Math.abs(p.z - bc.cz) > bc.half + 8) continue;
                const hit = pushOutRoundedBox(p, bc.cx, bc.cz, bc.half, bc.corner, 1.6);
                if (hit) {
                    const headOn = Math.abs(fwdX * hit.nx + fwdZ * hit.nz);
                    speed *= 1 - 0.10 * headOn * headOn; // só perde velocidade de verdade em batida de frente
                    if (wheelieAngle > 0.1) forceDropWheelie(); // colisão com calçada/prédio: desce o grau rápido
                }
            }

            const promptEl = document.getElementById('interaction-prompt');
            const missionTextEl = document.getElementById('cityMissionText');
            if (isMissionModalOpen) {
                if (promptEl) promptEl.style.display = 'none';
            } else if (!cityMission) {
                // Totens: perto = aviso no HUD + prompt "Pressione E"; E abre o modal de aceite.
                const totems = [
                    { key: 'wheelie', x: CITY_TOTEMS.wheelie.x, z: CITY_TOTEMS.wheelie.z, short: 'Missão Grau', label: CITY_TOTEMS.wheelie.label },
                    { key: 'pickup',  x: CITY_TOTEMS.pickup.x,  z: CITY_TOTEMS.pickup.z,  short: 'Missão Uber Moto', label: CITY_TOTEMS.pickup.label },
                    { key: 'race',    x: CITY_TOTEMS.race.x,    z: CITY_TOTEMS.race.z,    short: 'Missão Corrida', label: CITY_TOTEMS.race.label },
                ];
                // Usa posição real do marcador 3D quando existir (fonte da verdade visual)
                totems.forEach(tt => {
                    const marker = cityMarkers[tt.key];
                    if (marker) { tt.x = marker.position.x; tt.z = marker.position.z; }
                });
                const interactR = 28; // raio para poder pressionar E
                const detectR = 55;   // raio para avisar no HUD
                let best = null;
                let bestDist = Infinity;
                for (const tt of totems) {
                    const dist = Math.hypot(p.x - tt.x, p.z - tt.z);
                    if (dist < bestDist) { bestDist = dist; best = tt; }
                }
                if (best && bestDist <= interactR) {
                    cityNearMarker = best.key;
                    if (missionTextEl) {
                        missionTextEl.innerText = best.short + ' disponível!\nPressione E para aceitar';
                    }
                    if (promptEl) {
                        promptEl.innerHTML = 'Pressione <span class="key-badge">E</span> para ver a missão';
                        promptEl.style.display = 'block';
                    }
                } else if (best && bestDist <= detectR) {
                    cityNearMarker = null;
                    if (missionTextEl) {
                        missionTextEl.innerText = best.short + ' próxima — aproxime-se do totem';
                    }
                    if (promptEl) promptEl.style.display = 'none';
                } else {
                    cityNearMarker = null;
                    if (missionTextEl) missionTextEl.innerText = 'Procure os totens de missão (colunas coloridas)';
                    if (promptEl) promptEl.style.display = 'none';
                }
            } else if (cityMission === 'wheelie') {
                if (promptEl) promptEl.style.display = 'none';
                if (wheelieAngle > 0.15) cityWheelieMs += delta * 1000; else cityWheelieMs = 0;
                if (missionTextEl) missionTextEl.innerText = 'Grau: ' + (cityWheelieMs / 1000).toFixed(1) + 's / 60s';
                if (cityWheelieMs >= 60000) { coins += 150; saveProgress(); updateCoinHud(); showNotification('🏆', 'Missão Grau completa! +150 moedas'); resetCityMission(); }
            } else if (cityMission === 'dropoff') {
                if (promptEl) promptEl.style.display = 'none';
                // Atualiza linha 3D do caminho a cada frame (leve)
                if (!cityRouteLine || (Math.floor(clock.elapsedTime * 4) % 2 === 0)) {
                    updateCityRouteLine3D();
                }
                if (nearPoint(p, CITY_TOTEMS.dropoff.x, CITY_TOTEMS.dropoff.z, 12)) { coins += 100; saveProgress(); updateCoinHud(); showNotification('🛵', 'Passageiro entregue! +100 moedas'); resetCityMission(); }
            } else {
                if (promptEl) promptEl.style.display = 'none';
            }
        }

        // ==================== LOOP DA PISTA (FASE ÚNICA INFINITA) ====================
        let lapCount = 1, currentFinishZ = -PHASE_LENGTH;
        let pendingMode = null;
        let noWheelieTimer = 0;

        // ==================== MODOS DE JOGO ====================
        let gameMode = 'normal'; // 'normal' | 'competitivo' | 'maluco' | 'precisao' | 'perigo' | 'cidade'
        const COMPETITIVE_DURATION_MS = 60000; // 1 minuto
        const COMPETITIVE_TARGET_SCORE = 16000; // "16 mil" pontos no grau
        let competitiveTimeMs = COMPETITIVE_DURATION_MS;
        const PRECISION_DURATION_MS = 45000; // 45 segundos
        const PRECISION_TARGET_MS = 18000;   // 18s acumulados no ponto ideal para vencer
        let precisionTimeMs = PRECISION_DURATION_MS;
        let idealZoneTimeMs = 0;
        const DANGER_DURATION_MS = 40000; // 40 segundos
        const DANGER_TARGET_MS = 12000;   // 12s acumulados na zona de perigo (vermelha) para vencer
        let dangerTimeMs = DANGER_DURATION_MS;
        let dangerZoneTimeMs = 0;

        // ---- Obstáculos e linha de chegada (usados só no Grau Maluco) ----
        const obstaclesGroup = new THREE.Group(); scene.add(obstaclesGroup);
        let obstacles = [];
        let finishLineGroup = null;

        const MALUCO_OBST_TYPES = [
            { geo: new THREE.ConeGeometry(1.6, 4.4, 16), mat: new THREE.MeshStandardMaterial({ color: 0xff3d00, emissive: 0xff2a00, emissiveIntensity: 0.5 }), y: 2.0, radius: 2.4 },
            { geo: new THREE.CylinderGeometry(1.3, 1.3, 2.6, 18), mat: new THREE.MeshStandardMaterial({ color: 0xffb400, metalness: 0.3, roughness: 0.6 }), y: 1.3, radius: 2.2 },
            { geo: new THREE.BoxGeometry(2.4, 2.4, 2.4), mat: new THREE.MeshStandardMaterial({ color: 0xffcf3c, roughness: 0.85 }), y: 1.2, radius: 2.3 },
        ];

        // Constrói (ou limpa) os obstáculos e a linha de chegada do circuito do Grau Maluco.
        // Poucos obstáculos, bem espaçados e em cores vivas: fáceis de enxergar de longe.
        function buildMalucoObstacles(enabled, finishDistance) {
            finishDistance = finishDistance || PHASE_LENGTH;
            while (obstaclesGroup.children.length > 0) obstaclesGroup.remove(obstaclesGroup.children[0]);
            obstacles = [];
            if (finishLineGroup) { worldGroup.remove(finishLineGroup); finishLineGroup = null; }
            if (!enabled) return;

            const count = 20; // dobrado junto com o comprimento da pista para manter a mesma densidade de obstáculos
            const startZ = -180;
            const endZ = -finishDistance + 150;
            const span = endZ - startZ;
            const slot = span / (count + 1);

            let lastSide = Math.random() > 0.5 ? 1 : -1;
            for (let i = 0; i < count; i++) {
                const def = MALUCO_OBST_TYPES[i % MALUCO_OBST_TYPES.length];
                const mesh = new THREE.Mesh(def.geo, def.mat);
                const z = startZ + slot * (i + 1);
                const spread = (trackWidth / 2) - def.radius - 1;
                lastSide = -lastSide;
                const x = getTrackCenterX(z) + lastSide * (spread * 0.55);
                mesh.position.set(x, def.y, z);
                obstaclesGroup.add(mesh);
                obstacles.push({ mesh, x, z, radius: def.radius });
            }

            buildFinishLine(-finishDistance);
        }

        function buildFinishLine(finishZ) {
            const curveFunc = MAPS[selectedMap].curve;
            const fx = curveFunc(finishZ);
            const finishGroup = new THREE.Group();

            const stripeTex = createCheckeredTexture();
            stripeTex.repeat.set(8, 1);
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(trackWidth, 5), new THREE.MeshBasicMaterial({ map: stripeTex }));
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(fx, 0.07, finishZ);
            finishGroup.add(stripe);

            const poleGeo = new THREE.CylinderGeometry(0.4, 0.5, 16, 12);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.6, roughness: 0.35 });
            const poleOffset = trackWidth / 2 + 1.2;
            const poleL = new THREE.Mesh(poleGeo, poleMat); poleL.position.set(fx - poleOffset, 8, finishZ);
            const poleR = new THREE.Mesh(poleGeo, poleMat); poleR.position.set(fx + poleOffset, 8, finishZ);
            finishGroup.add(poleL, poleR);

            const bannerTex = createCheckeredTexture();
            bannerTex.repeat.set(14, 2);
            const banner = new THREE.Mesh(new THREE.BoxGeometry(poleOffset * 2 + 1.5, 2.6, 0.5), new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide }));
            banner.position.set(fx, 15.2, finishZ);
            finishGroup.add(banner);

            worldGroup.add(finishGroup);
            finishLineGroup = finishGroup;
        }

        // ==================== MOEDAS COLECIONÁVEIS ====================
        const coinsGroup = new THREE.Group(); scene.add(coinsGroup);
        scene.add(coinsGroup);
        let coinItems = [];
        const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 20);
        const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xc98f00, emissiveIntensity: 0.7, metalness: 0.75, roughness: 0.25 });
        const coinBigMat = new THREE.MeshStandardMaterial({ color: 0x00e5a8, emissive: 0x00a878, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.3 });

        function buildCoins(phaseConfig, zoneStartZ) {
            while (coinsGroup.children.length > 0) coinsGroup.remove(coinsGroup.children[0]);
            coinItems = [];
            const count = phaseConfig.coinCount || 20;
            const baseZ = (zoneStartZ !== undefined ? zoneStartZ : 0);
            const startZ = baseZ - 120;
            const endZ = baseZ - (phaseConfig.finishDistance - 150);
            const span = endZ - startZ;
            const slot = span / (count + 1);

            for (let i = 0; i < count; i++) {
                const jitter = (Math.random() - 0.5) * slot * 0.7;
                const z = startZ + slot * (i + 1) + jitter;
                const lateral = (Math.random() - 0.5) * (trackWidth - 5);
                const x = getTrackCenterX(z) + lateral;

                const isBig = Math.random() < 0.12;
                const mesh = new THREE.Mesh(coinGeo, isBig ? coinBigMat : coinMat);
                const scale = isBig ? 1.6 : 1.0;
                mesh.scale.set(scale, scale, scale);
                mesh.position.set(x, 1.5, z);
                mesh.rotation.x = Math.PI / 2;
                coinsGroup.add(mesh);
                coinItems.push({ x, z, radius: 1.7 * scale, mesh, value: isBig ? 5 : 1, collected: false, bobPhase: Math.random() * Math.PI * 2 });
            }
        }

        // ==================== FÍSICA E CONTROLE CORRIGIDOS ====================
        const keys = { w: false, a: false, s: false, d: false, space: false };
        let speed = 0, maxSpeed = BASE_MAX_SPEED;
        let wheelieAngle = 0, wheelieVel = 0;
        let score = 0, bestScore = 0, wheelieTimeMs = 0, runCoins = 0;
        const ANGLE_CRASH = Math.PI * 80 / 180; // 80° — além disso a moto cai para trás
        const BALANCE_POINT = 0.95; // ~54 graus (ponto de equilíbrio do grau)
        const ANGLE_IDEAL_MIN = 0.8;   // rad (~46°): começa a zona IDEAL (amarela)
        const ANGLE_DANGER_MIN = 1.15; // rad (~66°): começa a zona de PERIGO (vermelha)
        // --- Modelo físico do grau (pêndulo invertido girando em torno do eixo traseiro) ---
        // Vida real: ao empinar, a moto+piloto giram em torno do contato do pneu traseiro. O centro de gravidade (CG)
        // fica ~0,6 m à frente do eixo e ~0,7 m acima do chão. O PONTO DE EQUILÍBRIO é quando o CG passa exatamente
        // na vertical do eixo traseiro (por volta de 40-55°): ali a gravidade não puxa nem pra frente nem pra trás.
        // Acelerar joga o CG pra trás (levanta a frente); tirar o acelerador ou usar o freio traseiro (o "salva-vidas")
        // abaixa a frente. Equação: α = (a·sinψ − g·cosψ)/r, com ψ = ângulo do CG visto do eixo (ψ = φ0 + θ).
        const WH_PHI0 = Math.PI / 2 - BALANCE_POINT; // φ0: com θ = BALANCE_POINT, ψ = 90° (CG na vertical)
        const WH_G = 3.6;          // g/r efetivo (real ≈ 11 rad/s²; reduzido pra dar tempo de reação no teclado)
        const WH_SWEET_W = 0.30;   // meia-largura da zona de equilíbrio (≈17°), onde o CG "flutua" sobre o eixo
        const WH_SWEET_K = 0.16;   // fração da gravidade que sobra no centro dessa zona (quanto menor, mais tempo dá pra segurar)
        const WH_DAMP = 2.4;       // amortecimento (inércia do piloto + suspensão)
        const WH_A_BRAKE = 6.5;    // freio traseiro (S): ainda ajuda a abaixar a moto, é o "salva-vidas"
        const WH_A_KICK = 9.5;     // força do "tranco" de embreagem (ESPAÇO) que tira a frente do chão
        const WH_A_DECEL_DROP = 5.5; // quando solta o acelerador (não tá mais empurrando "W"), a frente abaixa sozinha
        const WH_CLIMB_DRAG = 3.4; // extra drag perto de 80°: o ângulo ainda sobe, só mais devagar
        // O grau só sobe com ESPAÇO E acelerando (segurando "W") ao mesmo tempo — como numa moto de verdade,
        // sem acelerar não tem como sustentar o grau. Soltando "W" (desacelerando) a moto abaixa a frente
        // ativamente, mesmo que ESPAÇO continue pressionado; soltando ESPAÇO o tranco murcha e ela também desce.
        
        // O tranco agora é um evento com começo, meio e fim (como um tranco de embreagem de verdade), e não um
        // botão de "sustentar no ar": segurando ESPAÇO por pouco tempo mal tira a roda do chão; segurando por mais
        // tempo (WH_KICK_RISE) o ângulo sobe aos poucos e se aproxima do ponto de equilíbrio; ali ele demora
        // (WH_KICK_HOLD) antes de o efeito do tranco se esvair (WH_KICK_FALL) e a moto abaixar sozinha, com a
        // roda da frente encostando no chão — mesmo que o jogador continue segurando ESPAÇO.
        const WH_KICK_RISE = 0.3;      // 50% mais rápido: sobe o grau em ~0,3s com Space+W
        const WH_KICK_FALL_SOFT = 1.15; // ao soltar só o Space (ainda acelerando), a moto volta ao normal BEM mais devagar
        const WH_KICK_FALL_HARD = 0.126; // −30%: volta ainda mais rápido ao soltar o W (desacelerando)
        const WH_KICK_RELEASE_PULL = 3.6; // empurrão pra baixo mais suave quando o tranco murcha (queda mais gradual)

        // Zera o grau na hora (queda / obstáculo de pista). Em colisão na cidade usa forceDropWheelie.
        function stopWheelie() {
            wheelieAngle = 0; wheelieVel = 0; whKick = 0;
            if (typeof wheeliePivot !== 'undefined' && wheeliePivot) wheeliePivot.rotation.x = 0;
        }
        // Para o grau de forma rápida, mas não instantânea (colisão na cidade): a frente desce com força.
        function forceDropWheelie() {
            if (wheelieAngle <= 0.02) {
                stopWheelie();
                return;
            }
            whKick = 0;
            wheelieVel = Math.min(wheelieVel, -4.5);
        }
        let whThrottle = 0, whBrake = 0, whKick = 0; // comandos suavizados (acelerador não é liga/desliga; whKick vai de 0 a 1)
        let gameState = 'playing';
        let cameraMode = 0; // 0 = Traseira, 1 = Lateral
        let currentLookAt = new THREE.Vector3();

        // EVENTOS DE TECLADO AMPLIADOS PARA GARANTIR CAPTURA DO ESPAÇO
     window.addEventListener('keydown', (e) => {
           if (e.code === 'Escape' && (appState === 'playing' || appState === 'paused')) { togglePause(); return; }
    if (appState !== 'playing') return;
    if (isMissionModalOpen) {
        if (e.code === 'Escape') { closeMissionModal(); e.preventDefault(); }
        return;
    }
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space') { keys.space = true; e.preventDefault(); }

    if (e.code === 'Escape') togglePause();
    if (e.code === 'KeyC') cameraMode = (cameraMode + 1) % 2;
    if (e.code === 'KeyE') {
        if (gameMode === 'cidade' && !cityMission && cityNearMarker) {
            openMissionModal(cityNearMarker);
            e.preventDefault();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
    if (e.code === 'Space') keys.space = false;
});

        const uiScore = document.getElementById('scoreDisplay'), uiTimer = document.getElementById('timer'), uiSpeed = document.getElementById('speedDisplay');
        const uiAngle = document.getElementById('gaugeAngleBig');

        function polarPoint(cx, cy, r, angleDeg) {
            const rad = angleDeg * Math.PI / 180;
            return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
        }
        function gaugeArcPath(cx, cy, r, v1, v2, maxV) {
            const a1 = 180 - (v1 / maxV) * 180;
            const a2 = 180 - (v2 / maxV) * 180;
            const p1 = polarPoint(cx, cy, r, a1);
            const p2 = polarPoint(cx, cy, r, a2);
            return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
        }
        function buildWheelieGauge() {
            const svg = document.getElementById('wheelieGaugeSvg');
            if (!svg || svg.dataset.built) return;
            const cx = 120, cy = 118, r = 96, rInner = 90;
            const svgNS = 'http://www.w3.org/2000/svg';
            const bg = document.createElementNS(svgNS, 'path');
            bg.setAttribute('d', gaugeArcPath(cx, cy, r, 0, ANGLE_CRASH, ANGLE_CRASH));
            bg.setAttribute('stroke', '#100c1c'); bg.setAttribute('stroke-width', '24');
            bg.setAttribute('fill', 'none'); bg.setAttribute('stroke-linecap', 'round');
            svg.appendChild(bg);

            const zones = [
                { from: 0, to: ANGLE_IDEAL_MIN, color: '#00e5a8' },
                { from: ANGLE_IDEAL_MIN, to: ANGLE_DANGER_MIN, color: '#ffc93c' },
                { from: ANGLE_DANGER_MIN, to: ANGLE_CRASH, color: '#ff2e63' }
            ];
            zones.forEach(z => {
                const p = document.createElementNS(svgNS, 'path');
                p.setAttribute('d', gaugeArcPath(cx, cy, rInner, z.from, z.to, ANGLE_CRASH));
                p.setAttribute('stroke', z.color); p.setAttribute('stroke-width', '16');
                p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'butt');
                svg.appendChild(p);
            });

            [0, BALANCE_POINT, ANGLE_CRASH].forEach(v => {
                const angle = 180 - (v / ANGLE_CRASH) * 180;
                const p1 = polarPoint(cx, cy, r + 14, angle);
                const label = document.createElementNS(svgNS, 'text');
                label.setAttribute('x', p1.x); label.setAttribute('y', p1.y + 4);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('fill', '#8a929e'); label.setAttribute('font-size', '11');
                label.setAttribute('font-family', 'Consolas, monospace');
                label.textContent = Math.round(v * (180 / Math.PI)) + '°';
                svg.appendChild(label);
            });

            const needleGroup = document.createElementNS(svgNS, 'g');
            needleGroup.setAttribute('id', 'gaugeNeedleGroup');
            const needle = document.createElementNS(svgNS, 'line');
            needle.setAttribute('x1', cx); needle.setAttribute('y1', cy);
            needle.setAttribute('x2', cx); needle.setAttribute('y2', cy - (r - 8));
            needle.setAttribute('stroke', '#fff'); needle.setAttribute('stroke-width', '5');
            needle.setAttribute('stroke-linecap', 'round');
            needleGroup.appendChild(needle);
            const pivot = document.createElementNS(svgNS, 'circle');
            pivot.setAttribute('cx', cx); pivot.setAttribute('cy', cy); pivot.setAttribute('r', 9);
            pivot.setAttribute('fill', '#fff');
            needleGroup.appendChild(pivot);
            svg.appendChild(needleGroup);

            svg.dataset.built = 'true';
        }

        function formatTime(ms) {
            const s = Math.floor(ms / 1000);
            return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}:${String(Math.floor((ms%1000)/10)).padStart(2,'0')}`;
        }

        function updateUI() {
            uiScore.innerText = Math.floor(score);
            const kmh = Math.round((Math.abs(speed) / BASE_MAX_SPEED) * 260);
            uiSpeed.innerText = kmh;
            checkAch("speed", kmh);
            
            const angleDeg = Math.round(wheelieAngle * (180/Math.PI));
            uiAngle.textContent = angleDeg + '°';
            const needleDeg = Math.max(-90, Math.min(90, -90 + (wheelieAngle / ANGLE_CRASH) * 180));
            const needleGroup = document.getElementById('gaugeNeedleGroup');
            if (needleGroup) needleGroup.style.transform = 'rotate(' + needleDeg + 'deg)';

            const gaugeStatus = document.getElementById('gaugeStatusBig');
            if (gaugeStatus) {
                if (wheelieAngle === 0) {
                    gaugeStatus.innerText = 'CHÃO';
                    gaugeStatus.style.color = '#8a929e';
                } else if (wheelieAngle < ANGLE_IDEAL_MIN) {
                    gaugeStatus.innerText = 'GRAU LEVE';
                    gaugeStatus.style.color = '#00e5a8';
                } else if (wheelieAngle < ANGLE_DANGER_MIN) {
                    gaugeStatus.innerText = 'PONTO IDEAL 🔥';
                    gaugeStatus.style.color = '#ffc93c';
                } else {
                    gaugeStatus.innerText = 'PERIGO! ⚠️';
                    gaugeStatus.style.color = '#ff2e63';
                }
            }
        }

        // Encerra a corrida atual (vitória ou derrota) e mostra a tela de resultado.
        function endRun(title, color, opts = {}) {
            gameState = 'gameover';
            if (opts.countFail) { stats.totalFails++; checkAch("fails", stats.totalFails); }
            if (opts.achReason === 'void') checkAch("void", 1);
            if (opts.achReason === 'crash') checkAch("crash", 1);

            document.getElementById('gameOverTitle').innerText = title;
            document.getElementById('gameOverTitle').style.color = color;
            document.getElementById('finalScore').innerText = Math.floor(score);
            document.getElementById('finalTime').innerText = formatTime(wheelieTimeMs);
            document.getElementById('finalCoins').innerText = runCoins;
            const _rr = Retention.onRunEnd(); bestScore = _rr.best; document.getElementById('bestScore').innerText = Math.floor(_rr.best);
            document.getElementById('gameOverSub').innerText = _rr.isNew ? '🏆 NOVO RECORDE neste modo!' : '';
            document.getElementById('replayBtn').style.display = Fx.hasReplay() ? 'block' : 'none';
            document.getElementById('gameOverOverlay').classList.remove('hidden');
        }

        function triggerCrash(reason) {
            if (cityRaceActive) { showRaceResult(false, 'Você caiu da moto.'); return; }
            if (gameState !== 'playing') return;
            const title = (reason === 'obstacle') ? 'BATEU!' : (reason === 'noWheelie' ? 'RODA NO CHÃO!' : 'CAIU!');
            if (reason === 'crash' || reason === 'obstacle') { Fx.startCrash(reason, title); return; } // câmera lenta + piloto arremessado
            endRun(title, '#ff2e63', { countFail: true, achReason: reason });
        }

        // ==================== FLUXO DO JOGO ====================
        function initApp() {
            loadProgress();
            Retention.init(); UI.init();
            renderSkinsMenu();
            renderMapsMenu();
            renderAchievements();
            applySkins();
            applyMap(0);
            updateCoinHud();
            buildWheelieGauge();
        }

        function startGame(mode, skipWarning) {
            if (mode === 'maluco' && !skipWarning) {
                pendingMode = mode;
                showScreen('screen-maluco-warning');
                return;
            }
            startGameInternal(mode);
        }

        function confirmMalucoWarning() {
            startGameInternal(pendingMode || 'maluco');
        }

        function startGameInternal(mode) {
            gameMode = mode || 'normal';
            Fx.reset(); Retention.onRunStart(); cameraMode = Settings.camera | 0;
            setTimeout(() => Tutorial.maybeShow(), 0);
            showScreen(null);
            document.getElementById('ui-container').style.display = 'block';
            document.getElementById('speedometer').style.display = 'block';
            document.getElementById('wheelie-gauge').style.display = 'block';
            document.getElementById('btn-pause').style.display = 'flex';
            if(window.innerWidth <= 820 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) document.getElementById('touch-controls').style.display = 'flex';
            
            appState = 'playing'; gameState = 'playing';
            lapCount = 1; score = 0; wheelieTimeMs = 0; speed = 0; wheelieAngle = 0; wheelieVel = 0; runCoins = 0; whThrottle = 0; whBrake = 0; whKick = 0;
            noWheelieTimer = 0;
            document.getElementById('noWheelieWarning').style.display = 'none';
            bikeContainer.position.set(0,0,0); bikeContainer.rotation.set(0,0,0);
            currentFinishZ = -PHASE_LENGTH;
            competitiveTimeMs = COMPETITIVE_DURATION_MS;
            precisionTimeMs = PRECISION_DURATION_MS;
            idealZoneTimeMs = 0;
            dangerTimeMs = DANGER_DURATION_MS;
            dangerZoneTimeMs = 0;

            document.getElementById('competitiveHud').style.display = 'none';
            document.getElementById('precisionHud').style.display = 'none';
            document.getElementById('dangerHud').style.display = 'none';
            document.getElementById('cityHud').style.display = 'none';
            setMinimapVisible(false);

            if (gameMode === 'normal') {
                document.getElementById('phaseDisplay').innerText = 'GRAU INFINITO • 0m';
                setupInfiniteTrack();
            } else if (gameMode === 'cidade') {
                if (trackMode === 'infinite') clearInfiniteChunks();
                buildMalucoObstacles(false);
                while (worldGroup.children.length > 0) { const c = worldGroup.children[0]; worldGroup.remove(c); if (c.geometry) c.geometry.dispose(); }
                while (decorGroup.children.length > 0) decorGroup.remove(decorGroup.children[0]);
                trackMode = 'city';
                document.getElementById('phaseDisplay').innerText = 'CIDADE ABERTA';
                document.getElementById('cityHud').style.display = 'block';
                document.getElementById('wheelie-gauge').style.display = 'block';
                scene.remove(raceGroup); cityRaceActive = false;
                buildCity();
                buildCitySky();
                scene.add(cityGroup);
                resetCityMission();
                isMissionModalOpen = false;
                pendingMissionKey = null;
                cityNearMarker = null;
                const cmt = document.getElementById('cityMissionText');
                if (cmt) cmt.innerText = 'Procure os totens de missão (colunas coloridas)';
                const prompt0 = document.getElementById('interaction-prompt');
                if (prompt0) prompt0.style.display = 'none';
            } else {
                if (trackMode === 'infinite' || trackMode === 'city') {
                    clearInfiniteChunks();
                    disposeCity();
                    applyMap(selectedMap);
                    trackMode = 'static';
                }
                if (gameMode === 'competitivo') {
                    buildCoins(PHASES[0], 0);
                    document.getElementById('phaseDisplay').innerText = 'GRAU COMPETITIVO';
                    document.getElementById('competitiveHud').style.display = 'block';
                    document.getElementById('competitiveGoal').innerText = 'Meta: ' + COMPETITIVE_TARGET_SCORE.toLocaleString('pt-BR') + ' pts';
                    document.getElementById('competitiveTimer').innerText = '01:00';
                    buildMalucoObstacles(false);
                } else if (gameMode === 'precisao') {
                    buildCoins(PHASES[0], 0);
                    document.getElementById('phaseDisplay').innerText = 'GRAU PRECISÃO';
                    document.getElementById('precisionHud').style.display = 'block';
                    document.getElementById('precisionGoal').innerText = 'Meta: ' + (PRECISION_TARGET_MS / 1000) + 's no ponto ideal';
                    document.getElementById('precisionProgress').innerText = '0.0s / ' + (PRECISION_TARGET_MS / 1000) + 's';
                    const secs0 = Math.ceil(PRECISION_DURATION_MS / 1000);
                    document.getElementById('precisionTimer').innerText = `${String(Math.floor(secs0/60)).padStart(2,'0')}:${String(secs0%60).padStart(2,'0')}`;
                    buildMalucoObstacles(false);
                } else if (gameMode === 'perigo') {
                    buildCoins(PHASES[0], 0);
                    document.getElementById('phaseDisplay').innerText = 'GRAU PERIGO';
                    document.getElementById('dangerHud').style.display = 'block';
                    document.getElementById('dangerGoal').innerText = 'Meta: ' + (DANGER_TARGET_MS / 1000) + 's na zona vermelha';
                    document.getElementById('dangerProgress').innerText = '0.0s / ' + (DANGER_TARGET_MS / 1000) + 's';
                    const secsD0 = Math.ceil(DANGER_DURATION_MS / 1000);
                    document.getElementById('dangerTimer').innerText = `${String(Math.floor(secsD0/60)).padStart(2,'0')}:${String(secsD0%60).padStart(2,'0')}`;
                    buildMalucoObstacles(false);
                } else {
                    currentFinishZ = -MALUCO_FINISH_DISTANCE;
                    buildCoins({ ...PHASES[0], finishDistance: MALUCO_FINISH_DISTANCE, coinCount: Math.round(PHASES[0].coinCount * 0.75) }, 0);
                    document.getElementById('phaseDisplay').innerText = 'GRAU MALUCO';
                    buildMalucoObstacles(true, MALUCO_FINISH_DISTANCE);
                }
            }
        }

        function togglePause() {
            if(appState === 'playing') {
                appState = 'paused';
                document.getElementById('screen-pause').classList.remove('hidden');
            } else if (appState === 'paused') resumeGame();
        }
        function resumeGame() { appState = 'playing'; document.getElementById('screen-pause').classList.add('hidden'); }
        document.getElementById('btn-pause').onclick = togglePause;

        document.getElementById('raceReturnBtn').onclick = () => {
            document.getElementById('raceResultOverlay').classList.add('hidden');
            raceResultShown = false;
            exitRace(pendingRaceSuccess);
        };
        document.getElementById('raceContinueBtn').onclick = continueRaceAttempt;

        function quitToMenu() {
            Fx.reset(); Retention.hideGhost(); Hints.hide();
            document.getElementById('gameOverOverlay').classList.add('hidden');
            document.getElementById('raceResultOverlay').classList.add('hidden');
            raceResultShown = false;
            document.getElementById('ui-container').style.display = 'none';
            document.getElementById('speedometer').style.display = 'none';
            document.getElementById('wheelie-gauge').style.display = 'none';
            document.getElementById('noWheelieWarning').style.display = 'none';
            document.getElementById('btn-pause').style.display = 'none';
            document.getElementById('touch-controls').style.display = 'none';
            document.getElementById('competitiveHud').style.display = 'none';
            document.getElementById('precisionHud').style.display = 'none';
            document.getElementById('dangerHud').style.display = 'none';
            document.getElementById('cityHud').style.display = 'none';
            document.getElementById('interaction-prompt').style.display = 'none';
            document.getElementById('mission-modal').style.display = 'none';
            isMissionModalOpen = false;
            pendingMissionKey = null;
            setMinimapVisible(false);
            buildMalucoObstacles(false);
            if (trackMode === 'infinite' || trackMode === 'city') {
                clearInfiniteChunks();
                disposeCity();
                applyMap(selectedMap);
                trackMode = 'static';
            }
            appState = 'menu';
            showScreen('screen-main');
        }

        document.getElementById('restartBtn').onclick = () => { document.getElementById('gameOverOverlay').classList.add('hidden'); startGame(gameMode, true); };

        // Controles Touch no Celular
        ['btnLeft', 'btnRight', 'btnAccel', 'btnBrake', 'btnWheelie', 'btnCam'].forEach(id => {
            const el = document.getElementById(id);
            if(!el) return;
            const k = el.dataset.key;
            el.addEventListener('touchstart', e=>{ 
                e.preventDefault(); 
                if (isMissionModalOpen) return;
                if(appState==='playing') {
                    if (k === 'c') { cameraMode = (cameraMode + 1) % 2; return; }
                    keys[k]=true; 
                }
                el.classList.add('active');
            }, {passive:false});
            el.addEventListener('touchend', e=>{ 
                e.preventDefault(); 
                if (k !== 'c') keys[k]=false; 
                el.classList.remove('active');
            }, {passive:false});
        });

        const clock = new THREE.Clock();
        

        function createCheckeredTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillRect(256, 256, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    texture.repeat.set(12, 2); 
    
    return texture;
}

    

function startCityMission(mission) {
    document.getElementById('cityHud').style.display = 'block';
    document.getElementById('cityMissionTitle').innerText = mission.title;
    document.getElementById('cityMissionText').innerText = "Missão iniciada! Siga os objetivos.";
    console.log("Iniciando:", mission.id);
}


    

        // ==================== LOOP PRINCIPAL ====================
        // ==================== ÁUDIO DO MOTOR ====================
        // accel      : toca UMA vez a cada vez que o W é apertado (moto acelerando).
        // accelconst : loop constante enquanto a moto se desloca — só começa DEPOIS que o "accel" terminou.
        // idle       : loop quando a moto está em repouso.
        const EngineAudio = (function () {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC || typeof ENGINE_AUDIO_B64 === 'undefined') return { update() {}, unlock() {}, setVolume() {}, state() { return {}; } };
            const ctx = new AC();
            const master = ctx.createGain(); master.gain.value = Settings.volume; master.connect(ctx.destination);
            const buffers = {}; let rate = 1;
            const ch = { accel: null, accelconst: null, idle: null };   // fonte atual de cada som
            const decode = (name) => {
                try {
                    const bin = atob(ENGINE_AUDIO_B64[name]), u8 = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                    const p = ctx.decodeAudioData(u8.buffer, b => { buffers[name] = b; }, e => console.warn('Áudio ' + name + ' não decodificou', e));
                    if (p && p.catch) p.catch(() => {});
                } catch (e) { console.warn('Áudio ' + name + ' falhou', e); }
            };
            Object.keys(ch).forEach(decode);

            function start(name, loop, fadeIn) {
                const buf = buffers[name]; if (!buf || ch[name]) return false;
                const g = ctx.createGain(), src = ctx.createBufferSource(), t = ctx.currentTime;
                src.buffer = buf; src.loop = loop; if (name === 'accelconst') src.playbackRate.value = rate; src.connect(g); g.connect(master);
                g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + fadeIn);
                const rec = { src, g };
                src.onended = () => { if (ch[name] === rec) ch[name] = null; try { g.disconnect(); } catch (e) {} };
                src.start(t); ch[name] = rec; return true;
            }
            function stop(name, fadeOut) {
                const rec = ch[name]; if (!rec) return;
                ch[name] = null;   // libera para uma nova partida do mesmo som
                const t = ctx.currentTime;
                try { rec.g.gain.cancelScheduledValues(t); rec.g.gain.setValueAtTime(rec.g.gain.value, t); rec.g.gain.linearRampToValueAtTime(0, t + fadeOut); rec.src.stop(t + fadeOut + 0.02); } catch (e) {}
            }
            const stopAll = (f) => { stop('accel', f); stop('accelconst', f); stop('idle', f); };
            const resume = () => { if (ctx.state !== 'running') { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} } };

            // navegadores só liberam áudio depois de um gesto do jogador
            const unlock = () => resume();
            ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
            document.addEventListener('visibilitychange', () => { if (document.hidden && ctx.state === 'running') { try { ctx.suspend(); } catch (e) {} } });

            // vento: ruído filtrado que cresce com a velocidade
            const nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nbuf.getChannelData(0);
            for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
            const wsrc = ctx.createBufferSource(); wsrc.buffer = nbuf; wsrc.loop = true;
            const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 500; wf.Q.value = 0.6;
            const wg = ctx.createGain(); wg.gain.value = 0; wsrc.connect(wf); wf.connect(wg); wg.connect(master); wsrc.start();
            function setWind(sr) {
                const t = ctx.currentTime;
                wg.gain.setTargetAtTime(Math.pow(sr, 1.5) * 0.3, t, 0.2);
                wf.frequency.setTargetAtTime(400 + 1000 * sr, t, 0.2);
            }

            let prevW = false;
            function update(o) {
                if (o.appState === 'paused') { if (ctx.state === 'running') { try { ctx.suspend(); } catch (e) {} } return; }
                const sr = Math.min(1, Math.max(0, o.speedRatio || 0));
                setWind(o.on ? sr : 0);
                if (!o.on) { stopAll(0.15); prevW = false; return; }
                resume();
                rate = 0.8 + 0.7 * sr; // rotação do motor acompanha a velocidade
                if (ch.accelconst) ch.accelconst.src.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.12);
                // W apertado agora (borda de subida) e o "accel" não está tocando → toca 1 vez
                if (o.w && !prevW && !ch.accel && buffers.accel) {
                    stop('idle', 0.08); stop('accelconst', 0.05);
                    start('accel', false, 0.02);
                }
                prevW = o.w;
                // Soltou o W: corta o accel (se ainda estiver tocando) e cai direto no idle / corta o accelconst
                if (ch.accel && !o.w) stop('accel', 0.08);
                if (ch.accel) { stop('idle', 0.08); stop('accelconst', 0.05); return; }   // accel ainda tocando com W apertado
                // accel já terminou: W apertado e moto se deslocando → accelconst em loop; senão → idle em loop
                if (o.w && o.moving) { start('accelconst', true, 0.12); stop('idle', 0.1); }
                else { start('idle', true, 0.08); stop('accelconst', 0.08); }
            }
            return { update, unlock, setVolume(v) { master.gain.setTargetAtTime(v, ctx.currentTime, 0.05); }, state() { return { ctx: ctx.state, accel: !!ch.accel, accelconst: !!ch.accelconst, idle: !!ch.idle, loaded: Object.keys(buffers) }; } };
        })();

        let _menuViewKey = '';
        function menuView() {
            const w = window.innerWidth, h = window.innerHeight;
            const main = document.getElementById('screen-main');
            const mainShown = appState === 'menu' && main && !main.classList.contains('hidden');
            document.body.classList.toggle('home-on', !!mainShown);
            const on = mainShown && w > 820 && h > 520;
            const key = on ? w + 'x' + h : '';
            if (key === _menuViewKey) return; _menuViewKey = key;
            if (on) camera.setViewOffset(w, h, -w * 0.17, 0, w, h); else camera.clearViewOffset();
        }

        function animate() {
            requestAnimationFrame(animate);
            const delta = Math.min(clock.getDelta(), 0.1);
            menuView();

            if(appState === 'menu') {
                bikeContainer.rotation.y += 0.01;
                camera.position.set(0, 3, 10).applyMatrix4(bikeContainer.matrixWorld);
                camera.lookAt(bikeContainer.position.clone().add(new THREE.Vector3(0,1,0)));
            }

            if (appState === 'playing' && Fx.active()) Fx.update(delta);

            if (appState === 'playing' && gameState === 'playing' && !raceResultShown && !isMissionModalOpen) {
                const ACCEL_RATE = maxSpeed * 0.32; // aceleração gradual: o km/h sobe aos poucos até o máximo
                const ACCEL_FLOOR = 0.05;
                const BRAKE_RATE = maxSpeed * 1.35;
                // No mapa aberto (cidade) soltar o acelerador não trava a moto: ela desacelera devagar, "de boa",
                // como uma moto de verdade em ponto morto/marcha alta. Nos outros modos mantém o freio-motor original.
                const ENGINE_BRAKE_RATE = maxSpeed * (gameMode === 'cidade' ? 0.16 : 0.4);

                if (keys.w) {
                    speed = Math.min(maxSpeed, speed + ACCEL_RATE * Math.max(1 - (speed / maxSpeed), ACCEL_FLOOR) * delta);
                } else if (keys.s) {
                    speed = Math.max(-maxSpeed / 2, speed - BRAKE_RATE * delta);
                } else if (speed > 0) {
                    speed = Math.max(0, speed - ENGINE_BRAKE_RATE * delta);
                } else if (speed < 0) {
                    speed = Math.min(0, speed + ENGINE_BRAKE_RATE * delta);
                }

                if (Math.abs(speed) > (maxSpeed * 0.01)) {
                    const turnRate = 2.1 * Settings.sensitivity * delta * (speed > 0 ? 1 : -1);
                    if (keys.a) bikeContainer.rotation.y += turnRate;
                    if (keys.d) bikeContainer.rotation.y -= turnRate;
                }

                // ====== FÍSICA DO GRAU (ver constantes WH_*) ======
                {
                    const spd = Math.max(0, speed) / maxSpeed;
                    const smooth = (rate) => 1 - Math.exp(-rate * delta);
                    whThrottle += ((keys.w ? 1 : 0) - whThrottle) * smooth(keys.w ? 5.5 : 8);
                    whBrake    += ((keys.s ? 1 : 0) - whBrake)    * smooth(keys.s ? 9 : 10);
                    // O tranco só ganha força enquanto ESPAÇO e "W" (acelerando) estão pressionados JUNTOS —
                    // sem acelerar não tem como sustentar o grau, igual numa moto de verdade. Soltando qualquer
                    // um dos dois ele murcha: soltando o "W" (desacelerando) murcha bem mais rápido do que só
                    // soltando o ESPAÇO (ainda acelerando) — a moto vai "parando" o grau nos dois casos.
                    const kicking = keys.space && keys.w;
                    if (kicking) {
                        whKick = Math.min(1, whKick + (delta / WH_KICK_RISE));
                    } else {
                        const fallTime = keys.w ? WH_KICK_FALL_SOFT : WH_KICK_FALL_HARD;
                        whKick = Math.max(0, whKick - (delta / fallTime));
                    }
                    const canHold = speed > maxSpeed * 0.04;
                    const damp = WH_DAMP + 1.2 * spd;          // efeito giroscópico da roda: mais estável em velocidade
                    const steps = Math.max(1, Math.ceil(delta / (1 / 120)));
                    const h = delta / steps;
                    for (let i = 0; i < steps; i++) {
                        const th = wheelieAngle;
                        const psi = WH_PHI0 + th;
                        // gravidade: puxa a frente pra baixo (θ < equilíbrio) ou derruba pra trás (θ > equilíbrio)
                        let gravity = -WH_G * Math.cos(psi);
                        if (th > 0) {
                            const z = Math.min(1, Math.abs(th - BALANCE_POINT) / WH_SWEET_W);
                            gravity *= WH_SWEET_K + (1 - WH_SWEET_K) * (z * z * (3 - 2 * z)); // zona de equilíbrio: CG quase sobre o eixo
                        }
                        // aceleração longitudinal (acelerador, freio-motor, freio traseiro)
                        const a = -WH_A_BRAKE * whBrake; // só o freio traseiro (S) empurra pra baixo; "W" não entra aqui
                        let alpha = gravity + a * Math.sin(psi);
                        // Tranco NÃO para no equilíbrio: enquanto Space+W, o ângulo sempre sobe até 80°.
                        // Perto de 80° o ritmo desacelera (vTarget menor), mas não zera — depois cai.
                        if (whKick > 0.05 && keys.w) {
                            const u = Math.min(1, th / ANGLE_CRASH); // 0 no chão → 1 em 80°
                            const vTarget = (1.15 * Math.pow(1 - u, 0.65) + 0.20) * whKick; // rad/s
                            alpha += (vTarget - wheelieVel) * 9.0;
                        } else {
                            // fallback se o servo não estiver ativo (ex.: kick morrendo)
                            const crashRoom = Math.max(0, 1 - th / ANGLE_CRASH);
                            alpha += WH_A_KICK * whKick * crashRoom * 0.35;
                        }
                        // Perto do equilíbrio a gravidade quase some (de propósito, pra dar tempo de segurar) — então
                        // só "soltar o tranco" e deixar a gravidade agir não bastava pra moto realmente descer.
                        // Esse empurrão extra é proporcional a quanto o tranco já murchou: com o tranco a todo vapor
                        // (segurando W+ESPAÇO) ele é zero e não atrapalha; ao soltar espaço ou W, ele cresce e desce de verdade.
                        alpha -= WH_KICK_RELEASE_PULL * (1 - whKick);
                        if (!canHold) alpha -= 6.0;            // sem velocidade não dá pra sustentar: a frente desce
                        if (!keys.w) alpha -= WH_A_DECEL_DROP; // desacelerando (soltou "W"): a moto abaixa a frente sozinha
                        alpha -= damp * wheelieVel;
                        wheelieVel += alpha * h;
                        wheelieAngle += wheelieVel * h;
                        if (wheelieAngle <= 0) { wheelieAngle = 0; if (wheelieVel < 0) wheelieVel = 0; }
                        if (wheelieAngle >= ANGLE_CRASH) break;
                    }
                }

                if (wheelieAngle >= ANGLE_CRASH) triggerCrash('crash');
                else wheeliePivot.rotation.x = wheelieAngle;

                if (wheelieAngle > 0.15) {
                    wheelieTimeMs += delta * 1000;
                    stats.totalTime += delta;
                    score += (150 * delta) * (wheelieAngle >= ANGLE_DANGER_MIN ? 3 : (wheelieAngle >= ANGLE_IDEAL_MIN ? 2 : 1));
                    uiTimer.innerText = formatTime(wheelieTimeMs);
                    checkAch("score", score); checkAch("time", stats.totalTime);
                }

                if (gameMode === 'maluco' && gameState === 'playing') {
                    const noWheelieWarningEl = document.getElementById('noWheelieWarning');
                    if (wheelieAngle > 0.15) {
                        noWheelieTimer = 0;
                        noWheelieWarningEl.style.display = 'none';
                    } else {
                        noWheelieTimer += delta;
                        const remaining = Math.max(0, 5 - noWheelieTimer);
                        noWheelieWarningEl.style.display = 'block';
                        noWheelieWarningEl.innerText = 'EMPINE A MOTO! ' + Math.ceil(remaining) + 's';
                        if (noWheelieTimer >= 5) {
                            noWheelieWarningEl.style.display = 'none';
                            triggerCrash('noWheelie');
                        }
                    }
                }

                bikeContainer.translateZ(-speed * delta);
                frontWheel.rotation.x -= speed * delta * 2; rearWheel.rotation.x -= speed * delta * 2;

                if (gameMode !== 'cidade') {
                    const trackX = getTrackCenterX(bikeContainer.position.z);
                    if (Math.abs(bikeContainer.position.x - trackX) > (trackWidth / 2 + 1.0)) triggerCrash('void');
                }

                if (gameMode === 'maluco') {
                    obstacles.forEach(obs => {
                        if ((bikeContainer.position.x - obs.x)**2 + (bikeContainer.position.z - obs.z)**2 < (obs.radius + 1.6)**2) { stopWheelie(); triggerCrash('obstacle'); }
                    });
                }

                coinItems.forEach(c => {
                    if (c.collected) return;
                    c.mesh.rotation.z += delta * 3.2;
                    c.mesh.position.y = 1.5 + Math.sin(clock.elapsedTime * 2 + c.bobPhase) * 0.2;
                    if ((bikeContainer.position.x - c.x)**2 + (bikeContainer.position.z - c.z)**2 < (c.radius + 1.8)**2) {
                        c.collected = true;
                        if (c.mesh.parent) c.mesh.parent.remove(c.mesh);
                        coins += c.value;
                        runCoins += c.value; Retention.tick('coins', c.value);
                        stats.totalCoinsCollected += c.value;
                        checkAch("coins", stats.totalCoinsCollected);
                        saveProgress();
                        updateCoinHud();
                    }
                });

                if (gameMode === 'competitivo' && gameState === 'playing') {
                    competitiveTimeMs -= delta * 1000;
                    if (score >= COMPETITIVE_TARGET_SCORE) {
                        endRun('VOCÊ VENCEU!', '#00e5a8');
                    } else if (competitiveTimeMs <= 0) {
                        competitiveTimeMs = 0;
                        endRun('TEMPO ESGOTADO!', '#ff2e63');
                    }
                    if (gameState === 'playing') {
                        const secs = Math.max(0, Math.ceil(competitiveTimeMs / 1000));
                        document.getElementById('competitiveTimer').innerText = `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
                    }
                }

                if (gameMode === 'precisao' && gameState === 'playing') {
                    precisionTimeMs -= delta * 1000;
                    if (wheelieAngle >= ANGLE_IDEAL_MIN && wheelieAngle < ANGLE_DANGER_MIN) {
                        idealZoneTimeMs += delta * 1000;
                    }
                    if (idealZoneTimeMs >= PRECISION_TARGET_MS) {
                        endRun('PERFEITO! ⚖️', '#00e5a8');
                    } else if (precisionTimeMs <= 0) {
                        precisionTimeMs = 0;
                        endRun('TEMPO ESGOTADO!', '#ff2e63');
                    }
                    if (gameState === 'playing') {
                        const secs = Math.max(0, Math.ceil(precisionTimeMs / 1000));
                        document.getElementById('precisionTimer').innerText = `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
                        document.getElementById('precisionProgress').innerText = (idealZoneTimeMs / 1000).toFixed(1) + 's / ' + (PRECISION_TARGET_MS / 1000) + 's';
                    }
                }

                if (gameMode === 'perigo' && gameState === 'playing') {
                    dangerTimeMs -= delta * 1000;
                    if (wheelieAngle >= ANGLE_DANGER_MIN && wheelieAngle < ANGLE_CRASH) {
                        dangerZoneTimeMs += delta * 1000;
                    }
                    if (dangerZoneTimeMs >= DANGER_TARGET_MS) {
                        endRun('INSANO! 🔥', '#00e5a8');
                    } else if (dangerTimeMs <= 0) {
                        dangerTimeMs = 0;
                        endRun('TEMPO ESGOTADO!', '#ff2e63');
                    }
                    if (gameState === 'playing') {
                        const secsD = Math.max(0, Math.ceil(dangerTimeMs / 1000));
                        document.getElementById('dangerTimer').innerText = `${String(Math.floor(secsD/60)).padStart(2,'0')}:${String(secsD%60).padStart(2,'0')}`;
                        document.getElementById('dangerProgress').innerText = (dangerZoneTimeMs / 1000).toFixed(1) + 's / ' + (DANGER_TARGET_MS / 1000) + 's';
                    }
                }

                if (gameMode === 'normal') {
                    updateInfiniteTrack(bikeContainer.position.z);
                    const distM = Math.max(0, Math.round(-bikeContainer.position.z));
                    document.getElementById('phaseDisplay').innerText = 'GRAU INFINITO • ' + distM + 'm';
                } else if (gameMode === 'cidade') {
                    if (cityRaceActive) updateCityRace(delta); else updateCity(delta);
                    updateMinimap();
                } else if (gameState === 'playing' && bikeContainer.position.z <= currentFinishZ + 1) {
                    if (gameMode === 'maluco') {
                        endRun('CHEGOU!', '#00e5a8');
                    } else {
                        lapCount++;
                        checkAch("lap", lapCount);
                        bikeContainer.position.set(0, 0, 0);
                        bikeContainer.rotation.set(0, 0, 0);
                        buildCoins(PHASES[0], 0);
                        document.getElementById('phaseDisplay').innerText = (gameMode === 'precisao') ? 'GRAU PRECISÃO' : (gameMode === 'perigo') ? 'GRAU PERIGO' : 'GRAU COMPETITIVO';
                    }
                }

                Retention.frame(delta); Fx.rec(delta);
                updateUI();

                let localCamTarget;
                let localLookTarget;

                if (cameraMode === 0) {
                    // Câmera 1: ponto fixo atrás/acima, mostra piloto+moto empinando e o caminho à frente.
                    // Mais perto da moto para uma pilotagem mais confortável (sem sensação de "zoom").
                    localCamTarget = new THREE.Vector3(0, 4.3, 7.2);
                    localLookTarget = new THREE.Vector3(0, 2.1, -4);
                } else {
                    // Câmera 2: ponto fixo lateral/traseiro, focada na moto (não no caminho)
                    localCamTarget = new THREE.Vector3(5.4, 2.7, 2.8);
                    localLookTarget = new THREE.Vector3(0, 1.5, 0);
                }

                // Câmera em ponto FIXO em relação à moto: sem lerp (o lerp fazia a câmera "ficar pra trás" e o
                // enquadramento esticar quanto mais rápido a moto ia). Atualiza a matriz antes pra não ficar 1 frame atrasada.
                bikeContainer.updateMatrixWorld(true);
                camera.position.copy(localCamTarget.applyMatrix4(bikeContainer.matrixWorld));
                currentLookAt.copy(bikeContainer.position).add(localLookTarget.applyQuaternion(bikeContainer.quaternion));
                camera.lookAt(currentLookAt);
            }

            EngineAudio.update({ appState, on: appState === 'playing' && gameState === 'playing' && !raceResultShown,
                w: keys.w, speedRatio: Math.abs(speed) / (maxSpeed || 1), moving: !isMissionModalOpen && Math.abs(speed) > maxSpeed * 0.02 });
            skyGroup.position.copy(camera.position);
            renderer.render(scene, camera);

            updateTotemsInteraction(bikeContainer.position.z, bikeContainer.position.x);
        }

        // ==================== EXTRAS: crash cinematográfico, replay, missões, fantasma, dicas, ajustes ====================
        const g$ = (id) => document.getElementById(id);
        function toast(msg) { const el = g$('toast'); if (!el) return; el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2800); }
        function vibrate(p) { if (Settings.vibrate && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
        const MODE_NAMES = { normal: 'Grau Infinito', competitivo: 'Competitivo', maluco: 'Grau Maluco', precisao: 'Precisão', perigo: 'Perigo', cidade: 'Cidade' };

        // ---------- Câmera lenta no crash + piloto arremessado + replay dos últimos segundos ----------
        const Fx = (function () {
            const CAP = 600, F = 7; // x, y, z, rotY, rotZ, inclinação do grau, dt
            const buf = new Float32Array(CAP * F); let head = 0, count = 0;
            let seq = null, rp = null, home = null, riderObj = null;
            const UP = new THREE.Vector3(0, 1, 0);

            function rec(dt) {
                if (gameState !== 'playing' && gameState !== 'crashing') return;
                const i = (head % CAP) * F, p = bikeContainer.position;
                buf[i] = p.x; buf[i + 1] = p.y; buf[i + 2] = p.z; buf[i + 3] = bikeContainer.rotation.y;
                buf[i + 4] = bikeContainer.rotation.z; buf[i + 5] = wheeliePivot.rotation.x; buf[i + 6] = dt;
                head++; if (count < CAP) count++;
            }
            function chaseCam(lookAtRider) {
                const off = cameraMode === 0 ? new THREE.Vector3(0, 4.3, 7.2) : new THREE.Vector3(5.4, 2.7, 2.8);
                const lk = cameraMode === 0 ? new THREE.Vector3(0, 2.1, -4) : new THREE.Vector3(0, 1.5, 0);
                const q = new THREE.Quaternion().setFromAxisAngle(UP, bikeContainer.rotation.y);
                camera.position.copy(bikeContainer.position).add(off.multiplyScalar(1.8).applyQuaternion(q));
                const look = bikeContainer.position.clone().add(lk.applyQuaternion(q));
                if (lookAtRider && riderObj && home) look.lerp(riderObj.position, 0.55);
                currentLookAt.copy(look); camera.lookAt(look);
            }
            function restoreRider() {
                if (!home) return;
                home.parent.add(home.o); home.o.position.copy(home.p); home.o.quaternion.copy(home.q); home.o.scale.copy(home.s);
                home = null; riderObj = null;
            }
            function startCrash(reason, title) {
                if (seq) return;
                gameState = 'crashing';
                const side = Math.random() < 0.5 ? -1 : 1;
                seq = { reason, title, t: 0, bs: Math.max(0, speed), side, vel: new THREE.Vector3(), spin: new THREE.Vector3() };
                vibrate([80, 40, 140]);
                const fl = g$('flash');
                if (fl) { fl.style.transition = 'none'; fl.style.opacity = 0.5; requestAnimationFrame(() => { fl.style.transition = 'opacity .5s'; fl.style.opacity = 0; }); }
                const R = window.activeRider;
                if (R && R.visible !== false && R.parent) {
                    riderObj = R;
                    home = { o: R, parent: R.parent, p: R.position.clone(), q: R.quaternion.clone(), s: R.scale.clone() };
                    scene.attach(R);
                    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(bikeContainer.quaternion);
                    seq.vel.copy(fwd).multiplyScalar(seq.bs * (reason === 'obstacle' ? 1.0 : 0.4));
                    seq.vel.y = reason === 'obstacle' ? 9 : 7; seq.vel.x += side * 3.5;
                    seq.spin.set(reason === 'obstacle' ? -6 : 6, side * 3, side * 4);
                }
            }
            function update(delta) {
                if (seq) {
                    const d = delta * 0.35; // câmera lenta
                    seq.t += delta;
                    seq.bs *= Math.max(0, 1 - 2.4 * d);
                    bikeContainer.translateZ(-seq.bs * d);
                    frontWheel.rotation.x -= seq.bs * d * 2; rearWheel.rotation.x -= seq.bs * d * 2;
                    const k = Math.min(1, 5 * d);
                    if (seq.reason === 'crash') wheeliePivot.rotation.x += (2.9 - wheeliePivot.rotation.x) * k;
                    else bikeContainer.rotation.z += (seq.side * 1.3 - bikeContainer.rotation.z) * k;
                    if (riderObj && home) {
                        const v = seq.vel; riderObj.position.addScaledVector(v, d); v.y -= 30 * d;
                        if (riderObj.position.y < 0.15) {
                            riderObj.position.y = 0.15; if (v.y < 0) v.y *= -0.25; if (Math.abs(v.y) < 1) v.y = 0;
                            v.x *= 1 - 3 * d; v.z *= 1 - 3 * d; seq.spin.multiplyScalar(Math.max(0, 1 - 3 * d));
                        }
                        riderObj.rotateX(seq.spin.x * d); riderObj.rotateY(seq.spin.y * d); riderObj.rotateZ(seq.spin.z * d);
                    }
                    rec(delta);
                    chaseCam(true);
                    if (seq.t >= 1.9) { const s = seq; seq = null; endRun(s.title, '#ff2e63', { countFail: true, achReason: s.reason }); }
                    return;
                }
                if (rp) {
                    rp.t += delta;
                    const n = rp.fr.length; let k = 0;
                    while (k < n - 2 && rp.ct[k + 1] <= rp.t) k++;
                    const a = rp.fr[k], b = rp.fr[Math.min(k + 1, n - 1)];
                    const span = rp.ct[Math.min(k + 1, n - 1)] - rp.ct[k];
                    const u = span > 0 ? Math.min(1, Math.max(0, (rp.t - rp.ct[k]) / span)) : 1;
                    const L = (i) => a[i] + (b[i] - a[i]) * u;
                    bikeContainer.position.set(L(0), L(1), L(2)); bikeContainer.rotation.y = L(3);
                    bikeContainer.rotation.z = L(4); wheeliePivot.rotation.x = L(5);
                    chaseCam(false);
                    if (rp.t >= rp.dur) endReplay();
                }
            }
            const hasReplay = () => count > 30;
            function startReplay() {
                if (!hasReplay() || gameState !== 'gameover') return;
                restoreRider();
                const idx = []; let acc = 0;
                for (let n = 0; n < count; n++) { const i = (((head - 1 - n) % CAP) + CAP) % CAP * F; idx.push(i); acc += buf[i + 6]; if (acc > 3.5) break; }
                idx.reverse();
                const fr = idx.map(i => Array.from(buf.subarray(i, i + F)));
                const ct = []; let t = 0; fr.forEach(f => { ct.push(t); t += f[6]; });
                rp = { fr, ct, t: 0, dur: t };
                gameState = 'replay';
                g$('gameOverOverlay').classList.add('hidden');
                g$('replay-banner').style.display = 'block';
                Retention.hideGhost();
            }
            function endReplay() {
                if (!rp) return;
                rp = null; g$('replay-banner').style.display = 'none';
                gameState = 'gameover'; g$('gameOverOverlay').classList.remove('hidden');
            }
            function reset() {
                seq = null; rp = null; restoreRider(); head = 0; count = 0;
                const b = g$('replay-banner'); if (b) b.style.display = 'none';
                bikeContainer.rotation.z = 0; wheeliePivot.rotation.x = 0;
            }
            return { rec, update, startCrash, startReplay, endReplay, hasReplay, reset, active: () => !!(seq || rp) };
        })();

        // ---------- Ranking online (opcional: preencha LEADERBOARD com um projeto Supabase) ----------
        const LEADERBOARD = { url: '', key: '', table: 'scores' }; // ex.: url 'https://xxxx.supabase.co', key = anon key
        const Ranking = {
            enabled() { return !!(LEADERBOARD.url && LEADERBOARD.key); },
            nick() { try { return (localStorage.getItem('grauSim_nick') || '').slice(0, 16); } catch (e) { return ''; } },
            hdr() { return { apikey: LEADERBOARD.key, Authorization: 'Bearer ' + LEADERBOARD.key, 'Content-Type': 'application/json' }; },
            async submit(mode, sc) {
                if (!this.enabled() || sc <= 0) return;
                try { await fetch(`${LEADERBOARD.url}/rest/v1/${LEADERBOARD.table}`, { method: 'POST', headers: Object.assign(this.hdr(), { Prefer: 'return=minimal' }), body: JSON.stringify({ mode, name: this.nick() || 'Piloto', score: Math.floor(sc) }) }); } catch (e) {}
            },
            async load(mode) {
                const box = g$('rank-list'); box.textContent = 'Carregando...';
                try {
                    const r = await fetch(`${LEADERBOARD.url}/rest/v1/${LEADERBOARD.table}?mode=eq.${encodeURIComponent(mode)}&select=name,score&order=score.desc&limit=10`, { headers: this.hdr() });
                    const rows = await r.json(); box.textContent = '';
                    if (!rows.length) { box.textContent = 'Ninguém no ranking ainda. Seja o primeiro!'; return; }
                    rows.forEach((row, i) => {
                        const d = document.createElement('div'); d.className = 'rank-row';
                        const a = document.createElement('span'); a.textContent = (i + 1) + '. ' + row.name;
                        const b = document.createElement('b'); b.textContent = row.score; b.style.color = '#ffc93c';
                        d.appendChild(a); d.appendChild(b); box.appendChild(d);
                    });
                } catch (e) { box.textContent = 'Não foi possível carregar o ranking.'; }
            },
            open() {
                const sel = g$('rank-mode');
                if (!sel.options.length) Object.keys(MODE_NAMES).forEach(m => sel.add(new Option(MODE_NAMES[m], m)));
                g$('rank-nick').value = this.nick();
                showScreen('screen-ranking'); this.load(sel.value);
            }
        };

        // ---------- Recordes por modo, missões diárias e fantasma ----------
        const Retention = (function () {
            const K = { best: 'grauSim_best_', ghost: 'grauSim_ghost_', daily: 'grauSim_daily', runs: 'grauSim_runs' };
            const POOL = [
                { id: 'wheelie', text: 'Acumule {n}s de grau', targets: [30, 45, 60], reward: 60 },
                { id: 'ideal', text: 'Fique {n}s na zona ideal 🔥', targets: [8, 12, 18], reward: 80 },
                { id: 'danger', text: 'Aguente {n}s na zona de perigo ⚠️', targets: [3, 5, 8], reward: 100 },
                { id: 'coins', text: 'Colete {n} moedas', targets: [15, 25, 40], reward: 70 },
                { id: 'score', text: 'Faça {n} pontos em uma corrida', targets: [2000, 3500, 5000], reward: 90 }
            ];
            let daily = null, runs = 0, runTime = 0, ghostBuf = [], lastG = 0, ghost = null, gi = 0, inDanger = false;
            let ghostRoot = null, ghostPivot = null;
            const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
            const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
            const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
            const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

            function ensureToday() {
                const t = today();
                if (daily && daily.date === t) return;
                try { const s = JSON.parse(ls.get(K.daily)); if (s && s.date === t && Array.isArray(s.missions)) { daily = s; return; } } catch (e) {}
                const rnd = mulberry(hash(t)), pool = POOL.slice();
                for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
                daily = { date: t, missions: pool.slice(0, 3).map(m => ({ id: m.id, text: m.text, target: m.targets[Math.floor(rnd() * 3)], reward: m.reward, p: 0, done: false })) };
                saveDaily();
            }
            const saveDaily = () => { if (daily) ls.set(K.daily, JSON.stringify(daily)); };
            function complete(m) {
                m.done = true; m.p = m.target;
                coins += m.reward; saveProgress(); updateCoinHud(); saveDaily(); updateBadge();
                toast('✅ Missão cumprida! +' + m.reward + ' 🪙'); vibrate([40, 30, 40]);
            }
            function tick(id, amount) {
                if (!daily) return;
                for (const m of daily.missions) { if (m.id === id && !m.done) { m.p += amount; if (m.p >= m.target) complete(m); } }
            }
            function setMax(id, val) {
                if (!daily) return;
                for (const m of daily.missions) { if (m.id === id && !m.done && val > m.p) { m.p = val; if (m.p >= m.target) complete(m); } }
            }
            function updateBadge() {
                const el = g$('daily-badge'); if (!el || !daily) return;
                el.textContent = '(' + daily.missions.filter(m => m.done).length + '/' + daily.missions.length + ')';
            }
            function render() {
                ensureToday();
                const box = g$('daily-list'); box.textContent = '';
                daily.missions.forEach(m => {
                    const d = document.createElement('div'); d.className = 'mission' + (m.done ? ' done' : '');
                    const top = document.createElement('div'); top.className = 'm-top';
                    const l = document.createElement('span'); l.textContent = m.text.replace('{n}', m.target);
                    const r = document.createElement('b'); r.textContent = m.done ? '✅' : '+' + m.reward + ' 🪙';
                    top.appendChild(l); top.appendChild(r);
                    const bar = document.createElement('div'); bar.className = 'm-bar';
                    const fill = document.createElement('i'); fill.style.width = Math.min(100, m.p / m.target * 100) + '%'; bar.appendChild(fill);
                    d.appendChild(top); d.appendChild(bar); box.appendChild(d);
                });
            }
            function buildGhost() {
                ghostRoot = new THREE.Group(); ghostRoot.scale.set(1.8, 1.8, 1.8);
                ghostPivot = new THREE.Group(); ghostPivot.position.set(0, 0.4, 0); ghostRoot.add(ghostPivot);
                const body = new THREE.Group(); body.position.set(0, -0.4, -1.2); ghostPivot.add(body);
                const mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.32, depthWrite: false });
                const wg = new THREE.CylinderGeometry(0.34, 0.34, 0.16, 14); wg.rotateZ(Math.PI / 2);
                const add = (geo, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); body.add(m); };
                add(wg, 0, 0.34, 1.2); add(wg, 0, 0.34, 1.2 - 2.348);
                add(new THREE.BoxGeometry(0.34, 0.5, 1.8), 0, 0.85, 0.4);
                add(new THREE.BoxGeometry(0.4, 0.8, 0.35), 0, 1.7, 0.7);
                ghostRoot.visible = false; scene.add(ghostRoot);
            }
            const hideGhost = () => { if (ghostRoot) ghostRoot.visible = false; };
            function updateGhost() {
                if (!ghost || !ghost.f.length || !Settings.ghost || gameMode === 'cidade') { hideGhost(); return; }
                if (!ghostRoot) buildGhost();
                const f = ghost.f, last = f[f.length - 1];
                if (runTime > last[0] + 0.5) { hideGhost(); return; }
                while (gi < f.length - 2 && f[gi + 1][0] <= runTime) gi++;
                const a = f[gi], b = f[Math.min(gi + 1, f.length - 1)];
                let k = b[0] > a[0] ? Math.min(1, Math.max(0, (runTime - a[0]) / (b[0] - a[0]))) : 0;
                if (Math.abs(b[2] - a[2]) > 30) k = 0; // volta/teleporte: não interpola
                const z = a[2] + (b[2] - a[2]) * k, x = a[1] + (b[1] - a[1]) * k + getTrackCenterX(z);
                ghostRoot.position.set(x, 0, z); ghostRoot.rotation.y = a[3] + (b[3] - a[3]) * k; ghostPivot.rotation.x = a[4] + (b[4] - a[4]) * k;
                ghostRoot.visible = true;
            }
            function saveGhost(mode, sc) {
                if (mode === 'cidade' || ghostBuf.length < 10) return;
                const key = K.ghost + mode + '_' + selectedMap; let cur = null;
                try { cur = JSON.parse(ls.get(key)); } catch (e) {}
                if (!cur || sc > (cur.s || 0)) ls.set(key, JSON.stringify({ s: sc, f: ghostBuf }));
            }
            return {
                init() { runs = parseInt(ls.get(K.runs), 10) || 0; ensureToday(); updateBadge(); window.addEventListener('pagehide', saveDaily); },
                runs: () => runs,
                openDaily() { render(); showScreen('screen-daily'); },
                tick, hideGhost,
                onRunStart() {
                    ensureToday(); runs++; ls.set(K.runs, String(runs));
                    runTime = 0; ghostBuf = []; lastG = -1; gi = 0; inDanger = false; ghost = null;
                    if (gameMode !== 'cidade') { try { ghost = JSON.parse(ls.get(K.ghost + gameMode + '_' + selectedMap)); } catch (e) { ghost = null; } }
                    hideGhost();
                },
                frame(dt) {
                    if (gameState !== 'playing') return;
                    runTime += dt;
                    const a = wheelieAngle;
                    if (a > 0.15) tick('wheelie', dt);
                    if (a >= ANGLE_IDEAL_MIN && a < ANGLE_DANGER_MIN) tick('ideal', dt);
                    if (a >= ANGLE_DANGER_MIN) { tick('danger', dt); if (!inDanger) { inDanger = true; vibrate(35); } } else inDanger = false;
                    setMax('score', score);
                    if (gameMode !== 'cidade' && runTime - lastG >= 0.1 && runTime < 120) {
                        lastG = runTime; const p = bikeContainer.position, r2 = (v) => Math.round(v * 100) / 100;
                        let cx = 0; try { cx = getTrackCenterX(p.z); } catch (e) {}
                        ghostBuf.push([r2(runTime), r2(p.x - cx), r2(p.z), r2(bikeContainer.rotation.y), r2(wheelieAngle)]);
                    }
                    updateGhost(); Hints.update();
                },
                onRunEnd() {
                    const mode = gameMode, sc = Math.floor(score);
                    let best = parseFloat(ls.get(K.best + mode)) || 0, isNew = false;
                    if (sc > best && sc > 0) { best = sc; isNew = true; ls.set(K.best + mode, String(sc)); Ranking.submit(mode, sc); }
                    setMax('score', sc); saveGhost(mode, sc); saveDaily(); hideGhost(); Hints.hide();
                    return { best, isNew };
                }
            };
        })();

        // ---------- Dicas na tela + tutorial ----------
        const Hints = {
            last: '',
            hide() { const el = g$('hint-bar'); if (el) el.style.display = 'none'; this.last = ''; },
            update() {
                const el = g$('hint-bar'); if (!el) return;
                if (appState !== 'playing' || gameMode === 'cidade' || !(Retention.runs() <= 8 || Settings.hintsAlways)) { this.hide(); return; }
                const acc = IS_TOUCH ? '▲' : 'W', kick = IS_TOUCH ? 'GRAU + ▲' : 'ESPAÇO + W', brk = IS_TOUCH ? '✖' : 'S';
                const a = wheelieAngle; let t;
                if (a < 0.15) t = speed < maxSpeed * 0.15 ? 'Segure ' + acc + ' para acelerar' : 'Segure ' + kick + ' para empinar';
                else if (a < ANGLE_IDEAL_MIN) t = 'Continue segurando ' + kick;
                else if (a < ANGLE_DANGER_MIN) t = 'Zona ideal! Segure firme 🔥';
                else t = 'Perigo! Solte o ' + (IS_TOUCH ? 'GRAU' : 'ESPAÇO') + ' ou use ' + brk + ' ⚠️';
                if (t !== this.last) { el.textContent = t; this.last = t; }
                el.style.display = 'block';
            }
        };
        const Tutorial = {
            forced: false,
            fill() {
                const T = IS_TOUCH;
                g$('tut-steps').innerHTML = [
                    ['1', 'Acelere', T ? 'Segure o botão <b>▲</b>' : 'Segure <kbd>W</kbd>'],
                    ['2', 'Empine', T ? 'Segure <b>GRAU</b> junto com <b>▲</b>' : 'Segure <kbd>ESPAÇO</kbd> + <kbd>W</kbd> juntos'],
                    ['3', 'Segure na faixa amarela', 'É o ponto ideal: mais pontos e o grau fica estável'],
                    ['4', 'Vermelho = perigo', 'Vale 3x, mas passou de 80° você cai. Solte ' + (T ? 'o GRAU' : '<kbd>ESPAÇO</kbd>') + ' ou use ' + (T ? '<b>✖</b>' : '<kbd>S</kbd>') + ' para baixar a frente'],
                    ['5', 'Direção e extras', T ? '◀ ▶ viram, 📷 troca a câmera, ⏸ pausa' : '<kbd>A</kbd>/<kbd>D</kbd> viram, <kbd>C</kbd> troca a câmera, <kbd>Esc</kbd> pausa']
                ].map(s => '<div class="tut-step"><span class="tut-n">' + s[0] + '</span><div><b>' + s[1] + '</b><br><small>' + s[2] + '</small></div></div>').join('');
            },
            show(forced) {
                this.forced = !!forced; this.fill(); g$('tutorial-overlay').classList.remove('hidden');
                if (!forced && appState === 'playing') appState = 'tutorial';
            },
            hide() {
                g$('tutorial-overlay').classList.add('hidden');
                try { localStorage.setItem('grauSim_tutorial', '1'); } catch (e) {}
                if (appState === 'tutorial') appState = 'playing';
                this.forced = false;
            },
            maybeShow() { let seen = null; try { seen = localStorage.getItem('grauSim_tutorial'); } catch (e) {} if (!seen) this.show(false); }
        };
        window.addEventListener('keydown', (e) => { if (appState === 'tutorial' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); Tutorial.hide(); } });

        // ---------- Configurações ----------
        const UI = {
            from: 'main',
            sync() {
                g$('set-volume').value = Math.round(Settings.volume * 100); g$('set-vol-val').textContent = Math.round(Settings.volume * 100) + '%';
                g$('set-sens').value = Math.round(Settings.sensitivity * 100); g$('set-sens-val').textContent = Math.round(Settings.sensitivity * 100) + '%';
                g$('set-quality').value = Settings.quality; g$('set-camera').value = String(Settings.camera);
                g$('set-vibrate').checked = !!Settings.vibrate; g$('set-ghost').checked = !!Settings.ghost; g$('set-hints').checked = !!Settings.hintsAlways;
            },
            set(k, v) {
                Settings[k] = v; Settings.save();
                if (k === 'quality') applyQuality();
                if (k === 'volume') EngineAudio.setVolume(v);
                this.sync();
            },
            openSettings(from) { this.from = from; this.sync(); showScreen('screen-settings'); },
            closeSettings() {
                if (this.from === 'pause') { showScreen(null); g$('screen-pause').classList.remove('hidden'); }
                else showScreen('screen-main');
            },
            init() {
                g$('set-volume').oninput = (e) => this.set('volume', e.target.value / 100);
                g$('set-sens').oninput = (e) => this.set('sensitivity', e.target.value / 100);
                g$('set-quality').onchange = (e) => this.set('quality', e.target.value);
                g$('set-camera').onchange = (e) => this.set('camera', parseInt(e.target.value, 10));
                g$('set-vibrate').onchange = (e) => this.set('vibrate', e.target.checked);
                g$('set-ghost').onchange = (e) => this.set('ghost', e.target.checked);
                g$('set-hints').onchange = (e) => this.set('hintsAlways', e.target.checked);
                g$('rank-mode').onchange = (e) => Ranking.load(e.target.value);
                g$('rank-nick').onchange = (e) => { try { localStorage.setItem('grauSim_nick', e.target.value.trim().slice(0, 16)); } catch (err) {} };
                if (Ranking.enabled()) g$('btn-ranking').style.display = '';
            }
        };

        // Inicializar Aplicação
        initApp();
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

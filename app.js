      function filterReleased() {
    const query = document.getElementById('pkg-search').value.toLowerCase();
    const apostle = document.getElementById('apostle-select').value;
    const type = document.getElementById('sort-type').value;
    const order = document.getElementById('sort-order').value;

    let filtered = dbPackages.filter(p => {
        return (p.name.toLowerCase().includes(query) || p.releasedApostle.toLowerCase().includes(query)) && 
               (apostle === "all" || p.releasedApostle === apostle);
    });

    // 정렬 로직 (기존 유지)
    filtered.sort((a, b) => {
        let vA = (type === 'price') ? a.price : calculateScore(a.contents, a.price);
        let vB = (type === 'price') ? b.price : calculateScore(b.contents, b.price);
        return (order === 'asc') ? vA - vB : vB - vA;
    });

    // 1. 리스트를 먼저 그립니다 (체크박스 상태 포함됨)
    renderPackageList('released-list', filtered); 
    
    // 2. 그래프를 그립니다 (drawReleasedChart 내부의 visibleData 필터가 작동함)
    drawReleasedChart(filtered);
}

 function calculateScore(contents, price) {
        if (!price || price <= 0) return 0;
        let total = 0;
        Object.entries(contents).forEach(([id, count]) => {
            const item = config.items.find(i => i.id === id);
            if (item) total += count * item.val;
        });
        return (total / price) * 1000;
    }

function renderPackageList(containerId, list = []) {
    const div = document.getElementById(containerId);
    if (!div) return;

    const safeList = Array.isArray(list) ? list : [];

    div.innerHTML = safeList.map(pkg => {
        const score = calculateScore(pkg.contents, pkg.price).toFixed(1);
        const noteHtml = pkg.note ? `<div class="pkg-note">📝 ${pkg.note}</div>` : "";
        const isVisible = !pkg.hidden;

        const summary = Object.entries(pkg.contents).map(([id, count]) => {
            const item = (config && config.items) ? config.items.find(i => i.id === id) : null;
            return `${item ? item.name : id} x${count}`;
        }).join(', ');
        
        return `
            <div class="pkg-card ${!isVisible ? 'is-hidden' : ''}" style="position: relative;">
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <input type="checkbox" 
                           ${isVisible ? 'checked' : ''} 
                           onclick="togglePackageVisibility('${pkg.name}')" 
                           style="margin-top: 4px; cursor: pointer; width: 16px; height: 16px;">
                    
                    <div style="flex: 1;">
                        <span class="pkg-name">[${pkg.releasedApostle}] ${pkg.name}</span>
                        <span class="pkg-price-tag" style="float: right;">${pkg.price.toLocaleString()}원</span>
                        ${noteHtml} 
                        <div style="margin-top: 5px;">
                            <span class="eff-badge">효율 점수 : ${score}</span>
                        </div>
                        <div class="pkg-items" style="margin-top: 8px; font-size: 0.85em; color: #666;">${summary}</div>
                        <button class="apply-btn" onclick="applyPackageData('${containerId}', '${pkg.name}')" style="margin-top: 10px; width: 100%;">이 구성으로 분석하기</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

    function applyPackageData(sourceId, pkgIdentifier) {
    // 💡 수정된 부분: released-list일 때 id 대신 name으로 찾도록 변경
    const pkg = (sourceId === 'released-list') 
        ? dbPackages.find(p => p.name === pkgIdentifier) // 👈 p.id 대신 p.name
        : constantPackages[pkgIdentifier]; // 상시는 기존 인덱스 방식 유지

    if(!pkg) {
        console.error("패키지를 찾을 수 없습니다:", pkgIdentifier);
        return;
    }

    document.body.style.backgroundImage = "url('images/쌀이드.gif')";
    config.price = pkg.price;
    config.items.forEach(item => { 
        item.count = pkg.contents[item.id] || ""; 
    });
    openTab('calc'); 
    calculate();
}

function openTab(id) {
    // 모든 탭과 카드에서 active 클래스 제거
    document.querySelectorAll('.tab, .card').forEach(el => el.classList.remove('active'));
    
    // 클릭한 탭과 해당 카드에 active 클래스 추가
    const targetTab = document.querySelector(`.tab[onclick="openTab('${id}')"]`);
    if (targetTab) targetTab.classList.add('active');
    
    const targetCard = document.getElementById(id);
    if (targetCard) targetCard.classList.add('active');

    // ✅ 각 탭에 맞는 초기화/렌더링 함수 실행
    if (id === 'calc') renderCalc();
    if (id === 'settings') renderSettings();
    if (id === 'constant') renderConstantPackages();
    
    // ⭐ [추가] 사도 도감 탭을 누르면 전체 리스트를 즉시 렌더링
    if (id === 'apostle-list') {
        if (typeof renderApostleList === 'function') {
            renderApostleList(); // 인자 없이 호출하면 apostleDB 전체를 그립니다.
        }
    }
}

   function renderCalc() {
    const priceInput = document.getElementById('pkg-price');
    const inputContainer = document.getElementById('item-inputs');
    if (!priceInput || !inputContainer) return;

    priceInput.value = config.price;
    const items = config.items;

    // 1. 그룹별 데이터 분류
    const normalItems = items.filter(i => !i.id.startsWith('attr_') && !i.id.startsWith('pos_'));
    const attrItems = items.filter(i => i.id.startsWith('attr_'));
    const posItems = items.filter(i => i.id.startsWith('pos_'));

    // 개별 행을 만드는 보조 함수 (기존 디자인 유지)
    const renderRow = (item) => `
        <div class="row">
            <div class="item-info">
                <img src="${item.icon}" class="item-icon">
                <span class="item-name">${item.name}</span>
            </div>
            <div class="input-wrapper">
                <input type="number" id="cnt-${item.id}" value="${item.count}" oninput="saveInputs()">
            </div>
        </div>`;

    let html = "";

    // 2. 일반 아이템 출력 (엘리프, 티켓 등)
    html += normalItems.map(item => renderRow(item)).join('');

    // 3. 속성별 모집권 그룹 (접기/펴기)
    if (attrItems.length > 0) {
        html += `
            <details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
                <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">
                    📂 속성별 모집권 (클릭)
                </summary>
                <div style="padding: 5px 0;">
                    ${attrItems.map(item => renderRow(item)).join('')}
                </div>
            </details>`;
    }

    // 4. 포지션별 모집권 그룹 (접기/펴기)
    if (posItems.length > 0) {
        html += `
            <details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
                <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">
                    📂 포지션별 모집권 (클릭)
                </summary>
                <div style="padding: 5px 0;">
                    ${posItems.map(item => renderRow(item)).join('')}
                </div>
            </details>`;
    }

    inputContainer.innerHTML = html;
}

    function calculate() {
        const price = parseFloat(document.getElementById('pkg-price').value);
        if(!price) return;
        let total = 0;
        config.items.forEach(item => {
            const count = parseFloat(document.getElementById(`cnt-${item.id}`).value) || 0;
            total += count * item.val;
        });
        const rate = (total / price) * 1000;
        document.getElementById('result').style.display = 'block';
        document.getElementById('res-rate').innerText = `${rate.toFixed(1)}개`;
        document.getElementById('res-total').innerText = `(환산: ${total.toLocaleString()}개)`;
    }

    function saveInputs() { config.items.forEach(item => { const input = document.getElementById(`cnt-${item.id}`); if(input) item.count = input.value; }); }
    function saveCurrentPrice() { config.price = document.getElementById('pkg-price').value; }

    function renderSettings() {
    const items = config.items;
    
    // 1. 그룹별로 데이터 분류
    const normalItems = items.filter(i => !i.id.startsWith('attr_') && !i.id.startsWith('pos_'));
    const attrItems = items.filter(i => i.id.startsWith('attr_'));
    const posItems = items.filter(i => i.id.startsWith('pos_'));

    // 개별 행을 만드는 보조 함수 (원본 HTML 구조 유지)
    const renderRow = (item) => `
        <div class="row">
            <div class="item-info">
                <img src="${item.icon}" class="item-icon">
                <span class="item-name">${item.name}</span>
            </div>
            <div class="input-wrapper">
                <input type="number" id="val-${item.id}" value="${item.val}" step="0.1" 
                       ${item.fixed ? 'readonly' : ''} oninput="saveSettings()">
            </div>
        </div>`;

    let html = "";

    // 2. 일반 아이템 출력
    html += normalItems.map(item => renderRow(item)).join('');

    // 3. 속성별 모집권 그룹 (확장 화살표)
    if (attrItems.length > 0) {
        html += `
            <details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
                <summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">
                    📂 속성별 모집권 (클릭하여 열기)
                </summary>
                <div style="background: #fff; padding-top: 5px;">
                    ${attrItems.map(item => renderRow(item)).join('')}
                </div>
            </details>`;
    }

    // 4. 포지션별 모집권 그룹 (확장 화살표)
    if (posItems.length > 0) {
        html += `
            <details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
                <summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">
                    📂 포지션별 모집권 (클릭하여 열기)
                </summary>
                <div style="background: #fff; padding-top: 5px;">
                    ${posItems.map(item => renderRow(item)).join('')}
                </div>
            </details>`;
    }

    document.getElementById('settings-list').innerHTML = html;
}

    function saveSettings() {
        config.items.forEach(item => { 
            const input = document.getElementById(`val-${item.id}`); 
            if(input) item.val = parseFloat(input.value) || 0; 
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        
        // 1. 출시/상시 패키지 리스트의 효율 점수 갱신
        filterReleased(); 
        renderConstantPackages();
        
        // 2. [추가] 현재 분석 탭의 계산 결과도 즉시 갱신
        calculate(); 
    }

   function renderConstantPackages() {
    const listDiv = document.getElementById('constant-list');
    const searchInput = document.getElementById('constant-search');
    const categorySelect = document.getElementById('constant-category');
    
    if (!listDiv) return;

    // 1. 검색어 및 선택된 카테고리 값 가져오기
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedCategory = categorySelect ? categorySelect.value : "all";

    // 2. 교주님이 config.js에 넣은 "판매중", "미판매" 값으로 필터링
    const filtered = constantPackages.filter(pkg => {
        // 이름 검색 필터링
        const matchesSearch = pkg.name.toLowerCase().includes(query);
        // 카테고리 필터링 ("all" 이거나 데이터의 category 값과 일치할 때)
        const matchesCategory = (selectedCategory === "all") || (pkg.category === selectedCategory);
        
        return matchesSearch && matchesCategory;
    });

    // 3. 필터링된 결과 렌더링
    listDiv.innerHTML = filtered.map((pkg) => {
        // 필터링되어 순서가 바뀌어도 원본 index를 찾아야 분석 기능이 정상 작동함
        const originalIndex = constantPackages.indexOf(pkg);
        
        const score = calculateScore(pkg.contents, pkg.price).toFixed(1);
        const noteHtml = pkg.note ? `<div class="pkg-note">📝 ${pkg.note}</div>` : "";
        
        const summary = Object.entries(pkg.contents).map(([id, count]) => {
            const item = config.items.find(i => i.id === id);
            return `${item ? item.name : id} x${count}`;
        }).join(', ');

        return `
            <div class="pkg-card">
                <span class="pkg-name">${pkg.name}</span>
                <span class="pkg-price-tag">${pkg.price.toLocaleString()}원</span>
                
                ${noteHtml} 
                <div><span class="eff-badge">효율 점수 : ${score}</span></div>
                <div class="pkg-items">${summary}</div>
                
                <button class="apply-btn" onclick="applyPackageData('constant-list', ${originalIndex})">
                    이 구성으로 분석하기
                </button>
            </div>`;
    }).join('');
}
    function loadAll() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if(saved) {
            const parsed = JSON.parse(saved);
            config.items = config.items.map(item => {
                const s = parsed.items.find(si => si.id === item.id);
                return s ? { ...item, val: s.val } : item;
            });
        }
    }

    function applyRandomBackground() {
        const bgs = [
            'images/배경1.webp', 
            'images/배경2.webp',
            'images/배경3.webp',
            'images/배경4.webp'
        ];
        document.body.style.backgroundImage = `url('${bgs[Math.floor(Math.random()*bgs.length)]}')`;
    }

    function resetConfig() { if(confirm("기본 설정으로 초기화 하시겠습니까?")) { localStorage.removeItem(STORAGE_KEY); location.reload(); } }
    function copyShareLink() {
          const essentialData = {};
            config.items.forEach(item => {
            essentialData[item.id] = item.val;
          });

          const encodedData = btoa(encodeURIComponent(JSON.stringify(essentialData)));
          const url = `${window.location.origin}${window.location.pathname}?s=${encodedData}`;

          navigator.clipboard.writeText(url).then(() => {
             alert("설정 링크 복사 완료!");
          });
    }

function drawReleasedChart(filteredData) {
    const canvas = document.getElementById('releasedChart');
    const container = document.getElementById('chart-container');
    const wrapper = document.getElementById('chart-wrapper');
    const selectedApostle = document.getElementById('apostle-select').value;

    const visibleData = filteredData.filter(p => !p.hidden);

    if (selectedApostle === "all" || visibleData.length === 0) {
        if(container) container.style.display = 'none';
        return;
    }

    if(container) container.style.display = 'block';

    const dynamicHeight = Math.max(200, visibleData.length * 40); 
    wrapper.style.height = dynamicHeight + 'px';
    canvas.style.height = dynamicHeight + 'px';

    const ctx = canvas.getContext('2d');

    // ⭐ [핵심 수정] constantPackages에서 실제 은총 패키지를 찾아 점수를 계산합니다.
    // 만약 리스트에 없다면 예비용(Fallback) 데이터를 사용합니다.
    const gracePkg = constantPackages.find(p => p.name === "은총 패키지") || {
        price: 99000, 
        contents: { p_elif: 6000, crayon_highest: 10, scandy: 500, kcandy: 500 } 
    };
    
    // 현재 아이템 가치 설정이 반영된 은총 패키지의 1000원당 효율 점수
    const graceScore = calculateScore(gracePkg.contents, gracePkg.price);

    const labels = visibleData.map(p => p.name);
    const scores = visibleData.map(p => calculateScore(p.contents, p.price));

    const realMax = scores.length > 0 ? Math.max(...scores) : 0;
    
    let xAxisMax;
    if (realMax > 1000) {
        xAxisMax = 1000; 
    } else {
        // 모든 패키지가 은총보다 구리면 은총 점수가 Max가 되어 선이 맨 우측에 붙음
        xAxisMax = Math.max(realMax, graceScore);
    }

    if (releasedChartObj) releasedChartObj.destroy();

    releasedChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: scores,
                backgroundColor: scores.map(s => s >= graceScore ? 'rgba(125, 178, 73, 0.7)' : 'rgba(233, 30, 99, 0.7)'),
                borderColor: scores.map(s => s >= graceScore ? '#7db249' : '#e91e63'),
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    beginAtZero: true, 
                    max: xAxisMax,
                    grid: { display: false },
                    ticks: { 
                        callback: function(val) {
                            if (val >= 1000) return '1,000+';
                            return Number(val).toFixed(1); 
                        }
                    }
                },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `효율 점수: ${context.raw.toFixed(1)}`
                    }
                }
            }
        },
        plugins: [{
            // 지그재그 로직
            afterDatasetsDraw: (chart) => {
                const { ctx, data, scales: { x, y } } = chart;
                ctx.save();
                data.datasets[0].data.forEach((value, i) => {
                    if (value > 1000) {
                        const meta = chart.getDatasetMeta(0);
                        const bar = meta.data[i];
                        const posX = x.getPixelForValue(1000);
                        const posY = bar.y;
                        const height = bar.height;
                        ctx.clearRect(posX - 5, posY - height/2, 10, height);
                        ctx.beginPath();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = bar.options.borderColor;
                        ctx.fillStyle = bar.options.backgroundColor;
                        let startY = posY - height/2;
                        ctx.moveTo(posX, startY);
                        for (let step = 1; step <= 4; step++) {
                            const side = step % 2 === 0 ? 5 : -5;
                            ctx.lineTo(posX + side, startY + (height/4) * step);
                        }
                        ctx.stroke();
                    }
                });
                ctx.restore();
            },
            // ⭐ [기준선 로직] graceScore 위치에 선을 긋습니다.
            afterDraw: chart => {
                const {ctx, chartArea: {top, bottom}, scales: {x}} = chart;
                const xPos = x.getPixelForValue(graceScore);
                
                if (xPos >= chart.chartArea.left && xPos <= chart.chartArea.right) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#888'; // 기준선 색상
                    ctx.setLineDash([5, 5]); // 점선 스타일
                    ctx.moveTo(xPos, top);
                    ctx.lineTo(xPos, bottom);
                    ctx.stroke();
                    

                    ctx.fillStyle = '#666'; // 글자 색상 (약간 더 진하게)
                    ctx.font = 'bold 11px Arial'; // 폰트 스타일
                    ctx.textAlign = 'left';
                    

                    const label = graceScore.toFixed(1);
                    ctx.fillText(label, xPos + 5, top + 12);
                    ctx.restore();
                }
            }
        }]
    });
}
window.togglePackageVisibility = function(pkgName) {
    const targetPkg = dbPackages.find(p => p.name === pkgName);

    if (targetPkg) {
        targetPkg.hidden = !targetPkg.hidden;

        // 💾 1. 현재 숨겨진 패키지들의 이름만 추출해서 저장
        const hiddenNames = dbPackages
            .filter(p => p.hidden)
            .map(p => p.name);
        localStorage.setItem('trickcal_hidden_list', JSON.stringify(hiddenNames));

        if (typeof filterReleased === 'function') filterReleased();
    }
}

function setupLocalPackages() {
    console.log("로컬 데이터 세팅 및 숨김 목록 복구 시작...");

    // 💾 2. 저장된 숨김 목록 불러오기 및 적용
    const savedHidden = localStorage.getItem('trickcal_hidden_list');
    if (savedHidden && typeof dbPackages !== 'undefined') {
        try {
            const hiddenNames = JSON.parse(savedHidden);
            dbPackages.forEach(p => {
                if (hiddenNames.includes(p.name)) {
                    p.hidden = true;
                }
            });
        } catch (e) {
            console.error("숨김 목록 복구 실패:", e);
        }
    }

    // --- 기존 로직 (사도 Select 박스 생성 등) ---
    const apostleSet = new Set();
    if (typeof dbPackages !== 'undefined' && dbPackages.length > 0) {
        dbPackages.forEach(data => {
            apostleSet.add(data.releasedApostle || "기타");
        });

        const select = document.getElementById('apostle-select');
        if (select) {
            select.innerHTML = '<option value="all">전체 사도</option>';
            Array.from(apostleSet).sort().forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                select.appendChild(opt);
            });
        }

        // 3. 필터링 및 그래프 그리기 (이제 hidden이 적용된 채로 그려짐)
        filterReleased();
    }
};

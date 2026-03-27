      function filterReleased() {
        const query = document.getElementById('pkg-search').value.toLowerCase();
        const apostle = document.getElementById('apostle-select').value;
        const type = document.getElementById('sort-type').value;
        const order = document.getElementById('sort-order').value;

        let filtered = dbPackages.filter(p => {
            return (p.name.toLowerCase().includes(query) || p.releasedApostle.toLowerCase().includes(query)) && 
                   (apostle === "all" || p.releasedApostle === apostle);
        });

        filtered.sort((a, b) => {
            let vA = (type === 'price') ? a.price : calculateScore(a.contents, a.price);
            let vB = (type === 'price') ? b.price : calculateScore(b.contents, b.price);
            return (order === 'asc') ? vA - vB : vB - vA;
        });

        renderPackageList('released-list', filtered); // 리스트 먼저 그리고
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

function renderPackageList(containerId, list = []) { // 👈 list가 없으면 빈 배열([])을 기본값으로 사용
    const div = document.getElementById(containerId);
    if (!div) return; // 컨테이너가 없으면 종료

    // list가 undefined나 null이더라도 에러가 나지 않도록 한 번 더 안전장치
    const safeList = Array.isArray(list) ? list : [];

    div.innerHTML = safeList.map(pkg => {
        const score = calculateScore(pkg.contents, pkg.price).toFixed(1);
        const summary = Object.entries(pkg.contents).map(([id, count]) => {
            // config.items가 로드되지 않았을 경우를 대비한 안전장치
            const item = (config && config.items) ? config.items.find(i => i.id === id) : null;
            return `${item ? item.name : id} x${count}`;
        }).join(', ');
        
        return `
            <div class="pkg-card">
                <span class="pkg-name">[${pkg.releasedApostle}] ${pkg.name}</span>
                <span class="pkg-price-tag">${pkg.price.toLocaleString()}원</span>
                <div><span class="eff-badge">효율 점수 : ${score}</span></div>
                <div class="pkg-items">${summary}</div>
                <button class="apply-btn" onclick="applyPackageData('${containerId}', '${pkg.id}')">이 구성으로 분석하기</button>
            </div>`;
    }).join('');
}

    function applyPackageData(sourceId, pkgId) {
        const pkg = (sourceId === 'released-list') ? dbPackages.find(p => p.id === pkgId) : constantPackages[pkgId];
        if(!pkg) return;
        document.body.style.backgroundImage = "url('images/쌀이드.gif')";
        config.price = pkg.price;
        config.items.forEach(item => { item.count = pkg.contents[item.id] || ""; });
        openTab('calc'); calculate();
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
        listDiv.innerHTML = constantPackages.map((pkg, index) => {
            // 💡 상시 패키지의 효율 점수를 계산합니다.
            const score = calculateScore(pkg.contents, pkg.price).toFixed(1);
            
            const summary = Object.entries(pkg.contents).map(([id, count]) => {
                const item = config.items.find(i => i.id === id);
                return `${item ? item.name : id} x${count}`;
            }).join(', ');

            return `
                <div class="pkg-card">
                    <span class="pkg-name">${pkg.name}</span>
                    <span class="pkg-price-tag">${pkg.price.toLocaleString()}원</span>
                    <div><span class="eff-badge">효율 점수 : ${score}</span></div>
                    <div class="pkg-items">${summary}</div>
                    <button class="apply-btn" onclick="applyPackageData('constant-list', ${index})">이 구성으로 분석하기</button>
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
    const wrapper = document.getElementById('chart-wrapper'); // 💡 wrapper 추가
    const selectedApostle = document.getElementById('apostle-select').value;

    if (selectedApostle === "all" || filteredData.length === 0) {
        if(container) container.style.display = 'none';
        return;
    }

    if(container) container.style.display = 'block';

    // 💡 데이터 개수에 따라 높이 계산 (1개당 40px 정도로 넉넉히)
    const dynamicHeight = Math.max(200, filteredData.length * 40); 
    
    // 💡 부모 wrapper의 높이를 직접 변경하여 캔버스가 늘어날 공간을 만듭니다.
    wrapper.style.height = dynamicHeight + 'px';
    canvas.style.height = dynamicHeight + 'px';

    const ctx = canvas.getContext('2d');

    // 은총 패키지 기준점 계산
    const gracePkg = constantPackages.find(p => p.name === "은총 패키지") || {price: 99000, contents: {p_elif: 6000}};
    const graceScore = calculateScore(gracePkg.contents, gracePkg.price);

    const labels = filteredData.map(p => p.name);
    const scores = filteredData.map(p => calculateScore(p.contents, p.price));

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
            maintainAspectRatio: false, // 💡 반드시 false여야 높이 조절이 먹힙니다.
            layout: {
                padding: { bottom: 20 } // 하단 수치 글자가 잘리지 않게 여백 추가
            },
            plugins: {
                legend: { display: false },
                // 수직 기준선(은총 패키지) 그리기
                beforeDraw: (chart) => {
                    const {ctx, chartArea: {top, bottom, left, right}, scales: {x}} = chart;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x.getPixelForValue(graceScore), top);
                    ctx.lineTo(x.getPixelForValue(graceScore), bottom);
                    ctx.stroke();
                    ctx.restore();
                }
            },
            scales: {
                x: { beginAtZero: true, grid: { display: false } },
                y: { grid: { display: false } }
            }
        },
        // 기준선을 그리기 위한 커스텀 플러그인
        plugins: [{
            afterDraw: chart => {
                const {ctx, chartArea: {top, bottom}, scales: {x}} = chart;
                const xPos = x.getPixelForValue(graceScore);
                if (xPos >= chart.chartArea.left && xPos <= chart.chartArea.right) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#888';
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(xPos, top);
                    ctx.lineTo(xPos, bottom);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }]
    });
}

function setupLocalPackages() {
    console.log("로컬 데이터 세팅 시작...");
    
    // 1. 사도 목록(Select 박스) 필터용 데이터 모으기
    const apostleSet = new Set();
    
    // dbPackages는 packages.js에서 이미 가져온 상태입니다.
    if (typeof dbPackages !== 'undefined' && dbPackages.length > 0) {
        dbPackages.forEach(data => {
            apostleSet.add(data.releasedApostle || "기타");
        });

        // 2. Select 박스(드롭다운)에 사도 이름들 채워넣기
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

        // 3. ⭐️ 핵심: 리스트와 그래프를 처음으로 그리기
        filterReleased(); 
    } else {
        console.error("dbPackages 데이터를 찾을 수 없습니다. packages.js 파일 연결을 확인하세요.");
    }
}

window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('s');

    if (sharedData) {
        try {
            const vals = JSON.parse(decodeURIComponent(atob(sharedData)));

            config.items.forEach(item => {
                if (vals[item.id] !== undefined) {
                    item.val = vals[item.id];
                }
            });

            if (typeof renderItems === 'function') renderItems();
            if (typeof renderPackages === 'function') renderPackages();
            if (typeof renderConstantPackages === 'function') renderConstantPackages();
        } catch (e) {
            console.error("Data Load Error:", e);
        }
    }
};

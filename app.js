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
    const iconPath = item ? item.icon : 'images/default.png'; // 아이콘 경로 가져오기
    return `
        <span class="content-item" style="display: inline-flex; align-items: center; gap: 4px; margin-right: 8px;">
            <img src="${iconPath}" style="width: 18px; height: 18px; object-fit: contain;">
            ${item ? item.name : id} x${count}
        </span>`;
}).join(''); // join(', ') 대신 빈 문자열로 합칩니다.
        
        // [수정] id="pkg-released-${pkg.name}" 추가 (공백이나 특수문자 대응을 위해 name 사용)
        return `
            <div class="pkg-card ${!isVisible ? 'is-hidden' : ''}" id="pkg-released-${pkg.name}" style="position: relative;">
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

    // [수정] 필터 조건에 !i.id.startsWith('marsh_') 추가
    const normalItems = items.filter(i => !i.id.startsWith('attr_') && !i.id.startsWith('pos_') && !i.id.startsWith('marsh_'));
    const attrItems = items.filter(i => i.id.startsWith('attr_'));
    const posItems = items.filter(i => i.id.startsWith('pos_'));
    const marshItems = items.filter(i => i.id.startsWith('marsh_')); // [추가] 마시멜로 전용 변수

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
    html += normalItems.map(item => renderRow(item)).join('');

    // 속성/포지션 그룹 로직 (기존과 동일)
    if (attrItems.length > 0) {
        html += `<details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
            <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">📂 속성별 모집권 (클릭)</summary>
            <div style="padding: 5px 0;">${attrItems.map(item => renderRow(item)).join('')}</div>
        </details>`;
    }
    if (posItems.length > 0) {
        html += `<details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
            <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">📂 포지션별 모집권 (클릭)</summary>
            <div style="padding: 5px 0;">${posItems.map(item => renderRow(item)).join('')}</div>
        </details>`;
    }

    // [추가] 마시멜로 그룹 UI
    if (marshItems.length > 0) {
        html += `<details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
            <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">📂 마시멜로 종류별 (클릭)</summary>
            <div style="padding: 5px 0;">${marshItems.map(item => renderRow(item)).join('')}</div>
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
    
    // 아이템 필터링 로직
    const normalItems = items.filter(i => !i.id.startsWith('attr_') && !i.id.startsWith('pos_') && !i.id.startsWith('marsh_'));
    const attrItems = items.filter(i => i.id.startsWith('attr_'));
    const posItems = items.filter(i => i.id.startsWith('pos_'));
    const marshItems = items.filter(i => i.id.startsWith('marsh_'));

    const renderRow = (item) => {
        const isPaidElif = item.id === 'p_elif';
        const isKcandy = item.id === 'kcandy';
        
        // 유료 엘리프나 왕사탕인 경우에만 도우미 버튼 표시
        const helperBtn = (isPaidElif || isKcandy) ? `<button class="helper-btn" onclick="toggleSettingHelper('${item.id}')">설정 도우미</button>` : '';
        
        // 탭 이동 시 상태 복구를 위한 체크 함수
        const isChecked = (type, val) => {
            const criteria = type === 'p_elif' ? config.paidElifCriteria : config.kcandyCriteria;
            return (criteria && criteria.includes(val)) ? 'checked' : '';
        };

        // 1. 유료 엘리프 도우미 (체크박스/복수 선택)
        const pElifHelper = isPaidElif ? `
            <div id="p_elif-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">유료 엘리프 주요 소모처 (복수 선택)</strong>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label><input type="checkbox" class="elif-helper-chk" value="3.0" onchange="updatePaidElifValue()" ${isChecked("p_elif", "3.0")}> 사도랑 왕사탕 패키지</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="4.8" onchange="updatePaidElifValue()" ${isChecked("p_elif", "4.8")}> 카드랑 별사탕 패키지</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="2.8" onchange="updatePaidElifValue()" ${isChecked("p_elif", "2.8")}> 새콤 교단 증명서 패키지</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="3.3" onchange="updatePaidElifValue()" ${isChecked("p_elif", "3.3")}> 1일 1회 모집 뽑기(일일뽑)</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="2.7" onchange="updatePaidElifValue()" ${isChecked("p_elif", "2.7")}> 엘리프 교체 패키지</label>
                </div>
                <p style="margin-top: 10px; font-size: 0.8em; color: #d32f2f;">* 선택한 항목 중 가장 낮은 효율이 기준값으로 적용됩니다.</p>
            </div>` : '';

        // 2. 왕사탕 도우미 (라디오/단일 선택)
        const kcandyHelper = isKcandy ? `
            <div id="kcandy-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">🍬 왕사탕 충전 기준 (택 1)</strong>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label><input type="radio" name="kcandy-group" class="kcandy-helper-radio" value="0.3" onchange="updateKcandyValue()" ${isChecked("kcandy", "0.3")}> ~3회 충전 (0.3)</label>
                    <label><input type="radio" name="kcandy-group" class="kcandy-helper-radio" value="0.5" onchange="updateKcandyValue()" ${isChecked("kcandy", "0.5")}> ~5회 충전 (0.5)</label>
                    <label><input type="radio" name="kcandy-group" class="kcandy-helper-radio" value="0.7" onchange="updateKcandyValue()" ${isChecked("kcandy", "0.7")}> ~8회 충전 (0.7)</label>
                    <label><input type="radio" name="kcandy-group" class="kcandy-helper-radio" value="1.0" onchange="updateKcandyValue()" ${isChecked("kcandy", "1.0")}> ~10회 충전 (1.0)</label>
                </div>
                <p style="margin-top: 10px; font-size: 0.8em; color: #666;">* 본인의 일일 평균 충전 횟수를 선택해 주세요.</p>
            </div>` : '';

        return `
            <div class="row" style="flex-wrap: wrap;">
                <div class="item-info">
                    <img src="${item.icon}" class="item-icon">
                    <span class="item-name">${item.name}</span>
                    ${helperBtn}
                </div>
                <div class="input-wrapper">
                    <input type="number" id="val-${item.id}" value="${item.val}" step="0.1" 
                           ${item.fixed ? 'readonly' : ''} oninput="saveSettings()">
                </div>
                ${pElifHelper}
                ${kcandyHelper}
            </div>`;
    };

    let html = "";
    // 일반 아이템 출력
    html += normalItems.map(item => renderRow(item)).join('');

    // 속성별 모집권 그룹
    if (attrItems.length > 0) {
        html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 속성별 모집권 (클릭)</summary>
            <div style="background: #fff; padding-top: 5px;">${attrItems.map(item => renderRow(item)).join('')}</div>
        </details>`;
    }

    // 포지션별 모집권 그룹
    if (posItems.length > 0) {
        html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 포지션별 모집권 (클릭)</summary>
            <div style="background: #fff; padding-top: 5px;">${posItems.map(item => renderRow(item)).join('')}</div>
        </details>`;
    }

    // 마시멜로 종류별 그룹
    if (marshItems.length > 0) {
        html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;">
            <summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 마시멜로 종류별 (클릭)</summary>
            <div style="background: #fff; padding-top: 5px;">${marshItems.map(item => renderRow(item)).join('')}</div>
        </details>`;
    }

    // 최종 결과 적용
    const settingsList = document.getElementById('settings-list');
    if (settingsList) settingsList.innerHTML = html;
}


// 설정 도우미 토글
function toggleSettingHelper(id) {
    const helper = document.getElementById(`${id}-helper`);
    if (helper) helper.classList.toggle('active');
}

// 선택된 항목 중 최저 가치를 계산하여 적용
function updatePaidElifValue() {
    const checkboxes = document.querySelectorAll('.elif-helper-chk');
    const checkedValues = Array.from(checkboxes)
        .filter(chk => chk.checked)
        .map(chk => chk.value);

    config.paidElifCriteria = checkedValues;

    if (checkedValues.length > 0) {
        const minValue = Math.min(...checkedValues.map(v => parseFloat(v)));
        const input = document.getElementById('val-p_elif');
        if (input) {
            input.value = minValue;
            saveSettings(); 
        }
    } else {
        saveSettings();
    }
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
    const sortTypeSelect = document.getElementById('constant-sort-type');
    const sortOrderSelect = document.getElementById('constant-sort-order');
    
    if (!listDiv || !categorySelect) return;

    // 1. 현재 선택된 값 저장
    const selectedCategory = categorySelect.value || "all";
    const query = (searchInput.value || "").toLowerCase().trim();
    const sortType = sortTypeSelect ? sortTypeSelect.value : 'score';
    const sortOrder = sortOrderSelect ? sortOrderSelect.value : 'desc';

    // 2. 카테고리 목록 자동 갱신 (중복 방지)
    const categoriesFromData = [...new Set(constantPackages.map(pkg => pkg.category))]
        .filter(cat => cat && cat !== "판매중" && cat !== "미판매")
        .sort();
    
    let selectHtml = `
        <option value="all" ${selectedCategory === 'all' ? 'selected' : ''}>전체</option>
        <option value="판매중" ${selectedCategory === '판매중' ? 'selected' : ''}>판매중</option>
        <option value="미판매" ${selectedCategory === '미판매' ? 'selected' : ''}>미판매</option>
    `;
    categoriesFromData.forEach(cat => {
        selectHtml += `<option value="${cat}" ${selectedCategory === cat ? 'selected' : ''}>${cat}</option>`;
    });
    categorySelect.innerHTML = selectHtml;

    // 3. 필터링 로직 (isExpired 대신 category: "미판매" 기준으로 수정)
    let filtered = constantPackages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(query);
        let matchesCategory = false;
        const pkgCat = pkg.category || "";

        if (selectedCategory === "all") {
            matchesCategory = true;
        } else if (selectedCategory === "판매중") {
            // 카테고리가 "미판매"가 아닌 것들을 판매중으로 간주
            matchesCategory = (pkgCat !== "미판매");
        } else if (selectedCategory === "미판매") {
            // 카테고리가 "미판매"인 것들만 필터링
            matchesCategory = (pkgCat === "미판매");
        } else {
            matchesCategory = (pkgCat === selectedCategory);
        }
        
        return matchesSearch && matchesCategory;
    });

    // 4. 정렬 로직 (기존 유지)
    filtered.sort((a, b) => {
        let vA = (sortType === 'price') ? a.price : calculateScore(a.contents, a.price);
        let vB = (sortType === 'price') ? b.price : calculateScore(b.contents, b.price);
        return (sortOrder === 'asc') ? vA - vB : vB - vA;
    });

    // 5. 리스트 렌더링 (스크롤용 ID 포함)
    listDiv.innerHTML = filtered.map((pkg) => {
        const originalIndex = constantPackages.indexOf(pkg);
        const score = calculateScore(pkg.contents, pkg.price).toFixed(1);
        const noteHtml = pkg.note ? `<div class="pkg-note">📝 ${pkg.note}</div>` : "";
       const summary = Object.entries(pkg.contents).map(([id, count]) => {
    const item = config.items.find(i => i.id === id);
    const iconPath = item ? item.icon : 'images/default.png';
    return `
        <span class="content-item" style="display: inline-flex; align-items: center; gap: 4px; margin-right: 8px;">
            <img src="${iconPath}" style="width: 18px; height: 18px; object-fit: contain;">
            ${item ? item.name : id} x${count}
        </span>`;
}).join('');

        return `
            <div class="pkg-card" id="pkg-constant-${originalIndex}">
                <span class="pkg-name">${pkg.name}</span>
                <span class="pkg-price-tag">${pkg.price.toLocaleString()}원</span>
                ${noteHtml} 
                <div><span class="eff-badge">효율 점수 : ${score}</span></div>
                <div class="pkg-items">${summary}</div>
                <button class="apply-btn" onclick="applyPackageData('constant-list', ${originalIndex})">이 구성으로 분석하기</button>
            </div>`;
    }).join('');

    // 6. 그래프 업데이트
    if (typeof drawConstantChart === 'function') {
        drawConstantChart(filtered);
    }
}

function loadAll() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) {
        const parsed = JSON.parse(saved);
        
        // 1. 기존 아이템 가치(val) 복구 로직
        if (parsed.items) {
            config.items = config.items.map(item => {
                const s = parsed.items.find(si => si.id === item.id);
                return s ? { ...item, val: s.val } : item;
            });
        }
        
        // 2. 설정 도우미 체크 상태 복구 (추가)
        config.paidElifCriteria = parsed.paidElifCriteria || [];
        config.kcandyCriteria = parsed.kcandyCriteria || [];
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

    const gracePkg = constantPackages.find(p => p.name === "은총 패키지") || {
        price: 99000, 
        contents: { p_elif: 6000, crayon_highest: 10, scandy: 500, kcandy: 500 } 
    };
    
    const graceScore = calculateScore(gracePkg.contents, gracePkg.price);

    const labels = visibleData.map(p => p.name);
    const scores = visibleData.map(p => calculateScore(p.contents, p.price));

    const realMax = scores.length > 0 ? Math.max(...scores) : 0;
    
    let xAxisMax;
    if (realMax > 1000) {
        xAxisMax = 1000; 
    } else {
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
            // ⭐ [클릭 이벤트 추가]
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const pkg = visibleData[index];
                    const targetElement = document.getElementById(`pkg-released-${pkg.name}`);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 강조 효과
                        targetElement.style.transition = 'background-color 0.3s';
                        targetElement.style.backgroundColor = '#fff9c4';
                        setTimeout(() => {
                            targetElement.style.backgroundColor = '';
                        }, 1000);
                    }
                }
            },
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

                    ctx.fillStyle = '#666';
                    ctx.font = 'bold 11px Arial';
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

let constantChartObj = null;

function drawConstantChart(filteredData) {
    const canvas = document.getElementById('constantChart');
    const container = document.getElementById('constant-chart-container');
    const wrapper = document.getElementById('constant-chart-wrapper');
    if (!canvas) return;

    if (filteredData.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    const dynamicHeight = Math.max(200, filteredData.length * 35);
    wrapper.style.height = dynamicHeight + 'px';
    canvas.style.height = dynamicHeight + 'px';

    const ctx = canvas.getContext('2d');

    const gracePkg = constantPackages.find(p => p.name === "은총 패키지") || {
        price: 99000, 
        contents: { p_elif: 6000, crayon_highest: 10, scandy: 500, kcandy: 500 }
    };
    const graceScore = calculateScore(gracePkg.contents, gracePkg.price);

    const labels = filteredData.map(p => p.name);
    const scores = filteredData.map(p => calculateScore(p.contents, p.price));

    const realMax = scores.length > 0 ? Math.max(...scores) : 0;
    let xAxisMax = Math.max(realMax, graceScore) * 1.1; 
    if (xAxisMax > 1000) xAxisMax = 1000;

    if (constantChartObj) constantChartObj.destroy();

    constantChartObj = new Chart(ctx, {
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
            // ⭐ [클릭 이벤트 추가]
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const pkg = filteredData[index];
                    const originalIndex = constantPackages.indexOf(pkg);
                    const targetElement = document.getElementById(`pkg-constant-${originalIndex}`);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 강조 효과 추가
                        targetElement.style.transition = 'background-color 0.3s';
                        targetElement.style.backgroundColor = '#fff9c4';
                        setTimeout(() => {
                            targetElement.style.backgroundColor = '#fafafa';
                        }, 1000);
                    }
                }
            },
            scales: {
                x: { 
                    beginAtZero: true, 
                    max: xAxisMax,
                    grid: { display: false } 
                },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: (context) => `효율 점수: ${context.raw.toFixed(1)}` }
                }
            }
        },
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

                    ctx.fillStyle = '#666';
                    ctx.font = 'bold 11px Arial';
                    ctx.fillText(graceScore.toFixed(1), xPos + 5, top + 12);
                    ctx.restore();
                }
            }
        }]
    });
}

function updateKcandyValue() {
    const selected = document.querySelector('.kcandy-helper-radio:checked');
    if (selected) {
        const val = selected.value;
        config.kcandyCriteria = [val]; 
        const input = document.getElementById('val-kcandy');
        if (input) {
            input.value = val;
            saveSettings();
        }
    }
}

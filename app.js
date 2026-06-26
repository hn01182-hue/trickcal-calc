// 💡 추가: 검색 디바운스를 위한 타이머 변수
let searchTimeout;
// 💡 추가: 타이핑을 0.3초간 멈추면 filterReleased()를 실행하는 함수
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filterReleased();
    }, 300); // 0.3초 딜레이
}

function filterReleased() {
    const query = document.getElementById('pkg-search').value.toLowerCase();
    const pkgType = document.getElementById('pkg-type-select').value;
    const apostle = document.getElementById('selected-apostle-val').value;
    const type = document.getElementById('sort-type').value;
    const order = document.getElementById('sort-order').value;

    let filtered = dbPackages.filter(p => {
        // 1. 이름 및 출시사도 검색어 매칭
        const matchesQuery = p.name.toLowerCase().includes(query) || p.releasedApostle.toLowerCase().includes(query);
        
       // 2. 패키지 대분류 필터 (사도 패키지 vs 아이시움 라운지 패키지)
        const isIsium = p.releasedApostle.startsWith("아이시움");
        let matchesPkgType = (pkgType === "isium") ? isIsium : !isIsium;

        // 3. 사도 소분류 필터링
        let matchesApostle = (apostle === "all") || (p.releasedApostle === apostle);
        
        return matchesQuery && matchesPkgType && matchesApostle;
    });

    // 정렬 로직 (내부 계산은 소수점까지 정밀하게 비교하여 순서 결정)
    filtered.sort((a, b) => {
        let vA = (type === 'price') ? a.price : calculateScore(a.contents, a.price);
        let vB = (type === 'price') ? b.price : calculateScore(b.contents, b.price);
        return (order === 'asc') ? vA - vB : vB - vA;
    });

    // 1. 리스트 그리기 (💡 이제 대분류가 전체일 때도 리스트 카드는 정상 작동합니다!)
    renderPackageList('released-list', filtered); 
    
    // 2. 그래프 그리기
    drawReleasedChart(filtered);
}

function onPkgTypeChange() {
    // 💡 1. 사도 필터 초기화 (핵심: 대분류를 바꾸면 사도 필터도 '전체'로 복귀)
    document.getElementById('selected-apostle-val').value = "all";
    document.getElementById('apostle-selector').innerText = "전체 패키지";

    // 💡 2. 검색창 안내 문구 변경
    const pkgType = document.getElementById('pkg-type-select').value;
    const searchInput = document.getElementById('modal-search');
    if (searchInput) {
        if (pkgType === "isium") {
            searchInput.placeholder = "검색...";
        } else {
            searchInput.placeholder = "사도 이름 검색...";
        }
    }

    updateApostleSelectOptions();
    filterReleased();
}

function updateApostleSelectOptions() {
    const pkgType = document.getElementById('pkg-type-select').value;
    const select = document.getElementById('apostle-select');
    if (!select) return;

    const prevSelected = select.value;
    select.innerHTML = '<option value="all">모든 패키지</option>'; // 💡 3번 반영 완료
    const apostleSet = new Set();

    dbPackages.forEach(p => {
        const name = p.releasedApostle || "기타";
        const isIsium = name.startsWith("아이시움");

        // 대분류 선택에 맞춰 사도 목록 추출 구문을 명확하게 단순화
        if (pkgType === "isium" && isIsium) {
            apostleSet.add(name);
        } else if (pkgType === "apostle" && !isIsium) {
            apostleSet.add(name);
        }
    });

    Array.from(apostleSet).sort().forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        if (name === prevSelected) opt.selected = true;
        select.appendChild(opt);
    });
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
        const score = Math.round(calculateScore(pkg.contents, pkg.price));
        const noteHtml = pkg.note ? `<div class="pkg-note">📝 ${pkg.note}</div>` : "";
        const isVisible = !pkg.hidden;

        const summary = Object.entries(pkg.contents).map(([id, count]) => {
            const item = (config && config.items) ? config.items.find(i => i.id === id) : null;
            const iconPath = item ? item.icon : 'images/default.png';
            return `
                <span class="content-item" style="display: inline-flex; align-items: center; gap: 4px; margin-right: 8px;">
                    <img src="${iconPath}" style="width: 18px; height: 18px; object-fit: contain;">
                    ${item ? item.name : id} x${count}
                </span>`;
        }).join('');
        
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
    const pkg = (sourceId === 'released-list') 
        ? dbPackages.find(p => p.name === pkgIdentifier)
        : constantPackages[pkgIdentifier];

    if(!pkg) {
        console.error("패키지를 찾을 수 없습니다:", pkgIdentifier);
        return;
    }

    document.body.style.backgroundImage = "url('images/쌀이드.gif')";
    
    // 🌐 1. 아이시움 패키지(웹상점) 여부 검사
    const isIcium = pkg.name.includes("아이시움");
    
    // 💡 [핵심 버그 수정] 계산기가 인식할 수 있도록 config에 패키지 이름을 주입해 줌!
    config.name = pkg.name; 

    // 💳 2. 가격 판정 및 주입 (원래 가격 기준으로 깊카 할인율 적용)
    let finalPrice = pkg.price;
    if (!isIcium) {
        const discountPercent = config.giftCardDiscountPercent || 0;
        finalPrice = pkg.price * (1 - discountPercent / 100);
    }
    config.price = Math.round(finalPrice); 

    // 임시 구성품 데이터 복사본 생성
    const updatedContents = { ...pkg.contents };

    // 🎮 3. 구글 플레이 포인트 계산
    if (!isIcium) {
        const tierRates = { bronze: 1.0, silver: 1.1, gold: 1.3, platinum: 1.6, diamond: 2.0 };
        const baseMultiplier = tierRates[config.playPointTier || 'bronze'] || 1.0;
        const extraMultiplier = parseFloat(config.playPointExtraEvent) || 0;
        const totalMultiplier = baseMultiplier + extraMultiplier;
        
        const earnedPoints = Math.round((pkg.price / 1000) * totalMultiplier);
        updatedContents['playpoint'] = (updatedContents['playpoint'] || 0) + earnedPoints;
    } else {
        updatedContents['playpoint'] = 0;
    }

    // 🔄 4. 계산기 탭 내부 입력 데이터 동기화
    config.items.forEach(item => { 
        item.count = updatedContents[item.id] !== undefined ? updatedContents[item.id] : 0; 
    });

    // 🖥️ 5. 탭 이동 및 계산기 렌더링 호출
    openTab('calc'); 
    calculate();
}
function openTab(id) {
    document.querySelectorAll('.tab, .card').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.querySelector(`.tab[onclick="openTab('${id}')"]`);
    if (targetTab) targetTab.classList.add('active');
    
    const targetCard = document.getElementById(id);
    if (targetCard) targetCard.classList.add('active');

    if (id === 'calc') renderCalc();
    if (id === 'settings') renderSettings();
    if (id === 'constant') renderConstantPackages();
    
    if (id === 'apostle-list') {
        if (typeof renderApostleList === 'function') {
            renderApostleList();
        }
    }
}

function renderCalc() {
    const priceInput = document.getElementById('pkg-price');
    const inputContainer = document.getElementById('item-inputs');
    if (!priceInput || !inputContainer) return;

    priceInput.value = config.price;
    const items = config.items;

    // 💡 capsule_ 제외 조건 및 capsuleItems 필터 추가
    const normalItems = items.filter(i => !i.id.startsWith('attr_') && !i.id.startsWith('pos_') && !i.id.startsWith('marsh_') && !i.id.startsWith('food_') && !i.id.startsWith('capsule_'));
    const attrItems = items.filter(i => i.id.startsWith('attr_'));
    const posItems = items.filter(i => i.id.startsWith('pos_'));
    const marshItems = items.filter(i => i.id.startsWith('marsh_'));
    const foodItems = items.filter(i => i.id.startsWith('food_'));
    const capsuleItems = items.filter(i => i.id.startsWith('capsule_')); // 💡 추가

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
    if (marshItems.length > 0) {
        html += `<details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
            <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">📂 마시멜로 종류별 (클릭)</summary>
            <div style="padding: 5px 0;">${marshItems.map(item => renderRow(item)).join('')}</div>
        </details>`;
    }
    if (foodItems.length > 0) {
        html += `<details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
        <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">📂 각종 요리 (클릭)</summary>
        <div style="padding: 5px 0;">${foodItems.map(item => renderRow(item)).join('')}</div>
        </details>`;
    }
    // 💡 캡슐 뽑기 티켓 details 레이아웃 추가
    if (capsuleItems.length > 0) {
        html += `<details style="margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
        <summary style="padding: 12px; cursor: pointer; background: #f1f1f1; font-weight: bold; font-size: 0.9em; border-radius: 4px;">📂 캡슐 뽑기 티켓 (클릭)</summary>
        <div style="padding: 5px 0;">${capsuleItems.map(item => renderRow(item)).join('')}</div>
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

    // 🌐 1단계: 아이시움 패키지(웹상점) 여부 확인
    const pkgNameEl = document.getElementById('pkg-name');
    const pkgName = pkgNameEl ? (pkgNameEl.innerText || pkgNameEl.value) : (config.name || "");
    const isIciumWebShop = pkgName.includes("아이시움");

    // 💡 2단계: 기본 점수 출력을 위한 구글 버프 역산(Rollback) 세팅
    const discountPercent = isIciumWebShop ? 0 : (config.giftCardDiscountPercent || 0);
    
    // 할인율이 적용된 가격을 원래 원가 가격으로 복원 (100% 할인 예외처리 포함)
    const originalPrice = isIciumWebShop ? price : (discountPercent >= 100 ? price : Math.round(price / (1 - discountPercent / 100)));

    // 현재 입력창에 주입되어 있는 구글 플레이 포인트 수량 및 가치 긁어오기
    const ppInput = document.getElementById('cnt-playpoint');
    const ppCount = ppInput ? (parseFloat(ppInput.value) || 0) : 0;
    const ppItem = config.items.find(i => i.id === 'playpoint');
    const ppVal = ppItem ? ppItem.val : 0;
    const ppTotalValue = ppCount * ppVal;

    // 입력창 총 가치에서 플포 가치를 제외한 '순수 패키지 구성품 가치' 추출
    const rawItemTotal = total - ppTotalValue;

    // 📊 3단계: 정밀 효율 점수 분리 산정
    // 기본 점수 = (순수 구성품 가치 / 할인 전 원래 가격) -> 패키지 원래 효율
    const baseRate = Math.round((rawItemTotal / originalPrice) * 1000); 
    
    // 실제 효율 = (플포가 포함된 현재 총 가치 / 할인된 현재 입력창 가격) -> 💡 실제 지출액 대비 가성비!
    const actualRate = Math.round((total / price) * 1000);
    const displayTotal = Math.round(total);
    
    // 🖥️ 4단계: 화면 레이아웃 출력
    document.getElementById('result').style.display = 'block';
    
    if (isIciumWebShop) {
        // 🌐 웹상점 전용 패키지 노출
        document.getElementById('res-rate').innerHTML = `기본 점수: ${baseRate}개`;
        document.getElementById('res-total').innerHTML = `
            (환산: ${displayTotal.toLocaleString()}개)<br>
            <span style="font-size: 0.82em; color: #ef4444; font-weight: bold; display: block; margin-top: 4px;">🌐 웹상점 상품 (구글 결제 혜택 제외)</span>
        `;
    } else {
        // 🛒 일반 구글스토어 패키지 노출 
            document.getElementById('res-rate').innerHTML = `
            기본 점수: ${baseRate}개<br>
            <span style="color: #10b981; font-weight: bold;">실제 효율: ${actualRate}개</span>
        `;
        document.getElementById('res-total').innerHTML = `
            (환산: ${displayTotal.toLocaleString()}개)<br>
            <span style="font-size: 0.8em; color: #64748b; display: block; margin-top: 4px; line-height: 1.4;">
                💸 실제 현금 지출: <strong>${Math.round(price).toLocaleString()}원</strong><br>
                🎁 포인트 적립: +${Math.round(ppCount).toLocaleString()}pt (+${Math.round(ppTotalValue).toLocaleString()} 무엘 상당)
            </span>
        `;
    }
}

function saveInputs() { config.items.forEach(item => { const input = document.getElementById(`cnt-${item.id}`); if(input) item.count = input.value; }); }
function saveCurrentPrice() { config.price = document.getElementById('pkg-price').value; }

// 💡 은총 패키지 효율을 정수로 계산해오는 내부 헬퍼 함수
function getGracePackageScore() {
    const gracePkg = constantPackages.find(p => p.name === "은총 패키지") || {
        price: 99000, 
        contents: { p_elif: 6000, crayon_highest: 10, scandy: 500, kcandy: 500 } 
    };
    return Math.round(calculateScore(gracePkg.contents, gracePkg.price));
}

function renderSettings() {
    const items = config.items;
    
    // capsule_ 제외 조건 및 capsuleItems 필터 추가
    const normalItems = items.filter(i => !i.id.startsWith('attr_') && !i.id.startsWith('pos_') && !i.id.startsWith('marsh_') && !i.id.startsWith('food_') && !i.id.startsWith('capsule_'));
    const attrItems = items.filter(i => i.id.startsWith('attr_'));
    const posItems = items.filter(i => i.id.startsWith('pos_'));
    const marshItems = items.filter(i => i.id.startsWith('marsh_'));
    const foodItems = items.filter(i => i.id.startsWith('food_'));
    const capsuleItems = items.filter(i => i.id.startsWith('capsule_')); // 추가

    const renderRow = (item) => {
        const isPaidElif = item.id === 'p_elif';
        const isKcandy = item.id === 'kcandy';
        const isManual = item.id === 'manual';
        const isCheerStick = item.id === 'cheer_stick';
        const isElCheerStick = item.id === 'el_cheer_stick';
        const isWildcard = item.id === 'wildcard';
        const isMileage = item.id === 'mileage';
        const isPlaypoint = item.id === 'playpoint'; // 💡 플레이 포인트 체크 추가
        
        // 도우미 버튼 활성화 조건에 playpoint 추가
        const helperBtn = (isPaidElif || isKcandy || isManual || isCheerStick || isElCheerStick || isWildcard || isMileage || isPlaypoint) ? 
            `<button class="helper-btn" onclick="toggleSettingHelper('${item.id}')">설정 도우미</button>` : '';
    
        const isChecked = (type, val) => {
            let criteria = [];
            if (type === 'p_elif') criteria = config.paidElifCriteria;
            else if (type === 'kcandy') criteria = config.kcandyCriteria;
            else if (type === 'manual') criteria = config.manualCriteria;
            else if (type === 'cheer_stick') criteria = config.cheerStickCriteria;
            else if (type === 'el_cheer_stick') criteria = config.elCheerStickCriteria;
            else if (type === 'wildcard') criteria = config.wildcardCriteria;
            else if (type === 'mileage') criteria = config.mileageCriteria;
            else if (type === 'playpoint') criteria = config.playpointCriteria; // 💡 플레이 포인트 체크 추가
            return (criteria && criteria.includes(val)) ? 'checked' : '';
        };

        const pElifHelper = isPaidElif ? `
            <div id="p_elif-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">유료 엘리프 주요 소모처 (복수 선택)</strong>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label><input type="checkbox" class="elif-helper-chk" value="3.0" onchange="updatePaidElifValue()" ${isChecked("p_elif", "3.0")}> 사도랑 왕사탕 패키지</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="4.8" onchange="updatePaidElifValue()" ${isChecked("p_elif", "4.8")}> 카드랑 별사탕 패키지</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="2.8" onchange="updatePaidElifValue()" ${isChecked("p_elif", "2.8")}> 새콤 교단 증명서 패키지</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="3.3" onchange="updatePaidElifValue()" ${isChecked("p_elif", "3.3")}> 1일 1회 모집 (일일뽑)</label>
                    <label><input type="checkbox" class="elif-helper-chk" value="2.7" onchange="updatePaidElifValue()" ${isChecked("p_elif", "2.7")}> 엘리프 교체 패키지</label>
                </div>
                <p style="margin-top: 10px; font-size: 0.8em; color: #d32f2f;">* 선택한 항목 중 가장 낮은 효율이 기준값으로 적용됩니다.</p>
            </div>` : '';

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

        const manualHelper = isManual ? `
            <div id="manual-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">🛠️ 장비의 정석 소모처(장비 랭크)</strong>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    <label><input type="checkbox" class="manual-helper-chk" value="0.900" onchange="updateManualValue()" ${isChecked("manual", "0.900")}> 2랭크 (0.900)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.750" onchange="updateManualValue()" ${isChecked("manual", "0.750")}> 3랭크 (0.750)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.450" onchange="updateManualValue()" ${isChecked("manual", "0.450")}> 4랭크 (0.450)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.375" onchange="updateManualValue()" ${isChecked("manual", "0.375")}> 5랭크 (0.375)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.321" onchange="updateManualValue()" ${isChecked("manual", "0.321")}> 6랭크 (0.321)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.205" onchange="updateManualValue()" ${isChecked("manual", "0.205")}> 7랭크 (0.205)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.188" onchange="updateManualValue()" ${isChecked("manual", "0.188")}> 8랭크 (0.188)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.150" onchange="updateManualValue()" ${isChecked("manual", "0.150")}> 9랭크 (0.150)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.125" onchange="updateManualValue()" ${isChecked("manual", "0.125")}> 10랭크 (0.125)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.107" onchange="updateManualValue()" ${isChecked("manual", "0.107")}> 11랭크 (0.107)</label>
                    <label><input type="checkbox" class="manual-helper-chk" value="0.094" onchange="updateManualValue()" ${isChecked("manual", "0.094")}> 12랭크 (0.094)</label>
                </div>
                <p style="margin-top: 10px; font-size: 0.8em; color: #d32f2f;">* 선택한 랭크 중 가장 낮은 가치가 적용됩니다.</p>
            </div>` : '';

        const cheerStickHelper = isCheerStick ? `
            <div id="cheer_stick-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">📣 업그레이드할 A3(어사이드 3단계) 일반 사도 보유 여부</strong>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label><input type="radio" name="cheer_stick-group" class="cheer_stick-helper-radio" value="yes" onchange="updateCheerStickValue()" ${isChecked("cheer_stick", "yes")}> 예 (가치 = 증명서 * 150)</label>
                    <label><input type="radio" name="cheer_stick-group" class="cheer_stick-helper-radio" value="no" onchange="updateCheerStickValue()" ${isChecked("cheer_stick", "no")}> 아니오 (가치 = 0)</label>
                </div>
            </div>` : '';

        const elCheerStickHelper = isElCheerStick ? `
            <div id="el_cheer_stick-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">🌟 업그레이드할 A3(어사이드 3단계) 엘다인 사도 보유 여부</strong>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label><input type="radio" name="el_cheer_stick-group" class="el_cheer_stick-helper-radio" value="yes" onchange="updateElCheerStickValue()" ${isChecked("el_cheer_stick", "yes")}> 예 (가치 = 증명서 * 400)</label>
                    <label><input type="radio" name="el_cheer_stick-group" class="el_cheer_stick-helper-radio" value="no" onchange="updateElCheerStickValue()" ${isChecked("el_cheer_stick", "no")}> 아니오 (가치 = 0)</label>
                </div>
            </div>` : '';

        const wildcardHelper = isWildcard ? `
            <div id="wildcard-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">🃏 카드 레벨 업에 투자 여부</strong>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label><input type="radio" name="wildcard-group" class="wildcard-helper-radio" value="yes" onchange="updateWildcardValue()" ${isChecked("wildcard", "yes")}> 예</label>
                    <label><input type="radio" name="wildcard-group" class="wildcard-helper-radio" value="no" onchange="updateWildcardValue()" ${isChecked("wildcard", "no")}> 아니오</label>
                </div>
            </div>` : '';

        const mileageHelper = isMileage ? `
            <div id="mileage-helper" class="helper-box">
                <strong style="display:block; margin-bottom:8px;">🪙 마일리지 소모처 (택 1)</strong>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <label><input type="radio" name="mileage-group" class="mileage-helper-radio" value="wildcard" onchange="updateMileageValue()" ${isChecked("mileage", "wildcard")}> 와일드 카드 [(와일드카드의 가치)/50]</label>
                    <label><input type="radio" name="mileage-group" class="mileage-helper-radio" value="other" onchange="updateMileageValue()" ${isChecked("mileage", "other")}> 그 외 [10]</label>
                </div>
            </div>` : '';

        // 💡 기존 구조를 유지하되, 내부를 하나의 큰 구글 플레이스토어 그룹 박스로 통합
        const playpointHelper = isPlaypoint ? `
            <div id="playpoint-helper" class="helper-box" style="text-align: left; width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-top: 10px; box-sizing: border-box;">
                <strong style="display:block; margin-bottom:12px; font-size: 1.05em; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; text-align: left;">🛒 구글 플레이스토어 관련 설정(이 구성으로 분석하기 클릭 시 적용)</strong>
                
                <!-- 1. 플레이 포인트 교환처 선택 영역 -->
                <div style="margin-bottom: 15px; text-align: left;">
                    <span style="display:block; font-weight: bold; margin-bottom: 6px; font-size: 0.9em; color: #4a5568; text-align: left;">🔄 플레이 포인트 교환처 (택 1)</span>
                    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px; width: 100%;">
                        <label style="display: flex; align-items: center; gap: 4px; width: 100%; text-align: left; font-size: 0.9em;">
                            <input type="radio" name="playpoint-group" class="playpoint-helper-radio" value="free_elif" onchange="updatePlaypointValue()" ${isChecked("playpoint", "free_elif")}> 무료 엘리프 (가치 : 1.67)
                        </label>
                        <label style="display: flex; align-items: center; gap: 4px; width: 100%; text-align: left; font-size: 0.9em;">
                            <input type="radio" name="playpoint-group" class="playpoint-helper-radio" value="ticket" onchange="updatePlaypointValue()" ${isChecked("playpoint", "ticket")}> 사도 모집 티켓 (가치 : 사도뽑기권/50)
                        </label>
                        <label style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px; margin-top: 2px; width: 100%; text-align: left; font-size: 0.9em;">
                            <span style="display: inline-flex; align-items: center; gap: 4px;">
                                <input type="radio" name="playpoint-group" class="playpoint-helper-radio" value="credit" onchange="updatePlaypointValue()" ${isChecked("playpoint", "credit")}> 구글 플레이 크레딧 (1포인트당 10원 반영)
                            </span>
                            <div id="credit-sub-helper" style="padding-left: 22px; margin-top: 4px; display: ${isChecked("playpoint", "credit") ? 'block' : 'none'}; text-align: left; width: 100%;">
                                <div style="display: flex; align-items: center; justify-content: flex-start; gap: 6px; width: 100%;">
                                    <span style="font-size: 0.85em; color: #4a5568;">목표 효율 :</span>
                                    <input type="number" id="playpoint-target-eff" value="${config.playpointTargetEff || getGracePackageScore()}" oninput="updatePlaypointValue()" style="width: 75px; padding: 2px 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85em;">
                                </div>
                                <span style="font-size: 0.78em; color: #718096; display: block; margin-top: 4px; letter-spacing: -0.5px; text-align: left;">
                                    * [참고] 은총 패키지 효율 : <strong>${getGracePackageScore()}</strong>
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- 2. 환경 변수 세팅 영역 (오른쪽 무엘 입력칸을 따로 만들지 않고 내부에 안착) -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; text-align: left;">
                    <div>
                        <label style="font-size: 0.85em; font-weight: bold; color: #4a5568; display: block; margin-bottom: 4px; text-align: left;">🎮 구글 등급</label>
                        <select id="settings-playpoint-tier" onchange="saveGoogleSettings()" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 0.85em;">
                            <option value="bronze" ${config.playPointTier === 'bronze' ? 'selected' : ''}>브론즈 (기본 1.0)</option>
                            <option value="silver" ${config.playPointTier === 'silver' ? 'selected' : ''}>실버 (기본 1.1)</option>
                            <option value="gold" ${config.playPointTier === 'gold' ? 'selected' : ''}>골드 (기본 1.3)</option>
                            <option value="platinum" ${config.playPointTier === 'platinum' ? 'selected' : ''}>플래티넘 (기본 1.6)</option>
                            <option value="diamond" ${config.playPointTier === 'diamond' ? 'selected' : ''}>다이아몬드 (기본 2.0)</option>
                        </select>
                    </div>
                    <div>
    			<label style="font-size: 0.85em; font-weight: bold; color: #4a5568; display: block; margin-bottom: 4px; text-align: left;">💳 깊카 할인율 (%)[*전액 깊카로 구매]			</label>
    			<input type="number" id="settings-giftcard-discount-percent" value="${config.giftCardDiscountPercent || 0}" placeholder="예: 10" 				min="0" max="99" oninput="saveGoogleSettings()" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1; font-			size: 0.85em; box-sizing: border-box;">
		    </div>
                    <div>
                        <label style="font-size: 0.85em; font-weight: bold; color: #d32f2f; display: block; margin-bottom: 4px; text-align: left;">🔥 플포 추가 배수 이벤트</label>
                        <input type="number" id="settings-playpoint-extra-event" value="${config.playPointExtraEvent || 0}" placeholder="기본 0" oninput="saveGoogleSettings()" style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 0.85em; font-weight: bold; color: #d32f2f; box-sizing: border-box;">
                    </div>
                </div>
			<p style="font-size: 0.8em; color: #ef4444; margin-top: 12px; margin-bottom: 0; text-align: left; font-weight: bold; letter-spacing: -0.3px; line-			height: 1.4;">
                ※  계산 하고 싶은 패키지에서 '이 구성으로 분석하기'를 클릭하면 적용됩니다. <br>
		깊카 할인은 패키지 가격 전액에 적용되는걸로 계산합니다(이외의 경우는 직접 패키지 가격에서 할인되는 가격을 빼야 합니다). <br>
		'아이시움' 패키지는 공식 웹상점 전용 상품이므로, 위 구글 플레이스토어 관련 설정(할인율 및 포인트 페이백)이 계산에 반영되지 않습니다.<br>
                </p>
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
                ${manualHelper}
                ${cheerStickHelper}
                ${elCheerStickHelper}
                ${wildcardHelper}
                ${mileageHelper}
                ${playpointHelper} </div>`; // 💡 플레이포인트 헬퍼 돔 추가
    };

    let html = "";
    html += normalItems.map(item => renderRow(item)).join('');

    if (attrItems.length > 0) { html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;"><summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 속성별 모집권 (클릭)</summary><div style="background: #fff; padding-top: 5px;">${attrItems.map(item => renderRow(item)).join('')}</div></details>`; }
    if (posItems.length > 0) { html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;"><summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 포지션별 모집권 (클릭)</summary><div style="background: #fff; padding-top: 5px;">${posItems.map(item => renderRow(item)).join('')}</div></details>`; }
    if (marshItems.length > 0) { html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;"><summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 마시멜로 종류별 (클릭)</summary><div style="background: #fff; padding-top: 5px;">${marshItems.map(item => renderRow(item)).join('')}</div></details>`; }
    if (foodItems.length > 0) { html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;"><summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 각종 요리 (클릭)</summary><div style="background: #fff; padding-top: 5px;">${foodItems.map(item => renderRow(item)).join('')}</div></details>`; }
    if (capsuleItems.length > 0) { html += `<details style="margin: 5px 0; border: 1px solid #ddd; border-radius: 4px;"><summary style="padding: 10px; cursor: pointer; background: #eee; font-weight: bold; font-size: 0.9em;">📂 캡슐 뽑기 티켓 (클릭)</summary><div style="background: #fff; padding-top: 5px;">${capsuleItems.map(item => renderRow(item)).join('')}</div></details>`; }

    const settingsList = document.getElementById('settings-list');
    if (settingsList) settingsList.innerHTML = html;
}

function saveSettings() {
    config.items.forEach(item => { 
        const input = document.getElementById(`val-${item.id}`); 
        if(input) item.val = parseFloat(input.value) || 0; 
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    
    // 💡 아래 줄을 추가했습니다!
    showToast("✅ 설정이 저장되었습니다!"); 
    
    filterReleased(); 
    renderConstantPackages();
    calculate(); 
}

function renderConstantPackages() {
    const listDiv = document.getElementById('constant-list');
    const searchInput = document.getElementById('constant-search');
    const categorySelect = document.getElementById('constant-category');
    const sortTypeSelect = document.getElementById('constant-sort-type');
    const sortOrderSelect = document.getElementById('constant-sort-order');
    
    if (!listDiv || !categorySelect) return;

    const selectedCategory = categorySelect.value || "all";
    const query = (searchInput.value || "").toLowerCase().trim();
    const sortType = sortTypeSelect ? sortTypeSelect.value : 'score';
    const sortOrder = sortOrderSelect ? sortOrderSelect.value : 'desc';

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

    let filtered = constantPackages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(query);
        let matchesCategory = false;
        const pkgCat = pkg.category || "";

        if (selectedCategory === "all") {
            matchesCategory = true;
        } else if (selectedCategory === "판매중") {
            matchesCategory = (pkgCat !== "미판매");
        } else if (selectedCategory === "미판매") {
            matchesCategory = (pkgCat === "미판매");
        } else {
            matchesCategory = (pkgCat === selectedCategory);
        }
        
        return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
        let vA = (sortType === 'price') ? a.price : calculateScore(a.contents, a.price);
        let vB = (sortType === 'price') ? b.price : calculateScore(b.contents, b.price);
        return (sortOrder === 'asc') ? vA - vB : vB - vA;
    });

    listDiv.innerHTML = filtered.map((pkg) => {
        const originalIndex = constantPackages.indexOf(pkg);
        const score = Math.round(calculateScore(pkg.contents, pkg.price));
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

    if (typeof drawConstantChart === 'function') {
        drawConstantChart(filtered);
    }
}

function loadAll() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) {
        const parsed = JSON.parse(saved);
        
        if (parsed.items) {
            config.items = config.items.map(item => {
                const s = parsed.items.find(si => si.id === item.id);
                return s ? { ...item, val: s.val } : item;
            });
        }
        
        config.paidElifCriteria = parsed.paidElifCriteria || [];
        config.kcandyCriteria = parsed.kcandyCriteria || [];
        config.manualCriteria = parsed.manualCriteria || [];
        config.cheerStickCriteria = parsed.cheerStickCriteria || [];
        config.elCheerStickCriteria = parsed.elCheerStickCriteria || [];
        config.wildcardCriteria = parsed.wildcardCriteria || [];
        config.mileageCriteria = parsed.mileageCriteria || [];
        
        // 💡 플레이포인트 세이브 기준값 분기 스토리지 연동 추가
        config.playpointCriteria = parsed.playpointCriteria || [];
        config.playpointTargetEff = parsed.playpointTargetEff || 250;


	config.playPointTier = parsed.playPointTier || "bronze";
	config.giftCardDiscountPercent = parsed.giftCardDiscountPercent || 0; 
	config.playPointExtraEvent = parsed.playPointExtraEvent || 0;
        
        config.playPointTier = parsed.playPointTier || "bronze";
        config.playPointEvent = parsed.playPointEvent || 1;
        config.giftCardDiscount = parsed.giftCardDiscount || 0;
    }
}

function applyRandomBackground() {
        /*
    const bgs = [
        'images/배경1.webp', 
        'images/배경2.webp',
        'images/배경3.webp',
        'images/배경4.webp'
    ];
    document.body.style.backgroundImage = `url('${bgs[Math.floor(Math.random()*bgs.length)]}')`;
    */

    // 배경 1로 고정 적용
    document.body.style.backgroundImage = "url('images/배경1.webp')";
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
    const selectedApostle = document.getElementById('selected-apostle-val').value;

    const visibleData = filteredData.filter(p => !p.hidden);

    // 💡 전체보기 상태("all")일 때는 그래프 컴포넌트만 숨기되, 리스트 카드는 정상 보존됨!
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
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const pkg = visibleData[index];
                    const targetElement = document.getElementById(`pkg-released-${pkg.name}`);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                            return Math.round(val); 
                        }
                    }
                },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `효율 점수: ${Math.round(context.raw)}`
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
                        ctx.strokeStyle = '#e91e63';
                        ctx.fillStyle = 'rgba(233, 30, 99, 0.7)';
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

                    const label = Math.round(graceScore);
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

        const hiddenNames = dbPackages
            .filter(p => p.hidden)
            .map(p => p.name);
        localStorage.setItem('trickcal_hidden_list', JSON.stringify(hiddenNames));

        if (typeof filterReleased === 'function') filterReleased();
    }
}

function setupLocalPackages() {
    console.log("로컬 데이터 세팅 및 숨김 목록 복구 시작...");

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

    if (typeof dbPackages !== 'undefined' && dbPackages.length > 0) {
        // 💡 페이지 로드 시 대분류 세팅을 기반으로 소분류 생성 연동 후, 즉시 첫 렌더링 호출!
        updateApostleSelectOptions();
        filterReleased(); // 💡 1번 버그 해결부 (초기 구동 시 패키지 리스트 강제 호출)
    }
}

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
                borderRadius: 4,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const pkg = filteredData[index];
                    const originalIndex = constantPackages.indexOf(pkg);
                    const targetElement = document.getElementById(`pkg-constant-${originalIndex}`);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                    grid: { display: false },
                    ticks: {
                        callback: function(val) {
                            if (val >= 1000) return '1,000+';
                            return Math.round(val);
                        }
                    }
                },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: (context) => `효율 점수: ${Math.round(context.raw)}` }
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
                    ctx.fillText(Math.round(graceScore), xPos + 5, top + 12);
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

function updateManualValue() {
    const checkboxes = document.querySelectorAll('.manual-helper-chk');
    const checkedValues = Array.from(checkboxes)
        .filter(chk => chk.checked)
        .map(chk => chk.value);

    config.manualCriteria = checkedValues;

    if (checkedValues.length > 0) {
        const minValue = Math.min(...checkedValues.map(v => parseFloat(v)));
        const input = document.getElementById('val-manual');
        if (input) {
            input.value = minValue.toFixed(3); 
            saveSettings(); 
        }
    } else {
        saveSettings();
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.style.display = "block";
    
    // 부드러운 페이드 인
    setTimeout(() => { toast.style.opacity = "1"; }, 10);
    
    // 2초 뒤 페이드 아웃
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
    }, 2000);
}

function openApostleModal() {
    document.getElementById('apostle-modal').style.display = 'flex';
    
    // 💡 추가: 모달이 열릴 때 패키지 타입에 따라 검색창 문구 변경
    const pkgType = document.getElementById('pkg-type-select').value;
    const modalSearchInput = document.getElementById('modal-search');
    
    if (pkgType === "isium") {
        modalSearchInput.placeholder = "검색...";
    } else {
        modalSearchInput.placeholder = "사도 이름 검색...";
    }
    
    renderModalList();
}

function closeApostleModal() {
    document.getElementById('apostle-modal').style.display = 'none';
}

function renderModalList() {
    const query = document.getElementById('modal-search').value.toLowerCase();
    const listDiv = document.getElementById('modal-list');
    const pkgType = document.getElementById('pkg-type-select').value;
    
    const apostleNames = [...new Set(dbPackages.map(p => p.releasedApostle))].reverse();
    
    const filtered = apostleNames.filter(name => {
        const isIsium = name.startsWith("아이시움");
        const matchesType = (pkgType === "isium") ? isIsium : !isIsium;
        return matchesType && name.toLowerCase().includes(query);
    });

    listDiv.innerHTML = filtered.map(name => {
        const isIsium = name.startsWith("아이시움");
        let imgHtml = '';
        
        // 아이시움이 아닐 때만 이미지 생성
        if (!isIsium) {
            // &로 구분하여 각각의 이미지 URL 생성
            const names = name.split('&');
            imgHtml = names.map(n => `
                <img src="images/${n.trim()}.webp" 
                     onerror="this.src='images/default.png'" 
                     style="width:30px; height:30px; border-radius:50%; margin-right:2px; object-fit:cover;">
            `).join('');
        }
        
        return `
            <div onclick="selectApostle('${name}')" style="display:flex; align-items:center; padding:10px; border-bottom:1px solid #eee; cursor:pointer;">
                ${imgHtml}
                <span style="margin-left:8px;">${name}</span>
            </div>
        `;
    }).join('');
}

function selectApostle(name) {
    document.getElementById('selected-apostle-val').value = name;
    document.getElementById('apostle-selector').innerText = name;
    closeApostleModal();
    filterReleased(); // 패키지 리스트 갱신
}

// 💡 일반 떡상 응원봉 가치 계산 함수
function updateCheerStickValue() {
    const selected = document.querySelector('.cheer_stick-helper-radio:checked');
    if (selected) {
        const val = selected.value;
        config.cheerStickCriteria = [val];
        
        let targetVal = 0;
        if (val === 'yes') {
            const certInput = document.getElementById('val-cert');
            const certVal = certInput ? parseFloat(certInput.value) : (config.items.find(i => i.id === 'cert')?.val || 8.5);
            targetVal = certVal * 150;
        }
        
        const input = document.getElementById('val-cheer_stick');
        if (input) {
            // 💡 소수점 이하가 0이면 정수로, 있으면 소수점 첫째짜리까지만
            input.value = Math.round(targetVal * 10) / 10; 
            saveSettings();
        }
    }
}

// 💡 엘다인 떡상 응원봉 가치 계산 함수
function updateElCheerStickValue() {
    const selected = document.querySelector('.el_cheer_stick-helper-radio:checked');
    if (selected) {
        const val = selected.value;
        config.elCheerStickCriteria = [val];
        
        let targetVal = 0;
        if (val === 'yes') {
            const certInput = document.getElementById('val-cert');
            const certVal = certInput ? parseFloat(certInput.value) : (config.items.find(i => i.id === 'cert')?.val || 8.5);
            targetVal = certVal * 400;
        }
        
        const input = document.getElementById('val-el_cheer_stick');
        if (input) {
            // 💡 소수점 이하가 0이면 정수로, 있으면 소수점 첫째짜리까지만
            input.value = Math.round(targetVal * 10) / 10; 
            saveSettings();
        }
    }
}

// 💡 추가: 전설 와일드 카드 가치 계산 함수
function updateWildcardValue() {
    const selected = document.querySelector('.wildcard-helper-radio:checked');
    if (selected) {
        const val = selected.value;
        config.wildcardCriteria = [val];
        
        let targetVal = 0;
        if (val === 'yes') {
            // 설정창 인풋의 엘다인 선택권(elch_ticket) 가치를 실시간으로 긁어옴 (없으면 기본값 10700)
            const elchInput = document.getElementById('val-elch_ticket');
            const elchVal = elchInput ? parseFloat(elchInput.value) : (config.items.find(i => i.id === 'elch_ticket')?.val || 10700);
            targetVal = elchVal * (25 / 400);
        }
        
        const input = document.getElementById('val-wildcard');
        if (input) {
            // 정수 까지만 깔끔하게 노출
            input.value = Math.round(targetVal);
            saveSettings();
        }
    }
}

//  설정 도우미 상자를 열고 닫는 함수
function toggleSettingHelper(id) {
    const helper = document.getElementById(`${id}-helper`);
    if (helper) {
        // CSS 파일 따로 안 건드려도 작동하도록 display 스타일 직접 제어
        const isHidden = window.getComputedStyle(helper).display === 'none';
        
        if (isHidden) {
            helper.style.display = 'block';      // 도우미 상자 보이기
            helper.style.width = '100%';         // 가득 차게 배치
            helper.classList.add('active');
        } else {
            helper.style.display = 'none';       // 도우미 상자 숨기기
            helper.classList.remove('active');
        }
    }
}

//  추가: 마일리지 가치 계산 함수 (라디오 토글)
function updateMileageValue() {
    const selected = document.querySelector('.mileage-helper-radio:checked');
    if (selected) {
        const val = selected.value;
        config.mileageCriteria = [val];
        
        let targetVal = 10; // 기본값 (그 외)
        if (val === 'wildcard') {
            // 설정창 인풋의 와일드카드(wildcard) 가치를 실시간으로 긁어옴 (없으면 기본값 0)
            const wildcardInput = document.getElementById('val-wildcard');
            const wildcardVal = wildcardInput ? parseFloat(wildcardInput.value) : (config.items.find(i => i.id === 'wildcard')?.val || 0);
            targetVal = wildcardVal / 50;
        }
        
        const input = document.getElementById('val-mileage');
        if (input) {
            // 소수점 이하 둘째 자리까지 깔끔하게 반올림 노출
            input.value = Math.round(targetVal);
            saveSettings();
        }
    }
}

// 💡 추가: 플레이 포인트 및 구글 크레딧 이중 설정 도우미 가치 계산 함수
function updatePlaypointValue() {
    const selected = document.querySelector('.playpoint-helper-radio:checked');
    const subHelper = document.getElementById('credit-sub-helper');
    
    if (selected) {
        const valType = selected.value;
        config.playpointCriteria = [valType];
        
        // 💳 구글 플레이 크레딧인 경우에만 하위 입력창 모듈 노출
        if (subHelper) {
            subHelper.style.display = (valType === 'credit') ? 'block' : 'none';
        }
        
        let targetVal = 0;
        if (valType === 'free_elif') {
            targetVal = 20 / 12; 
        } else if (valType === 'ticket') {
            // 사도 모집 티켓(t_apostle) 가치 불러와서 50으로 나눔
            const ticketInput = document.getElementById('val-t_apostle');
            const ticketVal = ticketInput ? parseFloat(ticketInput.value) : (config.items.find(i => i.id === 't_apostle')?.val || 150);
            targetVal = ticketVal / 50;
        } else if (valType === 'credit') {
            // 목표 효율 인풋값 긁어오기 (없으면 기본값 250)
            const targetEffInput = document.getElementById('playpoint-target-eff');
            const targetEff = targetEffInput ? parseFloat(targetEffInput.value) : 250;
            config.playpointTargetEff = targetEff; // 목표 효율 수치 저장 슬롯 세팅
            
            targetVal = targetEff / 100; // 🎯 250효율일 때 10원 = 2.5엘리프 변환 수식
        }
        
        const input = document.getElementById('val-playpoint');
        if (input) {
            // 소수점 이하 둘째 자리까지 반올림해서 저장 인풋에 대입
            input.value = Math.round(targetVal * 100) / 100;
            saveSettings();
        }
    }
}

function saveGoogleSettings() {
    config.playPointTier = document.getElementById('settings-playpoint-tier').value;
    config.giftCardDiscountPercent = parseFloat(document.getElementById('settings-giftcard-discount-percent').value) || 0; 
    config.playPointExtraEvent = parseFloat(document.getElementById('settings-playpoint-extra-event').value) || 0;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

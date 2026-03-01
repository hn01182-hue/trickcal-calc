// apostle.js

// 전역 변수 선언 확인
window.wantedApostles = window.wantedApostles || new Set(JSON.parse(localStorage.getItem('wanted_apostles') || '[]'));
window.lastCalcResults = null;

// 1. 사도 리스트 렌더링
window.renderApostleList = function(data = apostleDB) {
    const grid = document.getElementById('apostle-grid');
    if(!grid) return;

    grid.innerHTML = data.map(a => {
        const isChecked = wantedApostles.has(a.id);
        return `
            <div class="pkg-card" style="padding:10px; display:flex; flex-direction:column; align-items:center;">
                <div class="apostle-container ${a.isEldain ? 'eldain' : ''} ${isChecked ? 'checked' : ''}" 
                     onclick="toggleApostle(this, '${a.id}')">
                    <img src="images/${a.name}.webp" onerror="this.src='images/default.png'" class="apostle-img">
                    <div class="check-overlay">✓</div>
                </div>
                <div style="text-align:center; margin-top:8px;">
                    <div style="font-weight:bold; font-size:0.85em; ${a.isEldain ? 'color:#d32f2f;' : ''}">${a.name}</div>
                    <div style="font-size:0.7em; color:#888;">${a.role} / ${a.type}</div>
                </div>
            </div>
        `;
    }).join('');
}

window.filterApostles = function() {
    // HTML의 각 필터 요소 아이디를 확인하세요!
    const query = document.getElementById('apostle-search')?.value.trim().toLowerCase() || "";
    const rarity = document.getElementById('filter-rarity')?.value || "all";
    const type = document.getElementById('filter-type')?.value || "all";
    const role = document.getElementById('filter-role')?.value || "all";

    const filtered = apostleDB.filter(a => {
        const matchesName = a.name.toLowerCase().includes(query);
        const matchesRarity = (rarity === "all") || (rarity === "eldain" && a.isEldain) || (rarity === "normal" && !a.isEldain);
        const matchesRole = (role === "all" || a.role === role);
        
        // 속성 필터: 선택한 속성이거나, '공명' 속성인 경우 무조건 포함
        const matchesType = (type === "all") || (a.type === type) || (a.type === "공명");
        
        return matchesName && matchesRarity && matchesRole && matchesType;
    });

    // 필터링된 결과로 다시 그리기
    window.renderApostleList(filtered);
}

// 2. 사도 체크 토글
window.toggleApostle = function(element, apostleId) {
    if(wantedApostles.has(apostleId)) {
        wantedApostles.delete(apostleId);
    } else {
        wantedApostles.add(apostleId);
    }
    saveApostles();
    element.classList.toggle('checked');
}

window.saveApostles = function() {
    localStorage.setItem('wanted_apostles', JSON.stringify([...wantedApostles]));
}

// 3. 가치 계산 실행
window.runCalculation = function() {
    const selectedApostles = Array.from(wantedApostles);
    if (selectedApostles.length === 0) {
        alert("도감에서 원하는 사도를 체크해주세요!");
        return;
    }

    const VAL_NORMAL = 2550;
    const VAL_ELDAIN = 6800;
    const results = { all_attrs: {}, all_roles: {} };

    const allNormal = apostleDB.filter(a => !a.isEldain);
    const allEldain = apostleDB.filter(a => a.isEldain);

    const advEV = calculateBaseEV(allNormal, allEldain);
    results.adv_ticket = advEV;
    results.spec_ticket = advEV * 0.5;

    ["순수", "광기", "냉정", "우울", "활발"].forEach(t => {
        const typeNormal = allNormal.filter(a => a.type === t || a.type === "공명");
        const typeEldain = allEldain.filter(a => a.type === t || a.type === "공명");
        results.all_attrs[t] = calculateAttrEV(typeNormal, typeEldain);
    });

    ["탱커", "딜러", "서포터"].forEach(r => {
        const posNormal = allNormal.filter(a => a.role === r);
        const posEldain = allEldain.filter(a => a.role === r);
        results.all_roles[r] = calculateBaseEV(posNormal, posEldain);
    });

    let elchEV = 0;
    allEldain.forEach(e => {
        const prob = 1 / allEldain.length;
        elchEV += prob * (wantedApostles.has(e.id) ? VAL_ELDAIN : 0);
    });
    results.elch_yeon = elchEV;

    // 전역 변수에 결과 저장
    window.lastCalcResults = results;
    displayResults(results);
}

// 보조 계산 함수들
function calculateBaseEV(normals, eldains) {
    let ev = 0;
    if (normals.length > 0) normals.forEach(a => ev += (0.97/normals.length) * (wantedApostles.has(a.id) ? 2550 : 0));
    if (eldains.length > 0) eldains.forEach(a => ev += (0.03/eldains.length) * (wantedApostles.has(a.id) ? 6800 : 0));
    return ev;
}

function calculateAttrEV(normals, eldains) {
    let ev = 0;
    if (normals.length > 0) normals.forEach(a => ev += (0.97/normals.length) * (wantedApostles.has(a.id) ? 2550 : 0));
    if (eldains.length > 0) {
        let totalW = 0;
        eldains.forEach(e => totalW += (e.type === "공명" ? 1 : 2));
        eldains.forEach(e => {
            const w = (e.type === "공명" ? 1 : 2);
            ev += (0.03 * (w / totalW)) * (wantedApostles.has(e.id) ? 6800 : 0);
        });
    }
    return ev;
}

// 4. 결과 출력
window.displayResults = function(res) {
    const resultDiv = document.getElementById('quick-calc-result');
    if (!resultDiv) return;
    resultDiv.style.display = 'block';

    const bestType = Object.keys(res.all_attrs).reduce((a, b) => res.all_attrs[a] > res.all_attrs[b] ? a : b);
    const bestRole = Object.keys(res.all_roles).reduce((a, b) => res.all_roles[a] > res.all_roles[b] ? a : b);

    resultDiv.innerHTML = `
        <h4 style="margin:0 0 12px 0; color:#333; border-bottom:2px solid #4caf50; padding-bottom:5px;">📊 기대 가치 결과</h4>
        <div style="display:grid; gap:8px; font-size:0.95em;">
            <div style="display:flex; justify-content:space-between;">
                <span>🎟️ <strong>초특별</strong> 모집권 (20장)</span> 
                <strong>${Math.round(res.adv_ticket)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span>🎫 <strong>초고급</strong> 모집권 (10장)</span> 
                <strong>${Math.round(res.spec_ticket)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; background:#e8f5e9; padding:4px; border-radius:4px;">
                <span> 최대효율 <strong>속성</strong> [${bestType}]</span> 
                <strong>${Math.round(res.all_attrs[bestType])}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; background:#e3f2fd; padding:4px; border-radius:4px;">
                <span> 최대효율 <strong>포지션</strong> [${bestRole}]</span> 
                <strong>${Math.round(res.all_roles[bestRole])}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px dashed #ccc; padding-top:5px;">
                <span>✨ <strong>엘다인</strong> 연성권</span> 
                <strong>${Math.round(res.elch_yeon)}</strong>
            </div>
        </div>

        <button onclick="applyToSettings()" style="width:100%; margin-top:15px; padding:12px; background:#4caf50; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.9em; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ⚙️ 이 값을 설정에 적용하기
        </button>

        <details style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
            <summary style="font-size:0.82em; color:#4caf50; cursor:pointer; font-weight:bold;">🔎 모든 속성/포지션 비교 보기</summary>
            <div style="margin-top:10px; font-size:0.82em; background:#f9f9f9; padding:10px; border-radius:8px; border:1px solid #eee;">
                <p style="margin:0 0 8px 0; color:#2e7d32; font-weight:bold; border-bottom:1px solid #ddd;">[속성별 가치]</p>
                ${Object.entries(res.all_attrs).map(([type, val]) => `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>${type}</span><span>${Math.round(val)} 엘리프</span></div>`).join('')}
                <p style="margin:15px 0 8px 0; color:#1976d2; font-weight:bold; border-bottom:1px solid #ddd;">[포지션별 가치]</p>
                ${Object.entries(res.all_roles).map(([role, val]) => `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>${role}</span><span>${Math.round(val)} 엘리프</span></div>`).join('')}
            </div>
        </details>
        <p style="font-size:0.7em; color:#999; margin-top:12px;">* 체크한 사도만 가치로 인정(나머지 0)</p>
    `;
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// 5. ✅ 설정 반영 핵심 함수 (전역 등록)
// apostle.js

window.applyToSettings = function() {
    // 1. 계산 결과 확인
    const res = window.lastCalcResults;
    if (!res) {
        alert("먼저 [가치 계산하기] 버튼을 눌러주세요.");
        return;
    }

    // 2. 최대 효율 속성/포지션 찾기
    const bestType = Object.keys(res.all_attrs).reduce((a, b) => res.all_attrs[a] > res.all_attrs[b] ? a : b);
    const bestRole = Object.keys(res.all_roles).reduce((a, b) => res.all_roles[a] > res.all_roles[b] ? a : b);

    const newValuesMap = {
        'spec_ticket': Math.round(res.spec_ticket),
        'adv_ticket': Math.round(res.adv_ticket),
        'attr_ticket': Math.round(res.all_attrs[bestType]),
        'pos_ticket': Math.round(res.all_roles[bestRole]),
        'elch_yeon': Math.round(res.elch_yeon)
    };

    // 3. 변수 찾기
    let target = null;
    try {
        if (typeof config !== 'undefined') target = config;
        else if (window.config) target = window.config;
    } catch(e) { target = window.config; }

    // 4. 실제 적용 및 화면 갱신
    if (target && target.items) {
        // [데이터 업데이트]
        target.items.forEach(item => {
            if (newValuesMap[item.id] !== undefined) {
                item.val = newValuesMap[item.id];
            }
        });

        // [로컬 저장]
        const sKey = (typeof STORAGE_KEY !== 'undefined') ? STORAGE_KEY : 'trickcal_calc_v10_final';
        localStorage.setItem(sKey, JSON.stringify(target));

        // ✅ [실시간 화면 갱신] 
        // ---------------------------------------------------------
        // 1. 설정 탭의 숫자들을 바뀐 값으로 다시 그립니다.
        if (typeof renderSettings === 'function') renderSettings();

        // 2. ⭐ 핵심: filterReleased()를 불러야 패키지들의 '효율 점수'가 
        // 바뀐 가치에 맞춰 재계산되고 화면에 나타납니다.
        if (typeof filterReleased === 'function') {
            filterReleased(); 
        }

        // 3. 상시 패키지 탭도 다시 계산해서 그립니다.
        if (typeof renderConstantPackages === 'function') {
            renderConstantPackages();
        }
        // ---------------------------------------------------------

        alert(`✅ 설정에 성공적으로 반영되었습니다!\n(기준: 속성[${bestType}], 포지션[${bestRole}])`);
        
    } else {
        console.error("적용 실패: config 객체를 찾을 수 없습니다.");
    }
}

// ⚠️ 아까 사라졌던 리셋 버튼용 함수도 여기에 같이 넣어두세요!
window.resetApostles = function() {
    if(confirm("체크한 사도 목록을 모두 비우시겠습니까?")) {
        if (window.wantedApostles) window.wantedApostles.clear();
        localStorage.removeItem('wanted_apostles');
        if (typeof renderApostleList === 'function') renderApostleList(); 
        alert("사도 목록이 초기화되었습니다.");
    }
}
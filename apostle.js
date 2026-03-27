
window.wantedApostles = window.wantedApostles || new Set(JSON.parse(localStorage.getItem('wanted_apostles') || '[]'));
window.unownedApostles = window.unownedApostles || new Set(JSON.parse(localStorage.getItem('unowned_apostles') || '[]')); // 💡 미보유 목록 추가
window.lastCalcResults = null;

// 1. 사도 리스트 렌더링 수정
window.renderApostleList = function(data = apostleDB) {
    const grid = document.getElementById('apostle-grid');
    if(!grid) return;

    grid.innerHTML = data.map(a => {
        const isChecked = wantedApostles.has(a.id);
        const isUnowned = unownedApostles.has(a.id); // 미보유 여부 확인
        
        return `
            <div class="pkg-card" style="padding:10px; display:flex; flex-direction:column; align-items:center;">
                <div class="apostle-container ${a.isEldain ? 'eldain' : ''} ${isChecked ? 'checked' : ''} ${isUnowned ? 'unowned' : ''}" 
                     onclick="toggleApostle(this, '${a.id}')"
                     oncontextmenu="toggleUnowned(event, this, '${a.id}')">
                    <img src="images/${a.name}.webp" onerror="this.src='images/default.png'" class="apostle-img">
                    
                    <div class="check-overlay">✓</div>
                    
                    <div class="unowned-overlay">✕</div>
                </div>
                <div style="text-align:center; margin-top:8px;">
                    <div style="font-weight:bold; font-size:0.85em; ${a.isEldain ? 'color:#d32f2f;' : ''}">${a.name}</div>
                    <div style="font-size:0.7em; color:#888;">${a.role} / ${a.type}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 우클릭 미보유 토글 함수
window.toggleUnowned = function(event, element, apostleId) {
    event.preventDefault(); // 메뉴 팝업 방지
    
    if(unownedApostles.has(apostleId)) {
        unownedApostles.delete(apostleId);
        element.classList.remove('unowned');
    } else {
        unownedApostles.add(apostleId);
        element.classList.add('unowned');
    }
    localStorage.setItem('unowned_apostles', JSON.stringify([...unownedApostles]));
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


// 3. 가치 계산 실행 (미보유/중복 및 티켓별 가치 보존 로직 반영)
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

    // 1. 초특별 모집권 (가치 보존: 중복이라도 풀 점수)
    results.adv_ticket = calculateBaseEV(allNormal, allEldain, true);

    // 2. 초고급 모집권 (가치 감가: 중복이면 절반)
    results.spec_ticket = calculateBaseEV(allNormal, allEldain, false);

    // 3. 속성 모집권 (가치 감가 + 공명 가중치 적용)
    ["순수", "광기", "냉정", "우울", "활발"].forEach(t => {
        const typeNormal = allNormal.filter(a => a.type === t || a.type === "공명");
        const typeEldain = allEldain.filter(a => a.type === t || a.type === "공명");
        results.all_attrs[t] = calculateAttrEV(typeNormal, typeEldain, false);
    });

    // 4. 포지션 모집권 (가치 감가)
    ["탱커", "딜러", "서포터"].forEach(r => {
        const posNormal = allNormal.filter(a => a.role === r);
        const posEldain = allEldain.filter(a => a.role === r);
        results.all_roles[r] = calculateBaseEV(posNormal, posEldain, false);
    });

    // 5. 엘다인 연성권 (가치 감가 + 확정권 로직)
    let elchEV = 0;
    allEldain.forEach(e => {
        const prob = 1 / allEldain.length;
        elchEV += prob * getApostleValue(e, false);
    });
    results.elch_yeon = elchEV;
	//6. 교주의 빛무리 모집권
	const special7Names = ["디아나(왕년)", "란", "리뉴아", "벨라", "우로스", "죠안", "티그(영웅)"];
const special7List = apostleDB.filter(a => special7Names.includes(a.name));

let haloEV = 0;
if (special7List.length > 0) {
    special7List.forEach(a => {
        haloEV += (1 / special7List.length) * getApostleValue(a, false);
    });
}
results.halo_select = haloEV; // 👈 ID와 일치시킴

window.lastCalcResults = results;
displayResults(results);
}


/**
 * 💡 사도 개별 가치 판정 함수
 * @param {Object} a - 사도 객체
 * @param {Boolean} isAdvanced - 가치 보존 티켓(초특별) 여부
 */
function getApostleValue(a, isAdvanced) {
    if (!wantedApostles.has(a.id)) return 0; // 위시 아니면 0점

    const baseVal = a.isEldain ? 6800 : 2550;
    
    // 초특별 티켓이거나 미보유(X) 상태면 풀 점수, 아니면 절반
    if (isAdvanced || unownedApostles.has(a.id)) {
        return baseVal;
    } else {
        return baseVal * 0.5;
    }
}

// 일반적인 97:3 확률 기반 EV 계산 (초특별, 초고급, 포지션용)
function calculateBaseEV(normals, eldains, isAdvanced) {
    let ev = 0;
    if (normals.length > 0) {
        normals.forEach(a => {
            ev += (0.97 / normals.length) * getApostleValue(a, isAdvanced);
        });
    }
    if (eldains.length > 0) {
        eldains.forEach(a => {
            ev += (0.03 / eldains.length) * getApostleValue(a, isAdvanced);
        });
    }
    return ev;
}

// 속성 뽑기 전용 EV 계산 (공명 가중치 반영)
function calculateAttrEV(normals, eldains, isAdvanced) {
    let ev = 0;
    // 일반 사도: 균등 분배
    if (normals.length > 0) {
        normals.forEach(a => {
            ev += (0.97 / normals.length) * getApostleValue(a, isAdvanced);
        });
    }
    // 엘다인: 공명(1) vs 전용(2) 가중치 분배
    if (eldains.length > 0) {
        let totalW = 0;
        eldains.forEach(e => totalW += (e.type === "공명" ? 1 : 2));
        eldains.forEach(e => {
            const w = (e.type === "공명" ? 1 : 2);
            ev += (0.03 * (w / totalW)) * getApostleValue(e, isAdvanced);
        });
    }
    return ev;
}

// 4. 결과 출력 (개별 가치 목록만 깔끔하게 표시)
window.displayResults = function(res) {
    const resultDiv = document.getElementById('quick-calc-result');
    if (!resultDiv) return;
    resultDiv.style.display = 'block';

    // 한 줄 디자인을 위한 헬퍼 함수
    const renderRow = (label, value) => `
        <div style="display:flex; justify-content:space-between; padding:8px 4px; border-bottom:1px solid #f0f0f0;">
            <span>${label}</span>
            <strong style="color:#333;">${Math.round(value)}</strong>
        </div>
    `;

    let html = `
        <h4 style="margin:0 0 12px 0; color:#333; border-bottom:2px solid #4caf50; padding-bottom:5px;">📊 기대 가치 상세 결과</h4>
        <div style="display:flex; flex-direction:column; gap:2px; font-size:0.92em;">
    `;

    // 1. 기본 모집권 (분리하여 출력)
    html += renderRow("🎟️ 초특별 모집권 (20장)", res.adv_ticket);
    html += renderRow("🎫 초고급 모집권 (10장)", res.spec_ticket);
    html += renderRow("✨ 엘다인 연성권", res.elch_yeon);
    html += renderRow("🌈 교주의 빛무리 모집권", res.halo_select);

    // 2. 속성별 모집권 (순서대로 나열)
    Object.entries(res.all_attrs).forEach(([type, val]) => {
        html += renderRow(`${type} 모집권`, val);
    });

    // 3. 포지션별 모집권 (순서대로 나열)
    Object.entries(res.all_roles).forEach(([role, val]) => {
        html += renderRow(`${role} 모집권`, val);
    });

    html += `
        </div>
        <button onclick="applyToSettings()" style="width:100%; margin-top:18px; padding:14px; background:#4caf50; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1em; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background 0.2s;">
            ⚙️ 이 모든 값을 설정에 적용하기
        </button>
        <p style="font-size:0.75em; color:#999; margin-top:12px; text-align:center;">* 체크한 사도 비율에 기반한 개별 기대 가치입니다.</p>
    `;

    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}
// 5. 설정 반영 함수 (개별 ID에 값만 매칭)
window.applyToSettings = function() {
    const res = window.lastCalcResults;
    if (!res) {
        alert("먼저 [가치 계산하기] 버튼을 눌러주세요.");
        return;
    }

    // 1. 업데이트할 데이터 매핑
    const newValuesMap = {
        'spec_ticket': Math.round(res.spec_ticket),
        'adv_ticket': Math.round(res.adv_ticket),
        'elch_yeon': Math.round(res.elch_yeon),
        'halo_select': Math.round(res.halo_select)
    };

    // 속성별 가치 (attr_순수 등)
    Object.entries(res.all_attrs).forEach(([type, val]) => {
        newValuesMap[`attr_${type}`] = Math.round(val);
    });

    // 포지션별 가치 (pos_탱커 등)
    Object.entries(res.all_roles).forEach(([role, val]) => {
        newValuesMap[`pos_${role}`] = Math.round(val);
    });

    // 2. 실제 데이터 반영
    let target = null;
    try {
        if (typeof config !== 'undefined') target = config;
        else if (window.config) target = window.config;
    } catch(e) { target = window.config; }

    if (target && target.items) {
        target.items.forEach(item => {
            if (newValuesMap[item.id] !== undefined) {
                item.val = newValuesMap[item.id];
            }
        });

        const sKey = (typeof STORAGE_KEY !== 'undefined') ? STORAGE_KEY : 'trickcal_calc_v10_final';
        localStorage.setItem(sKey, JSON.stringify(target));

        alert(`✅ 모든 개별 가치가 설정에 반영되었습니다!`);

        if (typeof renderSettings === 'function') renderSettings();
        if (typeof filterReleased === 'function') filterReleased();
        if (typeof renderConstantPackages === 'function') renderConstantPackages();
        
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

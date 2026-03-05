const dbPackages = [
    {
        id: "[잉클] 스텝업 패키지 12",
        name: "[잉클] 스텝업 패키지 12",
        price: 99000,
        releasedApostle: "잉클",
        contents: {"p_elif":1000,"f_elif":2000,"t_apostle":150,"elch_yeon":1,"crayon_highest":10,"scandy":1000}
    },
    {
        id: "[잉클] 스텝업 패키지 3",
        name: "[잉클] 스텝업 패키지 3",
        price: 9900,
        releasedApostle: "잉클",
        contents: {"p_elif":100,"f_elif":200,"t_apostle":15,"adv_ticket":1,"crayon_highest":1,"scandy":100}
    },
    {
        id: "[잉클] 스텝업 패키지 6",
        name: "[잉클] 스텝업 패키지 6",
        price: 29500,
        releasedApostle: "잉클",
        contents: {"p_elif":300,"f_elif":600,"t_apostle":45,"spec_ticket":1,"crayon_highest":3,"scandy":300}
    },
    {
        id: "[잉클] 스텝업 패키지 9",
        name: "[잉클] 스텝업 패키지 9",
        price: 49500,
        releasedApostle: "잉클",
        contents: {"p_elif":500,"f_elif":1000,"t_apostle":75,"select_ticket":1,"crayon_highest":5,"scandy":500}
    },
    {
        id: "그대의 포옹 로비 패키지",
        name: "그대의 포옹 로비 패키지",
        price: 29500,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":900,"t_apostle":10,"t_card":10,"nuru":10,"scandy":300}
    },
    {
        id: "다야 강림 패키지",
        name: "다야 강림 패키지",
        price: 99000,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"t_apostle":100,"attr_광기":3}
    },
    {
        id: "다야 퓨어샤인 패키지",
        name: "다야 퓨어샤인 패키지",
        price: 9900,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":300,"kcandy":300,"scandy":300,"thumbs":20}
    },
    {
        id: "다야의 관심 패키지",
        name: "다야의 관심 패키지",
        price: 3300,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":100,"f_elif":100,"kcandy":100,"scandy":100,"food_purple":100}
    },
    {
        id: "다야의 도움 패키지",
        name: "다야의 도움 패키지",
        price: 3300,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":100,"f_elif":100,"scandy":100,"light_box":300}
    },
    {
        id: "다야의 변신 패키지",
        name: "다야의 변신 패키지",
        price: 19800,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":600,"t_apostle":20,"thumbs":40}
    },
    {
        id: "다야의 빌런 처치 패키지",
        name: "다야의 빌런 처치 패키지",
        price: 3300,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":100,"f_elif":100,"kcandy":200,"manual":500}
    },
    {
        id: "다야의 서포트 패키지",
        name: "다야의 서포트 패키지",
        price: 9900,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":300,"crayon_highest":1,"t_apostle":5,"t_card":5,"nuru":5}
    },
    {
        id: "다야의 손편지 패키지",
        name: "다야의 손편지 패키지",
        price: 29500,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":900,"f_elif":900,"kcandy":900,"thumbs":60,"gold":150}
    },
    {
        id: "다야의 완벽 패키지",
        name: "다야의 완벽 패키지",
        price: 49500,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"t_apostle":50,"kcandy":500,"scandy":500}
    },
    {
        id: "다야의 크레파스 패키지",
        name: "다야의 크레파스 패키지",
        price: 49500,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":1500,"crayon_high":20,"crayon_highest":6}
    },
    {
        id: "마법 소녀 다야 패키지",
        name: "마법 소녀 다야 패키지",
        price: 6600,
        releasedApostle: "다야(퓨어샤인)",
        contents: {"p_elif":200,"f_elif":200,"t_apostle":5,"manual":1000}
    },
    {
        id: "아멜리아(R41) 테마 극장 패스",
        name: "아멜리아(R41) 테마 극장 패스",
        price: 5500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif":170,"thumbs":50,"kcandy":800,"scandy":420}
    },
    {
        id: "아멜리아(R41)의 각오 패키지",
        name: "아멜리아(R41)의 각오 패키지",
        price: 49500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif":1500,"crayon_highest":6,"adv_ticket":1}
    },
    {
        id: "아멜리아(R41)의 결심 패키지",
        name: "아멜리아(R41)의 결심 패키지",
        price: 49500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif":1500,"f_elif":1500,"kcandy":1000,"scandy":500,"cert":400}
    },
    {
        id: "아멜리아(R41)의 기쁨 패키지",
        name: "아멜리아(R41)의 기쁨 패키지",
        price: 3300,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif":100,"kcandy":200,"food_blue":5,"nuru":3,"manual":800}
    },
    {
        id: "아멜리아(R41)의 선포 패키지",
        name: "아멜리아(R41)의 선포 패키지",
        price: 3300,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif":100,"scandy":100,"light_box":200,"food_blue":5,"nuru":3}
    },
    {
        id: "아멜리아(R41)의 완벽 패키지",
        name: "아멜리아(R41)의 완벽 패키지",
        price: 99000,
        releasedApostle: "아멜리아(R41)",
        contents: {"attr_우울":3,"t_apostle":100}
    },
    {
        id: "아멜리아(R41)의 카리스마 패키지",
        name: "아멜리아(R41)의 카리스마 패키지",
        price: 19800,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif":600,"thumbs":40,"kcandy":600,"scandy":600,"gold":120}
    },
    {
        id: "아멜리아(R41)의 희열 패키지",
        name: "아멜리아(R41)의 희열 패키지",
        price: 9900,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif":300,"t_apostle":10,"t_card":10}
    },
    {
        id: "영원한 꿈 이드 패키지",
        name: "영원한 꿈 이드 패키지",
        price: 99000,
        releasedApostle: "잉클",
        contents: {"p_elif":3000,"cert":800,"attr_냉정":3}
    },
    {
        id: "잉크의 정령 잉클 패키지",
        name: "잉크의 정령 잉클 패키지",
        price: 99000,
        releasedApostle: "잉클",
        contents: {"t_apostle":100,"crayon_highest":10}
    },
    {
        id: "잉클의 기품 패키지",
        name: "잉클의 기품 패키지",
        price: 9900,
        releasedApostle: "잉클",
        contents: {"p_elif":300,"t_apostle":10,"t_card":10}
    },
    {
        id: "잉클의 독서 패키지",
        name: "잉클의 독서 패키지",
        price: 49500,
        releasedApostle: "잉클",
        contents: {"p_elif":1500,"f_elif":1500,"thumbs":100,"cert":400}
    },
    {
        id: "잉클의 명상 패키지",
        name: "잉클의 명상 패키지",
        price: 29500,
        releasedApostle: "잉클",
        contents: {"p_elif":900,"f_elif":900,"crayon_highest":4}
    },
    {
        id: "잉클의 신중함 패키지",
        name: "잉클의 신중함 패키지",
        price: 19800,
        releasedApostle: "잉클",
        contents: {"p_elif":600,"t_apostle":20,"thumbs":40}
    },
    {
        id: "잉클의 인내 패키지",
        name: "잉클의 인내 패키지",
        price: 3300,
        releasedApostle: "잉클",
        contents: {"p_elif":100,"thumbs":10,"scandy":100,"food_blue":10,"food_purple":3}
    },
    {
        id: "잉클의 절제 패키지",
        name: "잉클의 절제 패키지",
        price: 3300,
        releasedApostle: "잉클",
        contents: {"p_elif":100,"kcandy":200,"thumbs":10,"deco_box":10}
    },
    {
        id: "잉클의 조화 패키지",
        name: "잉클의 조화 패키지",
        price: 3300,
        releasedApostle: "잉클",
        contents: {"p_elif":100,"kcandy":100,"scandy":100,"light_box":300,"manual":500}
    },
    {
        id: "잉클의 추억 패키지",
        name: "잉클의 추억 패키지",
        price: 49500,
        releasedApostle: "잉클",
        contents: {"gold":300,"t_apostle":50}
    },
    {
        id: "잉클의 헌신 패키지",
        name: "잉클의 헌신 패키지",
        price: 6600,
        releasedApostle: "잉클",
        contents: {"p_elif":200,"f_elif":200,"t_apostle":5,"nuru":5}
    },
{
    id: "언제나 든든한 내 편 로비 패키지",
    name: "언제나 든든한 내 편 로비 패키지",
    price: 29500,
    releasedApostle: "아멜리아(R41)",
    contents: {"p_elif": 900, "f_elif": 900, "t_apostle": 10, "nuru": 10, "scandy": 300}
},
{
    id: "아멜리아(R41)의 마음가짐 패키지",
    name: "아멜리아(R41)의 마음가짐 패키지",
    price: 3300,
    releasedApostle: "아멜리아(R41)",
    contents: {"p_elif": 100, "f_elif": 100, "kcandy": 100, "scandy": 100, "food_blue": 20}
    },
    {
    id: "아멜리아(R41)의 깨달음 패키지",
    name: "아멜리아(R41)의 깨달음 패키지",
    price: 6600,
    releasedApostle: "아멜리아(R41)",
    contents: {"p_elif": 200, "f_elif": 200, "t_apostle": 5, "nuru": 5}
    },
    {
    id: "아멜리아(R41)의 성찰 패키지",
    name: "아멜리아(R41)의 성찰 패키지",
    price: 9900,
    releasedApostle: "아멜리아(R41)",
    contents: {"p_elif": 300, "f_elif": 300, "kcandy": 300, "thumbs": 20, "manual": 2000}
    },
    {
        id: "정령산의 수문장 나이아 패키지",
        name: "정령산의 수문장 나이아 패키지",
        price: 29500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif": 900, "f_elif": 900, "cert": 300, "kcandy": 500, "attr_순수": 1}
    },
    {
        id: "힘의 마녀 벨벳 패키지",
        name: "힘의 마녀 벨벳 패키지",
        price: 29500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif": 900, "f_elif": 900, "cert": 300, "kcandy": 500, "attr_냉정": 1}
    },
    {
        id: "자수정의 용족 시스트 패키지",
        name: "자수정의 용족 시스트 패키지",
        price: 29500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif": 900, "f_elif": 900, "cert": 300, "kcandy": 500, "attr_광기": 1}
    },
    {
        id: "사료스탕스 책략관 루포 패키지",
        name: "사료스탕스 책략관 루포 패키지",
        price: 29500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif": 900, "f_elif": 900, "cert": 300, "kcandy": 500, "attr_활발": 1}
    },
    {
        id: "푸른 장미의 기적 블랑셰 패키지",
        name: "푸른 장미의 기적 블랑셰 패키지",
        price: 29500,
        releasedApostle: "아멜리아(R41)",
        contents: {"p_elif": 900, "f_elif": 900, "cert": 300, "kcandy": 500, "attr_우울": 1}
    },
    {
    id: "아멜리아(R41)의 기억 패키지",
    name: "아멜리아(R41)의 기억 패키지",
    price: 49500,
    releasedApostle: "아멜리아(R41)",
    contents: {"p_elif": 1500, "f_elif": 1500, "select_ticket": 1, "thumbs": 100}
    },
    {
    id: "아멜리아(R41)의 전설 카드 선택권 패키지",
    name: "아멜리아(R41)의 전설 카드 선택권 패키지",
    price: 49500,
    releasedApostle: "아멜리아(R41)",
    contents: {"p_elif": 1500, "t_card": 50, "l_spell_box": 1, "l_arti_box": 1}
    }

];




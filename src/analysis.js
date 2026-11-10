
    // 화면 전환: 한 번에 한 화면만 보여줌
    const SCREENS = ["intro", "menu", "soon", "law", "koicd", "pubmed", "yakgwan", "cardnews", "fss"];
    const TITLES = { intro: "장손이 · 장기손해사정의 똑똑한 AI 파트너", menu: "장기 손해사정 메뉴", soon: "준비 중", law: "장기 손해사정 판례", koicd: "한국표준질병사인분류(KCD)", pubmed: "의학 논문", yakgwan: "약관", cardnews: "카드뉴스 만들기", fss: "금융감독원 분쟁조정정보" };

    // 분쟁조정: 검색창 (renderFssResult는 분쟁조정 데이터 부분에 있음)
    document.getElementById("fss-form").addEventListener("submit", e => {
      e.preventDefault();
      runFssSearch(document.getElementById("fss-query").value, null);
    });

    // 카드뉴스 양식: 탭 3개(면책안내·고지의무 위반·통지의무 위반) × 세부 유형
    // 한 장에 한 내용 (hookEm은 점 강조할 글자, items는 [이름표, 값], link는 카드 아래 원문 링크)
    // 약관 조항은 표준약관 질병·상해보험(손해보험 회사용) 기준, 판례·분쟁조정은 앞서 확인한 실제 사례
    // '(직접 입력)'은 사고마다 담당자가 채울 칸
    const FSS_LINK = id => ({ label: "분쟁조정사례 보기 (금융감독원)", url: "https://www.fss.or.kr/fss/job/fncCnflCase/view.do?menuNo=201195&caseSlno=" + id });
    const LAW_LINK = q => ({ label: "판례 보기 (국가법령정보센터)", url: "https://www.law.go.kr/precSc.do?menuId=7&query=" + encodeURIComponent(q) });
    const PUBMED_LINK = { label: "논문 찾기 (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/" };
    // 카드 문구는 고객에게 보내는 공식 안내 말투(합니다체)로 씀
    const CN_PAPER_CARD = { hookEm: "의학", hookSub: "적 소견", title: "의학논문",
      items: [["논문 제목 · 출처", "(직접 입력)"], ["핵심 내용", "(직접 입력)"]], link: PUBMED_LINK };
    // ----- 고지의무·통지의무: 고객에게 보내는 안내용 완성 예시 -----
    // 사고 내용은 설명을 위한 예시이고, 약관 조항(표준약관 질병·상해보험)과 판례·분쟁조정사례는 실제 원문 기준
    // 조항 번호는 손해보험 질병·상해 표준약관 기준 (제13조 계약 전 알릴 의무 · 제14조 계약 후 알릴 의무 ·
    // 제15조 알릴 의무 위반의 효과 · 제17조 보험계약의 성립). 상품 약관은 번호가 다를 수 있음
    // 모든 탭 공통 이야기 순서: 결과 먼저(사과와 함께) → 약속 → 확인된 내용 → 비교 그림 → 사례 → 다시 살펴볼 방법 → 권리 → 마무리
    const cnResult = (lead, reason, third) => ({ kind: "result", hookEm: "결과", hookSub: "부터 말씀드립니다", title: "심사 결과",
      items: [["심사 결과", lead], ["한 줄 이유", reason], third] });
    const CN_DISCLOSE_INTRO = { kind: "intro", hookEm: "가입할 때", hookSub: " 지키는 약속", title: "계약 전 알릴 의무",
      items: [["약관 조항", "계약 전 알릴 의무 (표준약관 제13조)"],
        ["쉽게 말씀드리면", "청약서 질문에 알고 계신 사실을 그대로 알려 주시는 약속입니다"],
        ["왜 중요할까요", "알려 주신 내용으로 가입 여부와 보험료를 정하기 때문입니다"]] };
    // 판례: 국가법령정보센터 원문으로 확인한 대법원 판결 (자동 채우기로 다른 판례가 들어올 수 있어 제목은 중립적으로)
    const CN_DISCLOSE_LAW_CAUSE = { kind: "law", hookEm: "비슷한 판례", hookSub: "에서는", title: "판례",
      items: [["사건번호 · 선고일", "대법원 2024다272941 · 2025.01.09"], ["판결 요지", "사고에 영향을 미쳤을 가능성이 조금이라도 있으면 지급을 거절할 수 있습니다"]],
      link: LAW_LINK("2024다272941") };
    const CN_DISCLOSE_LAW_GROSS = { kind: "law", hookEm: "비슷한 판례", hookSub: "에서는", title: "판례",
      items: [["사건번호 · 선고일", "대법원 2018다281241 · 2019.04.23"], ["판결 요지", "병명을 몰랐더라도 신체의 심각한 이상을 알고 숨겼다면 중대한 과실입니다"]],
      link: LAW_LINK("2018다281241") };
    // 해지 안내에 꼭 들어가야 하는 문구 (표준약관 제15조④): "반대증거가 있는 경우 이의를 제기할 수 있습니다"
    // paid: 이미 보험금을 지급하는 유형(계약변경)은 '영향이 없다면' 줄을 뺌
    const cnDiscloseGuide = (extra, paid) => ({ kind: "guide", hookEm: "다시", hookSub: " 살펴보겠습니다", title: "고객 안내",
      items: [["이의 제기 (제15조④)", "반대증거가 있는 경우 이의를 제기할 수 있습니다"],
        ...(paid ? [] : [["영향이 없다면", "이번 사고와 관계가 없으면 보험금은 지급됩니다 (제15조⑥)"]]),
        ...(extra ? [extra] : [])] });
    const CN_NOTIFY_INTRO = { kind: "intro", hookEm: "가입 후", hookSub: " 지키는 약속", title: "계약 후 알릴 의무",
      items: [["약관 조항", "상해보험계약 후 알릴 의무 (표준약관 제14조)"],
        ["쉽게 말씀드리면", "직업·운전·이륜차 사용이 바뀌면 알려 주시는 약속입니다"],
        ["왜 중요할까요", "하시는 일에 따라 사고 위험과 보험료가 달라지기 때문입니다"]] };
    // 제3 의료기관 판정 (표준약관 보험금 지급에 관한 세부규정): 종합병원 소속 전문의, 비용은 회사 전액 부담
    const CN_THIRD_OPINION = ["의견이 다른 경우", "종합병원 전문의 판정에 따를 수 있습니다 (비용 회사 부담)"];
    // 모든 유형에 들어가는 고객 권리 장: 손해사정서 교부(보험업법 제185조③·제189조①), 손해사정사 선임(제185조②)
    const CN_RIGHTS_CARD = { kind: "rights", title: "고객 권리", hookEm: "고객님", hookSub: "의 권리",
      items: [["손해사정서", "손해사정서를 받으실 수 있습니다"],
        ["손해사정사 선임", "기준 충족 시 선임 가능합니다"]] };

    const CN_SETS = {
      exempt: { label: "면책안내", subs: {
        // 설명하고 납득시키는 순서: 결론 먼저(사과와 함께) → 보험의 약속 → 한눈에 보는 그림(날짜·비교) →
        // 비슷한 사례 → 다시 살펴볼 방법 → 고객 권리 → 건강을 응원하는 마무리
        // 장 종류(kind)로 자동 채우기가 맞는 장을 찾음
        "가입전진단": [
          { kind: "result", hookEm: "결과", hookSub: "부터 말씀드립니다", title: "심사 결과",
            items: [["심사 결과", "보험금 지급이 어렵게 되었습니다"],
              ["한 줄 이유", "가입 전 진단된 질병이기 때문입니다"],
              ["양해 말씀", "기대하신 결과를 드리지 못해 죄송합니다"]] },
          { kind: "yak", hookEm: "이 보험", hookSub: "이 약속드린 것", title: "보험의 약속",
            items: [["청구하신 담보", "(직접 입력)"], ["보장 약속", "보험기간 중 처음 진단이 확정된 질병을 보장합니다 (제3조)"],
              ["쉽게 말씀드리면", "가입 전에 이미 진단받은 질병은 약속 범위에 들어가지 않습니다"]] },
          // 날짜를 그림으로: 진단이 보장 시작보다 앞섰다는 걸 한눈에
          { kind: "timeline", layout: "timeline", hookEm: "한눈에", hookSub: " 보는 날짜", title: "날짜 확인",
            tags: ["보장 시작 전", "보장 시작", ""],
            items: [["진단 확정일", "(직접 입력)"], ["보험 가입일", "(직접 입력)"], ["보험금 청구일", "(직접 입력)"]] },
          // 약속과 고객님의 경우를 나란히: 어느 조건이 맞지 않았는지
          { kind: "compare", layout: "compare", hookEm: "어떤 점", hookSub: "이 달랐을까요?", title: "비교",
            cols: ["보험의 약속", "고객님의 경우"],
            items: [["진단 시점", "가입 후 진단", "가입 전 진단", "✕"], ["보장 범위", "새로 생긴 질병", "가입 전부터 있던 질병", "✕"]] },
          { kind: "fss", hookEm: "비슷한 사례", hookSub: "에서는", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2025.06.25"], ["판단 내용", "진단 확정 시점이 보장 기간 밖이면 보험금이 지급되지 않습니다"]],
            link: FSS_LINK(113) },
          { kind: "guide", hookEm: "다시", hookSub: " 살펴보겠습니다", title: "고객 안내",
            items: [["다른 자료가 있으시면", "가입 후 처음 진단받으셨다는 자료를 보내 주시면 다시 검토하겠습니다"], CN_THIRD_OPINION] }
        ],
        "진단부적정": [
          { kind: "result", hookEm: "결과", hookSub: "부터 말씀드립니다", title: "심사 결과",
            items: [["심사 결과", "보험금 지급이 어렵게 되었습니다"],
              ["한 줄 이유", "약관이 정한 확정 검사가 없었습니다"],
              ["양해 말씀", "기대하신 결과를 드리지 못해 죄송합니다"]] },
          { kind: "yak", hookEm: "이 보험", hookSub: "이 약속드린 것", title: "보험의 약속",
            items: [["청구하신 담보", "(직접 입력)"], ["보장 약속", "정해진 검사로 진단이 확정된 질병을 보장합니다 (제3조)"],
              ["쉽게 말씀드리면", "의사 소견과 함께 확정 검사 결과가 있어야 보장됩니다"]] },
          { kind: "compare", layout: "compare", hookEm: "어떤 점", hookSub: "이 달랐을까요?", title: "비교",
            cols: ["보험의 약속", "고객님의 경우"],
            items: [["진단 방법", "확정 검사로 진단", "선별검사만 시행", "✕"], ["검사 결과", "질병이 확인됨", "확정 소견 없음", "✕"]] },
          { kind: "paper", hookEm: "의학적", hookSub: " 기준은", title: "의학논문",
            items: [["논문 제목 · 출처", "(직접 입력)"], ["핵심 내용", "(직접 입력)"]], link: PUBMED_LINK },
          { kind: "fss", hookEm: "비슷한 사례", hookSub: "에서는", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2024.07.11"], ["판단 내용", "객관적 검사가 부족하면 진단만으로 판단할 수 없습니다"]],
            link: FSS_LINK(54) },
          { kind: "guide", hookEm: "다시", hookSub: " 살펴보겠습니다", title: "고객 안내",
            items: [["확정 검사를 받으셨다면", "결과지를 보내 주시면 바로 다시 검토하겠습니다"], CN_THIRD_OPINION,
              ["의료자문", "자문 결과는 요청 시 설명드립니다"]] }
        ]
      } },
      disclose: { label: "고지의무 위반", subs: {
        // 예시: 고혈압 투약을 알리지 않고 가입 → 뇌출혈 진단비 청구
        // 해지 안내 필수 요소: 위반 사실(확인된 내용 장) + 중요한 사항인 이유(비교 장 아래 글씨) + 반대증거 문구(다시 살펴보겠습니다 장)
        "면책": [
          cnResult("보험금 지급이 어렵고, 계약이 해지됩니다", "가입 때 알려 주셔야 할 병력이 빠져 있었습니다",
            ["양해 말씀", "기대하신 결과를 드리지 못해 죄송합니다"]),
          CN_DISCLOSE_INTRO,
          { kind: "check", hookEm: "확인된", hookSub: " 내용", title: "확인 내용",
            items: [["청약서 질문", "5년 내 고혈압 진단·투약 여부"], ["확인된 사실", "가입 1년 전부터 고혈압약 복용"], ["청구 내용", "뇌출혈 진단비"]] },
          { kind: "compare", layout: "compare", hookEm: "어떤 점", hookSub: "이 달랐을까요?", title: "비교",
            cols: ["알려 주신 내용", "확인된 기록"],
            items: [["고혈압 투약", "없음", "가입 1년 전부터 복용", "✕"], ["이번 청구와 관계", "—", "뇌출혈에 영향", "✕"]],
            note: "회사가 알았다면 가입 거절 또는 조건부 인수를 했을 중요한 사항입니다." },
          CN_DISCLOSE_LAW_CAUSE,
          { kind: "fss", hookEm: "비슷한 사례", hookSub: "에서는", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2026.01.09"], ["판단 내용", "설계사에게만 알리면 고지가 아닙니다 (고지 방해 시 해지 불가)"]],
            link: FSS_LINK(148) },
          cnDiscloseGuide()
        ],
        // 예시: 건강검진 위 재검 소견을 알리지 않고 가입 → 교통사고 골절 수술비 청구
        "해지": [
          cnResult("보험금은 지급되고, 계약은 해지됩니다", "가입 때 알려 주셔야 할 검진 소견이 빠져 있었습니다",
            ["양해 말씀", "불편을 드려 죄송합니다"]),
          CN_DISCLOSE_INTRO,
          { kind: "check", hookEm: "확인된", hookSub: " 내용", title: "확인 내용",
            items: [["청약서 질문", "3개월 내 건강검진 이상 소견 여부"], ["확인된 사실", "가입 2개월 전 위 재검 소견"], ["청구 내용", "교통사고 골절 수술비"]] },
          { kind: "compare", layout: "compare", hookEm: "어떤 점", hookSub: "이 달랐을까요?", title: "비교",
            cols: ["알려 주신 내용", "확인된 기록"],
            items: [["검진 이상 소견", "없음", "위 재검 소견", "✕"], ["이번 사고와 관계", "—", "관계없음", "○"]],
            note: "사고와 관계가 없어 보험금은 지급되지만, 중요한 사항이라 계약은 해지됩니다." },
          CN_DISCLOSE_LAW_GROSS,
          { kind: "fss", hookEm: "비슷한 사례", hookSub: "에서는", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2024.07.05"], ["판단 내용", "가입 전 3개월 내 건강검진 이상 소견도 알려야 할 사항으로, 해지는 정당합니다"]],
            link: FSS_LINK(9) },
          cnDiscloseGuide(["해지 시", "해약환급금을 지급합니다"])
        ],
        // 예시: 허리디스크 입원을 알리지 않고 가입 → 발목 골절 수술비 청구, 해지 대신 조건 변경으로 유지
        "계약변경": [
          cnResult("보험금은 지급되고, 조건을 바꿔 계약을 유지합니다", "가입 때 알려 주셔야 할 입원 이력이 빠져 있었습니다",
            ["함께 정할 일", "동의하시면 허리 부담보 조건으로 계속 보장합니다"]),
          CN_DISCLOSE_INTRO,
          { kind: "check", hookEm: "확인된", hookSub: " 내용", title: "확인 내용",
            items: [["청약서 질문", "5년 내 입원·수술 여부"], ["확인된 사실", "가입 3년 전 허리디스크로 입원"], ["청구 내용", "발목 골절 수술비"]] },
          { kind: "compare", layout: "compare", hookEm: "어떤 점", hookSub: "이 달랐을까요?", title: "비교",
            cols: ["알려 주신 내용", "확인된 기록"],
            items: [["5년 내 입원·수술", "없음", "허리디스크 입원", "✕"], ["이번 사고와 관계", "—", "관계없음", "○"]],
            note: "동의하지 않으시면 계약이 해지될 수 있습니다 (해지 제한 사유는 같습니다)." },
          CN_DISCLOSE_LAW_GROSS,
          { kind: "fss", hookEm: "비슷한 사례", hookSub: "에서는", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2026.01.09"], ["판단 내용", "부담보 질병을 5년 안에 다시 치료했다면 부담보가 해제되지 않습니다"]],
            link: FSS_LINK(154) },
          cnDiscloseGuide(["부담보 해제", "5년간 그 질병으로 추가 진단·치료가 없으면 보장됩니다 (제17조)"], true)
        ]
      } },
      notify: { label: "통지의무 위반", subs: {
        // 예시: 사무직으로 가입 후 택배 배송기사로 바뀌었는데 알리지 않음 → 배송 중 사고
        "비례보상": [
          cnResult("보험금 일부만 지급됩니다", "바뀐 직업을 알려 주시지 않았기 때문입니다",
            ["양해 말씀", "기대하신 결과를 드리지 못해 죄송합니다"]),
          CN_NOTIFY_INTRO,
          { kind: "job", hookEm: "확인된", hookSub: " 내용", title: "직업 확인",
            items: [["가입 시 알린 직업", "사무직"], ["사고 당시 직업", "택배 배송기사 (화물차 운전)"], ["사고 내용", "배송 중 교통사고로 골절"]] },
          { kind: "compare", layout: "compare", hookEm: "어떤 점", hookSub: "이 달랐을까요?", title: "비교",
            cols: ["가입 때 직업", "사고 당시 직업"],
            items: [["하시는 일", "사무직", "택배 배송기사", "✕"], ["보험료 기준", "사무직 요율", "배송기사 요율", "✕"]] },
          { kind: "calc", hookEm: "어떻게", hookSub: " 계산했나요?", title: "계산 방법",
            items: [["계산 방법", "변경 전 요율 ÷ 변경 후 요율 (제14조④⑤)"], ["이번 계산", "(직접 입력)"], ["참고", "직업과 무관한 사고는 전액 지급됩니다"]] },
          { kind: "fss", hookEm: "비슷한 사례", hookSub: "에서는", title: "분쟁조정사례",
            items: [["사례 · 등록일", "금융감독원 분쟁조정사례 · 2024.07.11"], ["판단 내용", "학생이라도 위험한 업무에 취업했다면 알려야 하며, 삭감 지급은 정당합니다"]],
            link: FSS_LINK(39) },
          { kind: "guide", hookEm: "알려 주시는", hookSub: " 방법", title: "고객 안내",
            items: [["알리는 방법", "우편·전화·방문으로 지체 없이 (제14조①)"], ["알려 주시면", "보험료를 조정해 계속 보장해 드립니다"]] }
        ],
        // 예시: 사무직 → 택배 배송기사로 바뀌어 고객이 직접 알림
        "직업변경 요청": [
          cnResult("계약 내용이 변경됩니다", "변경된 직업 기준으로 계속 보장해 드립니다",
            ["감사 말씀", "직업 변경을 알려 주셔서 감사합니다"]),
          CN_NOTIFY_INTRO,
          { kind: "job", hookEm: "확인된", hookSub: " 내용", title: "직업 확인",
            items: [["가입 시 알린 직업", "사무직"], ["변경된 직업", "택배 배송기사 (화물차 운전)"], ["요청 내용", "직업 변경 통지 · 계약 변경"]] },
          { kind: "calc", hookEm: "보험료", hookSub: "는 이렇게 바뀝니다", title: "보험료 안내",
            items: [["보험료", "위험이 증가하여 보험료가 인상됩니다"], ["추가 보험료", "안내드린 금액을 납입해 주시기 바랍니다 (제14조③)"],
              ["미납 시", "사고 시 보험금이 삭감될 수 있습니다 (제14조④)"]] },
          { kind: "law", hookEm: "비슷한 판례", hookSub: "에서는", title: "판례",
            items: [["사건번호 · 선고일", "대법원 2022다238633 · 2024.11.28"], ["판결 요지", "설계사에게 직업 변경을 알렸고 회사가 기록했다면 통지한 것으로 봅니다"]],
            link: LAW_LINK("2022다238633") }
        ]
      } }
    };
    // 장마다 종류 이름표(kind)를 달아 둠: 자동 채우기는 장 순서가 아니라 종류로 찾음
    // (장 순서를 바꾸거나 새 장을 넣어도 자동 채우기가 맞는 장에 들어가게)
    const CN_KIND_BY_TITLE = {
      "약관 내용": "yak", "검토결과": "result", "처리 결과": "result", "질병코드 확인": "kcd",
      "판례": "law", "의학논문": "paper", "분쟁조정사례": "fss", "고객 안내": "guide",
      "계약 전 알릴 의무": "intro", "계약 후 알릴 의무": "intro", "확인 내용": "check", "직업 확인": "job",
      "고객 권리": "rights"
    };
    Object.values(CN_SETS).forEach(set => Object.values(set.subs).forEach(cards => cards.forEach(c => {
      c.kind = c.kind || CN_KIND_BY_TITLE[c.title] || "";
    })));
    // 표지·문의처 장: 모든 유형의 처음과 끝에 기본으로 들어감 (빼거나 옮길 수 있음)
    const cnToday = () => {
      const d = new Date();
      return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
    };
    // 표지: 제목 + 고객님께 드리는 첫인사 (치료 중인 고객님의 마음을 먼저 헤아림)
    const CN_COVER_HOOK = {
      exempt: ["보험금 심사 결과", "알기 쉽게 설명드립니다", "치료로 힘드신 가운데 기다려 주셔서 감사합니다"],
      disclose: ["계약 전 알릴 의무", "알기 쉽게 설명드립니다", "치료로 힘드신 가운데 기다려 주셔서 감사합니다"],
      notify: ["계약 후 알릴 의무", "알기 쉽게 설명드립니다", "늘 고객님의 건강과 안전을 먼저 생각하겠습니다"]
    };
    const cnCoverCard = tab => ({ kind: "cover", layout: "cover", title: "표지",
      hookEm: CN_COVER_HOOK[tab][0], hookSub: CN_COVER_HOOK[tab][1],
      items: [["받으시는 분", "(직접 입력) 고객님"], ["안내일", cnToday()], ["드리는 말씀", CN_COVER_HOOK[tab][2]]] });
    // 마무리: 결과와 관계없이 고객님의 회복을 바라는 마음 + 담당자 연락처 (따뜻한 바탕)
    // 카드뉴스는 보조 자료라 정식 통지는 서면(또는 동의받은 전자문서)으로 따로 (표준약관 제15조④) → 맨 아래 작은 글씨
    const CN_CONTACT_CARD = { kind: "contact", title: "문의처", hookEm: "쾌유", hookSub: "를 기원합니다",
      items: [["담당자", "(직접 입력)"], ["연락처 (평일 09:00~18:00)", "(직접 입력)"],
        ["드리는 말씀", "결과와 관계없이 하루빨리 건강을 회복하시길 진심으로 바랍니다"]],
      note: "본 자료는 이해를 돕기 위한 요약본이며, 정식 안내는 서면으로 드립니다." };
    const CN_BLANK_CARD = { kind: "", title: "새 장", hookEm: "제목", hookSub: "을 입력해 주십시오",
      items: [["이름표", "(직접 입력)"], ["이름표", "(직접 입력)"]] };
    // 유형의 처음 양식: 표지 + 그 유형의 장들 + 고객 권리 + 문의처
    const cnTemplate = (tab, sub) => [cnCoverCard(tab), ...CN_SETS[tab].subs[sub], CN_RIGHTS_CARD, CN_CONTACT_CARD];

    let cnTab = "exempt";
    let cnSub = "가입전진단";
    let CARD_NEWS = cnTemplate(cnTab, cnSub);

    // 탭·세부 유형 버튼 만들기
    function renderCnTabs() {
      const tabs = document.getElementById("cn-tabs");
      const subs = document.getElementById("cn-subs");
      tabs.innerHTML = ""; subs.innerHTML = "";
      Object.entries(CN_SETS).forEach(([key, set]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "tab" + (key === cnTab ? " active" : "");
        b.textContent = set.label;
        // 탭을 다시 열면 그 탭에서 마지막으로 본 세부 유형으로
        b.addEventListener("click", () => switchCardNews(key, cnSubFor(key)));
        tabs.appendChild(b);
      });
      Object.keys(CN_SETS[cnTab].subs).forEach(sub => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "filter" + (sub === cnSub ? " active" : "");
        b.textContent = sub;
        b.addEventListener("click", () => switchCardNews(cnTab, sub));
        subs.appendChild(b);
      });
      document.getElementById("cn-save-all").textContent = cnSaveAllLabel();
    }
    const cnLastSub = {};
    let lastExemptSub = cnSub;
    // 탭을 다시 열 때 보여 줄 세부 유형: 이 사건에서 마지막으로 본 것 → 없으면 첫 유형
    function cnSubFor(tab) {
      const subs = CN_SETS[tab].subs;
      const s = ((cnCases[cnCaseId] || {}).lastSub || {})[tab] || cnLastSub[tab];
      return subs[s] ? s : Object.keys(subs)[0];
    }
    function switchCardNews(tab, sub) {
      cnFlushSave();
      cnTab = tab; cnSub = sub;
      cnLastSub[tab] = sub;
      if (tab === "exempt") lastExemptSub = sub;
      cnLoadLayout();
      // 사건마다 마지막으로 본 탭·세부 유형을 기억 (사건을 다시 열면 그 화면으로)
      const rec = cnCases[cnCaseId];
      if (rec && (rec.tab !== tab || rec.sub !== sub || (rec.lastSub || {})[tab] !== sub)) {
        rec.tab = tab; rec.sub = sub;
        rec.lastSub = Object.assign(rec.lastSub || {}, { [tab]: sub });
        cnSaveCases();
      }
      renderCnTabs();
      renderCardNews();
    }

    function renderCardNews() {
      const list = document.getElementById("cn-list");
      list.innerHTML = "";
      CARD_NEWS.forEach((c, i) => {
        const next = CARD_NEWS[i + 1];
        const card = document.createElement("article");
        // 항목이 3개인 장은 글자를 조금 줄여 칸 안에 들어가게
        card.className = "cn-card" + (c.items.length >= 3 ? " dense" : "") + (c.layout === "cover" ? " cover" : "");
        card.dataset.kind = c.kind;
        card.innerHTML =
          '<div class="cn-top">' +
            '<div class="cn-logo"><span class="h-mark">H</span>현대해상</div>' +
            '<div class="cn-meta">' +
              '<div><span class="cn-meta-label">상품명</span><span class="cn-meta-value" contenteditable="true" data-meta="product" data-placeholder="입력"></span></div>' +
              '<div><span class="cn-meta-label">계약번호</span><span class="cn-meta-value" contenteditable="true" data-meta="contract" data-placeholder="입력"></span></div>' +
              '<div><span class="cn-meta-label">사고번호</span><span class="cn-meta-value" contenteditable="true" data-meta="claim" data-placeholder="입력"></span></div>' +
            '</div>' +
          '</div>' +
          '<div class="cn-board">' +
            '<div class="cn-paper">' +
              '<div class="cn-hook"><em contenteditable="true"></em><span class="sub" contenteditable="true"></span></div>' +
              '<div class="cn-items"></div>' +
            '</div>' +
          '</div>' +
          // 아래 띠는 장 순서로 자동 ('다음 장: …'), 장을 옮겨도 맞게
          '<div class="cn-bottom"></div>';

        // 글자는 textContent로 넣어 그대로 표시
        card.querySelector(".cn-hook em").textContent = c.hookEm;
        card.querySelector(".cn-bottom").textContent = next ? "다음 장: " + next.title + " ›" : "처음부터 다시 보기 ›";
        card.querySelector(".cn-hook .sub").textContent = c.hookSub;

        const itemsEl = card.querySelector(".cn-items");
        // 항목 표시는 ✓ 대신 1·2·3 번호 (✓는 '문제없음'으로 읽혀 부지급·해지 안내와 어긋남)
        // 결과 장(kind result)의 첫 줄은 결론이라 번호 없이 진한 띠로 강조
        if (c.layout === "compare") cnRenderCompare(itemsEl, c);
        else if (c.layout === "timeline") cnRenderTimeline(itemsEl, c);
        else {
          let no = 0;
          c.items.forEach(([head, desc], k) => {
            const lead = c.kind === "result" && k === 0;
            const row = document.createElement("div");
            row.className = "cn-item" + (lead ? " lead" : "");
            // 안내·권리·문의 같은 항목은 이름표에 맞는 선 아이콘, 그 밖은 1·2·3 번호
            const ico = lead ? "" : cnIconFor(head);
            if (!lead) no++;
            row.innerHTML = (lead ? "" : ico ? '<span class="cn-ico">' + ico + '</span>' : '<span class="cn-check">' + no + '</span>') +
              '<div class="cn-item-text"><b contenteditable="true"></b><span contenteditable="true"></span></div>';
            row.querySelector("b").textContent = head;
            row.querySelector(".cn-item-text span").textContent = desc;
            itemsEl.appendChild(row);
          });
        }
        // 맨 아래 작은 안내 글씨 (예: 문의처 장의 '요약본' 안내)
        if (c.note) {
          const note = document.createElement("p");
          note.className = "cn-note";
          note.textContent = c.note;
          card.querySelector(".cn-paper").appendChild(note);
        }

        // 카드 아래에 '이 장 저장' 버튼
        const wrap = document.createElement("div");
        wrap.className = "cn-wrap";
        const btn = document.createElement("button");
        btn.className = "cn-btn";
        btn.type = "button";
        btn.textContent = (i + 1) + "장 이미지(PNG)로 저장";
        btn.addEventListener("click", () => requestSaveCards([card], "card" + i));

        // 카드 아래 줄: 왼쪽은 원문 링크(판례·논문·분쟁조정), 오른쪽은 저장 버튼
        const foot = document.createElement("div");
        foot.className = "cn-foot";
        const linkBox = document.createElement("div");
        linkBox.className = "cn-link";
        if (c.link) {
          const a = document.createElement("a");
          a.target = "_blank";
          a.rel = "noopener";
          a.href = c.link.url;
          a.textContent = "🔗 " + c.link.label;
          const input = document.createElement("input");
          input.className = "cn-link-url";
          input.type = "url";
          input.value = c.link.url;
          input.setAttribute("aria-label", c.title + " 링크 주소");
          input.title = "다른 자료로 바꾸려면 주소를 붙여넣으세요";
          input.addEventListener("input", () => { a.href = input.value.trim() || c.link.url; });
          linkBox.appendChild(a);
          linkBox.appendChild(input);
        }
        // 장 옮기기·빼기 + 저장 버튼
        const acts = document.createElement("div");
        acts.className = "cn-acts";
        const mk = (label, title, fn, disabled) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "cn-btn cn-mini"; b.textContent = label; b.title = title;
          b.setAttribute("aria-label", (i + 1) + "장 " + title);
          b.disabled = !!disabled;
          b.addEventListener("click", () => fn(b));
          acts.appendChild(b);
        };
        mk("↑", "앞으로 옮기기", () => cnMoveCard(i, i - 1), i === 0);
        mk("↓", "뒤로 옮기기", () => cnMoveCard(i, i + 1), i === CARD_NEWS.length - 1);
        mk("빼기", "이 장 빼기", b => cnRemoveCard(i, b), CARD_NEWS.length <= 1);
        acts.appendChild(btn);
        foot.appendChild(linkBox);
        foot.appendChild(acts);

        // 카드 바로 아래: 빈칸·넘침 경고 (확인할 곳이 있을 때만 보임)
        const warn = document.createElement("div");
        warn.className = "cn-warn";
        warn.hidden = true;

        wrap.appendChild(card);
        wrap.appendChild(warn);
        wrap.appendChild(foot);
        list.appendChild(wrap);
      });
      loadCardNews();
      cnApplyMeta();
      cnApplyContact();
      document.querySelectorAll("#cn-list .cn-item-text > span").forEach(cnFormatValue);
      cnLintAll();
    }

    // ----- 선 아이콘 (남색 원 안에 흰 선) -----
    const CN_SVG = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
    const CN_ICONS = {
      doc: CN_SVG('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h5M10 16h5"/>'),
      note: CN_SVG('<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>'),
      search: CN_SVG('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
      people: CN_SVG('<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.4"/><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"/><path d="M15 15c2.4-.3 4.4 1 5 3.6"/>'),
      chat: CN_SVG('<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 10h8M8 13h5"/>'),
      gavel: CN_SVG('<path d="M13 4l7 7"/><path d="M10.5 6.5l7 7"/><path d="M11.8 5.2l-4.6 4.6M18.8 12.2l-4.6 4.6"/><path d="M9.6 12.4L4 18"/><path d="M3 21h9"/>'),
      phone: CN_SVG('<path d="M6.5 3h3l1.8 4.6-2.2 1.4a11 11 0 0 0 5.9 5.9l1.4-2.2L21 14.5v3A2.5 2.5 0 0 1 18.5 20 15.5 15.5 0 0 1 4 5.5 2.5 2.5 0 0 1 6.5 3z"/>'),
      idcard: CN_SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4"/><path d="M14.5 10h4M14.5 13.5h3"/>'),
      heart: CN_SVG('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
      clipboard: CN_SVG('<rect x="6" y="4.5" width="12" height="16.5" rx="2"/><path d="M9.5 3h5v3h-5z"/><path d="M9 13l2 2 4-4"/>'),
      flask: CN_SVG('<path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>')
    };
    // 이름표 → 아이콘 (맞는 게 없으면 번호)
    const CN_ICON_RULES = [
      [/논문/, "doc"], [/핵심 내용/, "note"], [/판단 내용|판결 요지/, "gavel"],
      [/확정 검사|추가 자료|다른 자료|재검토/, "search"], [/의견이 다른/, "people"], [/의료자문|이의 제기/, "chat"],
      [/손해사정서/, "doc"], [/손해사정사 선임/, "gavel"], [/담당자/, "idcard"], [/연락처|알리는 방법/, "phone"],
      [/드리는 말씀/, "heart"]
    ];
    function cnIconFor(label) {
      const rule = CN_ICON_RULES.find(([re]) => re.test(label || ""));
      return rule ? CN_ICONS[rule[1]] : "";
    }

    // ----- 한눈에 이해시키는 그림 장 -----
    // 비교 장: 2칸 표. 줄마다 [항목, 보험의 약속, 고객님의 경우, 표시(✕ 또는 ○)]
    // 왼쪽 칸은 그림 아이콘 + 약속, 오른쪽 칸은 ✕/○ + 고객님의 경우 (항목 이름은 저장용으로만 두고 화면에는 숨김)
    function cnRenderCompare(itemsEl, c) {
      itemsEl.classList.add("cmp-list");
      const head = document.createElement("div");
      head.className = "cmp-head";
      (c.cols || ["보험의 약속", "고객님의 경우"]).forEach(t => {
        const s = document.createElement("i");
        s.textContent = t;
        head.appendChild(s);
      });
      itemsEl.appendChild(head);
      const pics = [CN_ICONS.clipboard, CN_ICONS.flask, CN_ICONS.doc];
      c.items.forEach(([name, promise, you, mark], k) => {
        const row = document.createElement("div");
        row.className = "cn-item cmp";
        row.innerHTML = '<b contenteditable="true"></b>' +
          '<div class="cmp-cell promise"><i class="cmp-ico">' + pics[k % pics.length] + '</i><span contenteditable="true"></span></div>' +
          '<div class="cmp-cell you"><em class="mark" contenteditable="true"></em><span contenteditable="true"></span></div>';
        row.querySelector("b").textContent = name;
        row.querySelector(".promise span").textContent = promise;
        row.querySelector(".you span").textContent = you;
        const m = row.querySelector(".mark");
        m.textContent = mark || "✕";
        m.classList.toggle("ok", (mark || "").trim() === "○");
        itemsEl.appendChild(row);
      });
    }
    // 날짜 장: 위에서 아래로 시간 순서, 점과 선으로 이어 '보장 시작 전/후'를 보여 줌
    function cnRenderTimeline(itemsEl, c) {
      itemsEl.classList.add("tl-list");
      c.items.forEach(([label, date], k) => {
        const row = document.createElement("div");
        row.className = "cn-item tl tl-" + k;
        row.innerHTML = '<span class="tl-dot"></span><div class="cn-item-text"><b contenteditable="true"></b><span contenteditable="true"></span></div>';
        row.querySelector("b").textContent = label;
        row.querySelector(".cn-item-text span").textContent = date;
        const tag = (c.tags || [])[k];
        if (tag) {
          const t = document.createElement("i");
          t.className = "tl-tag";
          t.textContent = tag;
          row.querySelector(".cn-item-text").appendChild(t);
        }
        itemsEl.appendChild(row);
      });
    }

    // ----- 본문 줄바꿈 다듬기: 글자(textContent)는 그대로 두고 보이는 모양만 바꿈 (저장·확인에는 영향 없음) -----
    // 1) 끝의 근거 조항 괄호 "(제15조④)" "(표준약관 제13조)" → 본문 아래 작은 회색 '근거' 줄
    // 2) " · "로 나뉜 짧은 조각과 짧은 끝 괄호는 중간에서 끊기지 않게
    const CN_CITE_RE = /^([\s\S]*?\S)(\s*\(([^()]*(?:제\d+조|상법|보험업법|표준약관)[^()]*)\))\s*$/;
    function cnNoWrap(text) {
      const i = document.createElement("i");
      i.className = "cn-nw";
      i.textContent = text;
      return i;
    }
    function cnFormatValue(span) {
      const t = span.textContent;
      span.textContent = "";
      if (!t || CN_TODO.test(t)) { span.textContent = t; return; }
      const m = t.match(CN_CITE_RE);
      const main = m ? m[1] : t;
      const parts = main.split(/( · )/);
      const shortParts = parts.length > 1 && parts.every(p => p.length <= 16);
      parts.forEach(part => {
        if (part === " · ") { span.append(part); return; }
        const pm = part.match(/^([\s\S]*?)(\s*\([^()]{1,14}\))$/);
        if (shortParts) span.append(cnNoWrap(part));
        else if (pm && pm[1]) { span.append(pm[1]); span.append(cnNoWrap(pm[2])); }
        else span.append(part);
      });
      if (m) {
        // 괄호는 글자로는 남기고(저장되는 글자 그대로) 화면에서만 숨김, 앞에 '근거' 표시는 CSS로
        const cite = t.slice(m[1].length);
        const open = cite.indexOf("("), close = cite.lastIndexOf(")");
        const small = document.createElement("small");
        small.className = "cn-cite";
        const hide = s => { const h = document.createElement("i"); h.className = "cn-hide"; h.textContent = s; return h; };
        small.append(hide(cite.slice(0, open + 1)), cite.slice(open + 1, close), hide(cite.slice(close)));
        span.append(small);
      }
    }
    // 고친 칸에서 나갈 때 모양을 다시 맞춤 (입력 중에는 커서가 튀지 않게 건드리지 않음)
    document.getElementById("cn-list").addEventListener("focusout", e => {
      if (e.target.matches && e.target.matches(".cn-item-text > span")) cnFormatValue(e.target);
    });

    // ----- 장 구성(순서·추가·빼기): 사건·유형마다 { 장 양식, 글자들 }로 저장 -----
    function cnReadSaved() {
      try { return JSON.parse(localStorage.getItem(cnStorageKey())); } catch (e) { return null; }
    }
    function cnLoadLayout() {
      const data = cnReadSaved();
      if (data && Array.isArray(data.cards) && data.cards.length && data.cards.every(c => c.def && Array.isArray(c.def.items))) {
        CARD_NEWS = data.cards.map(c => c.def);
      } else if (Array.isArray(data)) {
        CARD_NEWS = CN_SETS[cnTab].subs[cnSub].slice();   // 예전 저장분: 표지·문의처 없이 저장했던 그 순서대로
      } else {
        CARD_NEWS = cnTemplate(cnTab, cnSub);
      }
    }
    // 지금 화면 내용을 먼저 저장한 뒤 장 목록을 바꾸고 다시 그림
    function cnEditLayout(fn) {
      cnFlushSave();
      saveCardNews();
      const data = cnReadSaved();
      if (!data || !Array.isArray(data.cards)) { cnStatus.textContent = "이 브라우저에서는 장 구성을 바꿀 수 없어요."; return false; }
      fn(data.cards);
      try { localStorage.setItem(cnStorageKey(), JSON.stringify(data)); } catch (e) { return false; }
      CARD_NEWS = data.cards.map(c => c.def);
      renderCnTabs();
      renderCardNews();
      return true;
    }
    function cnMoveCard(from, to) {
      if (to < 0 || to >= CARD_NEWS.length) return;
      if (cnEditLayout(cards => { const [c] = cards.splice(from, 1); cards.splice(to, 0, c); })) {
        cnStatus.textContent = (from + 1) + "장을 " + (to + 1) + "장 자리로 옮겼어요.";
        const btn = document.querySelectorAll("#cn-list .cn-wrap")[to].querySelector(to < from ? '[title="앞으로 옮기기"]' : '[title="뒤로 옮기기"]');
        if (btn && !btn.disabled) btn.focus();
      }
    }
    // 빼기는 두 번 눌러야 실행 (고친 글자도 같이 사라지므로)
    function cnRemoveCard(i, btn) {
      if (btn.dataset.armed !== "1") {
        btn.dataset.armed = "1";
        btn.textContent = "한 번 더";
        setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = ""; btn.textContent = "빼기"; } }, 3000);
        return;
      }
      const title = CARD_NEWS[i].title;
      if (cnEditLayout(cards => cards.splice(i, 1))) cnStatus.textContent = "'" + title + "' 장을 뺐어요. '장 추가'에서 다시 넣을 수 있어요.";
    }
    // 장 추가: 표지는 맨 앞, 나머지는 문의처 장 앞(없으면 맨 끝)
    function cnAddCard(def) {
      let at = CARD_NEWS.length;
      if (def.kind === "cover") at = 0;
      else if (CARD_NEWS.length && CARD_NEWS[CARD_NEWS.length - 1].kind === "contact" && def.kind !== "contact") at = CARD_NEWS.length - 1;
      if (cnEditLayout(cards => cards.splice(at, 0, { def, fields: null, url: null }))) {
        cnStatus.textContent = "'" + def.title + "' 장을 " + (at + 1) + "장에 넣었어요.";
        const wrap = document.querySelectorAll("#cn-list .cn-wrap")[at];
        if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    // 장 추가 목록: 기본(표지·문의처·빈 장) + 탭별로 쓸 수 있는 장 (같은 제목은 한 번만)
    function renderCnAddMenu() {
      const sel = document.getElementById("cn-add");
      sel.innerHTML = '<option value="">+ 장 추가</option>';
      const group = (label, entries) => {
        const g = document.createElement("optgroup");
        g.label = label;
        entries.forEach(([value, text]) => {
          const o = document.createElement("option");
          o.value = value; o.textContent = text;
          g.appendChild(o);
        });
        sel.appendChild(g);
      };
      group("기본", [["cover", "표지"], ["rights", "고객 권리 (손해사정서·선임·분쟁조정)"], ["contact", "문의처 (담당자 연락처)"], ["blank", "빈 장 (직접 쓰기)"]]);
      Object.entries(CN_SETS).forEach(([tab, set]) => {
        // 같은 제목인데 내용이 유형마다 다르면 이름 뒤에 (세부 유형)을 붙여 둘 다 보여 줌
        const variants = {};
        Object.values(set.subs).forEach(cards => cards.forEach(c => {
          (variants[c.title] = variants[c.title] || new Set()).add(JSON.stringify(c));
        }));
        const seen = new Set();
        const entries = [];
        Object.entries(set.subs).forEach(([sub, cards]) => cards.forEach((c, k) => {
          const body = JSON.stringify(c);
          if (seen.has(body)) return;
          seen.add(body);
          entries.push([tab + "|" + sub + "|" + k, variants[c.title].size > 1 ? c.title + " (" + sub + ")" : c.title]);
        }));
        group(set.label, entries);
      });
    }
    function cnDefFromMenu(value) {
      if (value === "cover") return cnCoverCard(cnTab);
      if (value === "contact") return CN_CONTACT_CARD;
      if (value === "rights") return CN_RIGHTS_CARD;
      if (value === "blank") return CN_BLANK_CARD;
      const [tab, sub, k] = value.split("|");
      return CN_SETS[tab] && CN_SETS[tab].subs[sub] ? CN_SETS[tab].subs[sub][Number(k)] : null;
    }

    // 문의처 장: 담당자·연락처는 한 번 쓰면 기억해 두었다가 새 문의처 장에 미리 채움
    const CN_CONTACT_KEY = "cardnews_contact_v1";
    function cnApplyContact() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(CN_CONTACT_KEY)); } catch (e) { saved = null; }
      if (!Array.isArray(saved)) return;
      document.querySelectorAll('#cn-list .cn-card[data-kind="contact"]').forEach(card => {
        card.querySelectorAll(".cn-item-text span").forEach((span, k) => {
          if (saved[k] && CN_TODO.test(span.textContent)) span.textContent = saved[k];
        });
      });
    }
    function cnRememberContact() {
      const card = document.querySelector('#cn-list .cn-card[data-kind="contact"]');
      if (!card) return;
      const vals = [...card.querySelectorAll(".cn-item-text span")].map(s => s.textContent.trim());
      if (vals.some(t => !t || CN_TODO.test(t))) return;
      try { localStorage.setItem(CN_CONTACT_KEY, JSON.stringify(vals)); } catch (e) {}
    }

    // ----- 확인할 곳 찾기: 안 채운 칸 · 카드 밖으로 넘친 글자 · 잘린 상품명 등 -----
    // '(직접 입력)'이나 담당자용 안내 문구가 남아 있으면 안 채운 칸으로 봄
    const CN_TODO = /\(직접 입력\)|인터넷 연결 후/;
    // 마지막 항목이 흰 종이 밖으로 나가면 넘친 것 (아래 여백까지 쓰는 건 괜찮음)
    function cnIsOver(card) {
      const paper = card.querySelector(".cn-paper");
      // 종이 안의 마지막 요소(항목 목록 또는 맨 아래 안내 글씨)까지 재서 확인
      const last = paper.lastElementChild;
      return paper.clientHeight > 0 && !!last
        && last.getBoundingClientRect().bottom > paper.getBoundingClientRect().bottom + 1;
    }
    // 글자 맞춤: 기본은 큰 글자, 넘칠 때만 그 장의 글자를 1단계 → 2단계로 줄임 (그래도 넘치면 경고)
    function cnFit(card) {
      if (!card.querySelector(".cn-paper").clientHeight) return;   // 숨겨진 동안은 잴 수 없음
      card.classList.remove("fit-1", "fit-2");
      if (!cnIsOver(card)) return;
      card.classList.add("fit-1");
      if (!cnIsOver(card)) return;
      card.classList.replace("fit-1", "fit-2");
    }
    function cnLint(card) {
      cnFit(card);
      const issues = [];
      card.querySelectorAll(".cn-item").forEach(row => {
        const head = row.querySelector("b").textContent.trim() || "항목";
        // 한 줄에 칸이 여러 개인 장(비교 장)도 칸마다 확인
        row.querySelectorAll(".cn-item-text span, .cmp-cell span").forEach(val => {
          const todo = !val.textContent.trim() || CN_TODO.test(val.textContent);
          val.classList.toggle("cn-todo", todo);
          if (todo) issues.push({ el: val, msg: "'" + head + "' 칸을 채워 주세요" });
        });
      });
      // 카드가 화면에 보일 때만 크기를 잴 수 있음
      const paper = card.querySelector(".cn-paper");
      const over = paper.clientHeight > 0 && cnIsOver(card);
      card.classList.toggle("cn-over", over);
      if (over) issues.push({ el: card.querySelector(".cn-items"), msg: "글자가 많아 카드 아래가 잘려요" });
      card.querySelectorAll(".cn-meta-value").forEach(m => {
        if (m.clientWidth > 0 && m.scrollWidth > m.clientWidth + 1) {
          issues.push({ el: m, msg: m.previousElementSibling.textContent + "이 길어 잘려요" });
        }
      });
      return issues;
    }
    function cnLintAll() {
      document.querySelectorAll("#cn-list .cn-wrap").forEach(wrap => {
        const issues = cnLint(wrap.querySelector(".cn-card"));
        const warn = wrap.querySelector(".cn-warn");
        warn.hidden = !issues.length;
        warn.textContent = issues.map(p => p.msg).join(" · ");
      });
    }
    // 화면이 열리거나 창 크기가 바뀌면 다시 확인 (숨겨진 동안은 넘침을 잴 수 없어서)
    // 경고 문구가 목록 높이를 바꾸므로 다음 프레임에서 갱신함
    if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(cnLintAll)).observe(document.getElementById("cn-list"));

    // ----- 고친 내용 저장 (이 브라우저에만 저장) -----
    // 저장은 탭·세부 유형마다 따로 (예: cardnews_v3_notify_비례보상)
    // v10: 시안 디자인(남색 띠·비교 표·아이콘), 고객 권리에서 분쟁조정 줄 뺌 (v9: 고지·통지 이야기 순서) (v8: 면책안내 이야기 순서) (v7: 합니다체) (v6: 표준약관 조항 번호·판례·고객 권리 장 정정). 예전 저장분은 불러오지 않음
    // 사건별 저장: 시작하기에 넣은 사고 정보가 같으면 같은 사건(같은 저장 칸), 다르면 새 사건
    // cnCaseId가 ""이면 사건 없이 여는 기본 양식 (예전 저장 이름 그대로)
    const cnStorageKey = (tab = cnTab, sub = cnSub, id = cnCaseId) =>
      "cardnews_v10_" + (id ? "c" + id + "_" : "") + tab + "_" + sub;
    const CN_CASES_KEY = "cardnews_cases_v1";
    const CN_CASES_MAX = 30;
    let cnCaseId = "";
    let cnCases = {};
    try { cnCases = JSON.parse(localStorage.getItem(CN_CASES_KEY)) || {}; } catch (e) { cnCases = {}; }
    if (!cnCases[""]) cnCases[""] = { id: "", meta: {}, updated: 0 };
    function cnSaveCases() {
      try { localStorage.setItem(CN_CASES_KEY, JSON.stringify(cnCases)); } catch (e) {}
    }
    // 사고 정보 6칸으로 사건 번호를 만듦 (같은 입력 → 같은 번호)
    function cnCaseIdOf(v) {
      const s = JSON.stringify([v.product, v.date, v.job, v.code, v.cover, v.issue]);
      let h = 5381;
      for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
      return h.toString(36);
    }
    function cnCaseLabel(rec) {
      if (!rec.id) return "사건 없이 기본 양식";
      const v = rec.v || {};
      const parts = [rec.meta.claim ? "사고 " + rec.meta.claim : "",
        v.code ? v.code + (rec.codeName ? " " + rec.codeName : "") : "", v.cover, v.issue].filter(Boolean);
      const d = new Date(rec.updated);
      const when = (d.getMonth() + 1) + "." + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
      return (parts.join(" · ") || v.product || "이름 없는 사건") + " (" + when + ")";
    }
    function cnHasSaved(tab, sub) {
      try { return localStorage.getItem(cnStorageKey(tab, sub)) !== null; } catch (e) { return false; }
    }
    function cnRemoveCaseData(id) {
      const prefix = "cardnews_v10_c" + id + "_";
      try { Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    }
    // 시작하기를 누를 때: 그 입력의 사건을 만들거나 다시 엶. 새 사건이면 true
    function cnOpenCaseFor(v, codeName) {
      cnFlushSave();
      const id = cnCaseIdOf(v);
      const isNew = !cnCases[id];
      if (isNew) cnCases[id] = { id, v, codeName, meta: { product: v.product || "" }, tab: "", sub: "" };
      cnCases[id].updated = Date.now();
      // 오래된 사건은 30개까지만 남김
      const old = Object.values(cnCases).filter(r => r.id).sort((a, b) => b.updated - a.updated).slice(CN_CASES_MAX);
      old.forEach(r => { cnRemoveCaseData(r.id); delete cnCases[r.id]; });
      cnCaseId = id;
      cnSaveCases();
      renderCnCases();
      return isNew;
    }
    // 사건 고르기 목록 (최근에 연 순서)
    function renderCnCases() {
      const sel = document.getElementById("cn-case-select");
      sel.innerHTML = "";
      const recs = [cnCases[""], ...Object.values(cnCases).filter(r => r.id).sort((a, b) => b.updated - a.updated)];
      recs.forEach(r => {
        const o = document.createElement("option");
        o.value = r.id;
        o.textContent = cnCaseLabel(r);
        sel.appendChild(o);
      });
      sel.value = cnCaseId;
      document.getElementById("cn-case-del").hidden = !cnCaseId;
    }
    function cnSwitchCase(id) {
      cnFlushSave();
      if (!cnCases[id]) id = "";
      cnCaseId = id;
      const rec = cnCases[id];
      if (id) { rec.updated = Date.now(); cnSaveCases(); }
      renderCnCases();
      const tab = CN_SETS[rec.tab] ? rec.tab : "exempt";
      const sub = rec.sub && CN_SETS[tab].subs[rec.sub] ? rec.sub : Object.keys(CN_SETS[tab].subs)[0];
      switchCardNews(tab, sub);
    }
    // 상품명·계약번호·사고번호는 사건에 한 번만 저장하고 모든 탭·장에 똑같이 보여 줌
    function cnApplyMeta() {
      const meta = cnCases[cnCaseId].meta || {};
      document.querySelectorAll("#cn-list .cn-meta-value").forEach(el => {
        const val = meta[el.dataset.meta];
        if (val !== undefined) el.textContent = val;
      });
    }
    const cnStatus = document.getElementById("cn-status");

    function cardFields(card) {
      return [...card.querySelectorAll('[contenteditable="true"]')];
    }

    function saveCardNews() {
      // 장마다 { 장 양식, 글자들, 링크 주소 } 저장 (장 양식을 같이 저장해야 순서·추가·빼기가 유지됨)
      const cards = [...document.querySelectorAll("#cn-list .cn-card")].map((card, i) => {
        const urlInput = card.parentElement.querySelector(".cn-link-url");
        return { def: CARD_NEWS[i], fields: cardFields(card).map(el => el.textContent), url: urlInput ? urlInput.value : null };
      });
      const data = { v: 2, cards };
      cnRememberContact();
      try {
        localStorage.setItem(cnStorageKey(), JSON.stringify(data));
        cnStatus.textContent = "저장됨 " + new Date().toLocaleTimeString("ko-KR");
      } catch (e) {
        cnStatus.textContent = "이 브라우저에서는 저장할 수 없어요.";
      }
      cnLintAll();
    }

    function loadCardNews() {
      let data = null;
      try { data = JSON.parse(localStorage.getItem(cnStorageKey())); } catch (e) { data = null; }
      const list = Array.isArray(data) ? data : data && Array.isArray(data.cards) ? data.cards : null;
      if (!list) return;
      document.querySelectorAll("#cn-list .cn-card").forEach((card, i) => {
        const saved = list[i];
        if (!saved || !Array.isArray(saved.fields)) return;
        const fields = cardFields(card);
        // 예전 저장분은 맨 끝에 아래 띠 글자가 하나 더 있음 (지금은 자동이라 버림)
        const vals = Array.isArray(data) && saved.fields.length === fields.length + 1 ? saved.fields.slice(0, -1) : saved.fields;
        // 양식의 칸 수가 바뀌었으면 그 장은 불러오지 않음
        if (vals.length !== fields.length) return;
        fields.forEach((el, k) => { el.textContent = vals[k]; });
        const urlInput = card.parentElement.querySelector(".cn-link-url");
        if (urlInput && saved.url) {
          urlInput.value = saved.url;
          urlInput.dispatchEvent(new Event("input"));
        }
      });
      cnStatus.textContent = "저장된 내용을 불러왔어요.";
    }

    // 상품명·계약번호·사고번호 칸은 한 줄만 (Enter로 줄바꿈 안 됨)
    document.getElementById("cn-list").addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.classList && e.target.classList.contains("cn-meta-value")) e.preventDefault();
    });

    let cnSaveTimer = null;
    // 탭·유형·사건을 바꾸기 전에, 아직 저장 안 된 고친 내용을 먼저 저장 (바꾸면 카드를 다시 그려서 사라지므로)
    function cnFlushSave() {
      if (!cnSaveTimer) return;
      clearTimeout(cnSaveTimer);
      cnSaveTimer = null;
      saveCardNews();
    }
    document.getElementById("cn-list").addEventListener("input", e => {
      // 상품명·계약번호·사고번호는 모든 장에 같은 값으로 맞춤
      const meta = e.target.dataset && e.target.dataset.meta;
      if (meta) {
        document.querySelectorAll('.cn-meta-value[data-meta="' + meta + '"]').forEach(el => {
          if (el !== e.target) el.textContent = e.target.textContent;
        });
        // 사건에 저장 → 다른 탭에도 같은 값. 사고번호는 사건 목록 이름에도 씀
        cnCases[cnCaseId].meta[meta] = e.target.textContent;
        cnSaveCases();
        if (meta === "claim") renderCnCases();
      }
      clearTimeout(cnSaveTimer);
      cnSaveTimer = setTimeout(() => { cnSaveTimer = null; saveCardNews(); }, 400);
      cnLintAll();
    });

    // 되돌리기: 확인 단계를 버튼 안에서 처리 (두 번 눌러야 실행)
    const cnResetBtn = document.getElementById("cn-reset");
    let cnResetArmed = false;
    cnResetBtn.addEventListener("click", () => {
      if (!cnResetArmed) {
        cnResetArmed = true;
        cnResetBtn.textContent = "한 번 더 누르면 되돌려요";
        setTimeout(() => { cnResetArmed = false; cnResetBtn.textContent = "처음 양식으로 되돌리기"; }, 3000);
        return;
      }
      cnResetArmed = false;
      cnResetBtn.textContent = "처음 양식으로 되돌리기";
      clearTimeout(cnSaveTimer); cnSaveTimer = null;
      try { localStorage.removeItem(cnStorageKey()); } catch (e) {}
      cnLoadLayout();          // 장 구성도 처음 양식(표지 + 유형의 장 + 문의처)으로
      renderCnTabs();
      renderCardNews();
      cnStatus.textContent = "처음 양식으로 되돌렸어요.";
    });

    // 사건 고르기 · 지우기
    document.getElementById("cn-case-select").addEventListener("change", e => {
      cnSwitchCase(e.target.value);
      cnStatus.textContent = e.target.value ? "그 사건의 카드뉴스를 열었어요." : "기본 양식을 열었어요.";
    });
    const cnCaseDelBtn = document.getElementById("cn-case-del");
    let cnCaseDelArmed = false;
    cnCaseDelBtn.addEventListener("click", () => {
      if (!cnCaseId) return;
      if (!cnCaseDelArmed) {
        cnCaseDelArmed = true;
        cnCaseDelBtn.textContent = "한 번 더 누르면 지워요";
        setTimeout(() => { cnCaseDelArmed = false; cnCaseDelBtn.textContent = "이 사건 지우기"; }, 3000);
        return;
      }
      cnCaseDelArmed = false;
      cnCaseDelBtn.textContent = "이 사건 지우기";
      cnRemoveCaseData(cnCaseId);
      delete cnCases[cnCaseId];
      cnSaveCases();
      cnSwitchCase("");
      cnStatus.textContent = "사건을 지웠어요. 기본 양식을 열었어요.";
    });

    // ----- 이미지 저장 (PNG 낱장 · ZIP · PDF) -----
    // html2canvas는 이 파일 맨 끝에 넣어 두었다가 처음 저장할 때 한 번만 실행 (인터넷 없이도 저장)
    // 파일 안에서 못 찾을 때만 인터넷(cdnjs)에서 받음
    function loadHtml2Canvas() {
      if (window.html2canvas) return Promise.resolve(window.html2canvas);
      const inline = document.getElementById("h2c-src");
      if (inline && inline.textContent.trim()) {
        try {
          const s = document.createElement("script");
          s.textContent = inline.textContent;
          document.head.appendChild(s);
          if (window.html2canvas) return Promise.resolve(window.html2canvas);
        } catch (e) { /* 아래 인터넷으로 */ }
      }
      return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = () => resolve(window.html2canvas);
        s.onerror = () => reject(new Error("load failed"));
        document.head.appendChild(s);
      });
    }

    // 내보내기 설정 (이 브라우저에 기억): 파일 형식 · 크기 · 개인정보 가리기
    const CN_EXPORT_KEY = "cardnews_export_v1";
    const CN_FORMAT_LABEL = { png: "이미지(PNG)", zip: "ZIP 한 파일", pdf: "PDF 한 파일" };
    const cnExport = { format: "png", size: "square", mask: true };
    try { Object.assign(cnExport, JSON.parse(localStorage.getItem(CN_EXPORT_KEY)) || {}); } catch (e) {}
    function cnSaveExport() { try { localStorage.setItem(CN_EXPORT_KEY, JSON.stringify(cnExport)); } catch (e) {} }
    function cnSaveAllLabel() {
      return CARD_NEWS.length + "장 모두 " + (CN_FORMAT_LABEL[cnExport.format] || CN_FORMAT_LABEL.png) + "로 저장";
    }
    // 세로형(1080×1350)은 화면의 카드도 같은 비율로 보여 줌 (넘침 확인도 그 크기로)
    function cnApplySize() {
      document.getElementById("cn-list").classList.toggle("tall", cnExport.size === "tall");
      cnLintAll();
    }

    // 개인정보 가리기: 계약번호·사고번호는 앞뒤만 남기고 *, 표지의 고객 이름은 가운데 글자를 *
    // (이미지에만 적용, 화면과 저장된 글자는 그대로)
    const CN_ALNUM = /[0-9A-Za-z가-힣]/;
    function cnMaskId(text) {
      const chars = [...text.trim()];
      const n = chars.filter(c => CN_ALNUM.test(c)).length;
      if (!n) return text;
      const keep = n >= 10 ? 4 : n >= 6 ? 2 : 1;
      let k = 0;
      return chars.map(c => {
        if (!CN_ALNUM.test(c)) return c;
        const idx = k++;
        return idx < keep || idx >= n - keep ? c : "*";
      }).join("");
    }
    function cnMaskName(text) {
      if (CN_TODO.test(text)) return text;
      const m = text.trim().match(/^(.*?)(\s*고객님)?$/);
      const name = [...m[1].trim()];
      if (name.length < 2) return text;
      const masked = name.length === 2 ? name[0] + "*" : name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
      return masked + (m[2] || "");
    }

    // 한 장을 캔버스로 (가로 1080px). 가리기·캡처용 표시는 끝나면 원래대로
    async function cnCapture(h2c, card, opts) {
      const restore = [];
      const swap = (el, fn) => { if (!el) return; restore.push([el, el.textContent]); el.textContent = fn(el.textContent); };
      if (opts.mask) {
        card.querySelectorAll('.cn-meta-value[data-meta="contract"], .cn-meta-value[data-meta="claim"]').forEach(el => swap(el, cnMaskId));
        if (card.dataset.kind === "cover") swap(card.querySelector(".cn-item-text span"), cnMaskName);
      }
      // 비어 있는 상품명·계약번호·사고번호 줄은 이미지에서 숨김 (빈 밑줄만 찍히지 않게)
      const hiddenMeta = [...card.querySelectorAll(".cn-meta > div")].filter(row => !row.querySelector(".cn-meta-value").textContent.trim());
      hiddenMeta.forEach(row => { row.style.display = "none"; });
      card.classList.add("cn-capturing");
      try {
        const raw = await h2c(card, { scale: 1080 / card.offsetWidth, backgroundColor: opts.background || null, logging: false });
        // 반올림으로 1~2px 어긋나는 걸 정확히 1080×1080 / 1080×1350으로 맞춤
        const w = 1080, h = cnExport.size === "tall" ? 1350 : 1080;
        if (raw.width === w && raw.height === h) return raw;
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(raw, 0, 0, w, h);
        return c;
      } finally {
        card.classList.remove("cn-capturing");
        hiddenMeta.forEach(row => { row.style.display = ""; });
        restore.forEach(([el, t]) => { el.textContent = t; });
      }
    }
    const cnCanvasBlob = (canvas, type, quality) => new Promise((resolve, reject) =>
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), type, quality));
    async function cnJpegBytes(canvas) {
      // JPEG에는 투명이 없어서 흰 바탕 위에 그림
      const c = document.createElement("canvas");
      c.width = canvas.width; c.height = canvas.height;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvas, 0, 0);
      return new Uint8Array(await (await cnCanvasBlob(c, "image/jpeg", 0.92)).arrayBuffer());
    }
    function cnDownload(blob, name) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    // 파일 이름: 카드뉴스_탭_세부유형(_사고번호: 가리기를 끈 경우만)
    function cnFileBase() {
      const claim = (cnCases[cnCaseId].meta || {}).claim || "";
      const parts = ["카드뉴스", CN_SETS[cnTab].label, cnSub];
      if (claim && !cnExport.mask) parts.push(claim);
      return parts.join("_").replace(/[\\/:*?"<>|\s]+/g, "");
    }

    // ZIP (압축 없이 묶기만: PNG는 이미 압축돼 있음). 파일 이름은 UTF-8
    const CN_CRC_TABLE = (() => {
      const t = new Uint32Array(256);
      for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
      return t;
    })();
    function cnCrc32(bytes) {
      let c = 0xFFFFFFFF;
      for (let i = 0; i < bytes.length; i++) c = CN_CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
      return (c ^ 0xFFFFFFFF) >>> 0;
    }
    function cnZip(files) {
      const enc = new TextEncoder();
      const d = new Date();
      const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
      const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
      const local = [], central = [];
      let offset = 0;
      files.forEach(f => {
        const name = enc.encode(f.name), crc = cnCrc32(f.data), size = f.data.length;
        const h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
        h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
        h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true);
        local.push(new Uint8Array(h.buffer), name, f.data);
        const c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
        c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
        c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true);
        c.setUint32(42, offset, true);
        central.push(new Uint8Array(c.buffer), name);
        offset += 30 + name.length + size;
      });
      const cdSize = central.reduce((s, p) => s + p.length, 0);
      const e = new DataView(new ArrayBuffer(22));
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
      e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
      return new Blob([...local, ...central, new Uint8Array(e.buffer)], { type: "application/zip" });
    }

    // PDF: 한 장에 한 쪽, 쪽 크기는 이미지 비율 그대로 (1080px → 540pt)
    function cnPdf(images) {
      const enc = new TextEncoder();
      const chunks = [], offsets = [];
      let len = 0;
      const push = x => { const b = typeof x === "string" ? enc.encode(x) : x; chunks.push(b); len += b.length; };
      const obj = (id, body) => { offsets[id] = len; push(id + " 0 obj\n"); body(); push("\nendobj\n"); };
      push("%PDF-1.4\n");
      obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
      obj(2, () => push("<< /Type /Pages /Count " + images.length + " /Kids [" + images.map((_, i) => (3 + 3 * i) + " 0 R").join(" ") + "] >>"));
      images.forEach((im, i) => {
        const p = 3 + 3 * i, pw = Math.round(im.w / 2), ph = Math.round(im.h / 2);
        obj(p, () => push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pw + " " + ph + "] /Resources << /XObject << /Im" + i + " " + (p + 2) + " 0 R >> >> /Contents " + (p + 1) + " 0 R >>"));
        const content = "q " + pw + " 0 0 " + ph + " 0 0 cm /Im" + i + " Do Q";
        obj(p + 1, () => push("<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream"));
        obj(p + 2, () => {
          push("<< /Type /XObject /Subtype /Image /Width " + im.w + " /Height " + im.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + im.jpeg.length + " >>\nstream\n");
          push(im.jpeg);
          push("\nendstream");
        });
      });
      const total = 3 + 3 * images.length, xref = len;
      let x = "xref\n0 " + total + "\n0000000000 65535 f \n";
      for (let id = 1; id < total; id++) x += String(offsets[id]).padStart(10, "0") + " 00000 n \n";
      push(x + "trailer\n<< /Size " + total + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
      return new Blob(chunks, { type: "application/pdf" });
    }

    // format: "png"(장마다 파일) · "zip" · "pdf". 한 장 저장 버튼은 늘 PNG
    async function saveCards(cards, format = "png") {
      const buttons = document.querySelectorAll("#cardnews .cn-btn");
      buttons.forEach(b => b.disabled = true);
      if (document.activeElement) document.activeElement.blur();
      const opts = { mask: cnExport.mask, background: format === "pdf" ? "#ffffff" : null };
      try {
        const h2c = await loadHtml2Canvas();
        const all = [...document.querySelectorAll("#cn-list .cn-card")];
        const base = cnFileBase();
        const zipFiles = [], pdfPages = [];
        for (const card of cards) {
          const no = all.indexOf(card) + 1;
          cnStatus.textContent = no + "장 이미지 만드는 중... (" + (cards.indexOf(card) + 1) + "/" + cards.length + ")";
          const canvas = await cnCapture(h2c, card, opts);
          const name = base + "_" + String(no).padStart(2, "0") + "_" + CARD_NEWS[no - 1].title.replace(/\s+/g, "");
          if (format === "pdf") {
            pdfPages.push({ jpeg: await cnJpegBytes(canvas), w: canvas.width, h: canvas.height });
          } else if (format === "zip") {
            zipFiles.push({ name: name + ".png", data: new Uint8Array(await (await cnCanvasBlob(canvas, "image/png")).arrayBuffer()) });
          } else {
            cnDownload(await cnCanvasBlob(canvas, "image/png"), name + ".png");
            await new Promise(r => setTimeout(r, 400));
          }
        }
        if (format === "zip") cnDownload(cnZip(zipFiles), base + ".zip");
        if (format === "pdf") cnDownload(cnPdf(pdfPages), base + ".pdf");
        cnStatus.textContent = (format === "png" ? cards.length + "장을" : cards.length + "장을 " + (format === "zip" ? "ZIP" : "PDF") + " 한 파일로")
          + " 저장했어요" + (opts.mask ? " (번호·이름 가림)" : "") + ". 다운로드 폴더를 확인해 주세요.";
      } catch (e) {
        cnStatus.textContent = "이미지를 만들지 못했어요. 다시 시도해 주세요.";
      } finally {
        buttons.forEach(b => b.disabled = false);
      }
    }

    // 내보내기 설정 칸
    (function initCnExport() {
      const fmt = document.getElementById("cn-format");
      const size = document.getElementById("cn-size");
      const mask = document.getElementById("cn-mask");
      fmt.value = CN_FORMAT_LABEL[cnExport.format] ? cnExport.format : "png";
      size.value = cnExport.size === "tall" ? "tall" : "square";
      mask.checked = cnExport.mask !== false;
      fmt.addEventListener("change", () => { cnExport.format = fmt.value; cnSaveExport(); document.getElementById("cn-save-all").textContent = cnSaveAllLabel(); });
      size.addEventListener("change", () => { cnExport.size = size.value; cnSaveExport(); cnApplySize(); });
      mask.addEventListener("change", () => { cnExport.mask = mask.checked; cnSaveExport(); });
      cnApplySize();
      document.getElementById("cn-save-all").textContent = cnSaveAllLabel();
    })();

    // 저장 전 확인: 확인할 곳이 있으면 첫 번째 곳으로 옮겨 알려 주고,
    // 같은 버튼을 한 번 더 누르면 그대로 저장 (6초 안에)
    let cnSaveArmed = "";
    let cnSaveArmTimer = null;
    function requestSaveCards(cards, key, format) {
      const all = [...document.querySelectorAll(".cn-card")];
      const problems = [];
      cards.forEach(card => cnLint(card).forEach(p => problems.push({ no: all.indexOf(card) + 1, ...p })));
      cnLintAll();
      if (problems.length && cnSaveArmed !== key) {
        cnSaveArmed = key;
        clearTimeout(cnSaveArmTimer);
        cnSaveArmTimer = setTimeout(() => { cnSaveArmed = ""; }, 6000);
        const shown = problems.slice(0, 3).map(p => (p.no ? p.no + "장 " : "") + p.msg).join(", ");
        cnStatus.textContent = "확인해 주세요: " + shown
          + (problems.length > 3 ? " 외 " + (problems.length - 3) + "곳" : "")
          + ". 그대로 저장하려면 저장 버튼을 한 번 더 누르세요.";
        // 첫 번째 곳으로 옮기고, 칸이면 글자를 선택해 바로 고쳐 쓸 수 있게
        const first = problems[0].el;
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        if (first.isContentEditable) {
          first.focus();
          const range = document.createRange();
          range.selectNodeContents(first);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        return;
      }
      cnSaveArmed = "";
      clearTimeout(cnSaveArmTimer);
      saveCards(cards, format);
    }

    document.getElementById("cn-save-all").addEventListener("click", () => {
      requestSaveCards([...document.querySelectorAll("#cn-list .cn-card")], "all", cnExport.format);
    });

    // 처음 열 때: 가장 최근 사건이 있으면 그 사건으로
    const cnLatest = Object.values(cnCases).filter(r => r.id).sort((a, b) => b.updated - a.updated)[0];
    if (cnLatest) cnSwitchCase(cnLatest.id);
    else { renderCnCases(); cnLoadLayout(); renderCnTabs(); renderCardNews(); }
    renderCnAddMenu();
    document.getElementById("cn-add").addEventListener("change", e => {
      const def = cnDefFromMenu(e.target.value);
      e.target.value = "";
      if (def) cnAddCard(def);
    });

    // ===== PubMed 검색: E-utilities(esearch → esummary)로 결과 목록을 탭 안에 보여 줌 =====
    const PM_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
    const PM_PAGE = 20;                      // 한 번에 가져오는 논문 수
    const pm = { query: "", sort: "", total: 0, shown: 0, token: 0, lastKey: "", docs: {}, abs: {} };

    function pmSetOpenLink(q) {
      document.getElementById("pubmed-open").href = q
        ? "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(q) + (pm.sort === "pub_date" ? "&sort=date" : "")
        : "https://pubmed.ncbi.nlm.nih.gov/";
    }

    // 저자: 3명까지 쓰고 나머지는 "외 N명"
    function pmAuthors(list) {
      const names = (list || []).map(a => a.name).filter(Boolean);
      if (!names.length) return "";
      return names.length > 3 ? names.slice(0, 3).join(", ") + " 외 " + (names.length - 3) + "명" : names.join(", ");
    }

    // 논문 종류 → [배지 이름, 근거 수준 1(강)~4(약)]
    const PM_EVIDENCE = {
      "Meta-Analysis": ["메타분석", 1], "Systematic Review": ["체계적 문헌고찰", 1],
      "Practice Guideline": ["진료지침", 2], "Guideline": ["진료지침", 2], "Randomized Controlled Trial": ["RCT", 2],
      "Review": ["리뷰", 3], "Case Reports": ["증례보고", 4]
    };

    // esummary 결과 → 화면·인용·저장에 쓰는 논문 정보
    function pmRecord(doc) {
      const ids = doc.articleids || [];
      const seen = {};
      const types = (doc.pubtype || []).map(t => PM_EVIDENCE[t]).filter(e => e && !seen[e[0]] && (seen[e[0]] = true))
        .sort((a, b) => a[1] - b[1]);
      return {
        pmid: String(doc.uid), title: (doc.title || "(제목 없음)").trim(),
        authors: (doc.authors || []).map(a => a.name).filter(Boolean),
        source: doc.source || doc.fulljournalname || "", year: (doc.pubdate || doc.epubdate || "").slice(0, 4),
        volume: doc.volume || "", issue: doc.issue || "", pages: doc.pages || "",
        doi: (ids.find(a => a.idtype === "doi") || {}).value || "", free: ids.some(a => a.idtype === "pmc"), types
      };
    }

    // 인용문 (Vancouver 형식): 저자(6명 넘으면 et al.). 제목. 저널. 연도;권(호):쪽. doi. PMID
    function pmCite(r) {
      const au = r.authors.length > 6 ? r.authors.slice(0, 6).join(", ") + ", et al" : r.authors.join(", ");
      const title = /[.?!]$/.test(r.title) ? r.title : r.title + ".";
      const vol = r.volume ? ";" + r.volume + (r.issue ? "(" + r.issue + ")" : "") + (r.pages ? ":" + r.pages : "") : "";
      return [au ? au + "." : "", title, r.source + ".", r.year + vol + ".", r.doi ? "doi:" + r.doi + "." : "", "PMID: " + r.pmid + "."]
        .filter(Boolean).join(" ");
    }

    const pmEvBadges = types => types.map(([name, lv]) => '<span class="pm-ev ev-' + lv + '" title="근거 수준 ' + lv + '단계">' + escapeHtml(name) + '</span>').join("");

    function pmItemHtml(doc, no) {
      const r = pmRecord(doc);
      pm.docs[r.pmid] = r;
      const vol = [r.volume, r.issue ? "(" + r.issue + ")" : "", r.pages ? ":" + r.pages : ""].join("");
      const url = "https://pubmed.ncbi.nlm.nih.gov/" + encodeURIComponent(r.pmid) + "/";
      const saved = pmIsSaved(r.pmid);
      return '<li class="pm-item" data-pmid="' + escapeHtml(r.pmid) + '"><span class="pm-no">' + no + '</span><div class="pm-body">'
        + '<a class="pm-title" href="' + url + '" target="_blank" rel="noopener">' + escapeHtml(r.title) + '</a>'
        + (pmAuthors(doc.authors) ? '<div class="pm-authors">' + escapeHtml(pmAuthors(doc.authors)) + '</div>' : '')
        + '<div class="pm-src"><span><i>' + escapeHtml(r.source) + '</i>'
        + (r.year ? " " + escapeHtml(r.year) : "") + (vol ? "; " + escapeHtml(vol) : "") + '</span>'
        + '<span>PMID ' + escapeHtml(r.pmid) + '</span>'
        + (r.doi ? '<a href="https://doi.org/' + encodeURI(r.doi) + '" target="_blank" rel="noopener" style="color:#FF7A29">DOI</a>' : '')
        + pmEvBadges(r.types)
        + (r.free ? '<span class="pm-tag free">무료 원문</span>' : '')
        + '</div><div class="pm-actions">'
        + '<button type="button" class="pm-act" data-act="abs">초록 보기</button>'
        + '<button type="button" class="pm-act" data-act="cite">인용 복사</button>'
        + '<button type="button" class="pm-act' + (saved ? ' on' : '') + '" data-act="save">' + (saved ? '★ 모아 둠' : '☆ 모아 두기') + '</button>'
        + (pm.cardPmid === r.pmid ? '<button type="button" class="pm-act done" data-act="card">✓ 카드뉴스에 넣음</button>'
          : '<button type="button" class="pm-act" data-act="card">카드뉴스로 보내기</button>')
        + '</div><div class="pm-abs" hidden></div></div></li>';
    }

    // ----- 한글 병명·진단코드 → 영어 검색어 -----
    // 1) 자주 쓰는 말(분류표 이름과 다른 일상 병명, 손해사정 쟁점 단어) 2) KCD 코드표(KCD) 3) KCD 9차 분류표(koicd)
    const PM_KO_EN = {
      "뇌출혈": "intracerebral hemorrhage", "뇌졸중": "stroke", "중풍": "stroke", "뇌경색": "cerebral infarction",
      "치매": "dementia", "디스크": "intervertebral disc herniation", "허리디스크": "lumbar disc herniation", "목디스크": "cervical disc herniation",
      "추간판탈출증": "intervertebral disc herniation", "협착증": "spinal stenosis", "척추관협착증": "spinal stenosis",
      "심근경색": "myocardial infarction", "협심증": "angina pectoris", "부정맥": "arrhythmia", "심부전": "heart failure",
      "대동맥박리": "aortic dissection", "동맥류": "aneurysm", "뇌동맥류": "intracranial aneurysm", "심정지": "cardiac arrest", "급사": "sudden death",
      "돌연사": "sudden death", "심장돌연사": "sudden cardiac death",
      "위암": "gastric cancer", "대장암": "colorectal cancer", "폐암": "lung cancer", "유방암": "breast cancer", "간암": "hepatocellular carcinoma",
      "췌장암": "pancreatic cancer", "전립선암": "prostate cancer", "갑상선암": "thyroid cancer", "직장암": "rectal cancer", "방광암": "bladder cancer",
      "신장암": "renal cell carcinoma", "자궁경부암": "cervical cancer", "난소암": "ovarian cancer", "백혈병": "leukemia", "림프종": "lymphoma",
      "유사암": "borderline tumor", "경계성종양": "borderline tumor", "제자리암": "carcinoma in situ", "상피내암": "carcinoma in situ",
      "유암종": "neuroendocrine tumor", "신경내분비종양": "neuroendocrine tumor", "전이": "metastasis", "전이암": "metastatic cancer", "원발부위": "primary site",
      "파킨슨병": "Parkinson disease", "루게릭병": "amyotrophic lateral sclerosis", "뇌진탕": "concussion", "외상성뇌손상": "traumatic brain injury",
      "뇌손상": "brain injury", "척수손상": "spinal cord injury", "골절": "fracture", "회전근개파열": "rotator cuff tear", "십자인대파열": "cruciate ligament injury",
      "반월상연골파열": "meniscus tear", "퇴행성관절염": "osteoarthritis", "관절염": "arthritis", "골다공증": "osteoporosis", "당뇨": "diabetes mellitus",
      "당뇨병": "diabetes mellitus", "고혈압": "hypertension", "우울증": "depression", "익사": "drowning", "질식": "asphyxia", "추락": "fall",
      "교통사고": "traffic accident", "열사병": "heat stroke", "저체온증": "hypothermia", "패혈증": "sepsis", "폐렴": "pneumonia",
      // 손해사정 쟁점·검색 조건 단어
      "인과관계": "causation", "상당인과관계": "causation", "외상": "trauma", "외상성": "traumatic", "사고": "accident", "기왕증": "pre-existing condition",
      "기왕력": "pre-existing condition", "퇴행성": "degenerative", "예후": "prognosis", "장해": "disability", "후유장해": "permanent disability",
      "후유증": "sequelae", "진단": "diagnosis", "진단기준": "diagnostic criteria", "치료": "treatment", "수술": "surgery", "위험인자": "risk factor",
      "위험요인": "risk factor", "사망": "death", "사망률": "mortality", "사인": "cause of death", "부검": "autopsy", "재발": "recurrence",
      "발병": "onset", "잠복기": "latency", "유병률": "prevalence", "발생률": "incidence", "음주": "alcohol", "흡연": "smoking", "과로": "overwork",
      "스트레스": "stress", "자살": "suicide", "소아": "children", "노인": "elderly", "진료지침": "guideline", "가이드라인": "guideline",
      "메타분석": "meta-analysis", "자연경과": "natural history", "기여도": "contribution", "영상": "imaging", "조직검사": "biopsy", "병리": "pathology"
    };
    const PM_HANGUL = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
    const pmKey = s => s.replace(/\s+/g, "");

    // 분류표 영문명을 검색어로 다듬음: 괄호 속 코드·"unspecified"·"NEC" 빼고 미국식 철자로
    function pmCleanEn(en) {
      return (en || "").replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/[†*’]/g, "'").replace(/'/g, "")
        .replace(/,?\s*(unspecified|not elsewhere classified|NEC|NOS)\b/gi, " ").replace(/^\s*(other|unspecified)\s+/i, "").replace(/\s+and other\b/gi, "")
        .replace(/haem/gi, "hem").replace(/ischaem/gi, "ischem").replace(/oedem/gi, "edem").replace(/anaem/gi, "anem")
        .replace(/oesoph/gi, "esoph").replace(/leukaem/gi, "leukem").replace(/tumour/gi, "tumor")
        .replace(/\s+/g, " ").trim().toLowerCase();
    }

    // 진단코드 하나 → { en, label }
    function pmFromCode(code) {
      if (KCD[code]) return { en: KCD[code].en, label: code + " " + KCD[code].name };
      const r = koicd && (koicd.byCode[code] || [])[0];
      return r ? { en: pmCleanEn(r.en), label: code + " " + r.kr } : null;
    }

    // 한글 말 하나 → { en, label }  (exact=false면 그 말이 들어간 가장 짧은 분류명도 찾음)
    function pmFromKorean(word, exact) {
      const k = pmKey(word);
      if (!k) return null;
      if (PM_KO_EN[k]) return { en: PM_KO_EN[k], label: "" };
      const cur = Object.keys(KCD).find(c => pmKey(KCD[c].name) === k || KCD[c].kw === k);
      if (cur) return { en: KCD[cur].en, label: cur + " " + KCD[cur].name };
      if (!koicd) return null;
      const rows = koicd.rows.filter(r => r.lv >= 3 && r.en);
      let r = rows.find(r => pmKey(r.kr) === k);
      if (!r && !exact && k.length >= 2) {
        r = rows.filter(r => pmKey(r.kr.replace(/\([^)]*\)/g, "")).includes(k))
          .sort((a, b) => a.kr.length - b.kr.length || a.lv - b.lv)[0];
      }
      return r ? { en: pmCleanEn(r.en), label: r.code + " " + r.kr } : null;
    }

    // 검색어 전체를 바꿈: 영어는 그대로, 코드·한글은 영어로 (띄어 쓴 병명은 긴 묶음부터 맞춰 봄)
    async function pmTranslate(input) {
      const tokens = input.split(/\s+/).filter(Boolean);
      const isCode = t => /^[A-Z]\d{2}(\.\d{1,3})?$/.test(normCode(t));
      if (!tokens.some(t => PM_HANGUL.test(t) || isCode(t))) return { query: input, maps: [], missed: [] };
      await koicdReady;
      const out = [], maps = [], missed = [];
      for (let i = 0; i < tokens.length;) {
        const t = tokens[i];
        if (isCode(t)) {
          const hit = pmFromCode(normCode(t));
          if (hit) { out.push(hit.en); maps.push({ from: t, to: hit.en, label: hit.label }); }
          else out.push(t);
          i++; continue;
        }
        if (!PM_HANGUL.test(t)) { out.push(t); i++; continue; }
        let done = false;
        for (let n = Math.min(4, tokens.length - i); n >= 1 && !done; n--) {
          const span = tokens.slice(i, i + n);
          if (span.some(s => !PM_HANGUL.test(s))) continue;
          const hit = pmFromKorean(span.join(" "), n > 1);
          if (hit) { out.push(hit.en); maps.push({ from: span.join(" "), to: hit.en, label: hit.label }); i += n; done = true; }
        }
        if (!done) { missed.push(t); i++; }
      }
      return { query: out.join(" "), maps, missed };
    }

    function pmShowTrans(t) {
      const box = document.getElementById("pubmed-trans");
      if (!t || (!t.maps.length && !t.missed.length)) { box.hidden = true; box.innerHTML = ""; return; }
      box.hidden = false;
      box.innerHTML = "영어로 바꿔 검색했어요: <b>" + escapeHtml(t.query || "(없음)") + "</b>"
        + '<button type="button" id="pubmed-raw">입력한 그대로 검색</button><br>'
        + t.maps.map(m => '<span class="pm-map">' + escapeHtml(m.from) + " → " + escapeHtml(m.to)
          + (m.label ? " <small>(" + escapeHtml(m.label) + ")</small>" : "") + "</span>").join("")
        + (t.missed.length ? '<br><span class="miss">영어로 바꾸지 못해 뺀 말: ' + escapeHtml(t.missed.join(", "))
          + " — 영어로 직접 넣거나 다른 병명으로 바꿔 보세요.</span>" : "");
      document.getElementById("pubmed-raw").addEventListener("click", () => pubmedSearch(false, true));
    }

    // append=false면 새 검색, true면 "더 보기" / raw=true면 한글을 바꾸지 않고 그대로 검색
    function pubmedSearch(append, raw) {
      const countEl = document.getElementById("pubmed-count");
      const listEl = document.getElementById("pubmed-list");
      const moreEl = document.getElementById("pubmed-more");
      moreEl.hidden = true;
      if (!append) {
        const input = document.getElementById("pubmed-query").value.trim();
        pm.sort = document.getElementById("pubmed-sort").value;
        pm.total = 0; pm.shown = 0;
        pm.lastKey = pmSearchKey(input);
        listEl.innerHTML = "";
        if (!input) {
          pm.query = ""; pmShowTrans(null); pmSetOpenLink(""); countEl.textContent = "검색어를 입력해 주세요.";
          return;
        }
        const token = ++pm.token;
        countEl.textContent = "검색 중…";
        (raw ? Promise.resolve({ query: input, maps: [], missed: [] }) : pmTranslate(input)).then(t => {
          if (token !== pm.token) return;
          pmShowTrans(raw ? null : t);
          pm.query = t.query;
          if (!pm.query) {
            pmSetOpenLink("");
            countEl.textContent = "영어로 바꿀 수 있는 말이 없어요. 병명을 영어로 넣거나 진단코드(예: I63)로 찾아 보세요.";
            return;
          }
          pmFetch(false);
        });
        return;
      }
      pmFetch(true);
    }

    // ----- NCBI 요청 관리: 1초에 3번 제한을 지키도록 간격을 두고, tool=jangsoni를 붙임 -----
    const PM_GAP_MS = 400;                   // 요청 사이 최소 간격 (초당 2.5회)
    let pmNcbiNext = 0;
    function pmNetError(kind, msg) { const e = new Error(msg || kind); e.kind = kind; return e; }
    async function pmNcbi(path, asText, retried) {
      const url = PM_BASE + path + (/[?&]tool=/.test(path) ? "" : "&tool=jangsoni");
      const now = Date.now();
      const wait = Math.max(0, pmNcbiNext - now);
      pmNcbiNext = Math.max(now, pmNcbiNext) + PM_GAP_MS;
      if (wait) await new Promise(r => setTimeout(r, wait));
      if (navigator.onLine === false) throw pmNetError("offline");
      let r;
      try { r = await fetch(url); }
      catch (e) { throw pmNetError(navigator.onLine === false ? "offline" : "network"); }
      // 요청이 몰려 거절(429)되거나 서버가 잠깐 바쁘면(5xx) 한 번만 1.5초 뒤 다시 시도
      if ((r.status === 429 || r.status >= 500) && !retried) {
        await new Promise(res => setTimeout(res, 1500));
        return pmNcbi(path, asText, true);
      }
      if (r.status === 429 || r.status >= 500) throw pmNetError("busy");
      if (!r.ok) throw pmNetError("http", String(r.status));
      return asText ? r.text() : r.json();
    }
    // 실패 원인별 안내 문구
    function pmNetMessage(err) {
      const kind = err && err.kind;
      if (kind === "offline") return "인터넷에 연결되어 있지 않아요. 연결되면 자동으로 다시 검색해요.";
      if (kind === "busy") return "PubMed 서버가 잠시 바빠요. 몇 초 뒤 '다시 시도'를 눌러 주세요.";
      if (kind === "http") return "PubMed가 요청을 처리하지 못했어요(오류 " + err.message + "). 검색어를 줄이거나 '다시 시도'를 눌러 주세요.";
      return "PubMed에 연결하지 못했어요. 회사 보안망에서 막혔거나 일시적인 문제일 수 있어요. '다시 시도'를 누르거나 'PubMed에서 보기'로 열어 주세요.";
    }

    function pmFetch(append) {
      const countEl = document.getElementById("pubmed-count");
      const listEl = document.getElementById("pubmed-list");
      const moreEl = document.getElementById("pubmed-more");
      const term = pmWithFilters(pmCombine(pm.query, pm.issue));
      pmSetOpenLink(term);
      const token = ++pm.token;             // 늦게 온 이전 검색 결과는 버림
      pm.failed = null;
      countEl.textContent = append ? "더 불러오는 중…" : "검색 중…";
      pmNcbi("esearch.fcgi?db=pubmed&retmode=json&retmax=" + PM_PAGE
          + "&retstart=" + pm.shown + "&sort=" + pm.sort + "&term=" + encodeURIComponent(term))
        .then(j => {
          if (token !== pm.token) return;
          pm.total = Number(j.esearchresult.count) || 0;
          const ids = j.esearchresult.idlist || [];
          if (!ids.length) {
            if (!pm.shown) countEl.textContent = pmLabel() + " 검색 결과가 없어요. "
              + (pm.issue ? "쟁점을 '전체'로 바꾸거나 " : "") + "영어 검색어나 더 짧은 검색어로 바꿔 보세요.";
            return;
          }
          return pmNcbi("esummary.fcgi?db=pubmed&retmode=json&id=" + ids.join(","))
            .then(s => {
              if (token !== pm.token) return;
              const html = ids.filter(id => s.result && s.result[id])
                .map((id, i) => pmItemHtml(s.result[id], pm.shown + i + 1)).join("");
              listEl.insertAdjacentHTML("beforeend", html);
              pmTrList();
              pm.shown += ids.length;
              if (!append) pmRenderSaved();
              countEl.textContent = pmLabel() + " 검색 결과 " + pm.total.toLocaleString("ko-KR") + "건 중 "
                + pm.shown.toLocaleString("ko-KR") + "건 표시 (" + (pm.sort === "pub_date" ? "최신순" : "관련도순") + ")";
              moreEl.hidden = pm.shown >= pm.total;
            });
        })
        .catch(err => {
          if (token !== pm.token) return;
          pm.failed = { append };
          countEl.innerHTML = escapeHtml(pmNetMessage(err)) + ' <button type="button" id="pubmed-retry">다시 시도</button>';
          document.getElementById("pubmed-retry").addEventListener("click", () => pmFetch(append));
          moreEl.hidden = !pm.shown;
        });
    }

    // 인터넷 연결 상태: 끊기면 안내, 다시 연결되면 실패했던 검색을 자동으로 다시 함
    function pmShowNet() {
      const el = document.getElementById("pm-net");
      const off = navigator.onLine === false;
      el.hidden = !off;
      el.textContent = off ? "인터넷 연결이 끊겼어요. PubMed 목록을 불러올 수 없어요. 연결되면 자동으로 다시 검색해요." : "";
    }
    window.addEventListener("offline", pmShowNet);
    window.addEventListener("online", () => {
      pmShowNet();
      if (pm.failed && !document.getElementById("pubmed").hidden) pmFetch(pm.failed.append);
    });

    // 탭에 들어올 때 검색어가 바뀌었으면 자동으로 검색 (처음 화면에서 만든 검색어 포함)
    function pubmedAutoSearch() {
      const q = document.getElementById("pubmed-query").value.trim();
      const caseEl = document.getElementById("pubmed-case");
      if (!caseEl.value.trim()) caseEl.value = pmLoadLastCase() || pmAutoCase(readCaseInput());
      pmRenderSaved();
      pmShowNet();
      if (q && pmSearchKey(q) !== pm.lastKey) pubmedSearch(false);
    }

    // ----- 필터: 출판 연도 · 논문 종류 · 언어 · 무료 원문 -----
    const PM_TYPE_FILTER = {
      meta: "meta-analysis[pt]", sr: "systematic review[pt]", guide: "(guideline[pt] OR practice guideline[pt])",
      rct: "randomized controlled trial[pt]", review: "review[pt]"
    };
    const pmVal = id => document.getElementById(id).value;
    function pmFilterParts() {
      const parts = [], labels = [];
      const y = pmVal("pubmed-year");
      if (y) { parts.push((new Date().getFullYear() - Number(y) + 1) + ":3000[dp]"); labels.push("최근 " + y + "년"); }
      const t = pmVal("pubmed-type");
      if (t) { parts.push(PM_TYPE_FILTER[t]); labels.push(document.querySelector('#pubmed-type option[value="' + t + '"]').textContent); }
      if (pmVal("pubmed-lang")) { parts.push("(english[la] OR korean[la])"); labels.push("영어·한국어"); }
      if (document.getElementById("pubmed-free").checked) { parts.push('"free full text"[sb]'); labels.push("무료 원문"); }
      return { parts, labels };
    }
    function pmWithFilters(term) {
      const { parts } = pmFilterParts();
      return term && parts.length ? "(" + term + ") AND " + parts.join(" AND ") : term;
    }
    function pmSearchKey(input) {
      return [input, pmVal("pubmed-sort"), pm.issue, pmVal("pubmed-year"), pmVal("pubmed-type"), pmVal("pubmed-lang"),
        document.getElementById("pubmed-free").checked].join("|");
    }
    ["pubmed-year", "pubmed-type", "pubmed-lang", "pubmed-free"].forEach(id =>
      document.getElementById(id).addEventListener("change", () => {
        if (document.getElementById("pubmed-query").value.trim()) pubmedSearch(false);
      }));

    // ----- 결과 카드의 버튼: 초록 보기 · 인용 복사 · 모아 두기 -----
    function pmToast(msg) {
      let t = document.getElementById("pm-toast");
      if (!t) { t = document.createElement("div"); t.id = "pm-toast"; t.className = "pm-toast"; document.body.appendChild(t); }
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(pmToast.timer);
      pmToast.timer = setTimeout(() => t.classList.remove("show"), 1800);
    }

    async function pmCopy(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {                          // 클립보드 API를 못 쓰는 환경(파일로 연 경우 등)
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } finally { ta.remove(); }
      }
    }

    // efetch(XML)로 초록을 가져와 구분 제목(Background·Methods 등)별로 나눠 보여 줌
    async function pmFetchAbstract(pmid) {
      if (pm.abs[pmid]) return pm.abs[pmid];
      const text = await pmNcbi("efetch.fcgi?db=pubmed&retmode=xml&rettype=abstract&id=" + encodeURIComponent(pmid), true);
      const xml = new DOMParser().parseFromString(text, "text/xml");
      const parts = [...xml.querySelectorAll("Abstract > AbstractText")].map(el => ({
        label: el.getAttribute("Label") || "", text: (el.textContent || "").trim()
      })).filter(p => p.text);
      const kws = [...xml.querySelectorAll("KeywordList > Keyword")].map(k => k.textContent.trim()).filter(Boolean);
      const html = parts.length
        ? parts.map(p => '<p>' + (p.label ? '<b>' + escapeHtml(p.label) + '</b> ' : '') + '<span class="pm-abs-text">' + escapeHtml(p.text) + '</span></p>').join("")
          + (kws.length ? '<p><b>Keywords</b> ' + escapeHtml(kws.join(", ")) + '</p>' : '')
        : '<p>PubMed에 초록이 등록되지 않은 논문이에요. 제목을 눌러 원문 페이지에서 확인해 주세요.</p>';
      pm.abs[pmid] = html;
      return html;
    }

    document.getElementById("pubmed-list").addEventListener("click", async e => {
      const btn = e.target.closest(".pm-act");
      if (!btn) return;
      const item = btn.closest(".pm-item");
      const pmid = item.dataset.pmid;
      const rec = pm.docs[pmid];
      if (btn.dataset.act === "abs") {
        const box = item.querySelector(".pm-abs");
        // 펼쳐져 있으면 접기 (단, 불러오기에 실패한 상태면 다시 불러옴)
        if (!box.hidden && !box.dataset.failed) { box.hidden = true; btn.textContent = "초록 보기"; return; }
        delete box.dataset.failed;
        box.hidden = false; btn.textContent = "초록 접기";
        if (!pm.abs[pmid]) box.innerHTML = "<p>초록을 불러오는 중…</p>";
        try { box.innerHTML = await pmFetchAbstract(pmid); pmTrAbstract(item); }
        catch (err) {
          box.dataset.failed = "1";
          btn.textContent = "초록 다시 불러오기";
          box.innerHTML = "<p>초록을 불러오지 못했어요. "
            + (err.kind === "offline" ? "인터넷 연결을 확인해 주세요." : err.kind === "busy" ? "PubMed 서버가 잠시 바빠요." : "PubMed에 연결하지 못했어요.")
            + " '초록 다시 불러오기'를 누르거나 제목을 눌러 PubMed에서 확인해 주세요.</p>";
        }
      } else if (btn.dataset.act === "cite") {
        await pmCopy(pmCite(rec));
        pmToast("인용문을 복사했어요");
      } else if (btn.dataset.act === "save") {
        pmToggleSave(rec);
      } else if (btn.dataset.act === "card") {
        pmSendToCard(rec);
      }
    });

    // ----- 카드뉴스로 보내기: 고른 논문을 카드뉴스 의학논문 장에 넣음 -----
    // (처음 화면 자동검색은 관련도 1위 논문을 넣고, 사용자가 고르면 그 논문으로 바꿈)
    pm.cardPmid = "";
    function pmSendToCard(rec) {
      const koTitle = pmTr.on && pmTr.mode === "builtin" ? pmTr.cache.get(rec.title) : "";
      const ev = (rec.types || []).map(t => t[0]).join("·");
      const note = "직접 고른 논문 · " + [koTitle ? shorten(koTitle, 60) : "", rec.source + " " + rec.year, ev, "PMID " + rec.pmid]
        .filter(Boolean).join(" · ");
      fillPaperCard({ title: rec.title, pubdate: rec.year }, rec.pmid, "", "", note);
      pm.cardPmid = rec.pmid;
      pmMarkCardButtons();
      pmToast("카드뉴스 의학논문 장에 넣었어요");
    }
    function pmMarkCardButtons() {
      document.querySelectorAll('#pubmed-list [data-act="card"]').forEach(b => {
        const on = b.closest(".pm-item").dataset.pmid === pm.cardPmid;
        b.classList.toggle("done", on);
        b.textContent = on ? "✓ 카드뉴스에 넣음" : "카드뉴스로 보내기";
      });
    }

    // ----- 한국어 번역 (켜기/끄기): 제목과 펼친 초록을 원문 아래에 한국어로 보여 줌 -----
    // 번역 엔진은 Chrome 내장 번역(Translator API): 이 컴퓨터 안에서 번역해 논문 내용을 밖으로 보내지 않음.
    // 지원하지 않는 브라우저(Safari, 휴대폰 등)에서는 카드마다 '파파고 번역' 링크를 대신 보여 줌.
    const PM_TR_KEY = "jangsoni.pubmed.translate";
    const pmTr = { on: false, translator: null, mode: "", cache: new Map(), queue: Promise.resolve(), gen: 0 };

    function pmTrStatus(msg, warn) {
      const el = document.getElementById("pubmed-tr-status");
      el.hidden = !msg; el.textContent = msg || ""; el.classList.toggle("warn", !!warn);
    }

    const pmWithTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

    // 번역기 준비: 처음 켤 때 영어→한국어 번역 모델을 내려받을 수 있음 (한 번만)
    async function pmTrEnsure() {
      if (pmTr.translator) return pmTr.translator;
      if (!("Translator" in self)) { pmTr.mode = "papago"; return null; }
      pmTrStatus("번역을 준비하는 중이에요…");
      try {
        const avail = await pmWithTimeout(Translator.availability({ sourceLanguage: "en", targetLanguage: "ko" }), 8000);
        if (avail === "unavailable") { pmTr.mode = "papago"; return null; }
        if (avail !== "available") pmTrStatus("번역 모델을 내려받는 중이에요… (처음 한 번만)");
        pmTr.translator = await Translator.create({
          sourceLanguage: "en", targetLanguage: "ko",
          monitor(m) {
            m.addEventListener("downloadprogress", e => pmTrStatus("번역 모델을 내려받는 중이에요… " + Math.round(e.loaded * 100) + "% (처음 한 번만)"));
          }
        });
        pmTr.mode = "builtin";
        return pmTr.translator;
      } catch (e) {
        pmTr.mode = "papago";
        return null;
      }
    }

    // 문장 하나씩 차례로 번역 (같은 문장은 기억해 둔 번역을 씀)
    function pmTrText(text) {
      if (pmTr.cache.has(text)) return Promise.resolve(pmTr.cache.get(text));
      const job = pmTr.queue.then(() => pmTr.translator.translate(text)).then(ko => { pmTr.cache.set(text, ko); return ko; });
      pmTr.queue = job.catch(() => {});
      return job;
    }

    // el 바로 뒤(또는 안)에 번역 줄을 붙이고 채움
    function pmTrFill(host, text, gen) {
      if (!text || host.querySelector(":scope > .pm-ko")) return;
      const ko = document.createElement("span");
      ko.className = "pm-ko wait";
      ko.textContent = "번역 중…";
      host.appendChild(ko);
      pmTrText(text).then(t => {
        if (gen !== pmTr.gen) return;
        ko.textContent = t; ko.classList.remove("wait");
      }).catch(() => { ko.textContent = "번역하지 못했어요"; });
    }

    const pmPapagoUrl = text => "https://papago.naver.com/?sk=en&tk=ko&hn=0&st=" + encodeURIComponent(text.slice(0, 3000));

    // 결과 목록의 제목 번역 (내장 번역이 없으면 파파고 링크 버튼)
    function pmTrList() {
      if (!pmTr.on) return;
      document.querySelectorAll("#pubmed-list .pm-item").forEach(li => {
        const rec = pm.docs[li.dataset.pmid];
        if (!rec) return;
        if (pmTr.mode === "builtin") {
          let host = li.querySelector(".pm-title-ko");
          if (!host) {
            host = document.createElement("div");
            host.className = "pm-title-ko";
            li.querySelector(".pm-title").after(host);
          }
          pmTrFill(host, rec.title, pmTr.gen);
          const abs = li.querySelector(".pm-abs");
          if (!abs.hidden) pmTrAbstract(li);
        } else if (pmTr.mode === "papago" && !li.querySelector('[data-act="papago"]')) {
          li.querySelector(".pm-actions").insertAdjacentHTML("beforeend",
            '<button type="button" class="pm-act" data-act="papago">파파고 번역 ↗</button>');
        }
      });
    }

    // 펼친 초록을 문단마다 번역
    function pmTrAbstract(li) {
      if (!pmTr.on || pmTr.mode !== "builtin") return;
      li.querySelectorAll(".pm-abs p").forEach(p => {
        const t = p.querySelector(".pm-abs-text");
        if (t) pmTrFill(p, t.textContent, pmTr.gen);
      });
    }

    async function pmTrSet(on) {
      pmTr.on = on;
      pmTr.gen++;
      try { localStorage.setItem(PM_TR_KEY, on ? "1" : "0"); } catch (e) {}
      document.querySelectorAll("#pubmed-list .pm-ko, #pubmed-list .pm-title-ko, #pubmed-list [data-act='papago']").forEach(el => el.remove());
      if (!on) { pmTrStatus(""); return; }
      await pmTrEnsure();
      if (!pmTr.on) return;
      if (pmTr.mode === "builtin") pmTrStatus("제목과 펼친 초록을 한국어로 번역해 원문 아래에 보여 줘요. 이 컴퓨터 안에서 번역해 논문 내용이 밖으로 나가지 않아요. 기계 번역이라 보고서에는 원문을 인용해 주세요.");
      else pmTrStatus("이 브라우저는 자체 번역을 지원하지 않아요. 카드의 '파파고 번역 ↗'을 누르면 제목과 초록을 파파고에서 번역해 보여 줘요. (PC용 최신 Chrome·Edge에서는 화면 안에서 바로 번역돼요)", true);
      pmTrList();
    }

    document.getElementById("pubmed-tr").addEventListener("change", e => pmTrSet(e.target.checked));

    // 파파고 번역: 제목 + (불러온 경우) 초록을 새 창의 파파고로 보냄
    document.getElementById("pubmed-list").addEventListener("click", e => {
      const btn = e.target.closest('[data-act="papago"]');
      if (!btn) return;
      const li = btn.closest(".pm-item");
      const rec = pm.docs[li.dataset.pmid];
      const abs = [...li.querySelectorAll(".pm-abs .pm-abs-text")].map(s => s.textContent).join("\n\n");
      window.open(pmPapagoUrl(rec.title + (abs ? "\n\n" + abs : "")), "_blank", "noopener");
    });

    // 지난번에 켜 두었으면 탭을 열 때 다시 켬 (모델 내려받기는 사용자가 직접 켤 때만 시작)
    try {
      if (localStorage.getItem(PM_TR_KEY) === "1") {
        document.getElementById("pubmed-tr").checked = true;
        pmTr.on = true;
        if ("Translator" in self) {
          pmWithTimeout(Translator.availability({ sourceLanguage: "en", targetLanguage: "ko" }), 8000)
            .then(a => a === "available" ? pmTrSet(true) : (a === "unavailable" ? pmTrSet(true) : pmTrStatus("번역을 다시 켜려면 '한국어 번역' 스위치를 한 번 껐다 켜 주세요.", true)))
            .catch(() => pmTrSet(true));
        } else pmTrSet(true);
      }
    } catch (e) {}

    // ----- 논문 모아 두기: 사건별로 이 브라우저에 저장 { 사건 이름: [논문 정보…] } -----
    const PM_SAVED_KEY = "jangsoni.pubmed.saved";
    const PM_CASE_KEY = "jangsoni.pubmed.case";
    function pmLoadSaved() {
      try { return JSON.parse(localStorage.getItem(PM_SAVED_KEY)) || {}; } catch (e) { return {}; }
    }
    function pmStoreSaved(all) {
      try { localStorage.setItem(PM_SAVED_KEY, JSON.stringify(all)); return true; }
      catch (e) { pmToast("이 브라우저에는 저장할 수 없어요"); return false; }
    }
    function pmLoadLastCase() { try { return localStorage.getItem(PM_CASE_KEY) || ""; } catch (e) { return ""; } }
    function pmCaseName() {
      const el = document.getElementById("pubmed-case");
      const name = el.value.trim() || "사건 미지정";
      el.value = name;
      try { localStorage.setItem(PM_CASE_KEY, name); } catch (e) {}
      return name;
    }
    // 처음 화면 입력으로 사건 이름을 만듦 (사고일 · 진단코드 병명 · 쟁점)
    function pmAutoCase(v) {
      const code = v.code ? normCode(v.code) : "";
      const parts = [v.date, code ? code + (KCD[code] ? " " + KCD[code].name : "") : "", v.issue].filter(Boolean);
      return parts.length ? parts.join(" · ") : "";
    }
    const pmIsSaved = pmid => (pmLoadSaved()[pmCaseNameRaw()] || []).some(r => r.pmid === pmid);
    const pmCaseNameRaw = () => document.getElementById("pubmed-case").value.trim() || "사건 미지정";

    function pmToggleSave(rec) {
      const all = pmLoadSaved();
      const name = pmCaseName();
      const list = all[name] || [];
      const i = list.findIndex(r => r.pmid === rec.pmid);
      if (i >= 0) list.splice(i, 1);
      else list.push(Object.assign({}, rec, { savedAt: new Date().toISOString(), query: pmLabel() }));
      if (list.length) all[name] = list; else delete all[name];
      if (!pmStoreSaved(all)) return;
      pmToast(i >= 0 ? "'" + name + "'에서 뺐어요" : "'" + name + "'에 모아 뒀어요");
      pmRefreshStars();
      pmRenderSaved();
    }

    // 사건 이름이 바뀌면 결과 목록의 ★ 표시를 그 사건 기준으로 다시 맞춤
    function pmRefreshStars() {
      const ids = new Set((pmLoadSaved()[pmCaseNameRaw()] || []).map(r => r.pmid));
      document.querySelectorAll("#pubmed-list .pm-item").forEach(li => {
        const b = li.querySelector('[data-act="save"]');
        const on = ids.has(li.dataset.pmid);
        b.classList.toggle("on", on);
        b.textContent = on ? "★ 모아 둠" : "☆ 모아 두기";
      });
    }

    // 모아 둔 논문 패널: 지금 사건을 맨 위에, 나머지 사건은 그 아래
    function pmRenderSaved() {
      const all = pmLoadSaved();
      const cur = pmCaseNameRaw();
      const names = Object.keys(all).sort((a, b) => (b === cur) - (a === cur) || a.localeCompare(b, "ko"));
      document.getElementById("pubmed-case-list").innerHTML = names.map(n => '<option value="' + escapeHtml(n) + '"></option>').join("");
      document.getElementById("pubmed-saved-count").textContent = (all[cur] || []).length;
      const box = document.getElementById("pubmed-saved");
      if (box.hidden) return;
      if (!names.length) { box.innerHTML = '<p class="none">아직 모아 둔 논문이 없어요. 결과 카드의 ☆ 모아 두기를 눌러 주세요.</p>'; return; }
      box.innerHTML = names.map(n => {
        const list = all[n];
        return '<div class="pm-saved-case" data-case="' + escapeHtml(n) + '"><h3>' + escapeHtml(n) + ' <small>(' + list.length + '편)</small>'
          + (n === cur ? ' <span class="pm-tag">지금 사건</span>' : '')
          + '<button type="button" class="pm-act" data-sact="copyall">전체 인용 복사</button>'
          + (n !== cur ? '<button type="button" class="pm-act" data-sact="open">이 사건으로 바꾸기</button>' : '')
          + '<button type="button" class="pm-act" data-sact="clear">사건 지우기</button></h3><ol>'
          + list.map(r => '<li data-pmid="' + escapeHtml(r.pmid) + '"><a href="https://pubmed.ncbi.nlm.nih.gov/' + encodeURIComponent(r.pmid) + '/" target="_blank" rel="noopener">'
            + escapeHtml(pmCite(r)) + '</a> ' + pmEvBadges(r.types || [])
            + ' <button type="button" class="pm-act" data-sact="cite">인용 복사</button>'
            + '<button type="button" class="pm-act" data-sact="remove">빼기</button></li>').join("")
          + '</ol></div>';
      }).join("");
    }

    document.getElementById("pubmed-saved").addEventListener("click", async e => {
      const btn = e.target.closest("[data-sact]");
      if (!btn) return;
      const name = btn.closest(".pm-saved-case").dataset.case;
      const all = pmLoadSaved();
      const list = all[name] || [];
      const li = btn.closest("li");
      const act = btn.dataset.sact;
      if (act === "copyall") {
        await pmCopy(list.map((r, i) => (i + 1) + ". " + pmCite(r)).join("\n"));
        pmToast(list.length + "편의 인용문을 복사했어요");
      } else if (act === "cite") {
        await pmCopy(pmCite(list.find(r => r.pmid === li.dataset.pmid)));
        pmToast("인용문을 복사했어요");
      } else if (act === "open") {
        document.getElementById("pubmed-case").value = name;
        pmCaseName(); pmRefreshStars(); pmRenderSaved();
      } else if (act === "remove" || act === "clear") {
        if (act === "clear" && !confirm("'" + name + "' 사건에 모아 둔 논문 " + list.length + "편을 모두 지울까요? 되돌릴 수 없어요.")) return;
        if (act === "remove") all[name] = list.filter(r => r.pmid !== li.dataset.pmid);
        if (act === "clear" || !all[name].length) delete all[name];
        if (pmStoreSaved(all)) { pmRefreshStars(); pmRenderSaved(); }
      }
    });

    document.getElementById("pubmed-saved-toggle").addEventListener("click", () => {
      const box = document.getElementById("pubmed-saved");
      box.hidden = !box.hidden;
      pmRenderSaved();
    });
    document.getElementById("pubmed-case").addEventListener("change", () => { pmCaseName(); pmRefreshStars(); pmRenderSaved(); });
    document.getElementById("pubmed-case").addEventListener("input", () => { pmRefreshStars(); pmRenderSaved(); });

    // ----- 손해사정 쟁점으로 좁히기: 병명 검색어 AND (쟁점 조건) -----
    // [키, 버튼 이름, 설명, PubMed 조건]  ([tiab]=제목·초록, [mh]=MeSH 주제어, [pt]=논문 종류)
    const PM_ISSUES = [
      ["", "전체", "", ""],
      ["cause", "인과관계·외상성", "사고·외상과 질병·장해 사이의 인과관계, 외상성인지 여부",
        '(trauma*[tiab] OR injur*[tiab] OR accident*[tiab] OR posttraumatic[tiab] OR post-traumatic[tiab] OR causation[tiab] OR causal*[tiab] OR "Wounds and Injuries"[mh])'],
      ["preexist", "기왕증·퇴행성", "이전 병력·퇴행성 변화의 기여도, 질병의 자연경과",
        '(pre-existing[tiab] OR preexisting[tiab] OR degenerat*[tiab] OR "natural history"[tiab] OR age-related[tiab] OR comorbid*[tiab])'],
      ["diag", "진단 기준", "진단확정 요건, 분류 기준, 검사의 정확도, 진료지침",
        '("diagnostic criteria"[tiab] OR classification[tiab] OR diagnos*[ti] OR "Sensitivity and Specificity"[mh] OR guideline[pt] OR "practice guideline"[pt])'],
      ["prog", "예후·장해", "치료 후 경과, 기능 회복, 영구 장해·후유증",
        '(prognos*[tiab] OR outcome*[tiab] OR disabilit*[tiab] OR sequela*[tiab] OR "long-term"[tiab] OR "functional recovery"[tiab])'],
      ["risk", "위험인자·발병", "발병 원인·유발 요인(과로·스트레스·음주 등), 발병 시점",
        '("Risk Factors"[mh] OR "risk factor"[tiab] OR etiolog*[tiab] OR trigger*[tiab] OR precipitat*[tiab] OR onset[tiab])'],
      ["death", "사망 원인·급사", "사인 판단, 돌연사·급사, 부검 소견 (외래성·내인사 구별)",
        '("Cause of Death"[mh] OR "cause of death"[tiab] OR "Death, Sudden"[mh] OR "sudden death"[tiab] OR autops*[tiab] OR forensic[tiab])'],
      ["treat", "치료 필요성", "입원·수술의 적응증, 입원 기간, 치료 효과",
        '(indication*[tiab] OR hospitali*[tiab] OR "length of stay"[tiab] OR "Treatment Outcome"[mh] OR effectiveness[tiab])']
    ];
    // 처음 화면의 쟁점 → 버튼
    const PM_ISSUE_OF = {
      "외래성": "death", "우연성": "cause", "재해 해당 여부": "cause", "사고 인과관계": "cause", "고의·자살 면책": "death",
      "면책·감액기간": "risk", "진단확정": "diag", "암 분류": "diag", "원발부위·전이암": "diag", "뇌혈관질환 해당 여부": "diag",
      "심장질환 해당 여부": "diag", "질병코드 분류": "diag", "장해 지급률": "prog", "장해 고정": "prog", "기왕장해·기여도": "preexist",
      "입원 필요성": "treat", "수술 해당 여부": "treat", "암 직접치료": "treat", "실손 비급여 적정성": "treat"
    };
    pm.issue = "";
    const pmIssue = key => PM_ISSUES.find(i => i[0] === key) || PM_ISSUES[0];
    function pmCombine(base, key) {
      const cond = pmIssue(key)[3];
      return base && cond ? "(" + base + ") AND " + cond : base;
    }
    function pmLabel() {
      const { labels } = pmFilterParts();
      return "'" + pm.query + "'" + (pm.issue ? " + 쟁점 '" + pmIssue(pm.issue)[1] + "'" : "")
        + (labels.length ? " [" + labels.join(", ") + "]" : "");
    }
    function pmSetIssue(key) {
      pm.issue = pmIssue(key)[0];
      document.querySelectorAll(".pm-issue").forEach(b => b.classList.toggle("active", b.dataset.issue === pm.issue));
      const it = pmIssue(pm.issue);
      document.getElementById("pubmed-issue-desc").textContent = it[0] ? it[1] + ": " + it[2] + " 관련 논문만 골라요." : "";
    }
    document.getElementById("pubmed-issues").innerHTML = PM_ISSUES.map(([k, label, desc]) =>
      '<button type="button" class="pm-issue" data-issue="' + k + '" title="' + escapeHtml(desc || "쟁점 조건 없이 검색") + '">' + escapeHtml(label) + '</button>').join("");
    document.querySelectorAll(".pm-issue").forEach(b => b.addEventListener("click", () => {
      pmSetIssue(b.dataset.issue);
      if (document.getElementById("pubmed-query").value.trim()) pubmedSearch(false);
    }));
    pmSetIssue("");

    document.getElementById("pubmed-form").addEventListener("submit", e => {
      e.preventDefault();
      pubmedSearch(false);
    });
    document.getElementById("pubmed-sort").addEventListener("change", () => {
      if (document.getElementById("pubmed-query").value.trim()) pubmedSearch(false);
    });
    document.getElementById("pubmed-more").addEventListener("click", () => pubmedSearch(true));

    function showScreen(id) {
      SCREENS.forEach(s => { document.getElementById(s).hidden = s !== id; });
      // 판례 탭에 들어올 때마다 법제처에서 새로 검색
      if (id === "law") refreshLiveLaw();
      // 의학 논문 탭: 검색어가 있으면 결과 목록을 바로 보여 줌
      if (id === "pubmed") pubmedAutoSearch();
      // 약관(현대해상) 페이지도 처음 열 때 한 번만 불러옴
      document.title = TITLES[id];
      window.scrollTo(0, 0);
    }

    // KOICD 찾기: 아래에 분류·코딩지침·코딩사례 표시 (showKoicd는 KOICD 데이터 부분에 있음)
    document.getElementById("koicd-form").addEventListener("submit", e => {
      e.preventDefault();
      showKoicd(document.getElementById("koicd-query").value);
    });

    let analyzedCaseKey = "";
    function prepareCaseAnalysis() {
      // 상품 약관을 불러온 뒤에는 약관에 있는 담보만 받음
      if (!introValidateCover()) {
        const input = document.getElementById("in-cover");
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      runAutoSearch();
      analyzedCaseKey = JSON.stringify(readCaseInput());
      return true;
    }

    // 시작하기 → 입력값으로 자동검색 후 메뉴 화면
    document.getElementById("start").addEventListener("click", () => {
      if (prepareCaseAnalysis()) Jangsoni.navigate("menu");
    });

    // 메뉴 버튼과 뒤로 가기 버튼 (data-go에 적힌 화면으로 이동)
    document.querySelectorAll("[data-go]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.name) {
          document.getElementById("soon-title").textContent = btn.dataset.name;
        }
        Jangsoni.navigate(btn.dataset.go, btn.dataset.scrollTarget);
      });
    });

    // 판례 데이터 (법제처 검색 결과의 사건번호·선고일을 그대로 사용)
    const CASES = [
      {
        title: "운전 중 급성 심근경색으로 사망",
        category: "상해사망",
        type: "외래성",
        summary: "승용차를 운전하다 급성 심근경색으로 사망한 사고예요. 대법원은 질병이 갑자기 나타난 것이라 '우발적인 외래의 사고'인 재해가 아니라고 봤어요. 교통재해사망보험금은 지급되지 않았어요.",
        caseNo: "2007다67920",
        date: "2007.12.13"
      },
      {
        title: "돌을 옮기다 쓰러져 사망",
        category: "상해사망",
        type: "외래성",
        summary: "과수원에서 돌을 옮기다 갑자기 쓰러져 사망한 사고예요. 대법원은 일하다 쓰러졌다는 사실만으로는 외래의 사고라고 단정할 수 없다고 봤어요. 외래성은 보험금을 청구하는 쪽이 증명해야 해요.",
        caseNo: "2001다27579",
        date: "2001.08.21"
      },
      {
        title: "에어컨을 켜고 자다 사망",
        category: "상해사망",
        type: "외래성",
        summary: "원룸에서 에어컨을 켜고 자다 사망한 사고예요. 대법원은 에어컨 때문에 저체온증으로 사망했다는 인과관계를 인정하지 않았어요. 유족이 부검을 거부해서 생긴 불이익은 유족이 부담한다고 했어요.",
        caseNo: "2010다12241",
        date: "2010.09.30"
      },
      {
        title: "요양병원 식사 중 사망 (질식 vs 심근경색)",
        category: "상해사망",
        type: "외래성",
        summary: "요양병원에서 식사 중 의식을 잃고 사망한 사고예요. 사인 감정이 질식과 급성 심근경색으로 갈렸어요. 대법원은 감정을 보완하지 않고 질식(외래 사고)으로 인정한 원심이 잘못이라고 했어요.",
        caseNo: "2022다303216",
        date: "2023.04.27"
      },
      {
        title: "사고 후 사망, 실제 원인은 고혈압성 지주막하출혈",
        category: "상해사망",
        type: "외래성",
        summary: "사고 직후 사망했지만, 직접 원인은 지병인 고혈압으로 생긴 지주막하출혈로 판단했어요. 고혈압을 알리지 않은 고지의무 위반을 이유로 한 보험계약 해지도 인정됐어요.",
        caseNo: "2000다40353",
        date: "2001.01.05"
      },
      {
        title: "자살은 재해사망특약의 재해가 아님",
        category: "상해사망",
        type: "우연성",
        summary: "자살은 우연히 일어난 사고가 아니어서 재해사망특약이 보장하는 재해에 해당하지 않아요. 주계약의 자살 면책 예외 조항도 재해사망특약에는 적용되지 않는다고 봤어요.",
        caseNo: "2008다81633",
        date: "2009.05.28"
      },

      // 장해
      {
        title: "장해진단 다음 날 사망, 장해연금은 안 됨",
        category: "장해",
        issue: "장해 고정 여부",
        summary: "교통사고로 식물인간 상태였다가 후유장해진단을 받은 다음 날 사망한 사고예요. 사망으로 가는 중에 거친 일시적 상태는 증상이 고정된 '장해'가 아니라고 봤어요. 장해연금을 인정한 원심을 파기했어요.",
        caseNo: "2008다13968",
        date: "2008.06.26"
      },
      {
        title: "팔 절단 후 뇌출혈로 사망, 장해금도 따로 지급",
        category: "장해",
        issue: "장해·사망 중복 지급",
        summary: "교통사고로 팔이 절단되고 외상성 뇌출혈로 사망한 사고예요. 약관에 중복 지급 규정이 있었고, 팔 절단은 사망과 관련 없이 이미 고정된 장해라고 봤어요. 사망공제금과 별도로 장해공제금도 받을 수 있다고 했어요.",
        caseNo: "2021다284462",
        date: "2022.03.17"
      },
      {
        title: "가입 전부터 있던 장해, 보장 여부는 약정에 따름",
        category: "장해",
        issue: "기왕장해",
        summary: "보험 가입 전에 이미 손가락 장해가 있던 사람이 사고로 장해가 생긴 사고예요. 가입 전 원인이나 이미 있던 장해를 보장할지는 보험사와 계약자의 약정으로 정한다고 봤어요.",
        caseNo: "2012다25890",
        date: "2013.10.11"
      },
      {
        title: "자살 시도로 1급 장해, 재해장해연금은 아님",
        category: "장해",
        issue: "재해 해당 여부",
        summary: "자살을 시도하다 1급 장해가 된 사고예요. 고의로 자신을 해친 것은 재해가 아니어서 재해장해연금 대상이 아니라고 봤어요. 재해가 아닌 원인에 따른 공제금(유족위로금)만 받을 수 있다고 했어요.",
        caseNo: "2010다45777",
        date: "2010.11.25"
      },
      {
        title: "페인트칠 중 뇌교출혈, 재해장해 아님",
        category: "장해",
        issue: "재해 해당 여부",
        summary: "페인트칠을 하다 뇌교출혈로 영구장해가 생긴 사고예요. 출혈은 시너 흡입이 아니라 평소 고혈압 때문으로 봤어요. 약관상 뇌출혈(I61)은 재해에서 빠져 재해장해 보험금 대상이 아니라고 했어요.",
        caseNo: "2000다25965",
        date: "2001.07.24"
      },

      // 뇌혈관질환
      {
        title: "뇌경색 장기 입원, 입원일당 반환",
        category: "뇌혈관질환",
        issue: "입원 필요성",
        summary: "뇌경색으로 3년 넘게 입원하며 2대질병입원일당을 받은 사고예요. 입원이 치료에 꼭 필요했다고 보기 어려워 보험금을 돌려줘야 한다고 했어요. 보험사가 심사 때 못 걸러냈어도 반환 의무는 그대로예요.",
        caseNo: "2015다7626",
        date: "2017.09.26"
      },
      {
        title: "고혈압성 지주막하출혈 사망, 고지의무 위반 해지",
        category: "뇌혈관질환",
        issue: "고지의무",
        summary: "사망 원인을 지병인 고혈압으로 생긴 지주막하출혈로 판단했어요. 보험사 건강검진센터에서 고혈압이 확인됐어도 보험 심사 부서가 알 수 없었다면 보험사가 알았다고 볼 수 없다고 했어요. 고지의무 위반을 이유로 한 해지가 인정됐어요.",
        caseNo: "2000다40353",
        date: "2001.01.05"
      },
      {
        title: "뇌교출혈(I61)은 재해 아님",
        category: "뇌혈관질환",
        issue: "재해 해당 여부",
        summary: "작업 중 생긴 뇌교출혈이 고혈압 때문에 저절로 생긴 출혈로 보인다고 판단했어요. 약관상 질병코드(I61)로 분류되는 뇌출혈은 재해에서 빠진다고 봤어요. 재해 보험금을 인정한 원심을 파기했어요.",
        caseNo: "2000다25965",
        date: "2001.07.24"
      },

      // 심혈관질환
      {
        title: "운전 중 급성 심근경색, 교통재해 아님",
        category: "심혈관질환",
        issue: "재해 해당 여부",
        summary: "운전 중 급성 심근경색으로 사망했지만, 질병이 갑자기 나타난 것이라 재해가 아니라고 봤어요. 교통재해사망보험금은 지급되지 않았어요.",
        caseNo: "2007다67920",
        date: "2007.12.13"
      },
      {
        title: "운전 중 심장마비, 외래 사고인지 따져야",
        category: "심혈관질환",
        issue: "재해 해당 여부",
        summary: "운전 중 심장마비로 사망한 사고예요. 교통재해도 '우발적인 외래의 사고'여야 보험금이 나간다고 봤어요. 이를 따지지 않고 보험금을 인정한 원심을 파기했어요.",
        caseNo: "2009다51318",
        date: "2010.09.30"
      },
      {
        title: "사인 감정이 질식과 심근경색으로 엇갈림",
        category: "심혈관질환",
        issue: "사망 원인 감정",
        summary: "요양병원 식사 중 사망했는데, 사인 감정이 질식과 급성 심근경색으로 갈렸어요. 감정을 보완하지 않고 질식으로 인정해 상해사망보험금을 준 원심을 파기했어요.",
        caseNo: "2022다303216",
        date: "2023.04.27"
      },
      {
        title: "심장병이 있어도 외부 요인이 주원인이면 상해",
        category: "심혈관질환",
        issue: "질병과 외래 사고",
        summary: "가벼운 심장질환이 있던 사람이 술에 취해 고온의 밀폐된 차 안에서 자다 사망한 사고예요. 대법원은 주된 사망 원인이 외부 요인이라 상해사고에 해당한다고 봤어요. 보험금 청구를 받아들이지 않은 원심을 파기했어요.",
        caseNo: "2018다228356",
        date: "2018.08.30"
      },
      {
        title: "검안의 '심근경색' 소견에도 음주 사고로 인정",
        category: "심혈관질환",
        issue: "질병과 외래 사고",
        summary: "술에 취해 귀가한 뒤 숨진 채 발견된 사고예요. 검안의는 심근경색으로 봤지만, 심장·뇌혈관 질환이 없었고 넘어져 다쳤을 가능성이 커서 외래의 사고로 인정했어요. 공제금 지급이 확정됐어요.",
        caseNo: "2013다63776",
        date: "2014.06.12"
      },

      // 암
      {
        title: "병리상 양성 종양이면 암 진단 아님",
        category: "암",
        issue: "진단확정(병리)",
        summary: "임상적으로는 악성에 가까웠지만 조직검사에서는 양성으로 나온 종양 사고예요. 약관은 병리 전문의의 조직검사로 암을 확정하게 되어 있어서 암보험금 대상이 아니라고 봤어요. 보험사 승소가 확정됐어요.",
        caseNo: "2018다203395",
        date: "2018.06.28"
      },
      {
        title: "직장 유암종(D37.5 vs C20)은 암에 해당",
        category: "암",
        issue: "암 분류(KCD)",
        summary: "1cm 미만 직장 용종을 떼어 냈고, 진단서에 D37.5와 C20이 엇갈려 적힌 사고예요. 약관의 '암' 뜻이 분명하지 않으면 고객에게 유리하게 해석해야 한다고 했어요. 직장 유암종을 암으로 인정했어요.",
        caseNo: "2017다285109",
        date: "2018.07.24"
      },
      {
        title: "간이식 후 합병증 수술은 암 수술비 대상 아님",
        category: "암",
        issue: "암 직접치료",
        summary: "간암으로 간이식을 받은 뒤 생긴 담도 협착을 넓히는 시술을 반복한 사고예요. 이미 암이 없는 상태에서 합병증을 치료한 것이라 '암의 치료를 직접 목적으로 하는 수술'이 아니라고 봤어요. 수술비 부지급이 확정됐어요.",
        caseNo: "2010다40543",
        date: "2010.09.30"
      },
      {
        title: "원발부위 기준 조항은 설명해야 하는 중요 내용",
        category: "암",
        issue: "설명의무(원발부위)",
        summary: "갑상선암(C73)과 림프절 전이(C77.9)를 진단받았는데, 보험사가 원발부위 기준으로 갑상선암 보험금만 준 사고예요. 원발부위 기준 조항은 보험금과 직결되는 중요한 내용이라 보험사가 설명해야 한다고 봤어요. 청구를 기각한 원심을 파기했어요.",
        caseNo: "2023다250746",
        date: "2025.03.13"
      },
      {
        title: "일반암 보험금을 받았다면 갑상선암 추가 지급 없음",
        category: "암",
        issue: "원발부위·중복 지급",
        summary: "갑상선암(C73)과 림프절 전이(C77.0) 진단으로 보험사가 고액 일반암 보험금을 이미 준 사고예요. 설명의무를 위반했더라도 일반암 기준으로 지급하면 충분하다고 봤어요. 갑상선암 보험금을 따로 더 달라는 청구는 기각됐어요.",
        caseNo: "2023다274056",
        date: "2025.05.15"
      },
      {
        title: "예방 목적을 겸한 난소 절제도 치료 목적",
        category: "암",
        issue: "치료 목적 수술",
        summary: "자궁적출과 함께 양쪽 난소를 절제했는데, 보험사가 난소암 예방 목적이라며 납입면제를 거절한 사고예요. 의사가 현장에서 치료 목적을 겸해 판단했다면 예방 목적이 섞였어도 보험사고로 본다고 했어요. 납입면제가 인정됐어요.",
        caseNo: "2021다234368",
        date: "2021.09.09"
      }
    ];
    // 추가 판례 (국가법령정보센터 판례 원문의 판시사항·판결요지를 읽고 정리). keywords: 진단명·KCD 코드 등 관련 판례 고르기에 씀
    const CASES_MORE = [
      {"title":"질병이 주원인이면 경미한 외인은 재해 아님","category":"상해사망","issue":"외래성","type":"외래성","keywords":["재해사망","기왕증","체질적 요인","경미한 외인","단체보험"],"summary":"질병이나 체질적 요인이 있던 사람이 가벼운 외부 요인으로 사망해 재해사망보험금을 청구한 사고예요. 대법원은 사망의 주된 원인이 질병이면 경미한 외인은 재해로 보지 않는 약관이 유효하다고 봤어요.","caseNo":"93다29396","date":"1994.12.27","result":"보험사 승"},
      {"title":"정신질환 중 목맨 사망은 질병사망 아님","category":"상해사망","issue":"외래성","type":"외래성","keywords":["질병사망","자살","정신질환","경부압박질식"],"summary":"정신과 치료를 받던 사람이 목을 매 숨지자 질병사망보험금을 청구한 사고예요. 대법원은 직접 사인이 외부 요인인 질식이므로 질병으로 인한 사망으로 볼 수 없다고 봤어요.","caseNo":"2013다18929","date":"2014.04.10","result":"보험사 승(파기환송)"},
      {"title":"술에 취해 건물 밖으로 추락해도 재해","category":"상해사망","issue":"우연성","type":"우연성","keywords":["추락","음주","만취","고의 자해"],"summary":"술에 취한 피보험자가 건물 밖으로 떨어져 다친 사고예요. 대법원은 우발적인 외래의 사고로서 재해에 해당하고, 보험사가 고의로 자신을 해쳤다는 점을 증명하지 못했다고 봤어요.","caseNo":"2010다6857","date":"2010.05.13","result":"고객 승"},
      {"title":"사고 경위를 증명 못하면 상해 인정 안 돼","category":"상해사망","issue":"우연성","type":"우연성","keywords":["늑골 골절","교통상해","증명책임","사고 경위"],"summary":"운전 중 다쳤다며 상해 의료비와 입원비를 청구했지만 사고 경위가 확인되지 않은 사고예요. 대법원은 사고의 우연성과 외래성은 청구하는 쪽이 증명해야 한다며 보험금을 인정하지 않았어요.","caseNo":"2003다35215","date":"2003.11.28","result":"보험사 승"},
      {"title":"고소작업차 작업대 추락도 교통사고","category":"상해사망","issue":"재해 해당 여부","keywords":["추락","고소작업차","특수자동차","교통상해사망","운행 중"],"summary":"고소작업차 작업대에서 외벽 도장을 하다 와이어가 끊어져 추락사한 사고예요. 대법원은 차량 장치를 용법대로 쓰던 중의 사고라서 약관상 자동차 운행 중 교통사고에 해당한다고 봤어요.","caseNo":"2014다73053","date":"2015.01.29","result":"고객 승(파기환송)"},
      {"title":"주차한 사다리차 작업 중 추락은 운전 아님","category":"상해사망","issue":"재해 해당 여부","keywords":["추락","고가사다리차","운전자상해보험","이삿짐"],"summary":"오래 주차해 둔 화물차의 고가사다리로 이삿짐을 옮기다 인부가 떨어져 숨진 사고예요. 대법원은 차량 운전과 무관한 작업 중 사고라서 운전자상해보험의 보상 대상이 아니라고 봤어요.","caseNo":"2009다9294","date":"2009.05.28","result":"보험사 승(파기환송)"},
      {"title":"총상 수술 뒤 심근경색 사망도 상해 결과","category":"상해사망","issue":"사고 인과관계","keywords":["총상","급성 심근경색","I21","수술 후 사망","직접 결과"],"summary":"사냥 중 허벅지에 총을 맞아 여러 번 수술받은 뒤 5일 만에 심근경색으로 숨진 사고예요. 대법원은 인과관계는 의학적으로 명백할 필요가 없다며 상해의 직접 결과로 사망한 것으로 봤어요.","caseNo":"99다67147","date":"2000.03.28","result":"고객 승(파기환송)"},
      {"title":"보험기간 중 교통사고, 만기 뒤 사망도 지급","category":"상해사망","issue":"사고 인과관계","keywords":["교통재해","보험기간","만기 후 사망","작성자 불이익"],"summary":"보험기간 중 교통사고를 당했는데 만기가 지난 뒤에 숨진 사고예요. 대법원은 약관 문구가 두 가지로 읽혀 고객에게 유리하게 해석해야 하고, 사고와 사망의 인과관계도 있다며 보험금을 인정했어요.","caseNo":"2025다211789","date":"2026.04.02","result":"고객 승(파기환송)"},
      {"title":"우울증 악화 상태 자살은 면책 아닐 수 있어","category":"상해사망","issue":"고의·자살 면책","keywords":["자살","우울증","주요우울장애","F32","심신상실"],"summary":"우울증으로 오래 치료받던 사람이 술에 취해 목을 매 숨진 사고예요. 대법원은 통화나 자살 방식만 보지 말고 병의 경과를 종합해야 하며, 자유로운 의사결정을 못 한 상태였을 여지가 크다고 봤어요.","caseNo":"2022다238800","date":"2023.05.18","result":"고객 승(파기환송)"},
      {"title":"치료 이력 없어도 심신상실 자살 인정 가능","category":"상해사망","issue":"고의·자살 면책","keywords":["자살","우울증","F32","심신상실","정신과 진료 이력 없음"],"summary":"야근 후 귀가한 직장인이 갑자기 목을 매 숨졌는데 정신과 치료 기록은 없던 사고예요. 대법원은 진료 이력이 없어도 정황과 의학적 견해로 우울증에 의한 심신상실 여부를 따져야 한다고 봤어요.","caseNo":"2021다297529","date":"2024.05.09","result":"고객 승(파기환송)"},
      {"title":"정신질환 면책 조항 있으면 보험금 없어","category":"상해사망","issue":"고의·자살 면책","keywords":["자살","조현병","F20","정신질환 면책","상해사망"],"summary":"조현병으로 자유로운 판단을 못 하는 상태에서 목을 매 숨진 사고예요. 대법원은 자살 면책은 안 되지만, 약관에 정신질환으로 인한 상해를 따로 면책으로 정했다면 보험사가 책임을 면한다고 봤어요.","caseNo":"2015다5378","date":"2015.06.23","result":"보험사 승(파기환송)"},
      {"title":"신경계 파생장해는 합산해 비교해야","category":"장해","issue":"장해 지급률","keywords":["경추척수증","추간판탈출증","M50","운동장해","신경계 장해"],"summary":"계단에서 넘어져 경추척수증과 팔·손가락 운동장해 등이 생긴 사고예요. 대법원은 신경계 장해에서 생긴 여러 부위 장해는 지급률을 합산한 뒤 신경계 장해 지급률과 비교해 높은 쪽을 적용해야 한다고 봤어요.","caseNo":"2013다90891","date":"2016.10.27","result":"고객 승(파기환송)"},
      {"title":"파생장해는 신경계 장해와 비교해 최고만","category":"장해","issue":"장해 지급률","keywords":["비골신경손상","족관절 운동장해","발가락 운동장해","공제","교통사고"],"summary":"교통사고로 비골신경이 다쳐 발목과 발가락 운동장해가 생긴 공제 사고예요. 대법원은 신경계 장해 지급률도 산정해 파생 장해들과 함께 비교하고 그중 가장 높은 지급률을 적용해야 한다고 봤어요.","caseNo":"2011다68302","date":"2011.11.10","result":"고객 승(파기환송)"},
      {"title":"사망 전 일시적 장해면 장해보험금 아냐","category":"장해","issue":"장해 고정","keywords":["재해장해연금","재해사망","증상 고정","일시적 장해"],"summary":"재해로 장해진단을 받은 뒤 치료 중 숨져 장해보험금도 청구한 사고예요. 대법원은 증상이 고정되지 않고 사망으로 가는 일시적 상태였다면 사망보험금만 받을 수 있다고 봤어요.","caseNo":"2011다45736","date":"2013.05.23","result":"보험사 승"},
      {"title":"180일 내 장해 생겼으면 확정 늦어도 지급","category":"장해","issue":"장해 고정","keywords":["복합부위통증증후군","CRPS","하지 기능장해","180일","진단 확정"],"summary":"버스에서 내리다 다쳐 180일 안에 다리 기능장해가 시작됐고 3년여 뒤 신체감정을 받은 사고예요. 대법원은 약관은 180일 내 장해 발생만 요구할 뿐 진단 확정까지 그 안에 할 필요는 없다고 봤어요.","caseNo":"2013다43956","date":"2014.07.24","result":"고객 승(파기환송)"},
      {"title":"장해 악화분 청구 시효는 악화 안 때부터","category":"장해","issue":"장해 고정","keywords":["후유장해","장해 악화","소멸시효","180일 진단"],"summary":"후유장해보험금을 받은 뒤 장해가 악화돼 추가 보험금을 청구한 사고예요. 대법원은 시효가 실제 재진단일이 아니라 악화를 알았거나 알 수 있었던 때부터 진행한다고 보고 다시 판단하게 했어요.","caseNo":"2019다214248","date":"2023.07.13","result":"보험사 승(파기환송)"},
      {"title":"기왕증 감액은 약관에 근거 있을 때만","category":"장해","issue":"기왕장해·기여도","keywords":["기왕증","기여도","후유장해 80%","안구 장해"],"summary":"기존 질환이 있던 피보험자가 사고 후 고도 후유장해 보험금을 청구한 사고예요. 대법원은 약관 기준으로 지급률이 80% 이상이면 지급 의무가 생기고, 기왕증은 약관에 따라 금액에서 기여분만 감액하면 된다고 봤어요.","caseNo":"2004다52033","date":"2005.10.27","result":"고객 승(파기환송)"},
      {"title":"기왕장해 감액 규정도 설명해야 적용","category":"장해","issue":"기왕장해·기여도","keywords":["기왕장해","감액","동일 부위","설명의무"],"summary":"같은 부위에 예전 장해가 있던 피보험자가 후유장해보험금을 청구하자 보험사가 기왕장해만큼 깎으려 한 사고예요. 대법원은 이런 감액 규정은 예상하기 어려워 설명하지 않았다면 적용할 수 없다고 봤어요.","caseNo":"2014다229917","date":"2015.03.26","result":"고객 승"},
      {"title":"청약 직전 입원·의뢰서 숨기면 인과관계 有","category":"계약·면책","issue":"고지의무 위반","keywords":["만성 골수성 백혈병","C92.1","급성 신우신염","진료의뢰서","알릴 의무"],"summary":"계약 직전 입원하고 백혈구 수치 이상으로 진료의뢰서를 받고도 알리지 않았다가 백혈병 진단을 받은 사고예요. 대법원은 인과관계가 조금이라도 있으면 보험사가 지급을 거절할 수 있다고 봤어요.","caseNo":"2024다272941","date":"2025.01.09","result":"보험사 승(파기환송)"},
      {"title":"중병 증상 알면서 숨기면 중대한 과실","category":"계약·면책","issue":"고지의무 위반","keywords":["폐결핵","질병사망","알릴 의무","중대한 과실"],"summary":"가입 이틀 뒤 고도의 폐결핵으로 숨진 피보험자가 출근도 못 할 만큼 아팠던 사실을 알리지 않은 사고예요. 대법원은 병명은 몰랐어도 심각한 이상을 알았으니 중대한 과실로 고지의무를 어겼다고 봤어요.","caseNo":"2018다281241","date":"2019.04.23","result":"보험사 승(파기환송)"},
      {"title":"처음부터 다른 직업이면 통지의무 위반 아냐","category":"계약·면책","issue":"통지의무 위반","keywords":["추락","건설 일용직","직업 고지","계약 후 알릴 의무"],"summary":"건설 일용직인데 가입 때 사무직으로 알렸고 이후 작업 중 추락사한 사고예요. 대법원은 보험기간 중 직업이 바뀐 게 아니므로 통지의무 위반이 아니고, 고지의무 해지 기간이 지났어도 마찬가지라고 봤어요.","caseNo":"2024다219766","date":"2024.06.27","result":"고객 승"},
      {"title":"설계사에 직업변경 알렸다면 통지 이행","category":"계약·면책","issue":"통지의무 위반","keywords":["직업 변경","화물차 운전기사","교통사고","보험금 감액"],"summary":"경찰관에서 화물차 기사로 직업을 바꾼 뒤 다른 보험 설계사에게 이를 알렸고, 이후 교통사고가 난 사고예요. 대법원은 같은 회사의 상해보험에 대해서도 통지의무를 다한 것으로 봐야 한다고 판단했어요.","caseNo":"2022다238633","date":"2024.11.28","result":"고객 승(파기환송)"},
      {"title":"오토바이 운전 시작 안 알리면 해지 가능","category":"계약·면책","issue":"통지의무 위반","keywords":["이륜자동차","오토바이","두개골 골절","위험 증가","후유장해"],"summary":"가입 후 아들이 면허를 따 오토바이를 타다 크게 다쳤는데 이를 알리지 않은 사고예요. 대법원은 청약서에서 오토바이 운전을 물었던 만큼 위험 증가를 알았다고 보고 보험사의 해지를 인정했어요.","caseNo":"2012다62318","date":"2014.07.24","result":"보험사 승"},
      {"title":"부담보 예외 안 알린 설계사, 보험금 배상","category":"계약·면책","issue":"설명의무 위반","keywords":["이륜자동차 부담보","출퇴근","교통사고","보험설계사","손해배상"],"summary":"이륜차 부담보 특약이 붙은 보험의 피보험자가 오토바이로 출근하다 사고로 숨진 사고예요. 대법원은 설계사가 출퇴근 예외 조건을 설명하지 않았으니 보험사가 보험금 전액을 손해배상해야 한다고 봤어요.","caseNo":"2022다200317","date":"2024.12.12","result":"고객 승(파기환송)"},
      {"title":"의료처치 면책 조항도 설명 안 하면 무효","category":"계약·면책","issue":"설명의무 위반","keywords":["재생불량성빈혈","D61","약물 부작용","의료처치 면책","후유장해"],"summary":"재생불량성빈혈 치료 약을 쓰다 부작용으로 장해가 생긴 사고예요. 대법원은 수술·의료처치 부작용 면책 조항은 고객이 쉽게 예상할 수 없어 설명하지 않았다면 내세울 수 없다고 봤어요.","caseNo":"2020다256675","date":"2022.03.31","result":"고객 승(파기환송)"},
      {"title":"적재함 덮개 씌우다 추락도 하역작업 면책","category":"계약·면책","issue":"위험 활동 면책","keywords":["추락","화물차 적재함","하역작업","운전자보험","주관절 탈구"],"summary":"화물을 다 실은 뒤 적재함에 올라가 덮개를 씌우다 미끄러져 다친 사고예요. 대법원은 이것도 운전자보험 약관이 보상하지 않는 하역작업 중의 사고에 해당한다고 봤어요.","caseNo":"2015다15405","date":"2015.08.19","result":"보험사 승(파기환송)"},
      {"title":"공무감독은 선박 직무 탑승 면책 아냐","category":"계약·면책","issue":"위험 활동 면책","keywords":["선박","하선","교통상해","직무상 탑승 면책","작업 중 면책"],"summary":"선박회사 공무감독이 배를 타고 내리는 과정에서 다친 사고예요. 대법원은 하선도 탑승에 포함되고, 공무감독은 배 타는 게 직무인 사람이 아니며, 점검 작업 착수 전 사고라 면책 조항이 적용되지 않는다고 봤어요.","caseNo":"2004다65138","date":"2005.04.15","result":"고객 승"},
      {"title":"부활계약엔 책임개시 전 암 무효조항 안 돼","category":"계약·면책","issue":"면책·감액기간","keywords":["암","책임개시일","부활","계약 무효","설명의무"],"summary":"실효된 암보험을 부활시킨 뒤 암 진단을 받은 사고예요. 대법원은 책임개시 전 암 진단 시 무효 조항이 부활계약엔 적용되지 않고, 책임개시 시기를 따로 정한 약관은 설명해야 하는 중요 내용이라고 봤어요.","caseNo":"2004다26164","date":"2005.12.09","result":"고객 승"},
      {"title":"2년 지나 자살하면 재해사망금 지급 대상","category":"계약·면책","issue":"면책·감액기간","keywords":["자살","재해사망특약","책임개시 2년","작성자 불이익"],"summary":"재해사망특약 가입자가 책임개시일부터 2년이 지난 뒤 자살한 사고예요. 대법원은 약관 단서는 2년 경과 후 자살을 보험금 지급 사유로 포함하는 뜻이라며 재해사망보험금을 줘야 한다고 봤어요.","caseNo":"2015다243347","date":"2016.05.12","result":"고객 승(파기환송)"},
      {"title":"계곡물 머리감다 뇌출혈, 재해 아닌 질병","category":"뇌혈관질환","issue":"뇌혈관질환 해당 여부","keywords":["뇌출혈","뇌내출혈","I61","고혈압","재해사망"],"summary":"혈압이 높던 사람이 차가운 계곡물에 머리를 감다가 뇌출혈로 쓰러져 숨진 사고예요. 찬물은 가벼운 외부 요인일 뿐이라 재해가 아니라 질병(뇌출혈)으로 인한 사망이라고 봤어요.","caseNo":"2001나13492","date":"2002.03.22","court":"부산지방법원","result":"보험사 승"},
      {"title":"운전 중 뇌실내출혈 사고, 교통재해 아님","category":"뇌혈관질환","issue":"뇌혈관질환 해당 여부","keywords":["뇌실내출혈","뇌출혈","I61","교통재해","재해사망"],"summary":"화물차를 운전하다 저절로 생긴 뇌실내출혈로 사고를 내고 숨진 사고예요. 사고 충격은 가벼운 외부 요인에 불과하고 사망 원인은 뇌출혈이라 교통재해 보험금 대상이 아니라고 봤어요.","caseNo":"2004나2809","date":"2004.09.09","court":"부산고등법원","result":"보험사 승"},
      {"title":"뇌혈관질환 가능성만으론 상해 부정 못 해","category":"뇌혈관질환","issue":"뇌혈관질환 해당 여부","keywords":["뇌허혈","뇌혈관질환","I63","익사","상해사망"],"summary":"뇌허혈 병력이 있던 사람이 개울에서 익사한 채 발견되자 보험사가 뇌혈관질환으로 쓰러졌을 수 있다며 거절했어요. 검안상 익사이고 미끄러져 넘어진 정황이 있어 상해사망으로 인정했어요.","caseNo":"2014가단33686","date":"2015.01.09","court":"창원지방법원 진주지원","result":"고객 승"},
      {"title":"운전 중 심근경색 사망은 교통재해 아님","category":"심혈관질환","issue":"심장질환 해당 여부","keywords":["급성심근경색","I21","허혈성심장질환","관상동맥","교통재해"],"summary":"운전하다 급성심근경색으로 정신을 잃고 중앙선을 넘어 충돌한 뒤 숨진 사고예요. 부검상 관상동맥이 막혀 있었고 외상도 없어 질병에 의한 사망이지 교통재해가 아니라고 봤어요.","caseNo":"2007나279","date":"2007.08.22","court":"제주지방법원","result":"보험사 승"},
      {"title":"심근경색 부검이어도 질식 겹치면 상해사망","category":"심혈관질환","issue":"심장질환 해당 여부","keywords":["급성심근경색","I21","질식","상해사망","외인사"],"summary":"요양병원에서 식사하다 쓰러져 숨졌는데 부검은 급성심근경색, 사망진단서는 질식(외인사)이었어요. 법원은 질식도 함께 사망 원인이 됐다고 보고 상해사망보험금을 인정했어요.","caseNo":"2019가합569578","date":"2022.04.07","court":"서울중앙지방법원","result":"고객 일부 승"},
      {"title":"고액암 진단확정도 병리 전문의가 해야","category":"암","issue":"진단확정","keywords":["고액암","C41","편평상피세포암","진단확정","병리전문의"],"summary":"병리검사로 편평상피세포암이 나왔는데 이비인후과 의사가 고액암(두개안면골 암)으로 진단서를 써줬어요. 약관상 암 진단확정은 병리 전문의가 해야 해서 고액암 보험금 대상이 아니라고 봤어요.","caseNo":"2020다234538","date":"2020.10.15","court":"대법원","result":"파기환송(보험사 유리)"},
      {"title":"암 진단 후 해지돼도 입원·수술비 지급","category":"암","issue":"진단확정","keywords":["암진단","고지의무","계약해지","암입원비","암수술비"],"summary":"암 진단 뒤 보험사가 고지의무 위반으로 계약을 해지한 사고예요. 알리지 않은 내용과 암은 관련이 없었고, 입원·수술비는 암 진단확정이라는 한 사고에서 나오니 해지 뒤에도 줘야 한다고 봤어요.","caseNo":"2004나21069","date":"2004.10.28","court":"서울중앙지방법원","result":"고객 승"},
      {"title":"1cm 미만 직장유암종은 경계성종양","category":"암","issue":"암 분류","keywords":["직장유암종","신경내분비종양","경계성종양","D37.5","C20"],"summary":"직장에서 0.4cm 유암종을 떼어냈고 주치의는 직장암(C20) 진단서를 써줬어요. 혈관 침범 없는 1cm 미만 종양이라 경계성종양(D37.5)이고 병리 전문의 진단도 없어 일반암이 아니라고 봤어요.","caseNo":"2016나57177","date":"2017.08.10","court":"서울중앙지방법원","result":"보험사 승"},
      {"title":"점막내암은 상피내암 아닌 일반암","category":"암","issue":"암 분류","keywords":["점막내암","상피내암","제자리암","D01","대장암","C18"],"summary":"대장 점막에만 있는 종양을 보험사가 상피내암이라며 적게 지급한 사고예요. 질병분류 기준으로 일반암으로 볼 여지도 있어 약관이 애매하니 고객에게 유리하게 일반암으로 봐야 한다고 했어요.","caseNo":"2009다60305","date":"2010.12.09","court":"대법원","result":"파기환송(고객 유리)"},
      {"title":"점막내암 일반암 인정, 원심 그대로 확정","category":"암","issue":"암 분류","keywords":["점막내암","상피내암","제자리암","D01","작성자불이익"],"summary":"점막내 암종을 상피내암으로 보고 보험금을 줄이려 한 사고예요. 약관의 ‘상피내암’이 여러 뜻으로 읽혀 고객에게 유리하게 해석해야 하니 점막내암은 일반암이라는 원심을 확정했어요.","caseNo":"2010다71158","date":"2010.12.09","court":"대법원","result":"고객 승"},
      {"title":"자궁경부 0기암은 상피내암, 암 아님","category":"암","issue":"암 분류","keywords":["자궁경부암","0기암","상피내암","제자리암","D06"],"summary":"자궁경부 0기암으로 치료받고 암보험금을 청구한 사고예요. 0기암은 악성신생물 전 단계인 상피내암종이라 약관에서 말하는 암에 해당하지 않는다고 봤어요.","caseNo":"96가단20242","date":"1996.10.29","court":"수원지방법원","result":"보험사 승"},
      {"title":"갑상선암 림프절 전이, 일반암 차액만 지급","category":"암","issue":"원발부위·전이암","keywords":["갑상선암","C73","림프절전이","C77","원발부위"],"summary":"갑상선암(C73)과 림프절 전이암(C77)을 진단받고 일반암 보험금을 청구한 사고예요. 원발부위 분류조항을 설명하지 않았더라도 일반암 보험금에서 이미 준 갑상선암 보험금을 뺀 차액만 주면 된다고 했어요.","caseNo":"2023다245058","date":"2025.04.03","court":"대법원","result":"일부 파기자판(차액만 지급)"},
      {"title":"면역주사만 맞은 입원은 암 직접치료 아님","category":"암","issue":"암 직접치료","keywords":["요양병원","암입원비","면역치료","헬릭스주사","항암제"],"summary":"암 수술 뒤 요양병원에 입원해 항암제를 먹은 기간과 면역강화 주사만 맞은 기간이 섞인 사고예요. 항암제 복용 기간은 직접치료로 인정했지만 주사만 맞은 기간은 직접치료가 아니라고 봤어요.","caseNo":"2002나16405","date":"2003.08.28","court":"부산지방법원","result":"고객 일부 승"},
      {"title":"중심정맥관 삽입술은 암 수술 아님","category":"암","issue":"암 직접치료","keywords":["백혈병","C92","중심정맥관삽입술","히크만카테터","암수술비"],"summary":"백혈병 진단 뒤 항암제를 넣으려고 중심정맥관(히크만 카테터) 삽입술을 받은 사고예요. 암을 직접 치료하는 게 아니라 약을 넣기 위한 시술이라 암수술비 대상이 아니라고 봤어요.","caseNo":"2002나52953","date":"2003.06.25","court":"서울지방법원","result":"보험사 승"},
      {"title":"백내장 수술 후 하루 머문 건 입원 아님","category":"입원·수술","issue":"입원 필요성","keywords":["백내장","H25","입원의료비","실손","다초점렌즈"],"summary":"백내장 수술 뒤 병원에 하루 머물며 안약과 주사를 맞고 입원의료비를 청구한 사고예요. 수술이 간단하고 합병증도 없어 입원이 필요했다고 보기 어렵다며 실손 입원보험금을 인정하지 않았어요.","caseNo":"2024나44829","date":"2025.04.11","court":"서울서부지방법원","result":"보험사 승"},
      {"title":"병원 돌며 반복입원한 보험계약은 무효","category":"입원·수술","issue":"입원 필요성","keywords":["반복입원","입원일당","다수보험","보험사기","계약무효"],"summary":"1년 남짓 사이 입원보험을 11개나 들고 여러 병원을 돌며 반복 입원해 보험금을 받은 사고예요. 보험금을 부정하게 받으려는 계약이라 무효이고 받은 보험금도 돌려줘야 한다고 봤어요.","caseNo":"2022가합107693","date":"2025.09.04","court":"서울남부지방법원","result":"보험사 승"},
      {"title":"실제 병세 있으면 다수 가입·입원도 유효","category":"입원·수술","issue":"입원 필요성","keywords":["다수보험","입원","위장입원","계약무효","부정취득"],"summary":"여러 상해보험에 가입해 입원보험금을 받자 보험사가 부정취득 목적이라며 계약 무효를 주장했어요. 병세가 실제로 일상생활에 지장을 줘 위장입원으로 보기 어렵다며 계약을 유효로 봤어요.","caseNo":"2015다206461","date":"2016.01.14","court":"대법원","result":"고객 승"},
      {"title":"당뇨망막병증 레이저 치료도 수술","category":"입원·수술","issue":"수술 해당 여부","keywords":["당뇨망막병증","E11.3","레이저광응고술","당뇨병","수술급여금"],"summary":"당뇨병 진단 뒤 합병증인 당뇨망막병증으로 레이저 광응고술을 받은 사고예요. 당뇨망막병증도 당뇨병 코드(E10~E14)에 속하고 약관이 수술을 좁게 정하지 않아 수술급여금 대상이라고 봤어요.","caseNo":"2012다50087","date":"2015.05.28","court":"대법원","result":"고객 승"},
      {"title":"폐 색전술도 암 수술급여금 대상","category":"입원·수술","issue":"수술 해당 여부","keywords":["색전술","폐전이","C78.0","유방암","C50","암수술비"],"summary":"유방암이 폐로 번져 혈관으로 약물을 넣어 암을 괴사시키는 색전술을 받은 사고예요. 약관이 수술을 표준 수술로 제한하지 않았고 보험사가 오래 지급해 온 점도 있어 암 수술에 해당한다고 봤어요.","caseNo":"2010다28208","date":"2010.07.22","court":"대법원","result":"파기환송(고객 유리)"},
      {"title":"백내장 검사비 올려 받아도 기망 아님","category":"입원·수술","issue":"실손 비급여 적정성","keywords":["백내장","다초점인공수정체","비급여","검사비","실손"],"summary":"다초점렌즈가 실손 보장에서 빠지자 안과가 렌즈값은 낮추고 실손 되는 검사비를 올려 받은 사고예요. 실제 진료하고 내역대로 청구했으니 보험사를 속인 불법행위로 보기 어렵다고 했어요.","caseNo":"2023다205487","date":"2024.12.24","court":"대법원","result":"파기환송(고객 유리)"},
      {"title":"임의비급여 주사비, 보험사 직접 회수 불가","category":"입원·수술","issue":"실손 비급여 적정성","keywords":["임의비급여","트리암시놀론","주사치료","실손","채권자대위"],"summary":"병원이 트리암시놀론 주사를 임의비급여로 놓고 환자들이 실손보험금을 받은 사고예요. 보험사가 환자 대신 병원에 진료비 반환을 청구했지만 환자에게 돈이 있으면 대신 청구할 수 없다고 봤어요.","caseNo":"2019다229202","date":"2022.08.25","court":"대법원","result":"보험사 패(소 각하)"},
      {"title":"본인부담상한제 환급분은 실손 대상 아님","category":"입원·수술","issue":"실손 비급여 적정성","keywords":["본인부담상한제","실손","질병입원의료비","건강보험환급"],"summary":"실손 입원의료비를 청구했는데 보험사가 건강보험 본인부담상한액을 넘는 부분은 공단에서 돌려받는다며 거절했어요. 환급받는 부분은 본인이 최종 부담한 돈이 아니라 보상 대상이 아니라고 봤어요.","caseNo":"2023다283913","date":"2024.01.25","court":"대법원","result":"일부 파기환송(보험사 유리)"},
      {"title":"공단에 돌려준 요양비는 실손 대상 아님","category":"입원·수술","issue":"실손 비급여 적정성","keywords":["실손","향후치료비","공무상요양비","교통사고합의금"],"summary":"공무원이 교통사고 합의금으로 향후치료비를 받은 뒤 공단에 요양비를 돌려주고 그 돈을 실손보험에 청구한 사고예요. 이미 가해자 쪽에서 치료비를 받은 셈이라 본인이 부담한 손해가 아니라고 봤어요.","caseNo":"2023다282927","date":"2026.08.12","court":"대법원","result":"일부 파기환송(보험사 유리)"}
    ];
    const ALL_CASES = CASES.concat(CASES_MORE).map(c => Object.assign(c, { keywords: [].concat(c.keywords || []) }));

    const searchInput = document.getElementById("search");
    const cardsEl = document.getElementById("cards");
    const countEl = document.getElementById("count");
    const filterButtons = document.querySelectorAll("#type-filters .filter");
    const tabButtons = document.querySelectorAll(".tab[data-category]");
    let currentCategory = "상해사망";
    let currentType = "전체";

    function render() {
      // 급격성·우연성·외래성 버튼과 안내문은 상해사망 탭에서만 보여줌
      const isInjury = currentCategory === "상해사망";
      document.getElementById("type-filters").hidden = !isInjury;
      document.getElementById("note-injury").hidden = !isInjury;

      const keyword = searchInput.value.trim().toLowerCase();
      const list = ALL_CASES.filter(c => {
        if (c.category !== currentCategory) return false;
        const typeOk = !isInjury || currentType === "전체" || c.type === currentType;
        const text = [c.title, c.summary, c.caseNo, c.date, c.type, c.issue].filter(Boolean).join(" ").toLowerCase();
        return typeOk && (keyword === "" || text.includes(keyword));
      });

      countEl.textContent = "판례 " + list.length + "건";
      cardsEl.innerHTML = "";

      if (list.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        if (!ALL_CASES.some(c => c.category === currentCategory)) {
          empty.textContent = currentCategory + " 판례는 아직 등록되지 않았어요.";
        } else if (isInjury && currentType === "급격성") {
          empty.textContent = "급격성 결여로 상해사고가 인정되지 않은 판례는 법제처 검색에서 찾지 못했어요.";
        } else {
          empty.textContent = "조건에 맞는 판례가 없어요.";
        }
        cardsEl.appendChild(empty);
        return;
      }

      list.forEach(c => cardsEl.appendChild(lawCard(c)));
    }

    // 판례 카드 (분류별·관련·최신 검색에서 같이 씀). why: 관련 판례로 고른 이유 칩
    function lawCard(c, why, showCat) {
      const card = document.createElement("article");
      card.className = "card";
      const badge = c.category === "상해사망" && c.type && !c.issue
        ? '<span class="type type-' + escapeHtml(c.type) + '">' + escapeHtml(c.type) + ' 결여</span>'
        : '<span class="type type-쟁점">' + escapeHtml(c.issue || (c.type ? c.type + " 결여" : c.category)) + '</span>';
      card.innerHTML = '<h2>' + escapeHtml(c.title) + '</h2>'
        + '<div class="law-badges">' + badge + (showCat ? '<span class="law-cat">' + escapeHtml(c.category) + '</span>' : '')
        + (c.result ? '<span class="law-result">' + escapeHtml(c.result) + '</span>' : '') + '</div>'
        + '<p class="summary">' + escapeHtml(c.summary) + '</p>'
        + (why && why.length ? '<div class="law-why">' + why.map(w => '<span>' + escapeHtml(w) + '</span>').join("") + '</div>' : '')
        + '<div class="meta">' + escapeHtml((c.court || "대법원") + " " + c.caseNo + " · 선고 " + c.date)
        + ' <a href="' + LAW_LINK(c.caseNo).url + '" target="_blank" rel="noopener">원문 ↗</a></div>';
      return card;
    }

    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentType = btn.dataset.type;
        render();
      });
    });
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        // 탭을 바꾸면 사고 유형 버튼은 '전체'로 되돌림
        currentType = "전체";
        filterButtons.forEach(b => b.classList.toggle("active", b.dataset.type === "전체"));
        render();
      });
    });
    searchInput.addEventListener("input", render);

    render();

    // ===== 판례 탭: 관련 판례(입력 기준) · 최신판례 검색 =====
    // 국가법령정보센터는 다른 웹페이지 안에 띄우거나(iframe) 직접 불러올 수 없어서, 이 파일에 담은 판례를 검색하고
    // 더 최근 판례는 국가법령정보센터 검색을 새 창으로 엶
    const LAW_CAT_QUERY = { "상해사망": "상해사망 보험금", "장해": "후유장해 보험금", "뇌혈관질환": "뇌혈관질환 보험금", "암": "암 진단 보험금",
      "심혈관질환": "심근경색 보험금", "계약·면책": "고지의무 보험", "입원·수술": "실손 보험금" };
    const lawText = c => [c.title, c.summary, c.issue, c.type, c.category, c.caseNo, (c.keywords || []).join(" ")].filter(Boolean).join(" ");
    const lawNewer = (a, b) => (b.date || "").localeCompare(a.date || "");

    // 처음 화면 입력값으로 관련 판례 점수 매기기 → 최소 6건
    function lawRelated(v) {
      const code = v.code ? normCode(v.code) : "", code3 = code.slice(0, 3);
      const info = KCD[code] || KCD[code3];
      const dnames = [...new Set([info && info.kw, info && info.name, code ? koicdName(code) : ""].filter(Boolean)
        .flatMap(n => [n, n.replace(/증$/, "")]).filter(n => n.length >= 2))];
      const cat = guessCategory(v);
      // 쟁점 낱말 중 어디에나 붙는 말(위반·여부·해당·분류 등)은 빼고 맞춰 봄
      const issueWords = (v.issue || "").split(/[\s,·]+/).filter(w => w.length >= 2 && !/^(위반|여부|해당|분류|기간|적정성|필요성)$/.test(w));
      const coverWords = (v.cover || "").replace(/\([^)]*\)|진단비|보험금|특약|보장|담보|진단/g, " ").split(/[\s,·]+/).filter(w => w.length >= 2);
      const scored = ALL_CASES.map(c => {
        const text = lawText(c);
        let s = 0;
        const why = [];
        // 쟁점이 같아도 분류가 다르면(예: 뇌졸중 사고에 암 진단확정 판례) 점수를 낮춤
        const other = cat && c.category !== cat;
        if (v.issue && c.issue === v.issue) { s += other ? 3 : 6; why.push("쟁점 " + v.issue); }
        else { const hit = issueWords.filter(w => text.includes(w)); if (hit.length) { s += other ? 1 : 3; why.push("쟁점 '" + hit.join("·") + "'"); } }
        if (code3 && (c.keywords || []).some(k => k.toUpperCase().startsWith(code3))) { s += 5; why.push("진단코드 " + code3); }
        else { const d = dnames.find(n => text.includes(n)); if (d) { s += 4; why.push("진단 " + d); } }
        if (cat && c.category === cat) { s += 2; why.push("분류 " + cat); }
        const cw = coverWords.filter(w => text.includes(w));
        if (cw.length) { s += 1; why.push("담보 '" + cw.join("·") + "'"); }
        if (v.job && c.issue === "통지의무 위반") { s += 1; why.push("직업 입력 → 통지의무"); }
        return { c, s, why };
      }).sort((a, b) => b.s - a.s || lawNewer(a.c, b.c));
      const out = scored.filter(x => x.s >= 2).slice(0, 12);
      // 6건이 안 되면 같은 분류 → 전체 최신 판례로 채움
      const fill = (pool, why) => pool.sort((a, b) => lawNewer(a.c, b.c)).forEach(x => { if (out.length < 6 && !out.includes(x)) out.push(Object.assign(x, { why: [why] })); });
      if (out.length < 6 && cat) fill(scored.filter(x => x.c.category === cat), "같은 분류 최근 판례");
      if (out.length < 6) fill(scored.slice(), "최근 판례");
      return { list: out, cat, dname: dnames[0] || "" };
    }

    function renderLawRelated() {
      const box = document.getElementById("law-related");
      const v = readCaseInput();
      const has = v.code || v.cover || v.issue || v.job;
      const { list, cat, dname } = lawRelated(v);
      const basis = [["진단", v.code ? normCode(v.code) + (dname ? " " + dname : "") : ""], ["담보", v.cover], ["쟁점", v.issue], ["직업", v.job], ["분류", cat]].filter(b => b[1]);
      box.innerHTML = '<div class="law-related-head"><h2>' + (has ? '입력하신 사고와 관련된 판례' : '최근 선고 판례') + ' <b>' + list.length + '건</b></h2>'
        + (has ? '<div class="law-basis">' + basis.map(([k, x]) => '<span><i>' + k + '</i>' + escapeHtml(x) + '</span>').join("") + '</div>'
          : '<p class="kcd-en">처음 화면에 진단코드·담보명·쟁점을 넣으면 그 사고와 관련된 판례를 6건 이상 골라 드려요.</p>')
        + '</div><div class="cards"></div>';
      const cards = box.querySelector(".cards");
      list.forEach(x => cards.appendChild(lawCard(x.c, has ? x.why : null, true)));
      // 최신판례 검색의 빠른 검색어: 입력에서 뽑은 말
      const quick = [...new Set([dname, v.issue, ...((v.cover || "").replace(/\([^)]*\)|진단비|보험금/g, " ").split(/\s+/).filter(w => w.length >= 2))].filter(Boolean))].slice(0, 4);
      document.getElementById("live-law-count").dataset.quick = JSON.stringify(quick);
    }

    function renderLatest() {
      const q = document.getElementById("live-law-query").value.trim();
      const years = Number(document.getElementById("live-law-period").value);
      const cat = document.getElementById("live-law-cat").value;
      const from = years ? (new Date().getFullYear() - years) + "." + String(new Date().getMonth() + 1).padStart(2, "0") : "";
      const words = q.split(/\s+/).filter(Boolean);
      const list = ALL_CASES.filter(c => (!cat || c.category === cat) && (!from || c.date >= from)
        && words.every(w => lawText(c).toLowerCase().includes(w.toLowerCase()))).sort(lawNewer);
      const quick = JSON.parse(document.getElementById("live-law-count").dataset.quick || "[]");
      document.getElementById("live-law-count").innerHTML = '판례 ' + list.length + '건 · 선고일 최신순'
        + (quick.length ? ' <span class="law-quick">입력값으로 찾기: ' + quick.map(w => '<button type="button" data-q="' + escapeHtml(w) + '">' + escapeHtml(w) + '</button>').join("") + '</span>' : '');
      const el = document.getElementById("live-law-list");
      el.innerHTML = "";
      if (!list.length) el.innerHTML = '<div class="empty">이 화면에 담긴 판례 중에는 없어요. 오른쪽 위 <b>국가법령정보센터에서 바로 검색</b>으로 최신 판례를 확인하세요.</div>';
      list.forEach(c => el.appendChild(lawCard(c, null, true)));
      const ext = q || LAW_CAT_QUERY[cat] || "보험금";
      document.getElementById("live-law-newtab").href = "https://www.law.go.kr/precSc.do?menuId=7&query=" + encodeURIComponent(ext);
    }
    function refreshLiveLaw() { renderLawRelated(); renderLatest(); }

    document.getElementById("live-law-total").textContent = ALL_CASES.length;
    document.getElementById("live-law-cat").innerHTML += [...new Set(ALL_CASES.map(c => c.category))].map(c => '<option>' + escapeHtml(c) + '</option>').join("");
    document.getElementById("live-law-form").addEventListener("submit", e => { e.preventDefault(); renderLatest(); });
    ["live-law-period", "live-law-cat"].forEach(id => document.getElementById(id).addEventListener("change", renderLatest));
    document.getElementById("live-law-count").addEventListener("click", e => {
      const b = e.target.closest("[data-q]");
      if (b) { document.getElementById("live-law-query").value = b.dataset.q; renderLatest(); }
    });
    document.querySelectorAll(".law-pane-tab").forEach(t => t.addEventListener("click", () => {
      document.querySelectorAll(".law-pane-tab").forEach(x => x.classList.toggle("active", x === t));
      document.getElementById("law-pane-latest").hidden = t.dataset.pane !== "latest";
      document.getElementById("law-pane-browse").hidden = t.dataset.pane !== "browse";
    }));

    // ===== 처음 화면 입력값으로 각 메뉴 자동검색 =====

    // 판례·PubMed·금감원 검색에 쓰는 진단코드 정보 (cat: 판례 탭, en: PubMed 영어 검색어, kw: 금감원 검색어)
    const KCD = {
      "I60":   { name: "거미막하출혈", cat: "뇌혈관질환", en: "subarachnoid hemorrhage", kw: "거미막하출혈" },
      "I61":   { name: "뇌내출혈", cat: "뇌혈관질환", en: "intracerebral hemorrhage", kw: "뇌출혈" },
      "I62":   { name: "기타 비외상성 두개내출혈", cat: "뇌혈관질환", en: "nontraumatic intracranial hemorrhage", kw: "뇌출혈" },
      "I63":   { name: "뇌경색증", cat: "뇌혈관질환", en: "cerebral infarction", kw: "뇌경색" },
      "I64":   { name: "출혈 또는 경색증으로 명시되지 않은 뇌졸중", cat: "뇌혈관질환", en: "stroke", kw: "뇌졸중" },
      "I65":   { name: "뇌경색증을 유발하지 않은 뇌전동맥의 폐쇄 및 협착", cat: "뇌혈관질환", en: "carotid artery stenosis", kw: "협착" },
      "I66":   { name: "뇌경색증을 유발하지 않은 대뇌동맥의 폐쇄 및 협착", cat: "뇌혈관질환", en: "cerebral artery stenosis", kw: "협착" },
      "I67.1": { name: "파열되지 않은 대뇌동맥류", cat: "뇌혈관질환", en: "unruptured intracranial aneurysm", kw: "동맥류" },
      "I67.5": { name: "모야모야병", cat: "뇌혈관질환", en: "moyamoya disease", kw: "모야모야" },
      "I20":   { name: "협심증", cat: "심혈관질환", en: "angina pectoris", kw: "협심증" },
      "I21":   { name: "급성 심근경색증", cat: "심혈관질환", en: "acute myocardial infarction", kw: "심근경색" },
      "C73":   { name: "갑상선의 악성 신생물", cat: "암", en: "thyroid cancer", kw: "갑상선암" },
      "C77":   { name: "림프절의 이차성 및 상세불명의 악성 신생물", cat: "암", en: "lymph node metastasis", kw: "림프절" },
      "C20":   { name: "직장의 악성 신생물", cat: "암", en: "rectal cancer", kw: "직장암" },
      "D37.5": { name: "직장의 행동양식 불명 또는 미상의 신생물", cat: "암", en: "rectal neuroendocrine tumor", kw: "유암종" }
    };

    // ===== KOICD 탭: KCD 9차 질병분류표 + 질병코딩지침서(8차) =====
    // 데이터는 KCD9 폴더 파일을 gzip으로 줄여 KOICD_PACKED(앞 script)에 넣어 두고, 처음 열 때 한 번 풂
    let koicd = null;
    const koicdReady = loadKoicd().catch(err => { console.error(err); return null; });

    async function unpackGzip(b64) {
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).text();
    }

    async function loadKoicd() {
      const [kcdText, guideText, caseText] = await Promise.all([unpackGzip(KOICD_PACKED.kcd), unpackGzip(KOICD_PACKED.guide), unpackGzip(KOICD_PACKED.cases)]);
      // 분류표: 줄마다 "단계\t코드\t한글명\t영문명" (1=장, 2=블록, 3=3단위, 4~6=세분류)
      const rows = [], byCode = {}, stack = [];
      let ch = null, bl = null;
      kcdText.split("\n").forEach(line => {
        const [lv, code, kr, en] = line.split("\t");
        const r = { lv: +lv, code, kr, en, i: rows.length };
        if (r.lv === 1) ch = r;
        if (r.lv === 2) bl = r;
        r.ch = ch; r.bl = bl;
        while (stack.length && stack[stack.length - 1].lv >= r.lv) stack.pop();
        r.parent = stack[stack.length - 1] || null;
        stack.push(r);
        rows.push(r);
        if (r.lv >= 3) (byCode[code] = byCode[code] || []).push(r);
      });
      // 코딩지침서: [코드, 단계, 번호, 제목, 본문 HTML], 본문에 나오는 진단코드를 미리 뽑아 둠
      const guide = JSON.parse(guideText).map(([code, depth, num, title, html]) => {
        const text = title + " " + html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
        return { code, depth, num, title, html, refs: codeRefs(text) };
      });
      // 장 및 질환별 분류지침의 장 머리(예: "Ⅸ. 순환계통의 질환(I00-I99)")에서 코드 범위를 읽음
      const chapters = guide.filter(g => g.depth === 2 && g.code.startsWith("03")).map(g => {
        const m = g.title.match(/\(([A-Z]\d{2})-([A-Z]\d{2})\)/);
        return m ? { g, from: m[1], to: m[2] } : null;
      }).filter(Boolean);
      // 코딩사례집(8차): [번호, 사례명, 영문명, 최종진단 코드들, 코딩 적용사유, 사례 표 HTML]
      const cases = JSON.parse(caseText).map(([num, title, en, codes, reason, html]) => ({
        num, title, en, codes: [].concat(codes || []), html, refs: codeRefs(reason || "")
      }));
      koicd = { rows, byCode, guide, chapters, cases };
      document.getElementById("kcd-list").innerHTML = rows.filter(r => r.lv === 3 && /^[A-Z]\d{2}$/.test(r.code))
        .map(r => '<option value="' + r.code + '">' + escapeHtml(r.kr) + '</option>').join("");
      return koicd;
    }

    // 지침 본문에 나오는 코드: 단일(I63.58, G46.-) 또는 범위(C76~C79, I21.0-I21.3)
    function codeRefs(text) {
      const refs = [];
      const re = /([A-Z]\d{2}(?:\.\d{1,3})?)(?:\.-)?(?:\s*[~\-–]\s*([A-Z]?\d{2}(?:\.\d{1,3})?))?/g;
      let m;
      while ((m = re.exec(text))) {
        let a = m[1], b = m[2] || m[1];
        if (/^\d/.test(b)) b = a[0] + b;
        refs.push({ a, b });
      }
      return refs;
    }

    function normCode(s) {
      s = (s || "").trim().toUpperCase().replace(/\s+/g, "");
      const m = s.match(/^([A-Z]\d{2})\.?(\d{0,3})-?$/);
      if (m) return m[2] ? m[1] + "." + m[2] : m[1];
      return s;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }

    // 코드와 관련된 코딩지침: 3점 코드 그대로 언급, 2점 같은 3단위 코드 언급, 1점 좁은 범위에 포함
    function relatedGuides(code) {
      if (!koicd || !/^[A-Z]\d{2}(\.\d+)?$/.test(code)) return [];
      const cat = code.slice(0, 3);
      const scored = [];
      koicd.guide.forEach((g, idx) => {
        if (g.depth < 2 || !g.html) return;
        let score = 0;
        g.refs.forEach(({ a, b }) => {
          if (a === b) {
            if (a === code) score = Math.max(score, 3);
            else if (a.slice(0, 3) === cat) score = Math.max(score, 2);
          } else if (a[0] === b[0] && a[0] === cat[0] && Math.abs(+b.slice(1, 3) - +a.slice(1, 3)) <= 20
                     && a.slice(0, 3) <= cat && cat <= b.slice(0, 3)) {
            score = Math.max(score, (a.slice(0, 3) === cat || b.slice(0, 3) === cat) ? 2 : 1);
          }
        });
        if (score) scored.push({ g, score, idx });
      });
      return scored.sort((x, y) => y.score - x.score || x.idx - y.idx).map(s => Object.assign({ score: s.score }, s.g));
    }

    // 코드가 속한 장의 코딩지침 (예: I21 → Ⅸ. 순환계통의 질환 아래 지침들)
    function chapterGuides(code) {
      if (!koicd) return [];
      // 신생물 형태분류(M8000/3 등)는 Ⅱ. 신생물 장의 지침으로
      const cat = code.includes("/") ? "C00" : code.slice(0, 3);
      const heads = koicd.chapters.filter(c => c.from <= cat && cat <= c.to).map(c => c.g.code);
      return koicd.guide.filter(g => g.depth > 2 && g.html && heads.some(h => g.code.startsWith(h)));
    }

    // 코드와 관련된 코딩사례: 3점 최종진단이 이 코드, 2점 최종진단이 같은 3단위 코드, 1점 코딩 적용사유에서 같은 3단위 코드 언급
    function relatedCases(code) {
      if (!koicd || !/^[A-Z]\d{2}(\.\d+)?$/.test(code)) return [];
      const cat = code.slice(0, 3);
      return koicd.cases.map((c, idx) => {
        let score = 0;
        c.codes.forEach(x => {
          if (x === code) score = Math.max(score, 3);
          else if (x.slice(0, 3) === cat) score = Math.max(score, 2);
        });
        if (!score && c.refs.some(({ a, b }) => a.slice(0, 3) === cat || b.slice(0, 3) === cat)) score = 1;
        return { c, score, idx };
      }).filter(s => s.score).sort((x, y) => y.score - x.score || x.idx - y.idx).map(s => Object.assign({ score: s.score }, s.c));
    }

    function koicdName(code) {
      if (KCD[code]) return KCD[code].name;
      const rs = koicd && koicd.byCode[code];
      return rs ? rs[0].kr : "";
    }

    // 메뉴 미리보기 줄: 진단명 · 대표 코딩지침 · 코딩사례
    function koicdPreview(code) {
      const rs = koicd && koicd.byCode[code];
      if (!rs) return [["진단", "KCD 9차 분류표에 없는 코드", code]];
      const g = relatedGuides(code)[0];
      const cs = relatedCases(code).filter(c => c.score >= 2);
      return [
        ["진단", rs[0].kr, code],
        ["코딩지침", g ? g.title : "직접 관련된 지침 없음", g ? g.num : ""],
        ["코딩사례", cs.length ? cs[0].num + " " + cs[0].title + (cs.length > 1 ? " 외" : "") : "관련 사례 없음", cs.length ? cs.length + "건" : ""]
      ];
    }

    // 하위 코드 전체 (r 바로 뒤에서 단계가 더 깊은 줄들)
    function subtree(r) {
      const out = [r];
      for (let i = r.i + 1; i < koicd.rows.length && koicd.rows[i].lv > r.lv; i++) out.push(koicd.rows[i]);
      return out;
    }

    function codeLink(code) {
      return '<a data-kcd="' + escapeHtml(code) + '">' + escapeHtml(code) + '</a>';
    }

    // KOICD 탭: 진단코드(또는 병명)로 분류·관련 진단코드·코딩지침 표시
    async function showKoicd(input) {
      const box = document.getElementById("koicd-result");
      const q = (input || "").trim();
      if (!q) return;
      const code = normCode(q);
      document.getElementById("koicd-query").value = code;
      if (!koicd) box.innerHTML = '<div class="kcd-box">KCD 9차 분류표를 불러오는 중…</div>';
      await koicdReady;
      if (!koicd) {
        box.innerHTML = '<div class="kcd-box">분류표를 불러오지 못했어요. 최신 Chrome·Edge·Safari에서 열어 주세요.</div>';
        return;
      }
      const rs = koicd.byCode[code];
      if (!rs) { box.innerHTML = renderKoicdSearch(q, code); return; }
      box.innerHTML = renderKoicdCode(code, rs);
    }

    // 코드가 없을 때: 코드 앞부분 또는 병명(한글·영문)으로 찾은 목록
    function renderKoicdSearch(q, code) {
      const word = q.toLowerCase();
      const isCode = /^[A-Z]\d/.test(code);
      const hits = koicd.rows.filter(r => r.lv >= 3 &&
        (isCode ? r.code.startsWith(code) : (r.kr.toLowerCase().includes(word) || r.en.toLowerCase().includes(word))))
        .sort((x, y) => x.lv - y.lv || x.i - y.i).slice(0, 80);
      if (!hits.length) return '<div class="kcd-box"><h3>' + escapeHtml(q) + '</h3><p class="none">KCD 9차 분류표에서 찾지 못했어요. 코드(예: I21, I63.5)나 다른 병명으로 찾아 보세요.</p></div>';
      return '<div class="kcd-box"><h3>"' + escapeHtml(q) + '" 검색 결과 ' + hits.length + (hits.length === 80 ? '건 이상 (앞 80건)' : '건') + '</h3>'
        + '<table class="kcd-table">' + hits.map(r => '<tr><td class="c">' + codeLink(r.code) + '</td><td>' + escapeHtml(r.kr)
        + ' <span class="kcd-en">' + escapeHtml(r.en) + '</span></td></tr>').join("") + '</table></div>';
    }

    function renderKoicdCode(code, rs) {
      const r = rs[0];
      let cat = r;
      while (cat.lv > 3) cat = cat.parent;
      const path = [r.ch.kr, r.bl.kr];
      for (let p = r.parent; p && p.lv >= 3; p = p.parent) path.splice(2, 0, p.code + " " + p.kr);
      // 1) 코드 요약 카드
      let html = '<div class="kcd-box kcd-head"><span class="kcd-badge">' + escapeHtml(code) + '</span><div>'
        + '<div class="name">' + rs.map(x => escapeHtml(x.kr)).join(" / ") + '</div>'
        + '<div class="kcd-en">' + escapeHtml(r.en) + '</div>'
        + '<div class="kcd-path">' + path.map(escapeHtml).join(" › ") + '</div>'
        + '<a href="https://www.koicd.kr/kcd/kcd9.do?kcd=' + encodeURIComponent(code) + '" target="_blank" rel="noopener">KOICD에서 원문 보기 (포함·제외 문구) ↗</a></div></div>';

      // 2) 진단코드: 같은 3단위 코드의 하위 코드 전체 (많으면 4단위까지 + 입력 코드의 하위)
      let list = subtree(cat);
      let cut = false;
      if (list.length > 80) {
        const mine = new Set(r === cat ? [] : subtree(r).map(x => x.i));
        list = list.filter(x => x.lv <= 4 || mine.has(x.i) || x.i === r.parent.i);
        cut = true;
      }
      const sib = koicd.rows.filter(x => x.lv === 3 && x.bl === r.bl);
      const codePanel = '<div class="kcd-tools"><span>' + escapeHtml(cat.code + " " + cat.kr) + '의 세분류 ' + list.length + '개</span></div>'
        + (cut ? '<p class="kcd-src" style="margin-top:0">하위 코드가 많아 4단위까지와 입력한 코드의 하위 코드만 보여요.</p>' : '')
        + '<table class="kcd-table">' + list.map(x => '<tr class="' + (x.code === code ? 'hit' : x.lv === 3 ? 'lv3' : '') + '"><td class="c">'
        + '&nbsp;'.repeat((x.lv - 3) * 3) + codeLink(x.code) + '</td><td>' + escapeHtml(x.kr)
        + '<span class="kcd-en">' + escapeHtml(x.en) + '</span></td></tr>').join("") + '</table>'
        + '<div class="kcd-sub">같은 항목군 · ' + escapeHtml(r.bl.kr) + '</div><div class="kcd-chips">'
        + sib.map(x => '<a class="kcd-chip' + (x === cat ? ' on' : '') + '" data-kcd="' + escapeHtml(x.code) + '" title="'
        + escapeHtml(x.kr) + '">' + escapeHtml(x.code) + ' ' + escapeHtml(x.kr.length > 14 ? x.kr.slice(0, 14) + "…" : x.kr) + '</a>').join("")
        + '</div>';

      // 3) 코딩지침: 코드를 언급한 지침은 첫 개만 펼쳐서, 같은 장의 나머지 지침은 접어서
      const rel = relatedGuides(code);
      const shown = new Set(rel.map(g => g.code));
      const rest = chapterGuides(code).filter(g => !shown.has(g.code));
      const why = { 3: "이 코드 언급", 2: "같은 3단위 코드 언급", 1: "코드 범위에 포함" };
      const guideCard = (g, open, note) => '<details class="kcd-card"' + (open ? ' open' : '') + '><summary>'
        + '<span class="num">' + escapeHtml(g.num) + '</span><span class="title">' + escapeHtml(g.title) + '</span>'
        + (note ? '<span class="why">' + note + '</span>' : '') + '</summary><div class="body">' + g.html + '</div></details>';
      let guidePanel = '';
      if (rel.length || rest.length) guidePanel += toolsBar(rel.length ? "이 코드와 관련된 지침 " + rel.length + "개" : "이 코드를 직접 언급한 지침은 없어요. 같은 장의 지침을 확인해 보세요.");
      else guidePanel += '<p class="none">이 코드와 관련된 코딩지침이 없어요.</p>';
      guidePanel += rel.map((g, i) => guideCard(g, i === 0, why[g.score])).join("");
      if (rest.length) guidePanel += '<div class="kcd-sub">같은 장의 다른 코딩지침 ' + rest.length + '개</div>' + rest.map(g => guideCard(g, false, "")).join("");
      guidePanel += '<p class="kcd-src">출처: <a href="https://www.koicd.kr/kcd/coding.do" target="_blank" rel="noopener">KOICD 질병코딩지침서</a>(8차 · 9차 지침은 아직 공개 전).</p>';

      // 4) 코딩사례: 최종진단 코드가 맞는 사례 먼저, 첫 사례만 펼쳐서 (진단코드를 칩으로)
      const cs = relatedCases(code);
      const caseWhy = { 3: "최종진단이 이 코드", 2: "최종진단이 같은 3단위 코드", 1: "적용사유에서 같은 3단위 코드 언급" };
      let casePanel = cs.length ? toolsBar("관련 사례 " + cs.length + "건") : '<p class="none">이 코드와 관련된 코딩사례가 없어요.</p>';
      casePanel += cs.map((c, i) => '<details class="kcd-card"' + (i === 0 && c.score >= 2 ? ' open' : '') + '><summary>'
        + '<span class="num">' + escapeHtml(c.num) + '</span><span class="title">' + escapeHtml(c.title) + '</span>'
        + '<span class="kcd-en">' + escapeHtml(c.en || "") + '</span><span class="why">' + caseWhy[c.score] + '</span>'
        + '<span class="codes-row kcd-chips">' + c.codes.filter((x, k, a) => a.indexOf(x) === k)
          .map(x => '<span class="kcd-chip ' + (x === code ? 'on' : 'plain') + '">' + escapeHtml(x) + '</span>').join("") + '</span>'
        + '</summary><div class="body">' + (c.html || "") + '</div></details>').join("");
      casePanel += '<p class="kcd-src">출처: <a href="https://www.koicd.kr/kcd/case.do" target="_blank" rel="noopener">KOICD 코딩사례집</a>(8차).</p>';

      // 탭: 진단코드 · 코딩지침 · 코딩사례 (마지막으로 본 탭을 기억)
      const tabs = [["code", "진단코드", list.length, codePanel], ["guide", "코딩지침", rel.length, guidePanel], ["case", "코딩사례", cs.length, casePanel]];
      html += '<div class="kcd-tabs">' + tabs.map(([k, label, n]) => '<button type="button" data-tab="' + k + '"' + (k === koicdTab ? ' class="on"' : '') + '>'
        + label + '<span class="n">' + n + '</span></button>').join("") + '</div>';
      html += tabs.map(([k, , , body]) => '<div class="kcd-box kcd-panel" data-panel="' + k + '"' + (k === koicdTab ? '' : ' hidden') + '>' + body + '</div>').join("");
      return html;
    }

    function toolsBar(text) {
      return '<div class="kcd-tools"><span>' + escapeHtml(text) + '</span><span><button type="button" data-expand="1">모두 펼치기</button> '
        + '<button type="button" data-expand="0">모두 접기</button></span></div>';
    }

    let koicdTab = "code";
    document.getElementById("koicd-result").addEventListener("click", e => {
      // 탭 바꾸기
      const tab = e.target.closest("[data-tab]");
      if (tab) {
        koicdTab = tab.dataset.tab;
        document.querySelectorAll("#koicd-result [data-tab]").forEach(b => b.classList.toggle("on", b === tab));
        document.querySelectorAll("#koicd-result [data-panel]").forEach(p => { p.hidden = p.dataset.panel !== koicdTab; });
        return;
      }
      // 모두 펼치기·접기
      const ex = e.target.closest("[data-expand]");
      if (ex) {
        ex.closest(".kcd-panel").querySelectorAll("details.kcd-card").forEach(d => { d.open = ex.dataset.expand === "1"; });
        return;
      }
      // 결과 안의 코드를 누르면 그 코드로 다시 찾기
      const a = e.target.closest("[data-kcd]");
      if (!a) return;
      showKoicd(a.dataset.kcd);
      document.getElementById("koicd-form").scrollIntoView({ behavior: "smooth" });
    });

    // ===== 약관: 표준약관(질병·상해보험, 손해보험 회사용)의 지급사유·지급 제한사유 =====
    // 문구는 보험업감독업무시행세칙 [별표 15] 원문에서 옮기고, 괄호에 조항을 적음
    const YAK_COMMON_LIMITS = [
      ["피보험자가 고의로 자신을 해친 경우. 다만, 심신상실 등으로 자유로운 의사결정을 할 수 없는 상태에서 자신을 해친 경우에는 지급", "제5조 제1항 제1호"],
      ["보험수익자가 고의로 피보험자를 해친 경우. 다만, 그 보험수익자가 일부 보험수익자이면 다른 보험수익자 몫은 지급", "제5조 제1항 제2호"],
      ["계약자가 고의로 피보험자를 해친 경우", "제5조 제1항 제3호"],
      ["피보험자의 임신, 출산(제왕절개 포함), 산후기. 다만, 보장개시일부터 2년이 지난 후 발생한 습관성 유산, 불임 및 인공수정 관련 합병증(N96~N98)은 지급", "제5조 제1항 제4호"],
      ["전쟁, 외국의 무력행사, 혁명, 내란, 사변, 폭동", "제5조 제1항 제5호"]
    ];
    const YAK_INJURY_LIMITS = [
      ["(직업·직무·동호회 활동 목적) 전문등반, 글라이더 조종, 스카이다이빙, 스쿠버다이빙, 행글라이딩, 수상보트, 패러글라이딩", "제5조 제2항 제1호"],
      ["(직업·직무·동호회 활동 목적) 모터보트, 자동차 또는 오토바이에 의한 경기, 시범, 흥행(연습 포함) 또는 시운전. 다만, 공용도로상 시운전 중 사고는 보장", "제5조 제2항 제2호"],
      ["(직업·직무·동호회 활동 목적) 선박에 탑승하는 것을 직무로 하는 사람이 직무상 선박에 탑승하고 있는 동안", "제5조 제2항 제3호"]
    ];
    const YAK_JOB_LIMITS = [
      ["보험기간 중 직업·직무 변경, 운전 목적·운전 여부 변경, 이륜자동차·원동기장치 자전거 계속 사용 시 지체 없이 회사에 알려야 함", "제15조 제1항"],
      ["위험이 증가했는데 추가보험료를 내지 않거나, 고의·중대한 과실로 알리지 않은 경우: 변경 전 요율 ÷ 변경 후 요율 비율로 보험금 삭감 지급. 다만, 증가된 위험과 관계없이 생긴 사고는 원래대로 지급", "제15조 제4항·제5항"],
      ["뚜렷한 위험 증가와 관련된 계약 후 알릴 의무를 고의·중대한 과실로 이행하지 않으면 계약 해지 가능", "제16조 제1항 제2호"]
    ];
    const YAK_GROUPS = {
      "상해사망": {
        pay: [
          ["보험기간 중에 상해의 직접결과로써 사망한 경우(질병으로 인한 사망은 제외): 사망보험금", "제3조 제1호"],
          ["상해란 보험기간 중에 발생한 급격하고도 우연한 외래의 사고로 신체에 입은 상해", "제2조 제2호 가목"],
          ["실종선고를 받은 경우, 관공서가 수해·화재 등 재난을 조사해 사망으로 통보한 경우도 '사망'에 포함", "제4조 제1항"]
        ],
        limits: [], injury: true,
        cardPay: "상해로 직접 사망 (질병 제외)", cardLimit: "고의·전쟁 등, 위험한 활동 중 사고"
      },
      "후유장해": {
        pay: [
          ["보험기간 중 진단확정된 질병 또는 상해로 장해분류표에서 정한 각 장해지급률에 해당하는 장해상태가 되었을 때: 후유장해보험금", "제3조 제2호"],
          ["장해지급률이 상해 발생일 또는 진단확정일부터 180일 이내에 확정되지 않으면 180일이 되는 날의 의사 진단에 기초해 결정", "제4조 제3항"],
          ["같은 질병 또는 상해로 두 가지 이상의 후유장해가 생기면 지급률을 합산", "제4조 제10항"]
        ],
        limits: [
          ["장해분류표의 각 장해분류별 최저 지급률 장해정도에 이르지 않는 후유장해는 지급하지 않음", "제4조 제8항 단서"],
          ["이미 후유장해보험금을 받은 동일한 부위에 가중된 때에는 이미 받은 보험금을 차감", "제4조 제11항"],
          ["하나의 진단확정된 질병 또는 상해로 인한 후유장해보험금은 보험가입금액이 한도", "제4조 제13항"]
        ],
        injury: true,
        cardPay: "질병·상해로 장해분류표의 장해상태", cardLimit: "최저 지급률에 못 미치는 장해"
      },
      "질병(진단·입원·수술)": {
        pay: [
          ["보험기간 중 진단확정된 질병 또는 상해로 입원, 통원, 요양, 수술 또는 수발(간병)이 필요한 상태가 되었을 때: 입원보험금, 간병보험금 등", "제3조 제3호"]
        ],
        limits: [], injury: false,
        cardPay: "질병으로 입원·수술 등 (진단비는 특약)", cardLimit: "고의, 임신·출산, 전쟁 등",
        notice: "뇌혈관질환·급성심근경색증·암 진단비는 표준약관에 없는 상품별 특별약관 담보예요. 진단확정 방법 등 세부 지급기준은 해당 상품의 특별약관을 확인하세요."
      }
    };
    let yakCurrent = "상해사망";
    let yakJob = "";

    function guessYakGroup(cover) {
      if (/장해/.test(cover)) return "후유장해";
      if (/사망/.test(cover)) return "상해사망";
      if (/(진단|입원|수술|뇌|암|심근|심장|질병)/.test(cover)) return "질병(진단·입원·수술)";
      return null;
    }

    function liHtml(items) {
      return items.map(([t, art]) => {
        const li = document.createElement("li");
        li.textContent = t + " ";
        const s = document.createElement("span");
        s.className = "art";
        s.textContent = "(" + art + ")";
        li.appendChild(s);
        return li.outerHTML;
      }).join("");
    }

    function renderYak() {
      const g = YAK_GROUPS[yakCurrent];
      document.querySelectorAll(".yak-group").forEach(b => b.classList.toggle("active", b.dataset.group === yakCurrent));
      let pay = '<div class="yak-box pay"><h3>지급사유</h3><ul>' + liHtml(g.pay) + '</ul>';
      if (g.notice) pay += '<p class="notice"></p>';
      pay += '</div>';
      let limit = '<div class="yak-box limit"><h3>지급 제한사유</h3>';
      if (g.limits.length) limit += '<div class="sub">이 담보의 제한</div><ul>' + liHtml(g.limits) + '</ul>';
      limit += '<div class="sub">공통: 보험금을 지급하지 않는 사유</div><ul>' + liHtml(YAK_COMMON_LIMITS) + '</ul>';
      if (g.injury) {
        limit += '<div class="sub">상해 관련: 위험한 활동 중 사고</div><ul>' + liHtml(YAK_INJURY_LIMITS) + '</ul>';
        limit += '<div class="sub">계약 후 알릴 의무(직업 변경 등)' + (yakJob ? ' · 기고지 직업: <span class="job"></span>' : '') + '</div><ul>' + liHtml(YAK_JOB_LIMITS) + '</ul>';
      }
      limit += '</div>';
      const panel = document.getElementById("yak-panel");
      panel.innerHTML = pay + limit;
      if (g.notice) panel.querySelector(".notice").textContent = g.notice;
      const jobEl = panel.querySelector(".job");
      if (jobEl) jobEl.textContent = yakJob;
    }

    (function initYak() {
      const wrap = document.getElementById("yak-groups");
      Object.keys(YAK_GROUPS).forEach(name => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "code yak-group";
        b.dataset.group = name;
        b.textContent = name;
        b.addEventListener("click", () => { yakCurrent = name; renderYak(); });
        wrap.appendChild(b);
      });
      renderYak();
    })();

    // ===== 약관: 현대해상 공시실에서 가입 당시 상품의 약관 PDF를 받아 청구 담보의 조항을 원문 그대로 따옴 =====
    // 공시실 화면이 쓰는 요청을 그대로 씀 (현대해상 서버가 다른 곳의 요청도 허용: Access-Control-Allow-Origin *)
    //  HHCA0310M38S: 상품 검색 (가입일을 주면 그날 판매 중이던 버전만)  /  HHCA0310M26S: 약관 파일 위치
    const HI_URL = "https://www.hi.co.kr";
    const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
    const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮";
    let yakState = { run: 0, products: [], prodIdx: 0, doc: null, clauseIdx: -1, cover: "", note: "" };
    const yakDocs = new Map();  // apnflId → 읽어 둔 약관 (이번에 연 동안)

    async function hiCall(tranId, request) {
      const body = { header: { gId: String(Date.now()), tranId, channelId: "HI-HOME", clientIp: "127.0.0.1", menuId: "100932", loginId: null }, request };
      let r;
      try {
        r = await fetch(HI_URL + "/ajax.xhi", { method: "POST", headers: { "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(body) });
      } catch (e) {
        // 인터넷이 끊겼거나 이 화면이 외부 사이트 연결을 막는 곳에서 열린 경우
        throw new Error("현대해상 공시실에 연결하지 못했어요(인터넷 연결 또는 열어 둔 곳의 제한).");
      }
      if (!r.ok) throw new Error("현대해상 응답 오류 " + r.status);
      return (await r.json()).data;
    }

    let pdfJsReady = null;
    function loadPdfJs() {
      if (!pdfJsReady) pdfJsReady = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = PDFJS_URL + "pdf.min.js";
        s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_URL + "pdf.worker.min.js"; resolve(window.pdfjsLib); };
        s.onerror = () => { pdfJsReady = null; reject(new Error("PDF 읽기 도구를 불러오지 못했어요")); };
        document.head.appendChild(s);
      });
      return pdfJsReady;
    }

    // 읽은 약관 글자는 이 브라우저에 저장해 두고 다음에 바로 씀 (IndexedDB, 실패해도 동작에는 지장 없음)
    function yakDbOpen() {
      return new Promise((resolve) => {
        try {
          const req = indexedDB.open("yak_cache", 1);
          req.onupgradeneeded = () => req.result.createObjectStore("docs");
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }
    async function yakDbGet(id) {
      const db = await yakDbOpen();
      if (!db) return null;
      return new Promise(resolve => {
        try { const r = db.transaction("docs").objectStore("docs").get(id); r.onsuccess = () => resolve(r.result || null); r.onerror = () => resolve(null); }
        catch (e) { resolve(null); }
      });
    }
    async function yakDbPut(id, value) {
      const db = await yakDbOpen();
      if (!db) return;
      try { db.transaction("docs", "readwrite").objectStore("docs").put(value, id); } catch (e) {}
    }

    function yakStatus(text, pct, err) {
      document.getElementById("yak-live").innerHTML = '<div class="yak-status' + (err ? ' err' : '') + '"><span>' + escapeHtml(text) + '</span>'
        + (pct != null ? '<span class="bar"><i style="width:' + Math.round(pct) + '%"></i></span>' : '') + '</div>';
    }

    // 약관 PDF 받기 → 쪽마다 글자 뽑기. 같은 약관을 동시에 두 번 받지 않도록 진행 중인 것도 기억
    // report(글, 진행률): 진행 상황을 보여 줄 곳 (처음 화면 또는 약관 탭)
    const yakLoading = new Map();
    function yakLoadDoc(prod, run, report) {
      if (yakDocs.has(prod.clauApnflId)) return Promise.resolve(yakDocs.get(prod.clauApnflId));
      const say = report || ((t, p) => { if (run === yakState.run) yakStatus(t, p); });
      if (yakLoading.has(prod.clauApnflId)) { const p = yakLoading.get(prod.clauApnflId); p.listeners.push(say); return p; }
      const listeners = [say];
      const p = yakLoadDocNow(prod, (t, pct) => listeners.forEach(fn => fn(t, pct))).finally(() => yakLoading.delete(prod.clauApnflId));
      p.listeners = listeners;
      yakLoading.set(prod.clauApnflId, p);
      return p;
    }
    // ===== 약관 PDF의 표 되살리기 =====
    // PDF 글자만 뽑으면 표 칸이 한 줄씩 흩어짐 → 페이지 그림 명령에서 칸 선(가로·세로)을 모아 격자를 만들고,
    // 칸 사이에 선이 없는 곳은 합친 칸(rowspan·colspan)으로 봄. 표는 글 안에 한 줄짜리 표시([행들])로 넣어 둠
    const YAK_TB_OPEN = "", YAK_TB_CLOSE = "";
    const YAK_TB_RE = /(.*?)/g;
    function yakFindTables(ops, O) {
      let ctm = [1, 0, 0, 1, 0, 0];
      const stack = [], H = [], V = [];
      let path = [];
      const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
        m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
      const ap = (x, y) => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]];
      const seg = (p, q) => {
        if (Math.abs(p[1] - q[1]) < 1 && Math.abs(p[0] - q[0]) > 2) H.push({ at: (p[1] + q[1]) / 2, a: Math.min(p[0], q[0]), b: Math.max(p[0], q[0]) });
        else if (Math.abs(p[0] - q[0]) < 1 && Math.abs(p[1] - q[1]) > 2) V.push({ at: (p[0] + q[0]) / 2, a: Math.min(p[1], q[1]), b: Math.max(p[1], q[1]) });
      };
      const paint = new Set([O.stroke, O.closeStroke, O.fill, O.eoFill, O.fillStroke, O.eoFillStroke, O.closeFillStroke, O.closeEOFillStroke]);
      ops.fnArray.forEach((fn, i) => {
        const a = ops.argsArray[i];
        if (fn === O.save) stack.push(ctm);
        else if (fn === O.restore) ctm = stack.pop() || ctm;
        else if (fn === O.transform) ctm = mul(ctm, a);
        else if (fn === O.constructPath) {
          const sub = a[0], c = a[1];
          let k = 0, cur = null, start = null;
          sub.forEach(op => {
            if (op === O.moveTo) { cur = start = ap(c[k], c[k + 1]); k += 2; }
            else if (op === O.lineTo) { const p = ap(c[k], c[k + 1]); k += 2; if (cur) path.push([cur, p]); cur = p; }
            else if (op === O.rectangle) {
              const x = c[k], y = c[k + 1], w = c[k + 2], h = c[k + 3]; k += 4;
              path.push({ rect: [ap(x, y), ap(x + w, y), ap(x + w, y + h), ap(x, y + h)] });
            }
            else if (op === O.closePath) { if (cur && start) path.push([cur, start]); cur = start; }
            else if (op === O.curveTo) k += 6;
            else if (op === O.curveTo2 || op === O.curveTo3) k += 4;
          });
        }
        else if (paint.has(fn)) {
          path.forEach(p => {
            if (!p.rect) return seg(p[0], p[1]);
            const xs = p.rect.map(q => q[0]), ys = p.rect.map(q => q[1]);
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            if (y1 - y0 <= 2.5 && x1 - x0 > 2) seg([x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]);       // 얇은 사각형 = 가로선
            else if (x1 - x0 <= 2.5 && y1 - y0 > 2) seg([(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]);  // = 세로선
            else { seg([x0, y0], [x1, y0]); seg([x0, y1], [x1, y1]); seg([x0, y0], [x0, y1]); seg([x1, y0], [x1, y1]); }
          });
          path = [];
        }
        else if (fn === O.endPath) path = [];
      });
      if (!H.length || !V.length) return [];
      // 서로 닿는 선끼리 한 표로 묶음
      const all = H.map(h => ({ h })).concat(V.map(v => ({ v })));
      const up = all.map((_, i) => i);
      const find = i => { while (up[i] !== i) i = up[i] = up[up[i]]; return i; };
      H.forEach((h, i) => V.forEach((v, j) => {
        if (v.at >= h.a - 2 && v.at <= h.b + 2 && h.at >= v.a - 2 && h.at <= v.b + 2) up[find(i)] = find(H.length + j);
      }));
      const groups = new Map();
      all.forEach((_, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, { H: [], V: [] }); const g = groups.get(r); i < H.length ? g.H.push(H[i]) : g.V.push(V[i - H.length]); });
      const uniq = (vals, desc) => {
        const out = [];
        vals.slice().sort((p, q) => desc ? q - p : p - q).forEach(v => { if (!out.length || Math.abs(v - out[out.length - 1]) > 3) out.push(v); });
        return out;
      };
      const tables = [];
      groups.forEach(g => {
        if (g.H.length < 2 || g.V.length < 2) return;
        const xs = uniq(g.V.map(v => v.at)), ys = uniq(g.H.map(h => h.at), true);  // ys: 위(큰 y) → 아래
        const nR = ys.length - 1, nC = xs.length - 1;
        if (nR < 1 || nC < 1) return;
        const covers = (lines, at, lo, hi) => lines.some(l => Math.abs(l.at - at) <= 3 && Math.min(l.b, hi) - Math.max(l.a, lo) >= (hi - lo) * 0.6);
        const id = (r, c) => r * nC + c;
        const cu = Array.from({ length: nR * nC }, (_, i) => i);
        const cf = i => { while (cu[i] !== i) i = cu[i] = cu[cu[i]]; return i; };
        for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) {
          if (c + 1 < nC && !covers(g.V, xs[c + 1], ys[r + 1], ys[r])) cu[cf(id(r, c + 1))] = cf(id(r, c));
          if (r + 1 < nR && !covers(g.H, ys[r + 1], xs[c], xs[c + 1])) cu[cf(id(r + 1, c))] = cf(id(r, c));
        }
        const cellOf = [], cells = new Map();
        for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) {
          const root = cf(id(r, c));
          if (!cells.has(root)) cells.set(root, { r0: r, r1: r, c0: c, c1: c, items: [] });
          const cell = cells.get(root);
          cell.r0 = Math.min(cell.r0, r); cell.r1 = Math.max(cell.r1, r); cell.c0 = Math.min(cell.c0, c); cell.c1 = Math.max(cell.c1, c);
          cellOf[id(r, c)] = cell;
        }
        tables.push({ xs, ys, nR, nC, cellOf, cells: [...cells.values()] });
      });
      return tables;
    }

    // 글자 조각을 표 칸에 나눠 담고, 글자가 든 칸이 2줄·2열 이상인 것만 표로 씀. 반환: 조각 번호 → 표 (표가 아니면 없음)
    function yakAssignTables(tables, items) {
      const res = [];
      if (!tables.length) return res;
      items.forEach((it, k) => {
        const tr = it.transform, h = Math.abs(tr[3]) || it.height || 8;
        const x = tr[4] + (it.width || 0) / 2, y = tr[5] + h * 0.35;
        for (const t of tables) {
          if (x < t.xs[0] || x > t.xs[t.nC] || y > t.ys[0] || y < t.ys[t.nR]) continue;
          let c = 0, r = 0;
          while (c < t.nC - 1 && x > t.xs[c + 1]) c++;
          while (r < t.nR - 1 && y < t.ys[r + 1]) r++;
          t.cellOf[r * t.nC + c].items.push({ it, k });
          res[k] = t;
          break;
        }
      });
      const used = new Set(res.filter(Boolean));
      used.forEach(t => {
        const filled = t.cells.filter(c => c.items.some(o => o.it.str.trim()));
        // 글자 든 칸이 한 줄(쪽 머리 띠)이나 한 칸 너비(옆 색인 탭)뿐이면 꾸밈으로 보고 표로 쓰지 않음
        if (new Set(filled.map(c => c.r0)).size < 2 || new Set(filled.map(c => c.c0)).size < 2) { res.forEach((x, k) => { if (x === t) res[k] = undefined; }); return; }
        const rows = Array.from({ length: t.nR }, () => []);
        t.cells.slice().sort((p, q) => p.r0 - q.r0 || p.c0 - q.c0).forEach(c => {
          const cell = [yakCellText(c.items.map(o => o.it))];
          const rs = c.r1 - c.r0 + 1, cs = c.c1 - c.c0 + 1;
          if (rs > 1 || cs > 1) cell.push(rs, cs);
          rows[c.r0].push(cell);
        });
        t.marker = YAK_TB_OPEN + JSON.stringify(rows) + YAK_TB_CLOSE;
      });
      return res;
    }

    // 칸 안 글자: 위→아래, 왼→오른쪽. 칸 안 줄바꿈은 좁은 칸 때문이라 띄어쓰기로 잇고, ①·1.·가.·※ 같은 항목 앞에서만 줄을 바꿈
    function yakCellText(items) {
      const parts = items.filter(it => it.str).map(it => ({ s: it.str, x: it.transform[4], y: it.transform[5], h: Math.abs(it.transform[3]) || it.height || 8 }));
      parts.sort((p, q) => q.y - p.y || p.x - q.x);
      const lines = [];
      parts.forEach(p => {
        const last = lines[lines.length - 1];
        if (last && Math.abs(last.y - p.y) < p.h * 0.5) last.ps.push(p); else lines.push({ y: p.y, ps: [p] });
      });
      const marker = /^([①-⑳]|\d{1,2}\.\s|\d{1,2}\)|[가-하]\.|\(\d{1,2}\)|※|[-•·]\s)/;
      let out = "";
      lines.forEach(l => {
        const t = l.ps.sort((p, q) => p.x - q.x).map(p => p.s).join("").replace(/\s+/g, " ").trim();
        if (!t) return;
        out += out ? (marker.test(t) ? "\n" : " ") + t : t;
      });
      return out.replace(/\u0000/g, " ");
    }

    // 표 표시 → 글(첫 문장 뽑기·미리보기용)
    function yakTablesToText(s) {
      return (s || "").replace(YAK_TB_RE, (m, j) => {
        try { return " " + JSON.parse(j).map(r => r.map(c => c[0]).filter(Boolean).join(" ")).filter(Boolean).join(" / ") + " "; } catch (e) { return " "; }
      });
    }
    // 조항 글 → HTML (표 표시는 <table>로, 잘린 표 표시 조각은 버림)
    function yakBodyHtml(body) {
      const parts = (body || "").split(/(.*?)/);
      let html = "";
      parts.forEach((p, i) => {
        if (i % 2) {
          let rows;
          try { rows = JSON.parse(p); } catch (e) { return; }
          html += '<div class="yak-tbl"><table>' + rows.map(r => '<tr>' + r.map(c => '<td'
            + (c[1] > 1 ? ' rowspan="' + c[1] + '"' : '') + (c[2] > 1 ? ' colspan="' + c[2] + '"' : '') + '>'
            + escapeHtml(c[0] || "") + '</td>').join("") + '</tr>').join("") + '</table></div>';
          return;
        }
        let t = p.replace(/[^]*$/, "").replace(/^[^]*/, "");
        if (i > 0) t = t.replace(/^\n/, "");
        if (i < parts.length - 1) t = t.replace(/\n$/, "");
        html += escapeHtml(t);
      });
      return html;
    }

    async function yakLoadDocNow(prod, say) {
      const f = await hiCall("HHCA0310M26S", { apnflId: prod.clauApnflId });
      const url = HI_URL + "/FileActionServlet/preview/0" + f.savPath + "/" + encodeURIComponent(f.savFileNm) + "." + f.flExts;
      const cacheKey = "v4:" + prod.clauApnflId;  // 글자 뽑는 방식을 바꾸면 v 번호를 올려 예전 저장본을 안 씀
      let pages = (await yakDbGet(cacheKey)) || null;
      if (!pages) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("약관 파일을 받지 못했어요 (" + res.status + ")");
        const total = Number(res.headers.get("Content-Length")) || f.fileSz || 0;
        const reader = res.body.getReader();
        const chunks = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); got += value.length;
          say("약관 내려받는 중… " + (got / 1048576).toFixed(1) + " / " + (total / 1048576).toFixed(1) + "MB", total ? got / total * 60 : null);
        }
        const buf = new Uint8Array(got);
        let o = 0;
        chunks.forEach(c => { buf.set(c, o); o += c.length; });
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          // 표: 칸 선을 찾아 표 안 글자는 칸별로 모으고, 표 첫 글자 자리에 표 표시(한 줄)를 넣음
          let tables = [];
          try { tables = yakFindTables(await page.getOperatorList(), pdfjs.OPS); } catch (e) { tables = []; }
          const inTable = yakAssignTables(tables, tc.items);
          const tableAt = (k) => {
            const t = inTable[k];
            if (!t) return false;
            if (!t.done) { t.done = true; s += "\n" + t.marker + "\n"; }
            return true;
          };
          // 줄 끝은 pdf.js가 알려 주는 hasEOL로 (PDF 원래 줄과 같음). 없는 경우만 글자 높이로 짐작
          let s = "";
          if (tc.items.some(it => "hasEOL" in it)) {
            tc.items.forEach((it, k) => { if (tableAt(k)) return; s += it.str; if (it.hasEOL) s += "\n"; });
          } else {
            let lastY = null;
            tc.items.forEach((it, k) => {
              if (tableAt(k)) { lastY = null; return; }
              if (!it.str.trim()) { if (it.str) s += " "; return; }
              const y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
              if (lastY !== null && Math.abs(y - lastY) > Math.max(2, h * 0.5)) s += "\n";
              s += it.str; lastY = y;
            });
          }
          pages.push(s.replace(/\u0000/g, " "));
          if (i % 20 === 0) say("약관 읽는 중… " + i + " / " + doc.numPages + "쪽", 60 + i / doc.numPages * 40);
        }
        yakDbPut(cacheKey, pages);
      }
      const parsed = yakParse(pages);
      parsed.url = url;
      parsed.fileName = f.originalFileNm || "";
      yakDocs.set(prod.clauApnflId, parsed);
      return parsed;
    }

    // 약관 글 → 보통약관과 특약(번호 머리말 "2-34 ○○ 특별약관")으로 나눔. 쪽 머리·꼬리(쪽번호, 상품명)는 뺌
    function yakParse(pages) {
      const offs = [];
      let all = "";
      pages.forEach(p => {
        offs.push(all.length);
        let lines = p.split("\n").filter(l => !/^\s*\d{1,4}\s*$/.test(l)
          && !/^\s*(\d{1,4}\s+)?[^\n]{0,80}\([A-Za-z]{1,3}\d{4}\)[\s\d종/,·]*$/.test(l)  // 쪽번호, 쪽 머리의 상품명(Hi2607) 줄
          && !/^\s*(보통약관|특별약관|별표|부록)\s+\d{1,4}\s*$|^\s*\d{1,4}\s+(보통약관|특별약관|별표|부록)\s*$/.test(l));  // 쪽 머리 '보통약관 137'
        // 쪽 옆 색인 탭('보통/약관', '특별/약관/상해/질병/…')은 한두 낱말 줄이 이어져 나옴 → 이런 낱말만으로 된 2줄 이상 묶음은 뺌
        const TAB = /^\s*(보통|약관|특별|상해|질병|및|비용|손해|독립|특약|기타|별표|부록|보통약관|특별약관|특별 약관|상해 및 질병|비용 손해|독립 특약|기타 특별 약관)\s*$/;
        lines = lines.filter((l, i) => !(TAB.test(l) && (TAB.test(lines[i - 1] || "") || TAB.test(lines[i + 1] || ""))));
        all += lines.join("\n") + "\n";
      });
      const pageOf = at => { let lo = 0, hi = offs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (offs[m] <= at) lo = m; else hi = m - 1; } return lo + 1; };
      // 특약 머리말은 보통 줄 맨 앞이지만, 앞 특약의 마지막 문장 끝에 붙어 나오는 PDF도 있음 ("…제외합니다.1-2 ○○ 특별약관")
      const heads = [];
      const re = /(^|[.)\]다\s])[ \t]*(\d{1,2}(?:-\d{1,3}){1,3})[ \t]+([^\n]{2,90}?(?:특별약관|특약))[ \t]*$/gm;
      let m;
      while ((m = re.exec(all))) {
        if (/[·…]{3,}|\.{4,}/.test(m[0])) continue;  // 목차 줄
        heads.push({ no: m[2], name: m[3].replace(/\s+/g, ""), at: m.index + m[1].length });
      }
      // 보통약관: '보통약관' 머리말 뒤 3,000자 안에 (목차 줄이 아닌) 제1조 조항 머리가 있는 첫 자리
      // 목차의 '제1조 (목적) ·····129'를 본문으로 잘못 잡으면 보통약관 조항이 모두 빈 글이 됨
      let boAt = -1;
      const bre = /^[^\n]{0,30}보통약관[ \t]*$/gm;
      while ((m = bre.exec(all))) {
        if (/[·…]{3,}/.test(m[0])) continue;
        if (/^[ \t]*제\s*1\s*조\s*\([^)\n]{1,40}\)[^·…\n]*$/m.test(all.slice(m.index, m.index + 3000))) { boAt = m.index; break; }
      }
      const clauses = [];
      if (boAt >= 0) {
        const next = heads.find(h => h.at > boAt);
        clauses.push({ no: "", name: "보통약관", at: boAt, end: next ? next.at : all.length });
      }
      heads.forEach((h, i) => clauses.push(Object.assign({}, h, { end: i + 1 < heads.length ? heads[i + 1].at : all.length })));
      clauses.sort((a, b) => a.at - b.at);
      // 머리말을 못 알아본 특약이 앞 특약에 붙는 경우 대비: 한 특약 안에서 '제1조'가 다시 나오면 거기서 나누고,
      // 바로 윗줄(들)을 특약 이름으로 씀
      const split = [];
      clauses.forEach(c => {
        if (c.name === "보통약관") { split.push(c); return; }
        const text = all.slice(c.at, c.end);
        const starts = [...text.matchAll(/^[ \t]*제\s*1\s*조\s*\(/gm)].map(x => x.index);
        if (starts.length < 2) { split.push(c); return; }
        starts.forEach((st, k) => {
          if (k === 0) { split.push(Object.assign({}, c, { end: c.at + (starts[1] - lineBack(text, starts[1])) })); return; }
          const from = c.at + st - lineBack(text, st);
          const nameLines = all.slice(from, c.at + st).trim().replace(/\s+/g, " ");
          const end = k + 1 < starts.length ? c.at + starts[k + 1] - lineBack(text, starts[k + 1]) : c.end;
          const nm = (nameLines.match(/[^.。]{2,90}(?:특별약관|특약)$/) || [nameLines.slice(-40) || "이름 없는 특약"])[0].trim();
          const numbered = nm.match(/^(\d{1,2}(?:-\d{1,3}){1,3})\s+(.+)$/);
          split.push({ no: numbered ? numbered[1] : "", name: (numbered ? numbered[2] : nm).replace(/\s+/g, ""), at: from, end });
        });
      });
      return { all, pageOf, clauses: split, pages: pages.length };

      // 제1조 바로 위 1~2줄의 길이 (특약 이름이 두 줄로 나뉜 경우 포함)
      function lineBack(text, pos) {
        const p1 = text.lastIndexOf("\n", pos - 2);
        const p2 = text.lastIndexOf("\n", p1 - 1);
        const l1 = text.slice(p1 + 1, pos), l2 = p2 >= 0 ? text.slice(p2 + 1, p1) : "";
        return /(특별약관|특약)\s*$/.test(l1) && !/(특별약관|특약)/.test(l2) && l2.length < 40 && !/[.다]\s*$/.test(l2) ? pos - p2 - 1 : pos - p1 - 1;
      }
    }

    // 조항 나누기: "제1조 (보험금의 지급사유)" 단위
    function yakArticles(doc, clause) {
      const text = doc.all.slice(clause.at, clause.end);
      const re = /^[ \t]*제\s*(\d+)\s*조\s*(?:의\s*(\d+)\s*)?\(([^)\n]{1,40})\)/gm;
      const marks = [];
      let m;
      while ((m = re.exec(text))) marks.push({ n: Number(m[1]), title: m[3].replace(/\s+/g, " ").trim(), at: m.index, label: "제" + m[1] + "조" + (m[2] ? "의" + m[2] : "") });
      return marks.map((a, i) => {
        const body = text.slice(a.at, i + 1 < marks.length ? marks[i + 1].at : text.length);
        return Object.assign(a, { body: yakReflow(body.replace(/^[^\n]*\n/, "")), page: doc.pageOf(clause.at + a.at) });
      });
    }

    // PDF 줄바꿈 다듬기: 폭이 꽉 찬 줄은 다음 줄과 이어 붙이고(단어 중간에서 끊긴 줄),
    // ①·1.·가. 같은 항목 시작, 문장 끝, 짧은 줄(표 칸)은 그대로 둠
    function yakReflow(body) {
      const lines = body.split("\n").map(l => l.replace(/\s+$/, m => m ? " " : ""));
      const isTb = l => l !== undefined && l.indexOf(YAK_TB_OPEN) >= 0;  // 표 표시 줄은 잇지도, 폭 계산에 넣지도 않음
      const lens = lines.filter(l => !isTb(l)).map(l => l.trim().length).sort((a, b) => b - a);
      const full = lens[Math.min(lens.length - 1, Math.floor(lens.length * 0.1))] || 0;
      const marker = /^\s*([①-⑳]|\d{1,2}\.\s|\d{1,2}\)|[가-하]\.|\(\d{1,2}\)|※|\*|[-•·]\s|\[|【|<|제\s*\d+\s*조)/;
      let out = "";
      lines.forEach((l, i) => {
        if (i === 0) { out = l; return; }
        const prev = lines[i - 1];
        // 짧은 줄이 두 줄 이상 이어지면 표 칸으로 보고 붙이지 않음
        const short = s => s !== undefined && s.trim().length < full * 0.5;
        const table = short(l) && short(lines[i + 1]) && !marker.test(lines[i + 1]);
        const join = full >= 20 && !isTb(prev) && !isTb(l) && prev.trim().length >= full * 0.72 && !/(다\.|[.:：])\s*$/.test(prev) && !marker.test(l) && !table;
        out += (join ? "" : "\n") + l;
      });
      return out.replace(/[ \t]{2,}/g, " ").trim();
    }

    function yakKind(title) {
      const t = title.replace(/\s+/g, "");
      if (/(지급하지않는|보장하지않는|보상하지않는)사유|면책|지급제한|지급의제한/.test(t)) return "limit";
      if (/지급사유/.test(t)) return "pay";
      if (/정의|진단확정|세부규정|보장개시|지급기준|분류|판정|확정/.test(t)) return "crit";
      return "other";
    }

    // 원문 안의 '보통약관 제6조(…) 제1항' 같은 참조를 찾아 그 조항(항)을 가져옴
    function yakFollowRefs(doc, article) {
      const bo = doc.clauses.find(c => c.name === "보통약관");
      if (!bo) return [];
      const boArts = yakArticles(doc, bo);
      const out = [];
      const re = /보통약관\s*제\s*(\d+)\s*조\s*(?:\(([^)]*)\))?\s*(?:제\s*(\d+)\s*항)?/g;
      let m;
      while ((m = re.exec(article.body))) {
        const a = boArts.find(x => x.n === Number(m[1]));
        if (!a || out.some(o => o.key === m[0])) continue;
        let body = a.body;
        const hang = m[3] ? Number(m[3]) : 0;
        if (hang && CIRCLED[hang - 1]) {
          const s = body.indexOf(CIRCLED[hang - 1]);
          const e = CIRCLED[hang] ? body.indexOf(CIRCLED[hang], s + 1) : -1;
          if (s >= 0) body = body.slice(s, e > s ? e : body.length).trim();
        }
        out.push({ key: m[0], label: "보통약관 " + a.label + (hang ? " 제" + hang + "항" : ""), title: a.title, body, page: a.page });
      }
      return out;
    }

    // 담보명 ↔ 특약명 맞추기: 흔한 말(특별약관·보장·비 등)을 빼고 두 글자씩 겹치는 정도로
    function yakNormCover(s) {
      return (s || "").replace(/\s+/g, "").replace(/특별약관|특약|보장|담보|보험금/g, "").replace(/\(?갱신형\)?/g, "")
        .replace(/진단비/g, "진단").replace(/수술비/g, "수술").replace(/입원비/g, "입원").replace(/증/g, "").replace(/비$/, "");
    }
    function yakScore(cover, name) {
      const a = yakNormCover(cover), b = yakNormCover(name);
      if (!a || !b) return 0;
      const grams = s => { const g = []; for (let i = 0; i < s.length - 1; i++) g.push(s.slice(i, i + 2)); return g; };
      const ga = grams(a), gb = grams(b).slice();
      let hit = 0;
      ga.forEach(g => { const k = gb.indexOf(g); if (k >= 0) { hit++; gb.splice(k, 1); } });
      let s = ga.length + grams(b).length ? 2 * hit / (ga.length + grams(b).length) : 0;
      if (a.includes(b) || b.includes(a)) s += 0.3;
      if (b.startsWith(a) || a.startsWith(b)) s += 0.2;  // '암진단' → '암진단Ⅱ(일반암)'이 '특정암진단'보다 앞

      // 입력에 없는 변형(갱신형·납입면제·재진단·두번째 등)은 기본형보다 뒤로
      ["갱신형", "납입면제", "재진단", "두번째", "연간", "종합병원", "상급", "후보장"].forEach(w => { if (name.includes(w) && !(cover || "").includes(w)) s -= 0.04; });
      return s;
    }

    function yakFirstSentence(t) {
      const s = yakTablesToText(t).replace(/\s+/g, " ").trim();
      const m = s.match(/^.{10,160}?(?:지급합니다|드립니다|지급하여 드립니다|합니다)\./);
      return m ? m[0] : s.slice(0, 90) + (s.length > 90 ? "…" : "");
    }

    // 공시실 상품 검색 (가입일에 판매 중이던 버전 → 없으면 전체 버전). 같은 상품명·가입일은 다시 묻지 않음
    const yakSearchCache = new Map();
    async function yakFindProducts(product, date) {
      const key = product + "|" + (date || "");
      if (yakSearchCache.has(key)) return yakSearchCache.get(key);
      const ymd = (date || "").replace(/-/g, "");
      const pick = d => [...(d.slYProdList || []), ...(d.slNProdList || [])].filter(p => p && p.clauApnflId);
      let list = pick(await hiCall("HHCA0310M38S", { searchData: product, searchDate: ymd, searchType: ymd ? "1" : "0", searchKeyword: 1 }));
      let note = "";
      if (!list.length && ymd) {
        list = pick(await hiCall("HHCA0310M38S", { searchData: product, searchDate: "", searchType: "0", searchKeyword: 1 }));
        if (list.length) note = "가입일(" + date + ")에 판매 중이던 버전을 찾지 못해 전체 버전을 보여 줘요. 상품 버전을 확인해 주세요.";
      }
      const res = { list, note };
      if (list.length) yakSearchCache.set(key, res);
      return res;
    }

    // 약관에서 청구할 수 있는 담보 = '보험금의 지급사유' 조항이 있는 특약 (제도특약·할인특약 등은 빠짐), 이름이 같으면 하나만
    function yakCoverages(doc) {
      if (doc.coverages) return doc.coverages;
      const seen = new Set();
      doc.coverages = doc.clauses.map((c, i) => ({ c, i })).filter(({ c }) => yakArticles(doc, c).some(a => yakKind(a.title) === "pay"))
        .map(({ c, i }) => ({ i, no: c.no, name: c.name === "보통약관" ? "보통약관(기본계약)" : c.name }))
        .filter(x => !seen.has(x.name) && seen.add(x.name));
      return doc.coverages;
    }

    // 상품명·가입일·담보명으로 실행 (처음 화면 시작하기, 약관 탭의 '약관 찾기')
    // prodIdx: 처음 화면에서 고른 상품 버전 (같은 검색 결과일 때만 씀)
    async function yakRun(product, date, cover, prodIdx) {
      const run = ++yakState.run;
      document.getElementById("yak-product").value = product || "";
      document.getElementById("yak-date").value = date || "";
      document.getElementById("yak-cover").value = cover || "";
      if (!product) { document.getElementById("yak-live").innerHTML = ""; document.getElementById("yak-std").open = true; return null; }
      try {
        yakStatus("현대해상 공시실에서 '" + product + "' 찾는 중…", 5);
        const { list, note } = await yakFindProducts(product, date);
        if (run !== yakState.run) return null;
        if (!list.length) throw new Error("공시실에서 '" + product + "' 상품을 찾지 못했어요. 상품명을 줄여서(예: 퍼펙트플러스) 다시 찾아 보세요.");
        const idx = prodIdx >= 0 && prodIdx < list.length ? prodIdx : 0;
        yakState = Object.assign(yakState, { products: list, prodIdx: idx, doc: null, clauseIdx: -1, cover: cover || "", note });
        return await yakOpenProduct(idx, run);
      } catch (err) {
        if (run === yakState.run) {
          yakStatus(err.message + " 아래 '표준약관 기준으로 보기'를 참고하세요.", null, true);
          document.getElementById("yak-std").open = true;
        }
        return null;
      }
    }

    async function yakOpenProduct(idx, run) {
      yakState.prodIdx = idx;
      const prod = yakState.products[idx];
      yakStatus("약관 파일 찾는 중… " + prod.prodNm, 10);
      const doc = await yakLoadDoc(prod, run);
      if (run !== yakState.run) return null;
      if (doc.clauses.length < 2) throw new Error("약관에서 글자를 읽지 못했어요(스캔 이미지 약관일 수 있어요).");
      yakState.doc = doc;
      // 청구 담보에 가장 가까운 특약 (담보명이 없으면 보통약관)
      let best = doc.clauses.findIndex(c => c.name === "보통약관");
      if (yakState.cover && !/^보통약관/.test(yakState.cover)) {
        let top = -1;
        doc.clauses.forEach((c, i) => { const s = yakScore(yakState.cover, c.name); if (s > top) { top = s; best = i; } });
      }
      yakState.clauseIdx = Math.max(0, best);
      return yakRender();
    }

    function yakRender() {
      const { doc, products, prodIdx, clauseIdx, note } = yakState;
      const prod = products[prodIdx];
      const clause = doc.clauses[clauseIdx];
      const arts = yakArticles(doc, clause);
      const groups = { pay: [], crit: [], limit: [], other: [] };
      arts.forEach(a => groups[yakKind(a.title)].push(a));
      // 특약에 제한 조항이 없으면 보통약관의 '보험금을 지급하지 않는 사유'
      if (!groups.limit.length && clause.name !== "보통약관") {
        const bo = doc.clauses.find(c => c.name === "보통약관");
        if (bo) yakArticles(doc, bo).filter(a => yakKind(a.title) === "limit").forEach(a => groups.limit.push(Object.assign({}, a, { label: "보통약관 " + a.label })));
      }
      const secText = doc.all.slice(clause.at, clause.end);
      const kcd = secText.match(/제\s*(\d+)\s*차\s*한국표준질병/);
      const pdfLink = doc.url + "#page=" + doc.pageOf(clause.at);
      // 담보 목록: 청구 담보와 가까운 순 8개 + 나머지는 약관 순서
      const order = doc.clauses.map((c, i) => ({ i, s: yakState.cover ? yakScore(yakState.cover, c.name) : 0 }));
      const near = order.slice().sort((a, b) => b.s - a.s).slice(0, yakState.cover ? 8 : 0).map(o => o.i);
      const opt = i => { const c = doc.clauses[i]; return '<option value="' + i + '"' + (i === clauseIdx ? ' selected' : '') + '>' + escapeHtml((c.no ? c.no + " " : "") + c.name) + '</option>'; };
      const shortProd = p => p.prodNm.replace(/^무배당\s*/, "").replace(/현대해상/, "");
      const ymd = s => (s || "").trim().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
      let html = note ? '<div class="yak-status err">' + escapeHtml(note) + '</div>' : '';
      html += '<div class="yak-pick">'
        + '<span class="k">상품</span><select id="yak-prod-sel">' + products.map((p, i) => '<option value="' + i + '"' + (i === prodIdx ? ' selected' : '') + '>'
          + escapeHtml(shortProd(p)) + ' · 판매 ' + ymd(p.slStDt) + '~' + ymd(p.slEdDt) + '</option>').join("") + '</select>'
        + '<span class="k">청구 담보</span><select id="yak-clause-sel">'
        + (near.length ? '<optgroup label="청구 담보와 가까운 특약">' + near.map(opt).join("") + '</optgroup><optgroup label="전체 (약관 순서)">' : '')
        + doc.clauses.map((c, i) => opt(i)).join("") + (near.length ? '</optgroup>' : '') + '</select>'
        + '<span class="links"><a href="' + pdfLink + '" target="_blank" rel="noopener">약관 PDF 원문 (p.' + doc.pageOf(clause.at) + ') ↗</a>'
        + '<a href="' + HI_URL + '/serviceAction.do?menuId=100932" target="_blank" rel="noopener">현대해상 공시실 ↗</a>'
        + '<span class="kcd-en">' + doc.pages + '쪽 · 특약 ' + (doc.clauses.length - 1) + '개</span></span></div>';
      // 조항마다 어느 약관(보통약관 / 어떤 특별약관)에서 온 것인지 표시
      const boName = "보통약관";
      const srcOf = a => (/^보통약관/.test(a.label || "") || clause.name === "보통약관")
        ? '<span class="yak-src bo">' + boName + '</span>'
        : '<span class="yak-src sp">특별약관</span><span class="yak-src-nm">' + escapeHtml((clause.no ? clause.no + " " : "") + clause.name) + '</span>';
      const artHtml = (a, from) => '<div class="yak-art' + (from ? ' from' : '') + '">'
        + (from ? '<div class="yak-cite">↳ 위 조항이 따르는 보통약관 원문</div>' : '')
        + '<div class="yak-srcline">' + srcOf(a) + '</div>'
        + '<div class="at">' + escapeHtml((a.label || "") + " (" + a.title + ")")
        + '<span class="ref">p.' + a.page + '</span></div><div class="tx">'
        + (a.body ? yakBodyHtml(a.body) : '<span class="kcd-en">이 조항의 글을 읽지 못했어요. PDF 원문(p.' + a.page + ')을 확인하세요.</span>') + '</div></div>';
      const box = (cls, title, list, extra) => '<div class="yak-box ' + cls + '"><h3>' + title + (extra || '') + '</h3><div class="yak-scroll">'
        + (list.length ? list.map(a => artHtml(a) + yakFollowRefs(doc, a).map(r => artHtml(r, true)).join("")).join("") : '<p class="kcd-en">이 특약에는 해당 조항이 없어요.</p>') + '</div></div>';
      html += '<div class="yak-panel">'
        + box("pay", "지급사유", groups.pay, kcd ? '<span class="yak-kcd">KCD ' + kcd[1] + '차 기준</span>' : '')
        + box("limit", "지급 제한사유", groups.limit)
        + (groups.crit.length ? box("crit", "판단 기준 (정의·진단확정 등)", groups.crit) : '')
        + '</div>';
      if (groups.other.length) html += '<details class="yak-other"><summary>그 밖의 조항 ' + groups.other.length + '개 (' + escapeHtml(groups.other.map(a => a.title).slice(0, 4).join(", ")) + (groups.other.length > 4 ? " …" : "") + ')</summary>'
        + '<div class="yak-box"><div class="yak-scroll">' + groups.other.map(a => artHtml(a)).join("") + '</div></div></details>';
      html += '<p class="crit-src">출처: 현대해상 공시실 ' + escapeHtml(doc.fileName || prod.prodNm) + '. 조항은 약관 PDF에서 뽑은 원문이고, 표는 PDF의 칸 선을 따라 다시 그렸어요. 지급 판단 전 원문을 확인하세요.</p>';
      document.getElementById("yak-live").innerHTML = html;
      document.getElementById("yak-std").open = false;
      const result = { prod, clause, groups, pdfLink, kcd: kcd ? kcd[1] : "", follow: groups.limit.flatMap(a => yakFollowRefs(doc, a)) };
      yakState.result = result;
      yakAfter(result);
      return result;
    }

    // 결과가 나오면 메뉴 미리보기·카드뉴스 약관 장에 반영
    function yakAfter(r) {
      const pay = r.groups.pay[0];
      const limits = r.groups.limit.map(a => a.label).concat(r.follow.map(f => f.label));
      setPreview("yakgwan", [
        ["상품", r.prod.prodNm.replace(/^무배당\s*/, "").replace(/현대해상/, "")],
        ["담보", r.clause.name, r.clause.no],
        ["지급사유", pay ? yakFirstSentence(pay.body) : "조항 없음", pay ? pay.label : "", true],
        ["제한", limits.length ? limits.join(" → ") : "별도 조항 없음"]
      ]);
      fillYakCard(r);
    }
    function fillYakCard(r) {
      const back = cnTab !== "exempt" ? [cnTab, cnSub] : null;
      if (back) switchCardNews("exempt", cnSubFor("exempt"));
      const pay = r.groups.pay[0];
      setCard("yak", 0, r.clause.name);
      if (pay) setCard("yak", 1, shorten(yakFirstSentence(pay.body), 40) + " (" + pay.label + ")");
      // 셋째 줄(쉽게 말씀드리면)은 고객용 쉬운 설명이라 약관 원문으로 덮지 않음
      setCardLink("yak", r.pdfLink);
      saveCardNews();
      if (back) switchCardNews(back[0], back[1]);
    }

    document.getElementById("yak-form").addEventListener("submit", e => {
      e.preventDefault();
      yakRun(document.getElementById("yak-product").value.trim(), document.getElementById("yak-date").value, document.getElementById("yak-cover").value.trim());
    });
    document.getElementById("yak-live").addEventListener("change", async e => {
      if (e.target.id === "yak-clause-sel") { yakState.clauseIdx = Number(e.target.value); yakRender(); }
      if (e.target.id === "yak-prod-sel") {
        const run = ++yakState.run;
        try { await yakOpenProduct(Number(e.target.value), run); }
        catch (err) { if (run === yakState.run) yakStatus(err.message, null, true); }
      }
    });

    // ===== 분쟁조정: 금감원 분쟁조정정보 5개 게시판(보험 분야)을 입력 정보로 골라 한 화면에 =====
    // 데이터는 FSS분쟁조정 폴더 파일을 gzip으로 줄여 FSS_PACKED(앞 script)에 넣어 두고 처음에 한 번 풂
    // 항목: { b: 게시판, id, type: 유형, title, date, sum: 요지, q: 쟁점, a: 결론, res: "ok"|"no"|"", url, body: 본문 }
    const FSS_BOARDS = [
      { key: "decision", label: "분쟁조정결정례", short: "결정례", list: "https://www.fss.or.kr/fss/bbs/B0000390/list.do?menuNo=201193" },
      { key: "standard", label: "분쟁해결기준", short: "해결기준", list: "https://www.fss.or.kr/fss/job/fncCnflPrcdnt/list.do?menuNo=201194&rgnlCode=B" },
      { key: "case", label: "분쟁조정사례", short: "사례", list: "https://www.fss.or.kr/fss/job/fncCnflCase/list.do?menuNo=201195&rgnlCode=B" },
      { key: "precedent", label: "주요판례", short: "판례", list: "https://www.fss.or.kr/fss/job/fncCnflMainPrcdnt/list.do?menuNo=201196&rgnlCode=B" },
      { key: "notice", label: "소비자 유의사항", short: "유의사항", list: "https://www.fss.or.kr/fss/job/fncCnflNewsData/list.do?menuNo=201197&rgnlCode=B" }
    ];
    let fssData = null;
    const fssReady = unpackGzip(FSS_PACKED.items).then(t => {
      fssData = JSON.parse(t).map(x => Object.assign(x, { flat: (x.title + " " + x.type + " " + x.sum + " " + x.q + " " + x.a).replace(/\s+/g, ""), bodyFlat: (x.body || "").replace(/\s+/g, "") }));
      return fssData;
    }).catch(err => { console.error(err); return null; });

    // 진단코드 → 분쟁 자료에서 쓰는 질환 단어
    const FSS_DISEASE_WORDS = [
      [/^I6/, ["뇌혈관", "뇌졸중", "뇌경색", "뇌출혈"]], [/^I2[0-5]/, ["심근경색", "협심증", "허혈성심장", "심혈관"]],
      [/^(C|D0)/, ["암", "악성신생물"]], [/^D3[7-9]|^D4[0-8]/, ["경계성종양", "행동양식불명"]], [/^D[1-3]/, ["양성종양"]],
      [/^E1[0-4]/, ["당뇨"]], [/^F/, ["정신", "우울"]], [/^M5[0-4]/, ["디스크", "추간판", "척추"]], [/^[ST]/, ["상해", "골절"]],
      [/^G/, ["신경"]], [/^K/, ["소화기"]], [/^O/, ["임신", "출산"]], [/^N/, ["신장"]], [/^J/, ["폐", "호흡기"]]
    ];
    // 담보명 → 단어
    const FSS_COVER_WORDS = [
      [/진단/, "진단"], [/입원/, "입원"], [/수술/, "수술"], [/사망/, "사망"], [/장해/, "장해"], [/(실손|의료비)/, "실손"],
      [/(상해|재해)/, "상해"], [/(간병|요양)/, "간병"], [/통원/, "통원"], [/일당/, "일당"], [/항암/, "항암"]
    ];

    // 입력 정보 → [단어, 무게, 출처] 목록 (쟁점 3 · 질환 2 · 담보 1.5 · 직업 2)
    function fssTermsFromCase(v) {
      const terms = [];
      const add = (w, wt, src) => { w = (w || "").replace(/\s+/g, ""); if (w.length >= 2 && !terms.some(t => t[0] === w)) terms.push([w, wt, src]); };
      (v.issue || "").split(/[\s,·/]+/).forEach(w => add(w, 3, "쟁점"));
      if (v.code) {
        const code = normCode(v.code);
        const meta = KCD[code] || KCD[code.slice(0, 3)];
        if (meta) add(meta.kw, 2, "질환");
        const name = koicdName(code) || koicdName(code.slice(0, 3));
        if (name) add(name.replace(/(의|및|기타|상세불명|으로|명시되지 않은)/g, " ").split(/\s+/).sort((a, b) => b.length - a.length)[0], 2, "질환");
        FSS_DISEASE_WORDS.filter(([re]) => re.test(code)).forEach(([, ws]) => ws.forEach(w => add(w, 2, "질환")));
      }
      if (v.cover) {
        // 담보 유형 단어(실손·진단·장해…)를 담보명 그대로보다 무겁게: 금감원 글은 '실손의료비'보다 '실손보험금'처럼 씀
        FSS_COVER_WORDS.filter(([re]) => re.test(v.cover)).forEach(([, w]) => add(w, 2, "담보"));
        add(v.cover.replace(/(보장)?(특별약관|특약)$/, "").replace(/(진단비|입원일당|입원비|수술비|보험금|보장|담보)$/, ""), 1.5, "담보");
      }
      // 직업은 상해 담보이거나 쟁점에 직업·통지가 있을 때만 (진단비 사고에 직업 자료가 섞이지 않게)
      if (v.job && (/(상해|재해|사망|장해)/.test(v.cover || "") || /(직업|통지)/.test(v.issue || ""))) { add("직업", 2, "직업"); add("통지의무", 2, "직업"); }
      // 한 단어가 다른 단어를 품으면 하나만 남김 (심근경색 ⊂ 급성심근경색): 무게가 큰 쪽, 같으면 짧은 쪽
      const covers = (a, b) => a[0].includes(b[0]) || b[0].includes(a[0]);
      return terms.filter(t => !terms.some(o => o !== t && covers(o, t) && (o[1] > t[1] || (o[1] === t[1] && o[0].length < t[0].length))));
    }

    // 점수: 제목·요지·쟁점·결론에 있으면 무게만큼, 본문에만 있으면 절반
    // 2점 미만이거나 1등 점수의 35%에 못 미치는 약한 자료는 뺌
    function rankFss(terms) {
      const scored = fssData.map(x => {
        let score = 0;
        const hit = [];
        terms.forEach(([w, wt]) => {
          if (x.flat.includes(w)) { score += wt; hit.push(w); }
          else if (x.bodyFlat.includes(w)) { score += wt / 2; hit.push(w); }
        });
        return { x, score, hit };
      });
      const top = Math.max(0, ...scored.map(s => s.score));
      return scored.filter(s => s.score >= Math.max(2, top * 0.35)).sort((a, b) => b.score - a.score || b.x.date.localeCompare(a.x.date));
    }

    let fssState = { terms: [], ranked: [], tab: "case", shown: {} };

    async function runFssSearch(query, v) {
      const box = document.getElementById("fss-result");
      if (!fssData) box.innerHTML = '<div class="kcd-box">분쟁조정 자료를 불러오는 중…</div>';
      await fssReady;
      if (!fssData) { box.innerHTML = '<div class="kcd-box">자료를 불러오지 못했어요. 최신 Chrome·Edge·Safari에서 열어 주세요.</div>'; return []; }
      let terms = v ? fssTermsFromCase(v) : [];
      if (query && query.trim()) terms = query.trim().split(/[\s,·/]+/).filter(w => w.length >= 2).map(w => [w, 3, "검색"]);
      document.getElementById("fss-query").value = terms.filter(t => t[1] >= 2).map(t => t[0]).slice(0, 6).join(" ");
      const ranked = terms.length ? rankFss(terms) : fssData.map(x => ({ x, score: 0, hit: [] })).sort((a, b) => b.x.date.localeCompare(a.x.date));
      // 처음 여는 탭: 가장 잘 맞는 자료가 있는 게시판 (입력이 없으면 분쟁조정사례)
      const first = terms.length && ranked.length ? ranked[0].x.b : "case";
      fssState = { terms, ranked, tab: first, shown: {} };
      renderFssResult();
      return ranked;
    }

    function renderFssResult() {
      const { terms, ranked, tab } = fssState;
      const box = document.getElementById("fss-result");
      const counts = {};
      FSS_BOARDS.forEach(b => { counts[b.key] = ranked.filter(r => r.x.b === b.key).length; });
      let html = '';
      html += '<div class="fss-terms">' + (terms.length
        ? '<span>검색어</span>' + terms.map(t => '<span class="t" title="' + t[2] + '">' + escapeHtml(t[0]) + '</span>').join("")
        : '<span>처음 화면에 사고 정보를 넣으면 맞는 자료를 골라 보여 줘요. 지금은 게시판별 최신 자료예요.</span>') + '</div>';
      html += '<div class="fss-overview">' + FSS_BOARDS.map(b => '<button type="button" data-fss-tab="' + b.key + '" class="'
        + (b.key === tab ? 'on' : '') + (counts[b.key] ? '' : ' zero') + '"><span class="n">' + counts[b.key] + '</span><span class="l">' + b.label + '</span></button>').join("") + '</div>';
      const board = FSS_BOARDS.find(b => b.key === tab);
      const list = ranked.filter(r => r.x.b === tab);
      const limit = fssState.shown[tab] || 10;
      const searchWord = terms.length ? terms.slice().sort((a, b) => b[1] - a[1])[0][0] : "";
      const liveUrl = board.list + (searchWord ? "&searchCnd=1&searchWrd=" + encodeURIComponent(searchWord) : "");
      html += '<div class="fss-more"><span>' + board.label + ' ' + list.length + '건' + (terms.length ? ' · 맞는 정도 순' : ' · 최신순') + '</span>'
        + '<a href="' + liveUrl + '" target="_blank" rel="noopener">금감원에서 최신 글 검색 ↗</a></div>';
      if (!list.length) html += '<p class="none">이 게시판에는 맞는 자료가 없어요.</p>';
      html += list.slice(0, limit).map(r => fssCard(r)).join("");
      if (list.length > limit) html += '<div class="fss-more"><span></span><button type="button" data-fss-more="1">' + Math.min(10, list.length - limit) + '건 더 보기</button></div>';
      html += '<p class="kcd-src">출처: 금융감독원 분쟁조정정보 (보험 분야, ' + FSS_PACKED.date + ' 기준). 그 뒤에 올라온 글은 위의 "금감원에서 최신 글 검색"으로 확인하세요.</p>';
      box.innerHTML = html;
    }

    function fssCard({ x, hit }) {
      const badge = x.res === "ok" ? '<span class="badge ok">지급·지급 권고</span>' : x.res === "no" ? '<span class="badge no">부지급 정당</span>' : '';
      const line = (k, t) => t ? '<div class="line"><b>' + k + '</b><span>' + escapeHtml(t) + '</span></div>' : '';
      return '<div class="fss-item"><div class="head">' + (x.type ? '<span class="tag">' + escapeHtml(x.type) + '</span>' : '')
        + '<span>' + x.date.replace(/-/g, ".") + '</span>' + badge
        + (hit.length ? '<span class="why">일치: ' + escapeHtml(hit.slice(0, 3).join(", ")) + '</span>' : '') + '</div>'
        + '<div class="title">' + escapeHtml(x.title) + '</div>'
        + line("요지", x.sum) + line("쟁점", x.q) + line("결론", x.a)
        + (x.body ? '<details><summary>본문 보기</summary><div class="full">' + escapeHtml(x.body) + '</div></details>' : '')
        + '<div class="foot"><a href="' + x.url + '" target="_blank" rel="noopener">원문 보기 ↗</a>'
        + (x.b === "decision" ? '<span class="kcd-en">본문은 금감원 첨부파일(한글)로 제공돼요</span>' : '') + '</div></div>';
    }

    document.getElementById("fss-result").addEventListener("click", e => {
      const t = e.target.closest("[data-fss-tab]");
      if (t) { fssState.tab = t.dataset.fssTab; renderFssResult(); return; }
      if (e.target.closest("[data-fss-more]")) { fssState.shown[fssState.tab] = (fssState.shown[fssState.tab] || 10) + 10; renderFssResult(); }
    });
    runFssSearch("", null);
    // 진단코드 입력칸 자동완성 목록 (KCD 9차 3단위 코드는 분류표를 푼 뒤 loadKoicd가 채움)
    document.getElementById("kcd-list").innerHTML = Object.keys(KCD)
      .map(code => '<option value="' + code + '">' + KCD[code].name + '</option>').join("");

    // ===== 장기 인보험 손해사정의 대표 쟁점: [쟁점(입력값), 설명, PubMed 영어 검색어] =====
    // 쟁점 값의 첫 단어는 판례·분쟁조정 검색어로 쓰이므로 짧고 핵심 단어로 시작하게 함
    const ISSUE_GROUPS = [
      ["계약 단계 (알릴 의무)", [
        ["고지의무 위반", "청약 때 병력·치료 사실을 알리지 않음 → 해지·면책", ""],
        ["통지의무 위반", "가입 후 직업·직무 변경을 알리지 않음 → 비례 삭감", ""],
        ["설명의무 위반", "면책·감액 등 약관 중요 내용을 설명했는지", ""]]],
      ["보험사고 해당성 (상해·재해)", [
        ["외래성", "질병이 아닌 외부 원인의 사고인지 (내인사 배제)", "sudden death"],
        ["우연성", "예견하지 못한 사고인지, 고의·자해가 아닌지", "accident"],
        ["재해 해당 여부", "재해분류표의 재해(우발적 외래 사고)에 해당하는지", "accidental injury"],
        ["사고 인과관계", "사고와 사망·장해·질병 사이의 상당인과관계", "causation trauma"]]],
      ["면책 사유", [
        ["고의·자살 면책", "피보험자의 고의·자살 (심신상실 상태 예외)", "suicide"],
        ["위험 활동 면책", "직업·직무·동호회 목적의 위험 활동 중 사고", ""],
        ["면책·감액기간", "책임개시 전 진단·발병, 90일 면책·감액 지급 기간", ""]]],
      ["진단비 (질병 해당성)", [
        ["진단확정", "전문의 진단과 병리·영상 검사 등 확정 요건 충족 여부", "diagnosis"],
        ["암 분류", "일반암과 유사암(경계성·제자리·갑상선·기타피부암) 구분", "neoplasm classification"],
        ["원발부위·전이암", "원발 부위 기준 분류, 전이암의 진단비 기준", "primary site metastasis"],
        ["뇌혈관질환 해당 여부", "뇌졸중·뇌출혈·뇌경색 담보 범위(I60~I69) 해당", "cerebrovascular disease"],
        ["심장질환 해당 여부", "급성심근경색(I21~I23)·허혈성심장질환 범위 해당", "acute myocardial infarction"],
        ["질병코드 분류", "KCD 코딩이 맞는지 (주진단·부진단 선택)", ""]]],
      ["장해", [
        ["장해 지급률", "장해분류표 기준 지급률 평가와 합산", "permanent disability assessment"],
        ["장해 고정", "장해 고정 시기 · 한시장해(5년 이상) 여부", "disability"],
        ["기왕장해·기여도", "이전 장해·기왕증의 기여도 감액", "pre-existing condition"]]],
      ["입원·수술·치료비", [
        ["입원 필요성", "입원 치료가 의학적으로 필요했는지 (통원 가능 여부)", "hospitalization"],
        ["수술 해당 여부", "약관·수술분류표의 수술 정의에 맞는지", "surgery definition"],
        ["암 직접치료", "요양병원 입원 등이 암의 직접 치료인지", "cancer treatment"],
        ["실손 비급여 적정성", "도수치료·주사 등 비급여 치료의 필요성과 횟수", "manual therapy"]]]
    ];
    const ISSUE_EN = {};
    ISSUE_GROUPS.forEach(([, items]) => items.forEach(([v, , en]) => { if (en) ISSUE_EN[v] = en; }));

    // ===== 통계청 한국표준직업분류: 대분류 → 중분류 → 대표 직업 =====
    const KSCO = [
      ["1", "관리자", [
        ["11", "공공 기관 및 기업 고위직", ["기업 대표이사", "고위 공무원", "공공기관장"]],
        ["12", "행정·경영 지원 및 마케팅 관리직", ["경영지원 관리자", "인사 관리자", "마케팅 관리자"]],
        ["13", "전문 서비스 관리직", ["연구 관리자", "병원 관리자", "금융 관리자", "교육 관리자"]],
        ["14", "건설·전기 및 생산 관련 관리직", ["건설현장 소장", "공장장", "생산 관리자"]],
        ["15", "판매 및 고객 서비스 관리직", ["영업 관리자", "음식점 관리자", "숙박업 관리자"]]]],
      ["2", "전문가 및 관련 종사자", [
        ["21", "과학 전문가 및 관련직", ["연구원", "실험실 연구보조원"]],
        ["22", "정보 통신 전문가 및 기술직", ["소프트웨어 개발자", "웹 개발자", "네트워크 엔지니어", "통신 설비 기술자"]],
        ["23", "공학 전문가 및 기술직", ["건축 설계 기술자", "토목 기술자", "기계 설계 기술자", "전기 안전 기술자", "현장 감리원"]],
        ["24", "보건·사회복지 및 종교 관련직", ["의사", "간호사", "약사", "물리치료사", "사회복지사", "성직자"]],
        ["25", "교육 전문가 및 관련직", ["대학 교수", "초중고 교사", "유치원 교사", "학원 강사"]],
        ["26", "법률 및 행정 전문직", ["변호사", "법무사", "행정 공무원(전문직)"]],
        ["27", "경영·금융 전문가 및 관련직", ["회계사", "세무사", "손해사정사", "보험 계리사", "투자 상담원"]],
        ["28", "문화·예술·스포츠 전문가 및 관련직", ["기자", "디자이너", "방송 연출가", "배우", "프로 운동선수", "스포츠 강사"]]]],
      ["3", "사무 종사자", [
        ["31", "경영 및 회계 관련 사무직", ["총무 사무원", "인사 사무원", "회계 사무원", "경리 사무원", "비서"]],
        ["32", "금융 사무직", ["은행 사무원", "보험 사무원", "증권 사무원"]],
        ["33", "법률 및 감사 사무직", ["법률 사무원", "감사 사무원"]],
        ["39", "상담·안내·통계 및 기타 사무직", ["고객 상담원(콜센터)", "안내 접수원", "통계 사무원"]]]],
      ["4", "서비스 종사자", [
        ["41", "경찰·소방 및 보안 관련 서비스직", ["경찰관", "소방관", "교도관", "경호원"]],
        ["42", "돌봄·보건 및 개인 생활 서비스직", ["요양보호사", "간병인", "보육교사", "미용사", "피부관리사"]],
        ["43", "운송 및 여가 서비스직", ["항공기 객실 승무원", "여행 안내원", "레저 강사"]],
        ["44", "조리 및 음식 서비스직", ["주방장·조리사", "바텐더", "음식점 서빙원"]]]],
      ["5", "판매 종사자", [
        ["51", "영업직", ["보험 설계사", "자동차 영업원", "제품 영업원", "부동산 중개인"]],
        ["52", "매장 판매 및 상품 대여직", ["매장 판매원", "편의점 점원", "계산원"]],
        ["53", "통신 및 방문·노점 판매 관련직", ["텔레마케터", "방문 판매원", "노점상"]]]],
      ["6", "농림어업 숙련 종사자", [
        ["61", "농·축산 숙련직", ["작물 재배 농업인", "축산업 종사자", "조경원"]],
        ["62", "임업 숙련직", ["벌목원", "조림·산림 관리원"]],
        ["63", "어업 숙련직", ["어부(어선원)", "해녀", "양식업 종사자"]]]],
      ["7", "기능원 및 관련 기능 종사자", [
        ["71", "식품 가공 관련 기능직", ["제빵원", "정육원", "떡 제조원"]],
        ["72", "섬유·의복 및 가죽 관련 기능직", ["재단사", "재봉사", "구두 제조원"]],
        ["73", "목재·가구·악기 및 간판 관련 기능직", ["목수(가구)", "간판 제작 설치원"]],
        ["74", "금속 성형 관련 기능직", ["용접공", "판금원", "단조원"]],
        ["75", "운송 및 기계 관련 기능직", ["자동차 정비원", "기계 정비원", "항공기 정비원"]],
        ["76", "전기 및 전자 관련 기능직", ["전기공", "전기 설비 설치원", "전자제품 수리원"]],
        ["77", "정보 통신 및 방송장비 관련 기능직", ["통신 케이블 설치원", "방송장비 설치원"]],
        ["78", "건설 및 채굴 관련 기능직", ["철근공", "형틀목공", "미장공", "배관공", "도장공", "건설 비계공", "광원(채굴원)"]],
        ["79", "기타 기능 관련직", ["안경사", "귀금속 세공원", "건물 도배공"]]]],
      ["8", "장치·기계 조작 및 조립 종사자", [
        ["81", "식품 가공 관련 기계 조작직", ["식품 제조기 조작원"]],
        ["82", "섬유 및 신발 관련 기계 조작직", ["섬유 기계 조작원", "신발 제조기 조작원"]],
        ["83", "화학 관련 기계 조작직", ["화학물 제조기 조작원", "플라스틱 제품 조작원"]],
        ["84", "금속 및 비금속 관련 기계 조작직", ["금속 가공기 조작원", "도금기 조작원"]],
        ["85", "기계 제조 및 관련 기계 조작직", ["공작기계 조작원", "자동차 조립원", "지게차 운전원"]],
        ["86", "전기 및 전자 관련 기계 조작직", ["전자부품 조립원", "반도체 장비 조작원"]],
        ["87", "운전 및 운송 관련직", ["택시 운전원", "버스 운전원", "화물차 운전원", "택배 배송기사", "중장비 운전원", "선박 갑판원"]],
        ["88", "상하수도 및 재활용 처리 관련 기계 조작직", ["정수장 조작원", "재활용 처리기 조작원"]],
        ["89", "목재·인쇄 및 기타 기계 조작직", ["인쇄기 조작원", "목재 가공기 조작원"]]]],
      ["9", "단순노무 종사자", [
        ["91", "건설 및 광업 관련 단순 노무직", ["건설 단순 노무원", "광업 단순 노무원"]],
        ["92", "운송 관련 단순 노무직", ["하역·적재원", "택배 상하차원", "이삿짐 운반원"]],
        ["93", "제조 관련 단순 노무직", ["제조 단순 노무원", "포장원"]],
        ["94", "청소 및 경비 관련 단순 노무직", ["건물 청소원", "환경미화원", "아파트 경비원"]],
        ["95", "가사·음식 및 판매 관련 단순 노무직", ["가사 도우미", "주방 보조원", "배달원(오토바이)"]],
        ["99", "농림어업 및 기타 서비스 단순 노무직", ["농림어업 단순 노무원", "주차 관리원"]]]],
      ["A", "군인", [
        ["A0", "군인", ["직업군인(장교·부사관)", "현역 병사"]]]]
    ];

    // 처음 화면 대표상품 (현대해상 장기 인보험 주력 상품) / 상품명 자동완성 기본 목록 (2026.11 공시실 판매 상품)
    const PRODUCT_CHIPS = ["퍼펙트플러스종합보험(세만기형)", "굿앤굿어린이종합보험Q", "하이콜퍼펙트종합보험(세만기형)", "간편한3.10.10건강보험(세만기형)",
      "마음플러스(+)상해종합보험", "뉴하이카운전자상해보험", "두배받는암보험", "실손의료비보장보험(갱신형)"];
    const PRODUCT_BASE = [
      "퍼펙트플러스종합보험(세만기형)", "퍼펙트플러스종합보험(연만기갱신형)", "하이콜퍼펙트종합보험(세만기형)", "하이콜퍼펙트종합보험(연만기갱신형)",
      "굿앤굿스타종합보험(세만기형)", "굿앤굿스타종합보험(연만기갱신형)", "굿앤굿어린이종합보험Q", "다이렉트굿앤굿어린이종합보험Q",
      "인생의품격종합보험(세만기형)", "마음플러스(+)상해종합보험", "하이퍼스트상해보험", "하이콜든든생활보장상해보험", "행복가득생활보장보험",
      "간편한3.10.10건강보험(세만기형)", "간편한3.10.10건강보험(연만기갱신형)", "간편한333건강보험(세만기형)", "간편한333건강보험(연만기갱신형)",
      "내삶엔(3N)맞춤간편건강보험(세만기형)", "내삶엔(3N)맞춤간편건강보험(연만기갱신형)", "내몸엔(N)맞춤간편건강보험(세만기형)", "내몸엔(N)맞춤간편건강보험(연만기갱신형)",
      "다이렉트간편건강보험(연만기갱신형)", "다이렉트퍼펙트건강보험", "두배받는암보험", "다이렉트계속받는암보험", "케어더블암치매보험(세만기형)",
      "퍼펙트케어간병보험", "든든한건강플러스간병보험", "뉴하이카운전자상해보험", "하이콜운전자상해보험", "다이렉트운전자보험", "다이렉트오토바이운전자보험",
      "굿앤굿어린이치아보험", "밝게웃는얼굴치아보험(연만기갱신형)", "실손의료비보장보험(갱신형)", "노후실손의료비보장보험(갱신형)", "유병력자실손의료비보장보험(갱신형)"
    ];

    const CASE_INPUT_IDS = { product: "in-product", date: "in-date", job: "in-job", code: "in-code", cover: "in-cover", issue: "in-issue" };
    const CASE_STORAGE_KEY = "caseInput_v1";

    function readCaseInput() {
      const v = {};
      Object.keys(CASE_INPUT_IDS).forEach(k => { v[k] = document.getElementById(CASE_INPUT_IDS[k]).value.trim(); });
      v.code = v.code.toUpperCase();
      return v;
    }

    // 입력값은 이 브라우저에 기억해 두었다가 다시 열 때 채움
    (function restoreCaseInput() {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(CASE_STORAGE_KEY)); } catch (e) { saved = null; }
      if (!saved) return;
      Object.keys(CASE_INPUT_IDS).forEach(k => { if (saved[k]) document.getElementById(CASE_INPUT_IDS[k]).value = saved[k]; });
    })();

    // 가입일이 비어 있으면 예시로 3년 전 오늘을 넣어 둠 (직업·쟁점 예시는 입력칸의 value)
    (function defaultCaseDate() {
      const el = document.getElementById("in-date");
      if (el.value) return;
      const d = new Date();
      d.setFullYear(d.getFullYear() - 3);
      el.value = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    })();

    // ===== 처음 화면: 상품명 자동완성 (기본 목록 + 공시실 실시간 검색) · 대표상품 칩 =====
    const productNames = new Set(PRODUCT_BASE);
    function cleanProdName(nm) {
      return (nm || "").replace(/^\s*(무배당|\(무\))\s*/, "").replace(/^\(무\)\s*/, "").replace(/현대해상\s*/, "")
        .replace(/\s*\(Hi\d+\).*$/, "").replace(/\s+\d종.*$/, "").trim();
    }
    function renderProductList(extra) {
      const names = [...new Set([...(extra || []), ...productNames])];
      document.getElementById("product-list").innerHTML = names.map(n => '<option value="' + escapeHtml(n) + '"></option>').join("");
    }
    renderProductList();
    document.getElementById("product-chips").insertAdjacentHTML("beforeend",
      PRODUCT_CHIPS.map(n => '<button type="button" class="pick-chip" data-product="' + escapeHtml(n) + '">' + escapeHtml(n.replace(/\((세만기형|갱신형)\)$/, "")) + '</button>').join(""));
    function markProductChip() {
      const v = document.getElementById("in-product").value.trim();
      document.querySelectorAll("#product-chips .pick-chip").forEach(b => b.classList.toggle("on", b.dataset.product === v));
    }
    markProductChip();
    document.getElementById("product-chips").addEventListener("click", e => {
      const b = e.target.closest("[data-product]");
      if (!b) return;
      document.getElementById("in-product").value = b.dataset.product;
      markProductChip();
      introYakLoad();
    });
    // 2글자 이상 치면 잠시 뒤 공시실에서 그 이름이 들어간 상품(판매 중지 상품 포함)을 찾아 목록에 넣음
    let productTimer = 0, productRun = 0;
    const productLookup = new Map();
    document.getElementById("in-product").addEventListener("input", e => {
      const q = e.target.value.trim();
      markProductChip();
      if (productNames.has(q) && (!e.inputType || e.inputType === "insertReplacementText")) { introYakLoad(); return; }  // 목록에서 고름
      clearTimeout(productTimer);
      if (q.length < 2) return;
      productTimer = setTimeout(async () => {
        const run = ++productRun;
        try {
          if (!productLookup.has(q)) {
            const d = await hiCall("HHCA0310M38S", { searchData: q, searchDate: "", searchType: "0", searchKeyword: 1 });
            const now = (d.slYProdList || []).map(p => cleanProdName(p.prodNm));
            const old = (d.slNProdList || []).map(p => cleanProdName(p.prodNm));
            productLookup.set(q, [...new Set([...now, ...old])].filter(Boolean).slice(0, 40));
          }
          if (run !== productRun) return;
          const found = productLookup.get(q);
          found.forEach(n => productNames.add(n));
          renderProductList(found);
        } catch (err) { /* 인터넷이 안 되면 기본 목록만 씀 */ }
      }, 350);
    });

    // ===== 직업·쟁점 고르기 패널 =====
    const jobPicker = { tab: "3" };
    function renderJobPicker() {
      const cur = document.getElementById("in-job").value.trim();
      const big = KSCO.find(b => b[0] === jobPicker.tab) || KSCO[0];
      let html = '<div class="src">통계청 한국표준직업분류 대분류 → 중분류 · 해당하는 직업을 누르세요 (목록에 없으면 칸에 직접 적어도 돼요)</div>';
      html += '<div class="tabs">' + KSCO.map(b => '<button type="button" class="tab' + (b[0] === big[0] ? ' on' : '') + '" data-tab="' + b[0] + '">' + b[0] + ' ' + escapeHtml(b[1]) + '</button>').join("") + '</div>';
      html += big[2].map(([code, name, jobs]) => '<div class="grp"><div class="grp-name">' + escapeHtml(name) + '<small>중분류 ' + code + '</small></div><div class="chips">'
        + jobs.map(j => '<button type="button" class="pick-chip' + (j === cur ? ' on' : '') + '" data-value="' + escapeHtml(j) + '">' + escapeHtml(j) + '</button>').join("") + '</div></div>').join("");
      document.getElementById("job-picker").innerHTML = html;
    }
    function renderIssuePicker() {
      const cur = document.getElementById("in-issue").value.trim();
      let html = '<div class="src">장기 인보험 손해사정의 대표 쟁점 · 누르면 쟁점 칸에 들어가요</div>';
      html += ISSUE_GROUPS.map(([g, items]) => '<div class="grp"><div class="grp-name">' + escapeHtml(g) + '</div><div class="chips">'
        + items.map(([v, desc]) => '<button type="button" class="pick-chip' + (v === cur ? ' on' : '') + '" data-value="' + escapeHtml(v) + '" title="' + escapeHtml(desc) + '">' + escapeHtml(v) + '</button>').join("") + '</div></div>').join("");
      document.getElementById("issue-picker").innerHTML = html;
    }
    // 직업 칸에 해당하는 대분류 탭을 먼저 보여 줌
    function jobTabOf(job) {
      for (const [b, , mids] of KSCO) if (mids.some(m => m[2].includes(job))) return b;
      return null;
    }
    document.getElementById("job-list").innerHTML = KSCO.flatMap(([, bn, mids]) => mids.flatMap(([, mn, jobs]) => jobs.map(j => '<option value="' + escapeHtml(j) + '">' + escapeHtml(mn) + '</option>'))).join("");
    document.getElementById("issue-list").innerHTML = ISSUE_GROUPS.flatMap(([g, items]) => items.map(([v, desc]) => '<option value="' + escapeHtml(v) + '">' + escapeHtml(desc) + '</option>')).join("");

    const PICKERS = { "job-picker": { input: "in-job", render: renderJobPicker }, "issue-picker": { input: "in-issue", render: renderIssuePicker } };
    function togglePicker(id, open) {
      Object.keys(PICKERS).forEach(k => {
        const show = k === id ? (open === undefined ? document.getElementById(k).hidden : open) : false;
        if (show) {
          if (k === "job-picker") jobPicker.tab = jobTabOf(document.getElementById("in-job").value.trim()) || jobPicker.tab;
          PICKERS[k].render();
        }
        document.getElementById(k).hidden = !show;
        const btn = document.querySelector('[data-picker="' + k + '"]');
        if (btn) btn.setAttribute("aria-expanded", String(show));
      });
    }
    document.querySelectorAll(".pick-btn").forEach(b => b.addEventListener("click", () => togglePicker(b.dataset.picker)));
    Object.keys(PICKERS).forEach(k => {
      document.getElementById(k).addEventListener("click", e => {
        const tab = e.target.closest("[data-tab]");
        if (tab) { jobPicker.tab = tab.dataset.tab; renderJobPicker(); return; }
        const chip = e.target.closest("[data-value]");
        if (!chip) return;
        document.getElementById(PICKERS[k].input).value = chip.dataset.value;
        togglePicker(k, false);
      });
    });

    // ===== 처음 화면: 상품명·가입일을 넣으면 바로 공시실 약관을 받아 두고, 담보명은 그 약관의 담보 중에서만 고르게 함 =====
    // state: idle(상품명 없음) · loading(약관 받는 중, 담보명 잠금) · ready(약관 담보만 허용) · free(약관을 못 찾음, 직접 입력)
    const introYak = { key: "", run: 0, products: [], prodIdx: 0, doc: null, state: "idle", note: "", error: "" };

    function introYakBox(html) {
      const b = document.getElementById("intro-yak");
      b.hidden = !html;
      b.innerHTML = html || "";
    }

    async function introYakLoad(prodIdx) {
      const product = document.getElementById("in-product").value.trim();
      const date = document.getElementById("in-date").value;
      const key = product + "|" + date;
      if (!product) {
        Object.assign(introYak, { key: "", products: [], doc: null, state: "idle" });
        introCoverMode(); introYakBox(""); return;
      }
      if (key === introYak.key && prodIdx === undefined && introYak.state !== "free") return;  // 이미 받는 중이거나 받음
      const run = ++introYak.run;
      Object.assign(introYak, { key, state: "loading", doc: null, error: "" });
      introCoverMode();
      const say = (t, p) => {
        if (run !== introYak.run) return;
        introYakBox('<div class="row"><span>' + escapeHtml(t) + '</span>' + (p != null ? '<span class="bar"><i style="width:' + Math.round(p) + '%"></i></span>' : '') + '</div>');
      };
      try {
        say("현대해상 공시실에서 '" + product + "' 약관 찾는 중…", 5);
        const { list, note } = await yakFindProducts(product, date);
        if (run !== introYak.run) return;
        if (!list.length) throw new Error("공시실에서 '" + product + "' 상품을 찾지 못했어요. 상품명을 줄여서(예: 퍼펙트플러스) 다시 넣거나, 담보명을 직접 적어 주세요.");
        Object.assign(introYak, { products: list, note, prodIdx: prodIdx >= 0 && prodIdx < list.length ? prodIdx : 0 });
        const doc = await yakLoadDoc(list[introYak.prodIdx], null, say);
        if (run !== introYak.run) return;
        if (doc.clauses.length < 2) throw new Error("약관 글자를 읽지 못했어요(스캔 이미지 약관일 수 있어요). 담보명을 직접 적어 주세요.");
        Object.assign(introYak, { doc, state: "ready" });
      } catch (err) {
        if (run !== introYak.run) return;
        Object.assign(introYak, { state: "free", error: err.message });
      }
      introCoverMode();
      introRender();
      if (document.getElementById("in-cover").value.trim()) introValidateCover();
    }

    // 담보명 칸: 상태에 따라 잠금·안내 문구·고를 수 있는 목록을 바꿈
    function introCoverMode() {
      const input = document.getElementById("in-cover");
      const list = document.getElementById("intro-cover-list");
      const st = introYak.state;
      input.disabled = st === "loading";
      input.placeholder = { idle: "상품명을 넣으면 약관의 담보에서 골라요", loading: "약관 불러오는 중…", ready: "약관의 담보 중에서 고르세요 (예: 급성심근경색)", free: "담보명을 직접 적어 주세요" }[st];
      list.innerHTML = st === "ready" ? yakCoverages(introYak.doc).map(c => '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.no) + '</option>').join("") : "";
      if (st !== "ready") input.classList.remove("bad");
    }

    function introRender(msgHtml) {
      if (introYak.state === "free") { introYakBox('<div class="row"><span class="err">!</span><span>' + escapeHtml(introYak.error) + '</span></div>'); return; }
      if (introYak.state !== "ready") return;
      const { products, prodIdx, doc, note } = introYak;
      const ymd = s => (s || "").trim().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
      let html = '<div class="row"><span class="ok">✓ 약관을 불러왔어요</span><span>청구할 수 있는 담보 ' + yakCoverages(doc).length + '개 · 담보명은 이 중에서만 고를 수 있어요</span></div>';
      html += '<div class="row"><span>상품 버전</span><select id="intro-prod-sel">' + products.map((p, i) => '<option value="' + i + '"' + (i === prodIdx ? ' selected' : '') + '>'
        + escapeHtml(p.prodNm.replace(/^무배당\s*/, "").replace(/현대해상/, "")) + ' · 판매 ' + ymd(p.slStDt) + '~' + ymd(p.slEdDt) + '</option>').join("") + '</select></div>';
      if (note) html += '<div class="row"><span class="err">!</span><span>' + escapeHtml(note) + '</span></div>';
      html += '<div id="intro-cover-msg">' + (msgHtml || "") + '</div>';
      introYakBox(html);
    }

    // 담보명이 약관의 담보와 같은지 확인. 아니면 비슷한 담보를 골라 쓸 수 있게 보여 주고 false
    function introValidateCover() {
      const input = document.getElementById("in-cover");
      if (introYak.state !== "ready") return true;
      const v = input.value.replace(/\s+/g, "");
      const covs = yakCoverages(introYak.doc);
      const exact = v ? covs.find(c => c.name === v) : null;
      const ok = !v || !!exact;
      input.classList.toggle("bad", !ok);
      if (exact) input.value = exact.name;
      const near = ok ? [] : covs.map(c => ({ c, s: yakScore(v, c.name) })).sort((a, b) => b.s - a.s).slice(0, 5);
      const msg = ok ? "" : '<div class="row"><span class="err">약관에 없는 담보예요.</span><span>이 중에서 고르세요:</span></div><div class="row">'
        + near.map(n => '<button type="button" class="chip" data-cover="' + escapeHtml(n.c.name) + '">' + escapeHtml((n.c.no ? n.c.no + " " : "") + n.c.name) + '</button>').join("") + '</div>';
      const box = document.getElementById("intro-cover-msg");
      if (box) box.innerHTML = msg;
      return ok;
    }

    document.getElementById("in-product").addEventListener("change", () => introYakLoad());
    document.getElementById("in-date").addEventListener("change", () => introYakLoad());
    document.getElementById("in-cover").addEventListener("change", introValidateCover);
    document.getElementById("in-cover").addEventListener("input", () => {
      // 목록에서 고르면 바로 맞는지 확인 (타이핑 중에는 빨간 표시만 지움)
      const input = document.getElementById("in-cover");
      if (introYak.state === "ready" && yakCoverages(introYak.doc).some(c => c.name === input.value.replace(/\s+/g, ""))) introValidateCover();
      else input.classList.remove("bad");
    });
    document.getElementById("intro-yak").addEventListener("click", e => {
      const chip = e.target.closest("[data-cover]");
      if (!chip) return;
      document.getElementById("in-cover").value = chip.dataset.cover;
      introValidateCover();
    });
    document.getElementById("intro-yak").addEventListener("change", e => {
      if (e.target.id === "intro-prod-sel") introYakLoad(Number(e.target.value));
    });
    // 저장해 둔 상품명이 있으면 열자마자 약관을 받기 시작
    introYakLoad();

    // 판례 탭 분류 정하기: 상해·재해사망/장해 담보면 담보명 우선, 그 밖에는 진단코드 우선
    function guessCategory(v) {
      if (/사망/.test(v.cover) && /(상해|재해)/.test(v.cover)) return "상해사망";
      if (/장해/.test(v.cover)) return "장해";
      const info = KCD[v.code];
      if (info) return info.cat;
      if (/^I6/.test(v.code)) return "뇌혈관질환";
      if (/^I2/.test(v.code)) return "심혈관질환";
      if (/^(C|D0|D3|D4)/.test(v.code)) return "암";
      if (/^[ST]/.test(v.code)) return "상해사망";
      const c = v.cover;
      if (/장해/.test(c)) return "장해";
      if (/사망/.test(c) && /(상해|재해)/.test(c)) return "상해사망";
      if (/뇌/.test(c)) return "뇌혈관질환";
      if (/암/.test(c)) return "암";
      if (/(심근|심장|협심)/.test(c)) return "심혈관질환";
      // 담보·진단으로 못 정하면 쟁점으로
      const is = v.issue || "";
      if (/고지|통지|설명의무|위험 활동|면책·감액/.test(is)) return "계약·면책";
      if (/입원|수술|실손/.test(is) || /(입원|수술|실손|의료비)/.test(c)) return "입원·수술";
      if (/장해/.test(is)) return "장해";
      if (/외래성|우연성|재해|자살|사고 인과/.test(is)) return "상해사망";
      return null;
    }

    function setText(id, text) { document.getElementById(id).textContent = text; }

    // 메뉴 미리보기: [항목명, 값, 강조할 앞부분?, 두 줄 허용?] 줄들을 "항목명 | 값"으로 그림
    function setPreview(key, rows) {
      const box = document.getElementById("ar-" + key);
      box.innerHTML = "";
      rows.filter(r => r && r[1]).forEach(([k, v, strong, long]) => {
        const ks = document.createElement("span");
        ks.className = "k";
        ks.textContent = k;
        const vs = document.createElement("span");
        vs.className = "v" + (long ? " long" : "");
        vs.title = (strong ? strong + " " : "") + v;
        if (strong) { const b = document.createElement("b"); b.textContent = strong + " "; vs.appendChild(b); }
        vs.appendChild(document.createTextNode(v));
        box.append(ks, vs);
      });
    }

    function runAutoSearch() {
      const v = readCaseInput();
      try { localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(v)); } catch (e) {}
      const info = KCD[v.code];
      const any = Object.values(v).some(Boolean);

      // 입력 요약: 항목별 칩
      const codeName = v.code ? koicdName(normCode(v.code)) : "";
      const parts = [
        ["상품", v.product], ["가입일", v.date.replace(/-/g, ".")], ["기고지 직업", v.job],
        ["진단", v.code ? normCode(v.code) + (codeName ? " " + codeName : "") : ""], ["담보", v.cover], ["쟁점", v.issue]
      ].filter(p => p[1]);
      const summary = document.getElementById("case-summary");
      summary.innerHTML = "";
      parts.forEach(([k, val]) => {
        const s = document.createElement("span");
        const i = document.createElement("i");
        i.textContent = k;
        s.append(i, val);
        summary.appendChild(s);
      });
      ["yakgwan", "koicd", "law", "pubmed", "fss", "cardnews"].forEach(k => setText("ar-" + k, ""));
      if (!any) { runFssSearch("", null); return; }

      // 1) 약관: 상품명이 있으면 공시실에서 가입 당시 약관을 받아 청구 담보 조항을 따옴 (끝나면 미리보기·카드뉴스 반영)
      //    표준약관 기준(아래)은 상품명이 없거나 약관을 못 찾았을 때 참고용
      yakJob = v.job;
      const yakGroup = guessYakGroup(v.cover);
      if (yakGroup) yakCurrent = yakGroup;
      renderYak();
      yakRun(v.product, v.date, v.cover, introYak.key === v.product + "|" + v.date ? introYak.prodIdx : 0);
      if (v.product) {
        setPreview("yakgwan", [["상품", v.product], ["약관", "현대해상 공시실에서 찾는 중…"]]);
      } else if (yakGroup || v.job) {
        const g = YAK_GROUPS[yakCurrent];
        const limitCount = g.limits.length + YAK_COMMON_LIMITS.length + (g.injury ? YAK_INJURY_LIMITS.length + YAK_JOB_LIMITS.length : 0);
        setPreview("yakgwan", [
          ["담보 유형", yakCurrent],
          ["확인 항목", "지급사유 " + g.pay.length + "개 · 제한사유 " + limitCount + "개"],
          ["주의", v.job && g.injury ? "직업 변경 통지의무 (기고지: " + v.job + ")" : ""]
        ]);
      }

      // 2) KOICD: 진단코드의 분류·관련 코드·코딩지침을 미리 찾아 둠
      if (v.code) {
        showKoicd(v.code);
        const code = normCode(v.code);
        koicdReady.then(() => { if (koicd) setPreview("koicd", koicdPreview(code)); });
      }

      // 3) 판례: 파일에 저장된 판례에서 분류·쟁점으로 찾기
      const cat = guessCategory(v);
      const words = [v.issue, info && info.kw].filter(Boolean)
        .join(" ").split(/[\s,·]+/).filter(w => w.length >= 2);
      const pool = ALL_CASES.filter(c => !cat || c.category === cat);
      // 쟁점 단어가 맞으면 2점, 진단명 단어가 맞으면 1점 (쟁점이 더 중요)
      const issueWords = (v.issue || "").split(/[\s,·]+/).filter(w => w.length >= 2);
      const scored = pool.map(c => {
        const text = [c.title, c.summary, c.type, c.issue].filter(Boolean).join(" ");
        const score = words.reduce((s, w) => s + (text.includes(w) ? (issueWords.includes(w) ? 2 : 1) : 0), 0);
        return { c, score };
      }).sort((a, b) => b.score - a.score);
      const hits = words.length ? scored.filter(s => s.score > 0) : scored;
      const best = (hits[0] || scored[0] || {}).c;
      // 판례 탭 검색창에는 쟁점 단어를 넣되, 그 분류에 걸리는 판례가 있을 때만
      const issueWord = v.issue ? v.issue.split(/[\s,·]+/)[0] : "";
      const issueHit = issueWord && pool.some(c => [c.title, c.summary, c.type, c.issue].filter(Boolean).join(" ").includes(issueWord));
      lawPreset = { cat, keyword: issueHit ? issueWord : "", live: info ? info.kw + " 보험금" : "" };
      if (cat || words.length) {
        setPreview("law", [
          ["관련 판례", (cat ? cat + " " : "") + (hits.length || pool.length) + "건"],
          ["대표 판례", best ? best.title : "", best ? best.caseNo : "", true]
        ]);
      }

      // 4) 의학 논문: PubMed 검색어를 만들고 건수·대표 논문을 가져옴 (인터넷 필요)
      //    병명 영어 검색어가 있고 쟁점이 쟁점 버튼에 해당하면, 검색어는 병명만 두고 쟁점 버튼으로 좁힘
      const issueKey = info && info.en ? (PM_ISSUE_OF[v.issue] || "") : "";
      const enTerms = [info && info.en, issueKey ? "" : ISSUE_EN[v.issue]].filter(Boolean);
      const pubBase = enTerms.length ? enTerms.join(" ") : (v.code || "");
      document.getElementById("pubmed-query").value = pubBase;
      pmSetIssue(issueKey);
      // 논문 모아 두기의 사건 이름도 새 입력으로 맞춤 (입력이 없으면 지금 이름 유지)
      const autoCase = pmAutoCase(v);
      if (autoCase) { document.getElementById("pubmed-case").value = autoCase; pmCaseName(); pmRenderSaved(); }
      const pubTerm = pmCombine(pubBase, issueKey);                       // 실제 PubMed 검색식
      const pubQuery = pubBase + (issueKey ? " + " + pmIssue(issueKey)[1] : "");  // 화면에 보이는 검색어
      pm.cardPmid = "";                     // 새 사건: 카드뉴스 논문은 다시 자동(관련도 1위)으로
      if (pubBase) {
        setPreview("pubmed", [["검색어", pubQuery], ["해외 논문", "검색 중…"]]);
        pmNcbi("esearch.fcgi?db=pubmed&retmode=json&retmax=1&sort=relevance&term=" + encodeURIComponent(pubTerm))
          .then(j => {
            const count = Number(j.esearchresult.count).toLocaleString("ko-KR");
            const id = j.esearchresult.idlist[0];
            if (!id) { setPreview("pubmed", [["검색어", pubQuery], ["해외 논문", "0건"]]); return; }
            return pmNcbi("esummary.fcgi?db=pubmed&retmode=json&id=" + id)
              .then(s => {
                const doc = s.result[id];
                setPreview("pubmed", [
                  ["검색어", pubQuery],
                  ["해외 논문", count + "건"],
                  ["대표 논문", doc.title, (doc.pubdate || "").slice(0, 4)]
                ]);
                // 그사이 직접 고른 논문이 있거나, 다시 연 사건이거나, 다른 사건으로 바꿨으면 덮지 않음
                if (!pm.cardPmid && cnAutoPaperCase !== null && cnAutoPaperCase === cnCaseId) fillPaperCard(doc, id, count, pubQuery);
              });
          })
          .catch(err => setPreview("pubmed", [["검색어", pubQuery],
            ["해외 논문", err.kind === "offline" ? "인터넷 연결 후 확인" : err.kind === "busy" ? "PubMed 서버 혼잡 · 탭에서 다시 시도" : "연결 실패 · 탭에서 다시 시도"]]));
      }

      // 5) 분쟁조정: 금감원 5개 게시판(보험)에서 입력 정보로 맞는 자료를 골라 둠
      runFssSearch("", v);
      const fssTop = fssData ? rankFss(fssTermsFromCase(v)) : [];
      const fssPreview = ranked => {
        if (!ranked.length) { setPreview("fss", [["관련 자료", "맞는 자료 없음"]]); return; }
        const counts = FSS_BOARDS.map(b => [b.short, ranked.filter(r => r.x.b === b.key).length]).filter(c => c[1]);
        // 미리보기는 결론이 있는 분쟁조정사례·해결기준을 우선
        const best = (ranked.find(r => r.x.b === "standard" || (r.x.b === "case" && r.x.a)) || ranked[0]).x;
        setPreview("fss", [
          ["관련 자료", counts.map(c => c[0] + " " + c[1]).join(" · ")],
          ["대표", best.title, FSS_BOARDS.find(b => b.key === best.b).short, true],
          ["결론", best.a || best.sum, best.res === "ok" ? "지급" : best.res === "no" ? "부지급" : "", true]
        ]);
      };
      if (fssData) fssPreview(fssTop);
      else fssReady.then(() => { if (fssData) fssPreview(rankFss(fssTermsFromCase(v))); });

      // 6) 카드뉴스: 탭 3개에 입력값과 검색 결과를 반영
      // 쟁점으로 세부 유형과 처음 보여 줄 탭을 고름
      const issueText = v.issue || "";
      const exemptSub = /가입/.test(issueText) ? "가입전진단" : "진단부적정";
      const discloseSub = /해지/.test(issueText) ? "해지" : /(변경|부담보)/.test(issueText) ? "계약변경" : "면책";
      const notifySub = /(요청|변경 요청|계약변경)/.test(issueText) ? "직업변경 요청" : "비례보상";
      const showTab = /(고지|알릴)/.test(issueText) ? "disclose" : /(통지|직업)/.test(issueText) ? "notify" : "exempt";
      const showSub = showTab === "disclose" ? discloseSub : showTab === "notify" ? notifySub : exemptSub;

      // 사건 열기: 입력이 같으면 앞서 만든 사건을 다시 열고, 다르면 새 사건(빈 양식에서 시작)
      const isNewCase = cnOpenCaseFor(v, codeName);
      const filled = [];
      if (v.product) filled.push("상품명");
      const kept = [];
      // 그 사건에 이미 저장된 유형은 담당자가 고친 내용을 지키려고 다시 채우지 않음
      const fillSub = (tab, sub, fn) => {
        const fresh = !cnHasSaved(tab, sub);
        switchCardNews(tab, sub);
        if (fresh) { fn(); saveCardNews(); }
        else kept.push(CN_SETS[tab].label);
        return fresh;
      };
      const coverName = v.cover || "보험금";
      const claimText = [v.cover, codeName ? codeName + " (" + normCode(v.code) + ")" : v.code].filter(Boolean).join(" · ");
      // 판례·분쟁조정은 쟁점에 맞는 탭에 넣음 (통지의무 탭에는 판례 장이 없어 판례는 면책안내에)
      const lawTab = showTab === "notify" ? "exempt" : showTab;
      // 고지·통지 탭에는 그 의무를 다룬 자료만 넣음 (맞는 게 없으면 양식의 실제 사례를 그대로 둠)
      const TAB_TOPIC = { disclose: /고지|알릴/, notify: /통지|직업/ };
      const fillLaw = tab => {
        if (!(v.code || v.cover || v.issue)) return;
        const re = TAB_TOPIC[tab];
        const caseText = c => [c.title, c.summary, c.type, c.issue].filter(Boolean).join(" ");
        const pick = re ? (scored.find(s => re.test(caseText(s.c))) || {}).c : best;
        if (!pick) return;
        setCard("law", 0, "대법원 " + pick.caseNo + " · " + pick.date);
        setCard("law", 1, shorten(pick.title, 40));
        setCardLink("law", "https://www.law.go.kr/precSc.do?menuId=7&query=" + encodeURIComponent(pick.caseNo));
        filled.push("판례");
      };
      // 분쟁조정: 결론이 있는 가장 맞는 자료(사례·해결기준 우선)
      const fillFss = tab => {
        const re = TAB_TOPIC[tab];
        const pool = re ? fssTop.filter(r => re.test([r.x.title, r.x.a, r.x.sum].filter(Boolean).join(" "))) : fssTop;
        const top = (pool.find(r => r.x.b === "standard" || (r.x.b === "case" && r.x.a)) || pool[0] || {}).x;
        if (!top) return;
        setCard("fss", 0, "금융감독원 " + FSS_BOARDS.find(b => b.key === top.b).label + " · " + top.date.replace(/-/g, "."));
        setCard("fss", 1, shorten(top.a || top.sum || top.title, 44));
        setCardLink("fss", top.url);
        filled.push("분쟁조정");
      };

      // 고지의무 위반 탭: 쟁점이 고지의무일 때 청구 내용·처리 결과를 이 사건으로 바꾸고,
      // 예시로 들어 있던 '확인된 사실'은 비워 둠(직접 입력)
      fillSub("disclose", discloseSub, () => {
        if (showTab !== "disclose") return;
        setCard("check", 1, "(직접 입력)");
        if (claimText) setCard("check", 2, shorten(claimText, 44));
        if (discloseSub === "면책") {
          setCard("result", 0, coverName + " 지급 불가 · 계약 해지");
          setCard("result", 1, "알리지 않은 병력이 이번 청구에 영향을 미쳤습니다 (제15조④)");
        } else if (discloseSub === "해지") {
          setCard("result", 0, coverName + " 지급 · 계약은 해지");
          setCard("result", 1, "알리지 않은 병력은 이번 청구와 관계가 없습니다 (제15조⑥)");
        } else {
          setCard("result", 0, coverName + " 지급 · 조건 변경으로 유지");
        }
        filled.push("고지의무 확인·처리 결과");
        fillLaw("disclose");
        fillFss("disclose");
      });
      // 통지의무 위반 탭: 기고지 직업 + (쟁점이 통지의무면) 바뀐 직업·사고 내용은 직접 입력
      fillSub("notify", notifySub, () => {
        if (v.job) { setCard("job", 0, v.job); filled.push("기고지 직업"); }
        if (showTab !== "notify") return;
        setCard("job", 1, "(직접 입력)");
        if (notifySub === "비례보상") {
          setCard("job", 2, "(직접 입력)");
          if (v.cover) setCard("result", 0, v.cover + " 일부 삭감 지급");
        }
        fillFss("notify");
      });

      // 면책안내 탭 (마지막에 채움: PubMed 결과가 늦게 와도 이 탭에 들어가도록)
      const exemptFresh = fillSub("exempt", exemptSub, () => {
        // 약관 장: 담보명 (지급사유·면책 근거는 세부 유형 양식 그대로)
        if (v.cover) { setCard("yak", 0, v.cover); filled.push("담보명"); }
        // 날짜 장: 보험 가입일(보장 시작)을 입력값으로
        if (v.date) { setCard("timeline", 1, v.date.replace(/-/g, ".")); filled.push("가입일"); }
        // 질병코드 장: 진단명·코드 + 코딩지침 또는 분류표 포함 기준
        if (v.code) {
          setCard("kcd", 0, (codeName ? codeName + " " : "") + v.code);
          const gd = relatedGuides(normCode(v.code))[0];
          const crit = gd ? "코딩지침 " + gd.num + " " + gd.title : "KCD 분류표 기준으로 확인";
          setCard("kcd", 1, shorten(crit, 44));
          filled.push("KCD");
        }
        // 의학논문 장: PubMed 결과가 오면 fillPaperCard가 채움 (인터넷 없으면 검색어만)
        if (pubBase) {
          setCard("paper", 0, "PubMed '" + pubQuery + "' 검색");
          setCard("paper", 1, "인터넷 연결 후 대표 논문 확인");
          setCardLink("paper", "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(pubTerm));
          filled.push("의학논문");
        }
        if (lawTab === "exempt") fillLaw("exempt");
        if (showTab === "exempt") fillFss("exempt");
      });
      // PubMed 대표 논문은 이번에 새로 채운 사건에만 (다시 연 사건의 고친 내용은 그대로)
      cnAutoPaperCase = exemptFresh ? cnCaseId : null;

      // 쟁점에 맞는 탭을 열어 둠 (저장된 내용으로 다시 그려짐)
      if (showTab !== "exempt") switchCardNews(showTab, showSub);
      setPreview("cardnews", [
        ["사건", isNewCase ? "새 사건으로 저장" : "저장된 사건 다시 열기"],
        ["양식", CN_SETS[showTab].label + " · " + showSub],
        filled.length ? ["자동 반영", [...new Set(filled)].join(", ")] : null,
        kept.length ? ["그대로 둠", [...new Set(kept)].join(", ") + " (고친 내용 유지)"] : null
      ]);
    }
    let cnAutoPaperCase = null;

    // ----- 카드뉴스 채우기 도우미 -----
    function shorten(text, max) { return text.length > max ? text.slice(0, max) + "…" : text; }
    // kind: 장 종류 (yak·result·kcd·law·paper·fss·guide·intro·check·job). 지금 양식에 그 장이 없으면 아무것도 안 함
    function cnCardOf(kind) {
      return document.querySelector('#cn-list .cn-card[data-kind="' + kind + '"]');
    }
    function setCard(kind, itemIdx, value) {
      const card = cnCardOf(kind);
      const span = card && card.querySelectorAll(".cn-item-text > span")[itemIdx];
      if (span && value) { span.textContent = value; cnFormatValue(span); }
    }
    // 카드 아래 원문 링크 주소 바꾸기 (주소 칸의 input 이벤트로 링크·저장까지 처리)
    function setCardLink(kind, url) {
      const card = cnCardOf(kind);
      const input = card && card.parentElement.querySelector(".cn-link-url");
      if (!input) return;
      input.value = url;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    // PubMed 대표 논문이 오면 5장에 반영
    // (의학논문 카드는 면책안내 탭에만 있으므로, 다른 탭을 보고 있으면 잠깐 바꿔 채우고 돌아옴)
    // note가 있으면(의학 논문 탭의 '카드뉴스로 보내기') 둘째 줄을 그 설명으로 채움
    function fillPaperCard(doc, pmid, count, query, note) {
      const back = cnTab !== "exempt" ? [cnTab, cnSub] : null;
      if (back) switchCardNews("exempt", cnSubFor("exempt"));
      setCard("paper", 0, shorten(doc.title, 70) + " (" + (doc.pubdate || "").slice(0, 4) + ")");
      setCard("paper", 1, note || ("PubMed '" + query + "' " + count + "건 중 관련도 1위"));
      setCardLink("paper", "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/");
      saveCardNews();
      if (back) switchCardNews(back[0], back[1]);
    }

    // 판례 메뉴를 누르면 자동검색한 분류·검색어로 판례 탭을 맞춤
    let lawPreset = null;
    document.querySelector('.menu-item[data-go="law"]').addEventListener("click", () => {
      if (!lawPreset) return;
      if (lawPreset.cat) {
        const tab = document.querySelector('.tab[data-category="' + lawPreset.cat + '"]');
        if (tab) tab.click();
      }
      searchInput.value = lawPreset.keyword || "";
      render();
      // 진단코드가 있으면 법제처 검색어도 진단명으로 (예: 심근경색 보험금)
      refreshLiveLaw();
    });

// HTML Search/Replace Operations Schema for Gemini 3.0

export const htmlOperationsSchema = {
  type: "OBJECT",
  properties: {
    operations: {
      type: "ARRAY",
      description: "HTML 편집을 위한 search/replace 연산 배열",
      items: {
        type: "OBJECT",
        properties: {
          search: {
            type: "STRING",
            description: "찾을 정확한 HTML 문자열 (공백과 줄바꿈 주의)"
          },
          replace: {
            type: "STRING",
            description: "교체할 HTML 문자열"
          },
          description: {
            type: "STRING",
            description: "이 변경사항에 대한 설명"
          }
        },
        required: ["search", "replace"]
      },
      minItems: 1
    }
  },
  required: ["operations"]
};

// HTML 편집 전용 시스템 프롬프트
export const htmlEditPrompt = `당신은 HTML 코드를 직접 편집하는 프로모션 페이지 빌더 AI입니다.
사용자의 요청을 HTML search/replace 연산으로 변환하여 응답해주세요.

주요 기능:
1. **텍스트 변경**: "제목을 '크리스마스 세일'로 바꿔줘" → brand-name 텍스트 교체
2. **색상 변경**: "빨간색으로 바꿔줘" → CSS 색상 변수 교체
3. **가격 변경**: "첫 번째 플랜을 $29로" → plan-price 텍스트 교체
4. **새 플랜 추가**: "플랜 하나 더 만들어줘" → pricing-card HTML 삽입
5. **스타일 수정**: "글꼴 크게 해줘" → CSS 속성 변경

응답 규칙:
- 정확한 HTML 문자열을 search에 포함하세요
- 공백과 줄바꿈을 정확히 맞춰주세요
- 한 번에 하나의 변경사항만 처리하세요
- CSS 변수 활용: --primary-color, --secondary-color 등
- 기존 구조를 유지하며 최소한의 변경만 하세요

예시:
사용자: "제목을 '블랙프라이데이'로 바꿔줘"
→ {
  "operations": [{
    "search": "<h1 class=\"brand-name\" contenteditable=\"true\" id=\"brand-name\">JasonCom</h1>",
    "replace": "<h1 class=\"brand-name\" contenteditable=\"true\" id=\"brand-name\">블랙프라이데이</h1>",
    "description": "브랜드 이름을 '블랙프라이데이'로 변경"
  }]
}

사용자: "주요 색상을 빨간색으로 바꿔줘"
→ {
  "operations": [{
    "search": "--primary-color: #4EA699;",
    "replace": "--primary-color: #e53e3e;",
    "description": "주요 색상을 빨간색으로 변경"
  }]
}`;

// HTML 편집 예시 케이스들
export const htmlEditExamples = [
  {
    input: "제목을 '크리스마스 세일'로 바꿔줘",
    expectedOutput: {
      operations: [
        {
          search: "<h1 class=\"brand-name\" contenteditable=\"true\" id=\"brand-name\">JasonCom</h1>",
          replace: "<h1 class=\"brand-name\" contenteditable=\"true\" id=\"brand-name\">크리스마스 세일</h1>",
          description: "브랜드 이름을 '크리스마스 세일'로 변경"
        }
      ]
    }
  },
  {
    input: "주요 색상을 빨간색으로 바꿔줘",
    expectedOutput: {
      operations: [
        {
          search: "--primary-color: #4EA699;",
          replace: "--primary-color: #e53e3e;",
          description: "주요 색상을 빨간색으로 변경"
        }
      ]
    }
  },
  {
    input: "첫 번째 플랜 가격을 $29로 바꿔줘",
    expectedOutput: {
      operations: [
        {
          search: "<div class=\"plan-price\" contenteditable=\"true\">FREE</div>",
          replace: "<div class=\"plan-price\" contenteditable=\"true\">$29</div>",
          description: "첫 번째 플랜 가격을 $29로 변경"
        }
      ]
    }
  },
  {
    input: "한정 세일 배너를 보이게 해줘",
    expectedOutput: {
      operations: [
        {
          search: "<div class=\"limited-banner\" id=\"limited-banner\">",
          replace: "<div class=\"limited-banner active\" id=\"limited-banner\">",
          description: "한정 세일 배너 활성화"
        }
      ]
    }
  }
];

// HTML 기반 색상 테마 템플릿
export const colorThemeOperations = {
  default: [
    { search: "--primary-color: #4EA699;", replace: "--primary-color: #4EA699;", description: "기본 테마 적용" },
    { search: "--secondary-color: #140D4F;", replace: "--secondary-color: #140D4F;", description: "기본 보조 색상" }
  ],
  ocean: [
    { search: "--primary-color: #4EA699;", replace: "--primary-color: #0EA5E9;", description: "오션 테마 적용" },
    { search: "--secondary-color: #140D4F;", replace: "--secondary-color: #0369A1;", description: "오션 보조 색상" }
  ],
  sunset: [
    { search: "--primary-color: #4EA699;", replace: "--primary-color: #FF6B35;", description: "선셋 테마 적용" },
    { search: "--secondary-color: #140D4F;", replace: "--secondary-color: #F7931E;", description: "선셋 보조 색상" }
  ],
  red: [
    { search: "--primary-color: #4EA699;", replace: "--primary-color: #e53e3e;", description: "빨간색 테마 적용" },
    { search: "--secondary-color: #140D4F;", replace: "--secondary-color: #c53030;", description: "빨간색 보조 색상" }
  ]
};

// HTML 연산 검증 함수
export function validateHTMLOperations(data) {
  const errors = [];
  
  if (!data.operations || !Array.isArray(data.operations)) {
    errors.push('operations 배열이 필요합니다.');
    return errors;
  }
  
  data.operations.forEach((operation, index) => {
    const opNum = index + 1;
    
    if (!operation.search || typeof operation.search !== 'string') {
      errors.push(`${opNum}번째 연산에 search 문자열이 없습니다.`);
    }
    
    if (typeof operation.replace !== 'string') {
      errors.push(`${opNum}번째 연산에 replace 문자열이 없습니다.`);
    }
    
    if (operation.search === operation.replace) {
      errors.push(`${opNum}번째 연산의 search와 replace가 동일합니다.`);
    }
    
    // 잠재적으로 위험한 태그 검사
    const dangerousPatterns = [/<script/i, /<iframe/i, /javascript:/i, /on\w+=/i];
    const combinedContent = (operation.search + operation.replace).toLowerCase();
    
    dangerousPatterns.forEach(pattern => {
      if (pattern.test(combinedContent)) {
        errors.push(`${opNum}번째 연산에 잠재적으로 위험한 내용이 포함되어 있습니다.`);
      }
    });
  });
  
  return errors;
}

export default htmlOperationsSchema;
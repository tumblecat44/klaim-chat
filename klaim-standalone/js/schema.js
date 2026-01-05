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
    },
    response: {
      type: "OBJECT",
      description: "사용자에게 보여줄 대화형 응답",
      properties: {
        summary: {
          type: "STRING",
          description: "완료된 작업 요약 (1-2문장)"
        },
        details: {
          type: "ARRAY",
          description: "적용된 변경사항 목록 (복잡한 작업 시)",
          items: { type: "STRING" }
        },
        suggestions: {
          type: "ARRAY",
          description: "관련 제안 (최대 2개, 맥락에 맞을 때만)",
          items: { type: "STRING" }
        },
        clarification: {
          type: "STRING",
          description: "정보가 부족할 때 구체적인 질문"
        }
      },
      required: ["summary"]
    }
  },
  required: ["operations", "response"]
};

// HTML 편집 전용 시스템 프롬프트
export const htmlEditPrompt = `당신은 Klaim 프로모션 페이지 빌더의 전문 AI 어시스턴트입니다.
효율적이고 명확한 커뮤니케이션을 지향합니다.

## 역할
- HTML 코드를 직접 편집하여 프로모션 페이지를 수정
- 사용자 요청을 정확히 처리하고 관련된 유용한 제안 제공
- 불명확한 요청에는 구체적인 선택지와 함께 질문

## 응답 원칙
1. **간결함**: 성공 시 1-2문장으로 요약
2. **맥락적 제안**: 관련 있을 때만, 최대 2개
3. **명확한 질문**: 정보 부족 시 선택지 제공
4. **전문적 톤**: 이모지 최소화 (💡 제안, ⚠️ 경고만)

## 주요 기능
1. **텍스트 변경**: brand-name, plan-price, description 등
2. **색상 변경**: CSS 변수 (--primary-color, --secondary-color)
3. **플랜 관리**: pricing-card 추가/수정/삭제
4. **배너/할인**: limited-banner, discount-badge 활성화
5. **만료일**: countdown 컴포넌트 설정

## 응답 형식
모든 응답은 operations와 response를 포함해야 합니다:
- operations: HTML 변경 연산 (빈 배열도 가능)
- response:
  - summary: 완료 요약 (필수)
  - details: 세부 변경사항 (복잡한 작업 시)
  - suggestions: 관련 제안 (맥락상 유용할 때만)
  - clarification: 추가 정보 필요 시 질문

## 예시

### 명확한 요청:
사용자: "제목을 '크리스마스 세일'로 바꿔줘"
→ {
  "operations": [{
    "search": "<h1 class=\"brand-name\" contenteditable=\"true\" id=\"brand-name\">JasonCom</h1>",
    "replace": "<h1 class=\"brand-name\" contenteditable=\"true\" id=\"brand-name\">크리스마스 세일</h1>",
    "description": "브랜드 이름 변경"
  }],
  "response": {
    "summary": "제목을 '크리스마스 세일'로 변경했습니다."
  }
}

### 맥락적 제안 포함:
사용자: "크리스마스 프로모션 설정해줘"
→ {
  "operations": [제목/색상 변경 연산들],
  "response": {
    "summary": "크리스마스 프로모션 테마를 적용했습니다.",
    "details": ["제목: Christmas Sale", "색상: 빨강/초록 테마"],
    "suggestions": [
      "만료일을 12/25로 설정하면 카운트다운이 표시됩니다",
      "'Limited offer' 배너를 활성화하시겠습니까?"
    ]
  }
}

### 정보 부족:
사용자: "색상 바꿔줘"
→ {
  "operations": [],
  "response": {
    "summary": "색상 변경을 위해 추가 정보가 필요합니다.",
    "clarification": "어떤 색상으로 변경할까요? Ocean(파랑), Sunset(주황), Forest(녹색), Midnight(진파랑) 중 선택하거나 원하는 색상을 말씀해주세요."
  }
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
    
  });
  
  return errors;
}

export default htmlOperationsSchema;
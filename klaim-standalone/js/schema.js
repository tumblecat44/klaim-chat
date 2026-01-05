// HTML Search/Replace Operations Schema for Gemini 3.0

export const htmlOperationsSchema = {
  type: "OBJECT",
  properties: {
    operations: {
      type: "ARRAY",
      description: "HTML 편집을 위한 search/replace 연산 배열 (단순 텍스트 변경용)",
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
      }
    },
    actions: {
      type: "ARRAY",
      description: "복잡한 DOM 조작을 위한 액션 배열 (플랜 추가/삭제, 만료일 설정 등)",
      items: {
        type: "OBJECT",
        properties: {
          type: {
            type: "STRING",
            description: "액션 타입",
            enum: ["ADD_PLAN", "DELETE_PLAN", "UPDATE_PLAN", "REORDER_PLANS", "SET_EXPIRATION", "CLEAR_EXPIRATION", "ADD_BULLET_POINT", "REMOVE_BULLET_POINT", "SET_HIGHLIGHT", "BULK_UPDATE_PRICING"]
          },
          data: {
            type: "OBJECT",
            description: "액션에 필요한 데이터"
          },
          description: {
            type: "STRING",
            description: "이 액션에 대한 설명"
          }
        },
        required: ["type", "data"]
      }
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
  required: ["response"]
};

// 하이브리드 HTML/Action 처리 시스템 프롬프트
export const htmlEditPrompt = `당신은 Klaim 프로모션 페이지 빌더의 전문 AI 어시스턴트입니다.
HTML 편집과 JavaScript 액션을 조합하여 복잡한 요청을 처리할 수 있습니다.

## 역할
- 단순한 텍스트/색상 변경: HTML operations 사용
- 복잡한 구조 변경 (플랜 추가/삭제, 만료일 설정): actions 사용
- 복합 요청: operations + actions 조합 사용

## 처리 방식 선택 가이드

### HTML Operations 사용 (단순 편집)
- 텍스트 변경: 제목, 설명, 가격 수정
- 색상 변경: CSS 변수 수정 (--primary-color 등)
- 클래스 토글: active/hidden 클래스 추가/제거

### Actions 사용 (복잡한 DOM 조작)
- **ADD_PLAN**: 새 가격 플랜 추가
- **DELETE_PLAN**: 기존 플랜 삭제 (index 기준)
- **UPDATE_PLAN**: 플랜 전체 정보 업데이트
- **REORDER_PLANS**: 플랜 순서 변경
- **BULK_UPDATE_PRICING**: 여러 플랜 일괄 생성/수정
- **SET_EXPIRATION**: 만료일 설정 및 카운트다운 활성화
- **CLEAR_EXPIRATION**: 만료일 제거
- **ADD_BULLET_POINT**: 플랜에 기능 목록 추가
- **REMOVE_BULLET_POINT**: 기능 목록 제거
- **SET_HIGHLIGHT**: 추천 플랜 설정

## 응답 형식
- operations: HTML 편집 연산 배열 (옵션)
- actions: DOM 조작 액션 배열 (옵션)  
- response: 사용자 응답 (필수)

## 예시

### 단순 요청 (HTML만):
사용자: "제목을 'Winter Sale'로 바꿔줘"
→ { operations: [텍스트 변경], actions: [], response: {...} }

### 복잡한 요청 (액션만):
사용자: "스타터 플랜을 추가해줘"
→ { operations: [], actions: [{type: "ADD_PLAN", data: {...}}], response: {...} }

### 복합 요청 (둘 다):
사용자: "제목을 'Christmas Sale'로 바꾸고 3개 플랜 만들어줘"
→ { operations: [제목 변경], actions: [{type: "BULK_UPDATE_PRICING", ...}], response: {...} }

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

// 하이브리드 스키마 검증 함수
export function validateHTMLOperations(data) {
  const errors = [];
  
  // response는 항상 필수
  if (!data.response || typeof data.response !== 'object') {
    errors.push('response 객체가 필요합니다.');
    return errors;
  }
  
  if (!data.response.summary || typeof data.response.summary !== 'string') {
    errors.push('response.summary 문자열이 필요합니다.');
  }
  
  // operations와 actions 중 최소 하나는 있어야 함 (또는 clarification 있을 때는 둘 다 비어도 됨)
  const hasOperations = data.operations && Array.isArray(data.operations) && data.operations.length > 0;
  const hasActions = data.actions && Array.isArray(data.actions) && data.actions.length > 0;
  const hasClarification = data.response.clarification && data.response.clarification.trim().length > 0;
  
  if (!hasOperations && !hasActions && !hasClarification) {
    errors.push('operations 또는 actions 중 최소 하나는 있어야 하거나, clarification이 있어야 합니다.');
  }
  
  // operations 검증
  if (data.operations && Array.isArray(data.operations)) {
    data.operations.forEach((operation, index) => {
      const opNum = index + 1;
      
      if (!operation.search || typeof operation.search !== 'string') {
        errors.push(`${opNum}번째 operation에 search 문자열이 없습니다.`);
      }
      
      if (typeof operation.replace !== 'string') {
        errors.push(`${opNum}번째 operation에 replace 문자열이 없습니다.`);
      }
    });
  }
  
  // actions 검증
  if (data.actions && Array.isArray(data.actions)) {
    const validActionTypes = ["ADD_PLAN", "DELETE_PLAN", "UPDATE_PLAN", "REORDER_PLANS", "SET_EXPIRATION", "CLEAR_EXPIRATION", "ADD_BULLET_POINT", "REMOVE_BULLET_POINT", "SET_HIGHLIGHT", "BULK_UPDATE_PRICING"];
    
    data.actions.forEach((action, index) => {
      const actNum = index + 1;
      
      if (!action.type || typeof action.type !== 'string') {
        errors.push(`${actNum}번째 action에 type이 없습니다.`);
      } else if (!validActionTypes.includes(action.type)) {
        errors.push(`${actNum}번째 action의 type '${action.type}'이 유효하지 않습니다.`);
      }
      
      if (!action.data || typeof action.data !== 'object') {
        errors.push(`${actNum}번째 action에 data 객체가 없습니다.`);
      }
    });
  }
  
  return errors;
}

// HTML 수정 전용 스키마 (전체 HTML 교체 방식)
export const htmlFixSchema = {
  type: "OBJECT",
  properties: {
    fixedHTML: {
      type: "STRING",
      description: "수정된 완전한 HTML 코드"
    },
    fixDescription: {
      type: "STRING", 
      description: "어떤 HTML 오류를 수정했는지 설명"
    },
    success: {
      type: "BOOLEAN",
      description: "수정 성공 여부"
    }
  },
  required: ["fixedHTML", "fixDescription", "success"]
};

// HTML 수정 전용 프롬프트
export const htmlFixPrompt = `당신은 HTML 문법 오류 수정 전문가입니다.

## 역할
- 파싱 오류가 있는 HTML 코드를 수정
- 완전하고 유효한 HTML 문서 생성
- 원본 내용과 스타일은 최대한 보존

## 수정 원칙
1. **구조 보존**: 기존 콘텐츠와 레이아웃 유지
2. **문법 수정**: HTML5 표준 준수
3. **완전성**: 닫히지 않은 태그, 잘못된 속성 등 모두 수정
4. **최소 변경**: 오류 수정에 필요한 최소한의 변경만

## 응답 형식
- fixedHTML: 수정된 완전한 HTML
- fixDescription: 수정한 내용 요약
- success: true (수정 완료) 또는 false (수정 불가)`;

export default htmlOperationsSchema;
// 개선된 HTML Operations Schema - 대화형 응답 포함
// Gemini가 친절하고 효율적인 응답을 생성하도록 설계

export const improvedHtmlOperationsSchema = {
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
            description: "찾을 정확한 HTML 문자열"
          },
          replace: {
            type: "STRING", 
            description: "교체할 HTML 문자열"
          },
          description: {
            type: "STRING",
            description: "내부 로그용 변경 설명"
          }
        },
        required: ["search", "replace"]
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
          description: "적용된 변경사항 목록 (선택적)",
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

export const improvedHtmlEditPrompt = `당신은 Klaim 프로모션 페이지 빌더의 전문 AI 어시스턴트입니다.
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

## 주요 기능 매핑
1. **텍스트 변경**: brand-name, plan-price, description 등
2. **색상 변경**: CSS 변수 (--primary-color, --secondary-color)
3. **플랜 관리**: pricing-card 추가/수정/삭제
4. **배너/할인**: limited-banner, discount-badge 활성화
5. **만료일**: countdown 컴포넌트 설정

## 응답 구조
- operations: HTML 변경 연산
- response:
  - summary: 완료 요약 (필수)
  - details: 세부 변경사항 (복잡한 작업 시)
  - suggestions: 관련 제안 (맥락상 유용할 때만)
  - clarification: 추가 정보 필요 시 질문

## 예시 응답

### 명확한 요청:
사용자: "제목을 '크리스마스 세일'로 바꿔줘"
→ {
  "operations": [{
    "search": "<h1 class=\"brand-name\">현재제목</h1>",
    "replace": "<h1 class=\"brand-name\">크리스마스 세일</h1>"
  }],
  "response": {
    "summary": "제목을 '크리스마스 세일'로 변경했습니다."
  }
}

### 맥락적 제안 포함:
사용자: "크리스마스 프로모션 설정해줘"
→ {
  "operations": [색상/제목 변경 연산들],
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
}

현재 HTML 코드를 분석하여 사용자 요청을 처리하세요.`;

// 색상 테마 프리셋
export const colorThemes = {
  ocean: {
    name: "Ocean",
    primary: "#0EA5E9",
    secondary: "#0369A1",
    description: "파랑 계열"
  },
  sunset: {
    name: "Sunset", 
    primary: "#FF6B35",
    secondary: "#F7931E",
    description: "주황/빨강 계열"
  },
  forest: {
    name: "Forest",
    primary: "#10B981",
    secondary: "#059669", 
    description: "녹색 계열"
  },
  midnight: {
    name: "Midnight",
    primary: "#3730A3",
    secondary: "#1E1B4B",
    description: "진파랑 계열"
  },
  christmas: {
    name: "Christmas",
    primary: "#DC2626",
    secondary: "#059669",
    description: "빨강/초록 크리스마스"
  }
};

// 빠른 액션 템플릿
export const quickActionTemplates = {
  "가격 변경": {
    needsInfo: true,
    question: "어떤 플랜의 가격을 얼마로 변경할까요? (예: Basic $29)",
    example: "Basic 플랜을 $29로"
  },
  "색상 테마": {
    needsInfo: true,
    question: "Ocean, Sunset, Forest, Midnight 중 어떤 테마를 적용할까요?",
    options: Object.keys(colorThemes)
  },
  "프로모션 설정": {
    needsInfo: true,
    question: "어떤 프로모션을 설정할까요? (예: 블랙프라이데이, 크리스마스, 신년)",
    templates: {
      "블랙프라이데이": {
        title: "Black Friday Sale",
        theme: "midnight",
        banner: true,
        discount: "50% OFF"
      },
      "크리스마스": {
        title: "Christmas Special",
        theme: "christmas",
        banner: true,
        discount: "30% OFF"
      }
    }
  },
  "만료일 설정": {
    needsInfo: true,
    question: "프로모션 종료일을 언제로 설정할까요? (예: 2024-12-31)",
    format: "YYYY-MM-DD"
  }
};

// 시나리오별 응답 예시
export const responseExamples = {
  // 성공 케이스
  simpleSuccess: {
    summary: "제목을 '새해 특가'로 변경했습니다."
  },
  
  complexSuccess: {
    summary: "블랙프라이데이 프로모션을 설정했습니다.",
    details: [
      "제목: Black Friday Sale",
      "테마: Midnight (진파랑)",
      "할인 배지: 50% OFF"
    ],
    suggestions: [
      "만료일을 설정하면 카운트다운이 표시됩니다",
      "한정 수량 배너를 추가하시겠습니까?"
    ]
  },
  
  // 정보 부족 케이스
  needColorInfo: {
    summary: "색상 변경을 위해 추가 정보가 필요합니다.",
    clarification: "어떤 색상으로 변경할까요? Ocean(파랑), Sunset(주황), Forest(녹색), Midnight(진파랑) 중 선택하거나 HEX 코드를 입력해주세요."
  },
  
  needPriceInfo: {
    summary: "가격 변경을 위해 구체적인 정보가 필요합니다.",
    clarification: "어떤 플랜의 가격을 얼마로 변경할까요? 예: 'Basic 플랜 $29' 또는 '모든 플랜 20% 할인'"
  },
  
  // 에러 케이스
  notFound: {
    summary: "요청하신 요소를 찾을 수 없습니다.",
    clarification: "현재 페이지에는 Free, Starter, Pro 플랜이 있습니다. 어떤 플랜을 수정하시겠습니까?"
  }
};

export default improvedHtmlOperationsSchema;
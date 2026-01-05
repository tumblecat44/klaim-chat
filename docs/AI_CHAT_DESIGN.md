# AI Chat-based Promotion Builder 설계 문서

## 프로젝트 개요

### 목적
Klaim 프로모션 페이지 빌더에 AI 대화 기반 인터페이스를 추가하여 복잡한 폼 기반 설정을 자연어로 간소화

### 범위
- 기존 klaim-standalone 프로젝트에 AI 채팅 기능 통합
- MVP: 실제 배포 없음, 프로토타입 수준
- 하이브리드 UI: 기존 폼 + AI 채팅 인터페이스 병존

## Kent Beck 설계 철학 적용

### Simple Design 4 Rules
1. **Tests pass**: 기존 기능 보존하면서 AI 기능 추가
2. **Reveals intention**: 자연어 → 설정 변경 의도 명확화  
3. **No duplication**: 기존 모듈(PricingManager, ColorManager) 재활용
4. **Fewest elements**: 최소 복잡도로 최대 효과

### YAGNI (You Aren't Gonna Need It) 적용
- ❌ 복잡한 AI 체이닝
- ❌ 다중 모델 지원  
- ❌ 고도화된 NLP 분석
- ✅ 단일 API 호출로 모든 설정 변경
- ✅ 구조화된 응답으로 직접 UI 업데이트

## 기술 아키텍처

### AI API 전략

**확정 선택: Gemini 3 Flash Preview + Google GenAI SDK (2026 최신)**

```javascript
// 설치: npm install @google/genai (최신 버전 1.34.0+)
import { GoogleGenAI } from '@google/genai';

// 프로모션 설정용 JSON Schema (Gemini 3.0 Structured Output)
const promotionSchema = {
  type: "OBJECT",
  properties: {
    general: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "프로모션 제목" },
        url: { type: "STRING", description: "커스텀 URL (선택)" },
        description: { type: "STRING", description: "프로모션 설명" }
      }
    },
    pricing: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "플랜 이름 (예: Starter, Pro)" },
          units: { type: "NUMBER", description: "제공 수량" },
          unit: { type: "STRING", description: "단위 (예: credits, tokens)" },
          type: { type: "STRING", enum: ["free", "paid"], description: "무료/유료" },
          price: { type: "NUMBER", description: "가격 (유료일 경우)" },
          description: { type: "STRING", description: "플랜 설명" }
        },
        required: ["name", "type"]
      }
    },
    colors: {
      type: "OBJECT",
      properties: {
        template: { 
          type: "STRING", 
          enum: ["default", "ocean", "sunset", "forest", "blackwhite", "midnight", "darkocean"],
          description: "색상 템플릿" 
        },
        primary: { type: "STRING", description: "주요 색상 (HEX)" },
        secondary: { type: "STRING", description: "보조 색상 (HEX)" },
        text: { type: "STRING", description: "텍스트 색상 (HEX)" },
        background: { type: "STRING", description: "배경 색상 (HEX)" }
      }
    },
    expiration: {
      type: "OBJECT",
      properties: {
        hasExpiration: { type: "BOOLEAN", description: "만료일 설정 여부" },
        expirationDate: { type: "STRING", description: "만료일 (YYYY-MM-DD)" }
      }
    }
  }
};

// Gemini 3 Flash Preview SDK 사용법 (2026)
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

async function callGemini(userMessage) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // 2026년 최신 고성능 모델
    contents: userMessage,
    config: {
      responseMimeType: "application/json",
      responseSchema: promotionSchema,
      // Gemini 3 신기능: 사고 수준 조절
      thinkingConfig: {
        thinkingLevel: "LOW" // 빠른 응답을 위한 설정
      }
    }
  });
  
  return JSON.parse(response.text); // 보장된 JSON 응답
}
```

### 왜 Gemini 3.0 Flash + Structured Outputs인가?

#### Kent Beck 관점에서 재평가

**1. Simplicity (단순함)**
```javascript
// Gemini Structured Outputs
const response = await model.generateContent(userMessage);
const updates = JSON.parse(response.response.text()); // 보장된 JSON

// vs OpenAI Function Calling  
const updates = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments);
```

**2. Performance & Cost (성능과 비용)**
- Gemini Flash: 더 빠른 응답 속도 + 저렴한 비용
- OpenAI: 더 높은 품질 but 상대적으로 비싼 비용

**3. 한국어 지원**
- Gemini: Google의 다국어 강점
- 한국어 프롬프트 이해도는?

## ✅ **선택 이유 확정 (Kent Beck 승인)**

### **MVP 기준: "작동만 하면 됨" + "빠른 UX"**

**Gemini 3 Flash Preview 선택 이유 (2026 업데이트):**
1. ⚡ **최고 속도**: Gemini 3 Flash = 빠른 응답 + Pro급 성능
2. 💰 **가격 효율**: Gemini 3 Pro 대비 1/4 비용 (≤200k 토큰)
3. 🧠 **스마트 기능**: thinkingLevel로 응답 품질/속도 조절
4. 🎯 **2026 최신**: frontier-class 성능으로 복잡한 요청 처리

### **2026년 확인된 Gemini 3 기술적 장점:**
```javascript
// ✅ Google GenAI SDK v1.34.0+ (2026 최신)
- Gemini 3 전용 기능 지원
- 향상된 Structured Output (OBJECT/ARRAY 타입)
- 브라우저 직접 호출 지원 (MVP용)

// ✅ Gemini 3 Flash Preview 모델  
- Pro급 추론 성능 + Flash 속도
- 1M 토큰 입력, 64K 토큰 출력 지원
- 강화된 한국어 처리 (2025년 1월 지식 컷오프)
- thinkingLevel: "LOW"로 빠른 응답 최적화
```

### **검증되지 않은 부분 (MVP에서 허용)**
- 한국어 정확도 → 테스트하면서 개선
- 복잡한 요청 처리 → 단순한 케이스부터 시작  
- API 제한사항 → MVP 범위에서 문제없음

## UI/UX 설계

### 하이브리드 접근법

```
┌─────────────────┬─────────────────┐
│   기존 폼 패널   │   미리보기 패널   │
│                │                │
│ ┌─────────────┐ │                │
│ │ General     │ │     Preview    │
│ │ Pricing     │ │                │
│ │ Colors      │ │                │
│ └─────────────┘ │                │
│                │                │
│ ┌─────────────┐ │                │
│ │ AI Chat     │ │                │ 
│ │ Toggle UI   │ │                │
│ └─────────────┘ │                │
└─────────────────┴─────────────────┘
```

### 채팅 UI 통합 방식

**선택: ChatUX 라이브러리**
- 순수 JavaScript, 최소 의존성
- 기존 프로젝트 구조와 호환
- 가벼운 구현 (< 50KB)

## 구현 계획

### Phase 1: 기반 구조 (1-2일)
```javascript
// 1. 환경 변수 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-key';

// 2. 채팅 UI 토글 
<button id="ai-chat-toggle">💬 AI Assistant</button>
<div id="ai-chat-panel" class="hidden">
  <!-- ChatUX 컴포넌트 -->
</div>

// 3. Gemini API 호출 함수 (새 SDK)
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function callGemini(userMessage) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userMessage,
      config: {
        responseMimeType: "application/json",
        responseSchema: promotionSchema
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}
```

### Phase 2: 핵심 기능 (2-3일)
```javascript
// 4. Gemini Structured Output 응답 처리
async function handleUserMessage(userMessage) {
  try {
    const updates = await callGemini(userMessage);
    
    // 기존 모듈 재활용
    if (updates.pricing) {
      PricingManager.bulkUpdate(updates.pricing);
    }
    if (updates.colors) {
      ColorManager.applyColors(updates.colors);
    }
    if (updates.general) {
      updateGeneralSection(updates.general);
    }
    if (updates.expiration) {
      updateExpirationSection(updates.expiration);
    }
    
    // 성공 피드백
    chatUI.addMessage("설정을 업데이트했습니다! ✅", 'bot');
  } catch (error) {
    chatUI.addMessage("죄송합니다. 다시 시도해 주세요.", 'bot');
  }
}

// 5. 자연어 처리 예시 (Gemini가 직접 JSON 생성)
"민트색으로 3개 플랜 만들어줘" 
→ {
  colors: { template: "default", primary: "#4EA699" },
  pricing: [
    { name: "Starter", type: "paid", price: 29 },
    { name: "Pro", type: "paid", price: 99 },
    { name: "Enterprise", type: "paid", price: 299 }
  ]
}
```

### Phase 3: 사용성 개선 (1-2일)
```javascript
// 6. 맥락 인식
function buildContextPrompt() {
  const currentData = Storage.load();
  return `현재 설정: ${JSON.stringify(currentData)}`;
}

// 7. 에러 처리 및 피드백
function handleAIError(error) {
  chatUI.addMessage("죄송합니다. 다시 시도해 주세요.", 'bot');
}
```

## 예상 사용자 시나리오

### 시나리오 1: 빠른 프로모션 생성
```
User: "크리스마스 프로모션으로 스타터 $29, 프로 $99, 엔터프라이즈 $299 3개 플랜 만들어줘"

AI Response: 
{
  "general": { "title": "크리스마스 프로모션" },
  "pricing": [
    { "name": "Starter", "price": 29, "type": "paid" },
    { "name": "Pro", "price": 99, "type": "paid" },
    { "name": "Enterprise", "price": 299, "type": "paid" }
  ]
}

Result: 3개 가격 플랜이 자동으로 생성되고 미리보기에 반영됨
```

### 시나리오 2: 색상 테마 변경
```
User: "좀 더 따뜻한 색상으로 바꿔줘"

AI Response:
{
  "colors": {
    "template": "sunset",
    "primary": "#FF6B35",
    "secondary": "#F7931E"
  }
}

Result: Sunset 템플릿이 적용되고 색상 필드들이 업데이트됨
```

## 성능 및 보안 고려사항

### 보안 (MVP 수준)
```javascript
// 환경 변수로 API 키 관리
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is required');
  throw new Error('Gemini API key is required');
}

// 클라이언트 사이드에서 직접 호출 (MVP이므로 허용)
// 실제 운영 시에는 서버 프록시 필요
```

### 성능 최적화
```javascript
// 디바운싱으로 API 호출 최소화
const debouncedAICall = debounce(callAI, 1000);

// 로딩 상태 표시
function showAILoading() {
  chatUI.addMessage("생각 중... 🤔", 'bot', { temporary: true });
}
```

## 개발 우선순위

### 🚀 Must Have (MVP)
1. ✅ 기본 채팅 UI 통합
2. ✅ OpenAI Function Calling 구현
3. ✅ 기존 모듈과 AI 응답 연동
4. ✅ 실시간 미리보기 동기화

### 🎯 Nice to Have (향후)
1. 대화 히스토리 저장
2. 실행 취소/다시 실행
3. 음성 입력 지원
4. 다국어 지원

## Kent Beck의 마무리 철학

> "Make it work, make it right, make it fast"

1. **Make it work**: Function Calling으로 기본 동작 구현
2. **Make it right**: 기존 모듈 재활용으로 코드 중복 제거  
3. **Make it fast**: 필요할 때 최적화 (YAGNI)

이 설계는 복잡성을 최소화하면서도 사용자에게 실질적 가치를 제공하는 Kent Beck의 철학을 충실히 따릅니다.
# 📚 HTML Search/Replace 기반 AI 프로모션 빌더 - 구현 문서

## 🎯 개요

본 문서는 Klaim 프로모션 빌더의 AI 기능이 어떻게 구현되었는지 기술적 세부사항을 설명합니다.
기존 데이터 기반 접근법에서 **HTML 직접 편집 방식**으로 전환한 아키텍처를 다룹니다.

## 🏗️ 핵심 아키텍처

### 1. 전체 시스템 구조

```
사용자 입력 (자연어)
    ↓
AI Chat UI (ai-chat.js)
    ↓
AI Handler (ai-handler.js)
    ↓
Gemini API → Search/Replace 연산 생성
    ↓
HTML Manager (html-manager.js)
    ↓
Fuzzy Matching + Validation
    ↓
미리보기 업데이트 (Blob URL)
```

## 🔧 핵심 컴포넌트

### 1. HTMLManager 클래스 (`js/html-manager.js`)

#### 주요 기능
- **HTML 상태 관리**: 현재 HTML을 메모리에 보관
- **Search/Replace 연산**: 단일 replace 연산으로 모든 편집 처리
- **Fuzzy Matching**: 공백/줄바꿈 차이를 무시하고 매칭
- **자동 백업/롤백**: 실패 시 자동으로 이전 상태 복원
- **히스토리 관리**: Undo/Redo 지원

#### 핵심 메서드

```javascript
class HTMLManager {
  // 연산 적용 - 핵심 로직
  applyOperations(operations) {
    const backup = this.currentHTML;
    
    try {
      // 각 연산 순차 적용
      for (const op of operations) {
        if (!this.fuzzyReplace(op.search, op.replace)) {
          throw new Error(`Search string not found: ${op.search}`);
        }
      }
      
      // HTML 문법 검증
      if (!this.isValidHTML(this.currentHTML)) {
        throw new Error('Invalid HTML generated');
      }
      
      // 성공 시 히스토리 추가
      this.history.push(backup);
      return { success: true, html: this.currentHTML };
      
    } catch (e) {
      this.currentHTML = backup; // 자동 롤백
      return { success: false, error: e.message };
    }
  }

  // Fuzzy Matching 구현
  fuzzyReplace(search, replace) {
    // 1단계: 정확한 매치
    if (this.currentHTML.includes(search)) {
      this.currentHTML = this.currentHTML.replace(search, replace);
      return true;
    }
    
    // 2단계: 공백 정규화
    const normalized = search.replace(/\s+/g, '\\s*');
    const regex = new RegExp(normalized);
    
    if (regex.test(this.currentHTML)) {
      this.currentHTML = this.currentHTML.replace(regex, replace);
      return true;
    }
    
    return false;
  }

  // HTML 검증
  isValidHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return !doc.querySelector('parsererror');
  }
}
```

### 2. AI Handler (`js/ai-handler.js`)

#### 주요 역할
- Gemini API와 통신
- HTML 컨텍스트 관리 
- 연산 검증 및 적용
- 에러 처리

#### 처리 흐름

```javascript
async processUserMessage(userMessage) {
  // 1. 현재 HTML 로드
  const currentHTML = htmlManager.getCurrentHTML();
  
  // 2. Gemini에 전송할 프롬프트 생성
  const contextPrompt = `
    현재 HTML 코드:
    ${currentHTML}
    
    사용자 요청: "${userMessage}"
    
    search/replace 연산을 생성해주세요.
  `;
  
  // 3. Gemini API 호출
  const operations = await geminiAPI.generateStructuredOutput(
    contextPrompt, 
    htmlOperationsSchema
  );
  
  // 4. 연산 적용
  const result = htmlManager.applyOperations(operations.operations);
  
  // 5. 미리보기 업데이트
  this.updatePreview();
}
```

### 3. Schema 정의 (`js/schema.js`)

#### Search/Replace 연산 스키마

```javascript
export const htmlOperationsSchema = {
  type: "OBJECT",
  properties: {
    operations: {
      type: "ARRAY",
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
            description: "변경사항 설명"
          }
        },
        required: ["search", "replace"]
      }
    }
  }
};
```

#### 시스템 프롬프트

```javascript
export const htmlEditPrompt = `
당신은 HTML 코드를 직접 편집하는 AI입니다.
사용자 요청을 HTML search/replace 연산으로 변환하세요.

예시:
사용자: "제목을 '블랙프라이데이'로 바꿔줘"
→ {
  "operations": [{
    "search": "<h1 class=\"brand-name\">JasonCom</h1>",
    "replace": "<h1 class=\"brand-name\">블랙프라이데이</h1>",
    "description": "브랜드 이름 변경"
  }]
}
`;
```

## 🚀 AI 기능 구현 방식

### 1. Gemini API 통합

```javascript
// js/gemini.js
class GeminiAPI {
  async generateStructuredOutput(prompt, schema) {
    const requestData = {
      model: 'gemini-2.0-flash-thinking-exp',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: {
          thinkingLevel: 'medium'
        }
      }
    };
    
    const response = await this.ai.models.generateContent(requestData);
    return JSON.parse(response.text);
  }
}
```

### 2. 채팅 UI 구현

```javascript
// js/ai-chat.js
class AIChatUI {
  async sendMessage(text) {
    // 1. 사용자 메시지 표시
    this.addMessage(text, 'user');
    
    // 2. AI 처리
    const response = await aiHandler.processUserMessage(text);
    
    // 3. AI 응답 표시
    this.addMessage(response.message, 'bot');
  }
}
```

## 💡 핵심 개선사항

### 1. 키워드 분류 제거

**이전 방식 (취약함)**:
```javascript
// ❌ 취약한 키워드 기반 분류
if (message.includes('색상') || message.includes('color')) {
  // 색상 변경 로직
} else if (message.includes('가격') || message.includes('price')) {
  // 가격 변경 로직
}
// "Basic 플랜 색상 빨간색으로" → 분류 실패!
```

**현재 방식 (견고함)**:
```javascript
// ✅ 모든 요청을 HTML 편집으로 처리
const operations = await generateHTMLOperations(message);
htmlManager.applyOperations(operations);
// 분류 없이 직접 HTML 수정
```

### 2. Fuzzy Matching 알고리즘

```javascript
fuzzyReplace(search, replace) {
  // 1. 정확 매치 시도
  if (exactMatch(search)) return true;
  
  // 2. 공백 정규화 (\s+ → \s*)
  const normalized = normalizeWhitespace(search);
  if (regexMatch(normalized)) return true;
  
  // 3. 줄바꿈 무시
  const multiline = ignoreLineBreaks(search);  
  if (multilineMatch(multiline)) return true;
  
  return false;
}
```

### 3. 자동 검증 및 롤백

```javascript
applyOperations(operations) {
  const backup = this.currentHTML;
  
  try {
    // 연산 적용
    this.currentHTML = applyChanges(operations);
    
    // DOMParser로 검증
    if (!isValidHTML(this.currentHTML)) {
      throw new Error('Invalid HTML');
    }
    
    return { success: true };
    
  } catch (error) {
    // 자동 롤백
    this.currentHTML = backup;
    return { success: false, error };
  }
}
```

## 📊 성능 최적화

### 1. Blob URL 기반 미리보기

```javascript
generatePreviewURL() {
  // HTML을 Blob으로 변환
  const blob = new Blob([this.currentHTML], { type: 'text/html' });
  
  // Blob URL 생성 (메모리 효율적)
  return URL.createObjectURL(blob);
}

// iframe 업데이트
updatePreview() {
  const url = htmlManager.generatePreviewURL();
  previewFrame.src = url;
  
  // 메모리 누수 방지
  URL.revokeObjectURL(previousURL);
}
```

### 2. 히스토리 관리

```javascript
class HTMLManager {
  constructor() {
    this.history = [];      // 최대 50개 보관
    this.maxHistory = 50;
  }
  
  addToHistory(backup) {
    this.history.push(backup);
    
    // 메모리 관리
    if (this.history.length > this.maxHistory) {
      this.history.shift(); // 오래된 것 제거
    }
  }
}
```

## 🔒 보안 고려사항

### 1. HTML Sanitization

```javascript
validateHTMLOperations(operations) {
  const dangerousPatterns = [
    /<script/i,     // 스크립트 태그
    /<iframe/i,     // iframe
    /javascript:/i, // 인라인 JS
    /on\w+=/i      // 이벤트 핸들러
  ];
  
  operations.forEach(op => {
    dangerousPatterns.forEach(pattern => {
      if (pattern.test(op.search + op.replace)) {
        throw new Error('Potentially dangerous content');
      }
    });
  });
}
```

### 2. API 키 보호

```javascript
// 브라우저 로컬스토리지 사용 (임시)
// 프로덕션에서는 서버 프록시 필요
class Config {
  static getApiKey() {
    return localStorage.getItem('GEMINI_API_KEY');
  }
}
```

## 📈 확장 가능성

### 1. 더 복잡한 연산 지원

```javascript
// 현재: replace만
{ search: "A", replace: "B" }

// 향후 가능:
{ type: "insertAfter", target: "X", content: "Y" }
{ type: "remove", selector: ".class" }
{ type: "setAttribute", element: "div", attr: "style", value: "..." }
```

### 2. 멀티 스텝 연산

```javascript
// 복잡한 요청을 여러 단계로 분해
"3개 플랜 만들고 빨간색으로 바꿔줘"
→ [
  { /* 플랜 추가 연산 */ },
  { /* 색상 변경 연산 */ }
]
```

## 🎯 결론

이 구현은 다음과 같은 장점을 제공합니다:

1. **견고성**: 키워드 분류 없이 모든 요청을 일관되게 처리
2. **유연성**: 어떤 HTML 변경사항도 지원
3. **안전성**: 자동 검증과 롤백으로 안정성 보장
4. **사용성**: 자연어로 HTML을 직접 편집하는 직관적 경험

특히 "Basic 플랜 색상 빨간색으로 바꿔줘" 같은 복합적 요청도 정확하게 처리할 수 있게 되었습니다.
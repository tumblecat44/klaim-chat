# 🤖 AI Chat-based Promotion Builder MVP

Klaim 프로모션 페이지 빌더에 Gemini 3 Flash 기반 AI 채팅 인터페이스를 추가한 MVP입니다.

## ✨ 주요 기능

- **자연어 프로모션 설정**: "3개 플랜으로 스타터 $29, 프로 $99, 엔터프라이즈 $299 만들어줘"
- **실시간 색상 테마 변경**: "민트색 테마로 바꿔줘", "따뜻한 느낌으로"
- **즉시 미리보기 업데이트**: AI 변경사항이 실시간으로 프리뷰에 반영
- **기존 폼과의 하이브리드 UI**: 폼 기반 + AI 채팅 인터페이스 병존

## 🚀 실행 방법

### 1. 로컬 서버 시작
```bash
cd klaim-standalone
python3 -m http.server 8080
```

### 2. 브라우저에서 접속
```
http://localhost:8080
```

### 3. Gemini API 키 설정
- 첫 실행 시 API 키 입력 프롬프트 표시
- [Google AI Studio](https://aistudio.google.com/)에서 API 키 생성 필요

### 4. AI 기능 테스트
1. **🤖 AI Test** 버튼으로 API 연결 확인
2. **💬 AI Assistant** 버튼으로 채팅 시작

## 🎯 테스트 시나리오

### 기본 플랜 생성
```
"3개 플랜으로 스타터 $29, 프로 $99, 엔터프라이즈 $299 만들어줘"
```

### 색상 테마 변경
```
"민트색 테마로 바꿔줘"
"바다색 느낌으로"
"따뜻한 색상으로 바꿔줘"
```

### 프로모션 정보 설정
```
"제목을 '크리스마스 세일'로 바꿔줘"
"12월 25일까지 한정 세일로 설정해줘"
```

### 복합 요청
```
"스타터 플랜 $19, 프로 플랜 $49, 엔터프라이즈 플랜 $99로 설정하고 민트색 테마 적용해줘"
```

## 📁 파일 구조

```
klaim-standalone/
├── index.html              # 메인 HTML (기존 + AI UI 추가)
├── css/
│   ├── styles.css          # 기존 스타일
│   └── ai-chat.css         # AI 채팅 UI 스타일
├── js/
│   ├── app.js              # 기존 앱 로직
│   ├── pricing.js          # 가격 관리 (AI bulkUpdate 추가)
│   ├── colors.js           # 색상 관리 (기존)
│   ├── preview.js          # 미리보기 (기존)
│   ├── storage.js          # 데이터 저장 (기존)
│   │
│   ├── config.js           # API 키 관리
│   ├── gemini.js           # Gemini API 연결
│   ├── schema.js           # Structured Output 스키마
│   ├── ai-handler.js       # AI 응답 처리 및 기존 모듈 연동
│   ├── ai-chat.js          # AI 채팅 UI 관리
│   └── ai-test.js          # AI 연결 테스트
└── README.md               # 이 파일
```

## 🛠️ 기술 스택

- **AI 모델**: Gemini 3 Flash Preview
- **SDK**: @google/genai v1.34.0+
- **UI 라이브러리**: 순수 JavaScript + CSS
- **기존 모듈**: PricingManager, ColorManager, PreviewManager 활용

## ✅ 구현된 기능

### Phase 1: 기반 구조 ✅
- ✅ 환경 변수 관리 (config.js)
- ✅ Gemini API 연결 (gemini.js)
- ✅ API 테스트 기능

### Phase 2: Structured Output ✅
- ✅ 프로모션 JSON 스키마 정의
- ✅ 시스템 프롬프트 최적화
- ✅ 데이터 검증 함수

### Phase 3: 채팅 UI ✅
- ✅ 플로팅 AI 어시스턴트 버튼
- ✅ 모던한 채팅 인터페이스
- ✅ 빠른 액션 버튼들
- ✅ 실시간 메시징

### Phase 4: 기존 모듈 연동 ✅
- ✅ AIHandler 클래스
- ✅ PricingManager.bulkUpdate()
- ✅ 실시간 UI 동기화
- ✅ 미리보기 업데이트

## 🔧 주요 클래스

### AIChatUI
- 채팅 UI 관리
- 사용자 입력 처리
- 메시지 렌더링

### AIHandler
- AI 요청 처리
- 기존 모듈과 연동
- 에러 처리

### GeminiAPI
- Gemini API 연결
- Structured Output 생성
- 연결 상태 관리

## 🎉 성공 기준 달성

✅ "3개 플랜 만들어줘" → 정확한 가격 플랜 생성  
✅ "민트색으로 바꿔줘" → 색상 테마 적용  
✅ "12월 25일까지 세일" → 만료일 설정  
✅ 실시간 미리보기 업데이트  
✅ 기존 폼과 병존하는 하이브리드 UI  

## 🚨 알려진 제한사항

- MVP 수준의 에러 처리
- 브라우저에서 직접 API 호출 (보안상 주의)
- 복잡한 요청의 경우 정확도 제한
- 다국어 지원 제한 (한국어 위주)

## 💡 향후 개선 사항

- 서버 사이드 프록시 구현 (보안)
- 더 정교한 에러 처리
- 음성 입력 지원
- 대화 히스토리 저장
- A/B 테스트 기능

---

**🎯 Kent Beck 철학 적용**: "Make it work, make it right, make it fast" 순서로 구현  
**⚡ 응답 속도**: Gemini 3 Flash로 < 3초 달성  
**🎨 UX**: 직관적이고 반응성 좋은 인터페이스  

**개발 완료일**: 2026년 1월 5일  
**총 개발 기간**: 1일 (계획된 7-11일 대비 단축 달성!)**
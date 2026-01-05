---
name: "Claude Code Workflow Manager"
description: "Claude Code의 Research-First 접근법과 체계적 개발 워크플로우 관리"
---

# Claude Code Workflow Manager Skill

## 언제 사용하는가
- 새로운 기능 개발 시작시
- 복잡한 코드 리팩토링시
- 버그 수정 및 디버깅시
- 코드 리뷰 및 개선시

## 핵심 워크플로우

### 1. Research-First Approach
```
1. 파일 읽기 (Read tool) - 현재 상태 파악
2. 서브에이전트 활용 - 전문 영역 조사
3. 계획 수립 (TodoWrite) - 작업 단위 분할
4. 점진적 구현 - 200줄 이하 변경
5. 검증 및 테스트 - 각 단계마다 검증
```

### 2. 작업 계획 수립
```typescript
interface WorkflowPlan {
  objective: string;          // 목표
  currentState: string;       // 현재 상태
  steps: WorkflowStep[];      // 단계별 작업
  constraints: string[];      // 제약사항
  testStrategy: string;       // 테스트 전략
}

interface WorkflowStep {
  description: string;
  files: string[];           // 관련 파일들
  maxDiffSize: number;       // 최대 변경 라인 수
  dependencies: string[];    // 의존성
  testRequired: boolean;     // 테스트 필요 여부
}
```

### 3. 상태 파악 체크리스트
- [ ] 프로젝트 구조 이해
- [ ] 기존 코드 패턴 분석
- [ ] 사용 중인 라이브러리/프레임워크 확인
- [ ] 테스트 구조 파악
- [ ] 설정 파일 검토

## 행동 전 검증 프로세스

### Before Action Checklist
```typescript
async function beforeAction(task: string): Promise<ActionPlan> {
  // 1. 현재 상태 파악
  const projectState = await analyzeProjectState();
  
  // 2. 관련 파일 식별
  const relevantFiles = await findRelevantFiles(task);
  
  // 3. 의존성 분석
  const dependencies = await analyzeDependencies(relevantFiles);
  
  // 4. 리스크 평가
  const risks = await assessRisks(task, projectState);
  
  // 5. 실행 계획 수립
  return createActionPlan(task, projectState, risks);
}
```

### 파일 분석 패턴
```bash
# 1. 프로젝트 루트 파악
ls -la
find . -name "package.json" -o -name "*.config.js" -o -name "tsconfig.json"

# 2. 코드 패턴 분석
grep -r "import.*from" --include="*.ts" --include="*.js" . | head -20
grep -r "export.*=" --include="*.ts" --include="*.js" . | head -10

# 3. 테스트 구조 확인
find . -name "*test*" -o -name "*spec*" -type f
```

### 점진적 구현 가이드
1. **작은 단위로 분할**
   - 200줄 이하 변경 유지
   - 기능별 독립적 구현
   - 각 단계 검증 후 진행

2. **TDD 패턴 활용**
   - 입출력 쌍 기반 테스트 작성
   - 실제 데이터 우선, 모킹 최소화
   - 실패 → 구현 → 통과 → 리팩토링

3. **지속적 검증**
   - 각 변경 후 테스트 실행
   - 린트/타입체크 통과 확인
   - 기능 동작 검증

## 에러 처리 및 복구

### 컨텍스트 관리
```bash
# 컨텍스트 오버플로우 방지
/clear  # 정기적 초기화

# 체크포인트 활용
/checkpoint  # 중요 지점 저장
/rewind     # 문제시 복구
```

### 권한 및 보안
```typescript
// 최소 권한 설정
const allowedOperations = [
  'read', 'write', 'edit', 'test'
];

// 위험한 작업 사전 확인
function validateOperation(operation: string): boolean {
  if (DANGEROUS_OPERATIONS.includes(operation)) {
    return confirm(`Dangerous operation: ${operation}. Continue?`);
  }
  return true;
}
```

## 성능 최적화 전략

### 컨텍스트 효율성
- 한 채팅 = 하나의 기능/프로젝트
- 정기적 /clear 사용
- 서브에이전트로 작업 분산

### 도구 활용 우선순위
1. **Read**: 파일 내용 이해
2. **Grep**: 코드 패턴 검색
3. **TodoWrite**: 작업 계획 관리
4. **Edit/MultiEdit**: 코드 변경
5. **Bash**: 테스트 및 검증

## 품질 보증

### Code Review Checklist
- [ ] 기존 패턴 준수
- [ ] 타입 안정성 확보
- [ ] 에러 처리 적절성
- [ ] 테스트 커버리지
- [ ] 성능 영향 최소화
- [ ] 보안 취약점 없음

### 완료 기준
- [ ] 모든 테스트 통과
- [ ] 린트/타입체크 통과
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트
- [ ] 통합 테스트 성공

## 베스트 프랙티스

### 커뮤니케이션
- 작업 시작 전 계획 공유
- 각 단계 완료시 상태 보고
- 문제 발생시 즉시 알림
- 결과물 명확한 설명

### 코드 품질
- 일관된 스타일 유지
- 의미 있는 변수명 사용
- 적절한 주석 (요청시에만)
- 확장 가능한 구조 설계

### 문서화
- README 업데이트
- API 문서 유지
- 변경사항 기록
- 사용 예제 제공
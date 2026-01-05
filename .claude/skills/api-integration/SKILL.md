---
name: "API Integration Best Practices"
description: "RESTful API 설계 및 통합 전용 스킬"
---

# API Integration Skill

## 언제 사용하는가
- REST API 엔드포인트 설계시
- 외부 서비스 API 통합시
- API 클라이언트 라이브러리 개발시
- API 문서화 및 스펙 정의시

## 핵심 원칙

### 1. RESTful 설계
- 리소스 중심 URL 구조
- HTTP 메서드 의미론적 사용
- 상태 코드 정확한 활용
- 일관된 응답 형식

### 2. 인증 및 보안
```typescript
// Bearer Token 방식
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
}
```

### 3. 에러 처리 패턴
```typescript
interface APIError {
  status: number;
  code: string;
  message: string;
  details?: any;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  pagination?: PaginationInfo;
}
```

## URL 설계 패턴

### 리소스 기반 구조
```
GET    /api/v1/users           # 사용자 목록
GET    /api/v1/users/{id}      # 특정 사용자
POST   /api/v1/users           # 사용자 생성
PUT    /api/v1/users/{id}      # 사용자 수정
DELETE /api/v1/users/{id}      # 사용자 삭제

# 중첩 리소스
GET    /api/v1/users/{id}/orders
POST   /api/v1/users/{id}/orders
```

### 쿼리 파라미터
```
# 필터링
GET /api/v1/products?category=electronics&status=active

# 정렬
GET /api/v1/products?sort=price&order=desc

# 페이지네이션
GET /api/v1/products?page=2&limit=50

# 필드 선택
GET /api/v1/users?fields=id,name,email
```

## HTTP 상태 코드 매핑

### 성공 응답
- `200 OK`: 일반적인 성공
- `201 Created`: 리소스 생성 성공
- `204 No Content`: 삭제 성공

### 클라이언트 에러
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `422 Unprocessable Entity`: 유효성 검증 실패

### 서버 에러
- `500 Internal Server Error`: 서버 오류
- `502 Bad Gateway`: 게이트웨이 오류
- `503 Service Unavailable`: 서비스 불가

## 클라이언트 구현 패턴

### 기본 클라이언트 구조
```typescript
class APIClient {
  constructor(
    private baseURL: string,
    private apiKey: string,
    private timeout: number = 30000
  ) {}

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      const result = await response.json();
      
      if (!response.ok) {
        throw new APIError(result.error || 'Request failed', response.status);
      }
      
      return result;
    } catch (error) {
      // 에러 처리 및 로깅
      throw this.handleError(error);
    }
  }

  get<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }
}
```

### 재시도 메커니즘
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (shouldRetry(error)) {
        await sleep(delay * Math.pow(2, attempt - 1)); // 지수 백오프
        continue;
      }
      throw error;
    }
  }
}
```

## 테스트 전략

### 통합 테스트
```typescript
describe('API Integration', () => {
  it('should handle success response', async () => {
    const response = await apiClient.get('/users/1');
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });

  it('should handle 404 error', async () => {
    await expect(apiClient.get('/users/999'))
      .rejects
      .toThrow('User not found');
  });

  it('should retry on network error', async () => {
    // 네트워크 장애 시나리오 테스트
  });
});
```

### 실제 API 테스트
- 실제 서비스와의 통합 테스트
- API 키 및 환경 분리
- 레이트 리미팅 고려
- 데이터 정합성 검증

## 모니터링 및 로깅
- 요청/응답 로깅
- 성능 메트릭 수집
- 에러율 추적
- API 사용량 모니터링
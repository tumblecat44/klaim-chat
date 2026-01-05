// HTML 상태 관리 및 Search/Replace 시스템
// 모든 AI 요청을 HTML 직접 편집으로 처리

class HTMLManager {
  constructor() {
    this.currentHTML = '';
    this.history = [];      // 변경 이력 관리
    this.historyIndex = -1; // redo 지원용
    this.maxHistory = 50;   // 최대 이력 보관 수
    
    this.init();
  }
  
  // 초기화 - 현재 preview.html 로드
  async init() {
    try {
      const response = await fetch('preview.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.currentHTML = await response.text();
      console.log('✅ HTML 템플릿 로드 완료');
    } catch (error) {
      console.error('❌ HTML 템플릿 로드 실패:', error);
      this.currentHTML = this.getDefaultTemplate();
    }
  }
  
  // 기본 템플릿 (fallback)
  getDefaultTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Promotion Preview</title>
    <style>
        body { font-family: sans-serif; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        .pricing-card { border: 1px solid #ccc; padding: 1rem; margin: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Promotion Page</h1>
        <div class="pricing-cards">
            <div class="pricing-card">
                <h3>Free Plan</h3>
                <div>$0</div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }
  
  // 핵심 기능: 연산 배열 적용
  applyOperations(operations) {
    if (!operations || operations.length === 0) {
      return { success: false, error: '적용할 연산이 없습니다.' };
    }
    
    // 백업 생성
    const backup = this.currentHTML;
    
    try {
      console.log('🔄 HTML 연산 적용 시작:', operations.length + '개');
      
      // 각 연산 순차 적용
      for (const [index, op] of operations.entries()) {
        if (!op.search || typeof op.search !== 'string') {
          throw new Error(`${index + 1}번째 연산의 검색 문자열이 유효하지 않습니다.`);
        }
        
        if (typeof op.replace !== 'string') {
          throw new Error(`${index + 1}번째 연산의 교체 문자열이 유효하지 않습니다.`);
        }
        
        console.log(`  연산 ${index + 1}: "${op.search.substring(0, 50)}..." → "${op.replace.substring(0, 50)}..."`);
        
        if (!this.fuzzyReplace(op.search, op.replace)) {
          throw new Error(`검색 문자열을 찾을 수 없습니다: "${op.search}"`);
        }
      }
      
      // HTML 문법 검증
      if (!this.isValidHTML(this.currentHTML)) {
        throw new Error('생성된 HTML이 유효하지 않습니다.');
      }
      
      // 성공 시 히스토리에 추가
      this.addToHistory(backup);
      
      console.log('✅ HTML 연산 적용 완료');
      return { 
        success: true, 
        html: this.currentHTML,
        appliedCount: operations.length
      };
      
    } catch (error) {
      // 실패 시 자동 롤백
      this.currentHTML = backup;
      console.error('❌ HTML 연산 적용 실패:', error.message);
      
      return { 
        success: false, 
        error: error.message,
        rollback: true
      };
    }
  }
  
  // Fuzzy matching으로 문자열 교체
  fuzzyReplace(search, replace) {
    const originalHTML = this.currentHTML;
    
    // 1단계: 정확한 문자열 매치
    if (this.currentHTML.includes(search)) {
      this.currentHTML = this.currentHTML.replace(search, replace);
      console.log('    ✓ 정확 매치 성공');
      return true;
    }
    
    // 2단계: 공백 정규화 후 재시도
    try {
      // 연속된 공백을 정규화
      const normalizedSearch = search.replace(/\s+/g, '\\s+');
      const regex = new RegExp(normalizedSearch, 'g');
      
      if (regex.test(this.currentHTML)) {
        this.currentHTML = this.currentHTML.replace(regex, replace);
        console.log('    ✓ 공백 정규화 매치 성공');
        return true;
      }
    } catch (regexError) {
      console.warn('    ⚠️ 정규식 생성 오류:', regexError.message);
    }
    
    // 3단계: 줄바꿈 무시하고 재시도
    try {
      const multilineSearch = search.replace(/\s+/g, '\\s*').replace(/\n/g, '\\s*');
      const multilineRegex = new RegExp(multilineSearch, 'gm');
      
      if (multilineRegex.test(this.currentHTML)) {
        this.currentHTML = this.currentHTML.replace(multilineRegex, replace);
        console.log('    ✓ 멀티라인 매치 성공');
        return true;
      }
    } catch (regexError) {
      console.warn('    ⚠️ 멀티라인 정규식 오류:', regexError.message);
    }
    
    console.log('    ❌ 모든 매치 방법 실패');
    return false;
  }
  
  // HTML 문법 검증 (자동 수정 포함)
  isValidHTML(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // parsererror 요소 확인
      const errors = doc.querySelector('parsererror');
      if (errors) {
        console.error('HTML 파싱 오류 감지:', errors.textContent);
        
        // 규칙 기반 자동 수정 시도
        console.log('🔧 규칙 기반 HTML 자동 수정 시도...');
        const fixedHTML = this.autoFixBasicErrors(html);
        
        if (fixedHTML !== html) {
          // 수정된 HTML로 재검증
          const fixedDoc = parser.parseFromString(fixedHTML, 'text/html');
          const fixedErrors = fixedDoc.querySelector('parsererror');
          
          if (!fixedErrors) {
            console.log('✅ 규칙 기반 수정 성공');
            this.currentHTML = fixedHTML;
            return true;
          }
        }
        
        return false;
      }
      
      // 기본적인 구조 검증
      if (!doc.documentElement || !doc.body) {
        console.error('HTML 기본 구조가 없습니다.');
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('HTML 검증 중 오류:', error);
      return false;
    }
  }
  
  // 규칙 기반 HTML 오류 자동 수정
  autoFixBasicErrors(html) {
    let fixedHTML = html;
    let fixCount = 0;
    
    console.log('🔧 기본 HTML 오류 수정 시작...');
    
    // 1. 닫히지 않은 self-closing 태그 수정
    const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];
    selfClosingTags.forEach(tag => {
      const regex = new RegExp(`<${tag}([^>]*)>(?!</)`, 'gi');
      const matches = fixedHTML.match(regex);
      if (matches) {
        fixedHTML = fixedHTML.replace(regex, `<${tag}$1 />`);
        fixCount += matches.length;
      }
    });
    
    // 2. 속성값 따옴표 추가
    fixedHTML = fixedHTML.replace(/(\w+)=([^\s"'][^\s>]*)/g, '$1="$2"');
    
    // 3. 잘못된 중첩 태그 수정 (간단한 케이스)
    fixedHTML = fixedHTML.replace(/<(div|p|h[1-6])([^>]*)><\/\1>\s*<\1\2>/gi, '<$1$2>');
    
    // 4. 특수문자 이스케이프
    fixedHTML = fixedHTML.replace(/&(?![a-zA-Z]+;)/g, '&amp;');
    
    // 5. 닫히지 않은 기본 태그 자동 닫기 (마지막 시도)
    const commonTags = ['div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    commonTags.forEach(tag => {
      const openRegex = new RegExp(`<${tag}([^>]*?)>`, 'gi');
      const closeRegex = new RegExp(`</${tag}>`, 'gi');
      
      const openMatches = (fixedHTML.match(openRegex) || []).length;
      const closeMatches = (fixedHTML.match(closeRegex) || []).length;
      
      if (openMatches > closeMatches) {
        const diff = openMatches - closeMatches;
        for (let i = 0; i < diff; i++) {
          fixedHTML += `</${tag}>`;
          fixCount++;
        }
      }
    });
    
    if (fixCount > 0) {
      console.log(`🔧 ${fixCount}개의 기본 오류를 수정했습니다.`);
    } else {
      console.log('🔧 수정할 기본 오류가 없습니다.');
    }
    
    return fixedHTML;
  }
  
  // 히스토리 관리
  addToHistory(backup) {
    // 현재 위치 이후의 히스토리 제거 (redo 기록 삭제)
    if (this.historyIndex < this.history.length - 1) {
      this.history.splice(this.historyIndex + 1);
    }
    
    // 새 백업 추가
    this.history.push(backup);
    
    // 최대 개수 초과 시 오래된 것부터 삭제
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    this.historyIndex = this.history.length - 1;
    
    console.log(`📚 히스토리 추가됨 (${this.history.length}/${this.maxHistory})`);
  }
  
  // Undo 기능
  undo() {
    if (this.history.length === 0) {
      return { success: false, message: '되돌릴 변경사항이 없습니다.' };
    }
    
    // 현재 상태를 미래 히스토리로 보관 (redo용)
    const currentState = this.currentHTML;
    
    // 이전 상태로 복원
    this.currentHTML = this.history.pop();
    this.historyIndex = this.history.length - 1;
    
    console.log(`↶ Undo 실행 (남은 히스토리: ${this.history.length})`);
    
    return { 
      success: true, 
      html: this.currentHTML,
      message: '이전 상태로 되돌렸습니다.'
    };
  }
  
  // 현재 HTML 반환
  getCurrentHTML() {
    return this.currentHTML;
  }
  
  // HTML 강제 설정 (테스트용)
  setHTML(html) {
    if (this.isValidHTML(html)) {
      this.addToHistory(this.currentHTML);
      this.currentHTML = html;
      return { success: true };
    } else {
      return { success: false, error: '유효하지 않은 HTML입니다.' };
    }
  }
  
  // 미리보기 업데이트 (iframe용 blob URL 생성)
  generatePreviewURL() {
    try {
      const blob = new Blob([this.currentHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      console.log('🔗 미리보기 URL 생성됨');
      return url;
      
    } catch (error) {
      console.error('미리보기 URL 생성 실패:', error);
      return null;
    }
  }
  
  // 독립적인 HTML 파일 생성 (퍼블리시용)
  generateStandaloneHTML() {
    // 모든 외부 의존성을 인라인으로 포함한 완전한 HTML
    // 현재는 이미 self-contained 상태
    return this.currentHTML;
  }
  
  // 디버깅용 정보
  getDebugInfo() {
    return {
      htmlLength: this.currentHTML.length,
      historyCount: this.history.length,
      historyIndex: this.historyIndex,
      isValid: this.isValidHTML(this.currentHTML)
    };
  }
}

// 전역 인스턴스 생성
const htmlManager = new HTMLManager();

export default htmlManager;
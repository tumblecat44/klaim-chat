// AI 테스트 스크립트 - Gemini API 연결 확인

import geminiAPI from './gemini.js';
import { promotionSchema, exampleCases, systemPrompt, validatePromotionData } from './schema.js';

class AITester {
  constructor() {
    this.initEventListeners();
    this.testResults = [];
  }
  
  initEventListeners() {
    const testBtn = document.getElementById('test-ai-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.runTests());
    }
  }
  
  async runTests() {
    const testBtn = document.getElementById('test-ai-btn');
    
    try {
      // 버튼 상태 변경
      testBtn.disabled = true;
      testBtn.innerHTML = '🔄 Testing...';
      
      console.log('🚀 AI 테스트 시작...');
      this.showTestModal();
      
      // 1. Gemini API 초기화 테스트
      await this.testInitialization();
      
      // 2. 기본 연결 테스트
      await this.testBasicConnection();
      
      // 3. 간단한 텍스트 생성 테스트
      await this.testTextGeneration();
      
      // 4. Structured Output 테스트
      await this.testStructuredOutput();
      
      console.log('✅ 모든 AI 테스트 완료');
      this.showSuccessMessage();
      
    } catch (error) {
      console.error('❌ AI 테스트 실패:', error);
      this.showErrorMessage(error);
    } finally {
      // 버튼 복원
      testBtn.disabled = false;
      testBtn.innerHTML = '🤖 AI Test';
    }
  }
  
  async testInitialization() {
    this.updateTestProgress('API 초기화 중...');
    
    const success = await geminiAPI.init();
    if (!success) {
      throw new Error('Gemini API 초기화 실패');
    }
    
    this.addTestResult('✅ API 초기화 성공');
  }
  
  async testBasicConnection() {
    this.updateTestProgress('기본 연결 테스트 중...');
    
    const result = await geminiAPI.testConnection();
    if (!result.success) {
      throw new Error(result.error);
    }
    
    this.addTestResult('✅ 기본 연결 성공');
    this.addTestResult(`📝 응답: ${result.message.substring(0, 100)}...`);
  }
  
  async testTextGeneration() {
    this.updateTestProgress('텍스트 생성 테스트 중...');
    
    const testPrompt = '프로모션 페이지 빌더 AI 어시스턴트로서 간단한 자기소개를 해주세요.';
    const response = await geminiAPI.generateText(testPrompt);
    
    this.addTestResult('✅ 텍스트 생성 성공');
    this.addTestResult(`📝 생성된 텍스트: ${response.substring(0, 150)}...`);
  }
  
  async testStructuredOutput() {
    this.updateTestProgress('Structured Output 테스트 중...');
    
    // 예시 케이스로 테스트
    const testCase = exampleCases[0]; // "3개 플랜 만들어줘" 케이스
    this.addTestResult(`🧪 테스트 입력: "${testCase.input}"`);
    
    try {
      const contextPrompt = `${systemPrompt}\n\n사용자 요청: "${testCase.input}"`;
      const result = await geminiAPI.generateStructuredOutput(contextPrompt, promotionSchema);
      
      this.addTestResult('✅ Structured Output 성공');
      this.addTestResult(`📋 생성된 JSON:`);
      this.addTestResult(JSON.stringify(result, null, 2));
      
      // 데이터 검증
      const validationErrors = validatePromotionData(result);
      if (validationErrors.length > 0) {
        this.addTestResult(`⚠️ 검증 경고: ${validationErrors.join(', ')}`);
      } else {
        this.addTestResult('✅ 데이터 검증 통과');
      }
      
      // 예상 결과와 비교 (선택적)
      if (testCase.expectedOutput) {
        const hasExpectedPricing = result.pricing && result.pricing.length === 3;
        this.addTestResult(`🔍 예상 결과 비교: ${hasExpectedPricing ? '✅ 유사함' : '⚠️ 다름'}`);
      }
      
    } catch (error) {
      throw new Error(`Structured Output 테스트 실패: ${error.message}`);
    }
  }
  
  showTestModal() {
    // 기존 모달 제거
    const existingModal = document.getElementById('ai-test-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 테스트 모달 생성
    const modal = document.createElement('div');
    modal.id = 'ai-test-modal';
    modal.innerHTML = `
      <div class="modal-overlay" style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
      ">
        <div class="modal-content" style="
          background: white; padding: 20px; border-radius: 12px;
          max-width: 500px; width: 90%; max-height: 70vh; overflow-y: auto;
        ">
          <div class="modal-header" style="
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;
          ">
            <h2 style="margin: 0;">🤖 AI 연결 테스트</h2>
            <button class="close-btn" style="
              background: none; border: none; font-size: 24px; cursor: pointer;
            ">&times;</button>
          </div>
          <div id="test-progress" style="
            font-weight: bold; margin-bottom: 10px; color: #666;
          ">테스트 준비 중...</div>
          <div id="test-results" style="
            background: #f8f9fa; padding: 15px; border-radius: 8px;
            min-height: 200px; font-family: monospace; font-size: 12px;
            white-space: pre-wrap; line-height: 1.4;
          "></div>
          <div class="modal-actions" style="
            margin-top: 15px; text-align: right;
          ">
            <button class="btn-close" style="
              background: #6c757d; color: white; border: none;
              padding: 8px 16px; border-radius: 6px; cursor: pointer;
            ">닫기</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 닫기 이벤트
    const closeBtn = modal.querySelector('.close-btn');
    const closeBtnAction = modal.querySelector('.btn-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    [closeBtn, closeBtnAction].forEach(btn => {
      btn.addEventListener('click', () => this.closeTestModal());
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeTestModal();
      }
    });
    
    this.testResults = [];
  }
  
  closeTestModal() {
    const modal = document.getElementById('ai-test-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  updateTestProgress(message) {
    const progressEl = document.getElementById('test-progress');
    if (progressEl) {
      progressEl.textContent = message;
    }
  }
  
  addTestResult(message) {
    this.testResults.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    const resultsEl = document.getElementById('test-results');
    if (resultsEl) {
      resultsEl.textContent = this.testResults.join('\\n');
      resultsEl.scrollTop = resultsEl.scrollHeight;
    }
  }
  
  showSuccessMessage() {
    this.updateTestProgress('✅ 모든 테스트 완료!');
    this.addTestResult('\\n🎉 Gemini API가 정상적으로 작동합니다!');
    this.addTestResult('이제 AI 채팅 기능을 사용할 수 있습니다.');
    
    // 닫기 버튼을 성공 색상으로 변경
    const closeBtn = document.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.style.background = '#28a745';
      closeBtn.textContent = '계속 진행';
    }
  }
  
  showErrorMessage(error) {
    this.updateTestProgress('❌ 테스트 실패');
    this.addTestResult(`\\n🚨 오류 발생: ${error.message}`);
    this.addTestResult('\\n해결 방법:');
    this.addTestResult('1. 인터넷 연결 확인');
    this.addTestResult('2. API 키가 올바른지 확인');
    this.addTestResult('3. 페이지 새로고침 후 다시 시도');
    
    // 닫기 버튼을 에러 색상으로 변경
    const closeBtn = document.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.style.background = '#dc3545';
    }
  }
}

// AI 테스트 초기화
document.addEventListener('DOMContentLoaded', () => {
  new AITester();
});

console.log('🤖 AI 테스트 모듈이 로드되었습니다.');
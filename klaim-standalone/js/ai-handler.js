// AI 응답 처리 - HTML 직접 편집 방식
// 모든 사용자 요청을 HTML search/replace 연산으로 처리

import geminiAPI from './gemini.js';
import { htmlOperationsSchema, htmlEditPrompt, validateHTMLOperations } from './schema.js';
import htmlManager from './html-manager.js';

class AIHandler {
  constructor() {
    this.isProcessing = false;
  }
  
  // 사용자 메시지 처리 (메인 엔트리 포인트)
  async processUserMessage(userMessage) {
    if (this.isProcessing) {
      throw new Error('이미 다른 요청을 처리 중입니다. 잠시 후 다시 시도해주세요.');
    }
    
    this.isProcessing = true;
    
    try {
      console.log('🔄 AI 요청 처리 시작:', userMessage);
      
      // 1. 현재 HTML 컨텍스트 로드
      const currentHTML = htmlManager.getCurrentHTML();
      
      // 2. 컨텍스트가 포함된 프롬프트 생성
      const contextPrompt = this.buildContextPrompt(currentHTML, userMessage);
      
      // 3. Gemini API로 HTML 연산 생성
      const operations = await geminiAPI.generateStructuredOutput(contextPrompt, htmlOperationsSchema);
      
      // 4. 연산 검증
      const validationErrors = validateHTMLOperations(operations);
      if (validationErrors.length > 0) {
        console.warn('연산 검증 경고:', validationErrors);
        throw new Error('생성된 HTML 연산이 유효하지 않습니다: ' + validationErrors.join(', '));
      }
      
      // 5. HTML 연산 적용
      const result = htmlManager.applyOperations(operations.operations);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // 6. 미리보기 업데이트
      this.updatePreview();
      
      // 7. 성공 응답 생성
      return this.generateSuccessResponse(userMessage, operations.operations, result);
      
    } catch (error) {
      console.error('❌ AI 처리 오류:', error);
      return this.handleError(error, userMessage);
    } finally {
      this.isProcessing = false;
    }
  }
  
  // 컨텍스트 프롬프트 생성
  buildContextPrompt(currentHTML, userMessage) {
    return `${htmlEditPrompt}

현재 HTML 코드:
\`\`\`html
${currentHTML}
\`\`\`

사용자 요청: "${userMessage}"

위 HTML 코드를 분석하여 사용자 요청에 맞는 search/replace 연산을 생성해주세요.
정확한 HTML 문자열 매치가 중요하며, 공백과 줄바꿈을 정확히 맞춰주세요.`;
  }
  
  // 미리보기 업데이트 (iframe에 새로운 HTML 적용)
  updatePreview() {
    try {
      const previewFrame = document.getElementById('preview-frame');
      if (!previewFrame) {
        console.warn('미리보기 프레임을 찾을 수 없습니다.');
        return;
      }
      
      // Blob URL 생성 및 적용
      const previewURL = htmlManager.generatePreviewURL();
      if (previewURL) {
        // 이전 URL 정리 (메모리 누수 방지)
        if (previewFrame.src && previewFrame.src.startsWith('blob:')) {
          URL.revokeObjectURL(previewFrame.src);
        }
        
        previewFrame.src = previewURL;
        console.log('✅ 미리보기 업데이트 완료');
      }
      
    } catch (error) {
      console.error('미리보기 업데이트 실패:', error);
    }
  }
  
  // 성공 응답 생성
  generateSuccessResponse(userMessage, operations, result) {
    const operationCount = operations.length;
    const operationSummary = operations.map(op => 
      op.description || `"${op.search.substring(0, 30)}..." 교체`
    ).join(', ');
    
    return {
      message: `✅ 완료! ${operationCount}개 변경사항을 적용했습니다:\n\n${operationSummary}\n\n미리보기에서 결과를 확인해보세요!`,
      updated: true,
      type: 'success',
      operationCount,
      operations: operations.map(op => op.description).filter(Boolean)
    };
  }
  
  // 에러 처리 및 사용자 친화적 메시지 생성
  handleError(error, userMessage) {
    console.error('AI Handler 오류:', error);
    
    if (error.message.includes('API_KEY') || error.message.includes('401')) {
      return {
        message: '🔑 API 키 설정에 문제가 있습니다. 새로고침 후 다시 시도해주세요.',
        type: 'error'
      };
    }
    
    if (error.message.includes('RATE_LIMIT') || error.message.includes('429')) {
      return {
        message: '⏱️ 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        type: 'error'
      };
    }
    
    if (error.message.includes('JSON')) {
      return {
        message: '🤖 AI 응답을 해석하는 중 오류가 발생했습니다. 좀 더 구체적으로 말씀해 주시겠어요?',
        type: 'error'
      };
    }
    
    if (error.message.includes('Search string not found')) {
      return {
        message: '🔍 요청하신 부분을 HTML에서 찾을 수 없습니다. 다른 방식으로 설명해 주시겠어요?',
        type: 'error'
      };
    }
    
    if (error.message.includes('Invalid HTML')) {
      return {
        message: '⚠️ 변경사항이 유효하지 않은 HTML을 생성할 수 있어 취소되었습니다. 다시 시도해주세요.',
        type: 'error'
      };
    }
    
    return {
      message: `❌ 처리 중 오류가 발생했습니다: ${error.message}\\n\\n다른 방식으로 말씀해 주시거나, 새로고침 후 다시 시도해주세요.`,
      type: 'error'
    };
  }
  
  // Undo 기능
  async undo() {
    try {
      const result = htmlManager.undo();
      if (result.success) {
        this.updatePreview();
        return {
          message: '↶ 이전 상태로 되돌렸습니다.',
          type: 'success',
          updated: true
        };
      } else {
        return {
          message: result.message,
          type: 'normal'
        };
      }
    } catch (error) {
      console.error('Undo 실패:', error);
      return {
        message: 'Undo 중 오류가 발생했습니다.',
        type: 'error'
      };
    }
  }
  
  // 현재 HTML 다운로드 (퍼블리시 기능)
  publishHTML() {
    try {
      const html = htmlManager.generateStandaloneHTML();
      
      // 다운로드 트리거
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'promotion-page.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      return {
        message: '📁 HTML 파일이 다운로드되었습니다!',
        type: 'success'
      };
      
    } catch (error) {
      console.error('HTML 퍼블리시 실패:', error);
      return {
        message: 'HTML 파일 생성에 실패했습니다.',
        type: 'error'
      };
    }
  }
  
  // 디버깅 정보 제공
  getDebugInfo() {
    const htmlInfo = htmlManager.getDebugInfo();
    
    return {
      ...htmlInfo,
      isProcessing: this.isProcessing,
      geminiConnected: geminiAPI.isInitialized
    };
  }
  
  // 빠른 액션 처리
  async processQuickAction(action) {
    console.log('🚀 빠른 액션 처리:', action);
    return this.processUserMessage(action);
  }
  
  // HTML 매니저 인스턴스 제공 (디버깅용)
  getHTMLManager() {
    return htmlManager;
  }
}

// 전역 인스턴스 생성
const aiHandler = new AIHandler();

export default aiHandler;
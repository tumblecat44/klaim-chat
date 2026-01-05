// AI 응답 처리 - HTML 직접 편집 방식
// 모든 사용자 요청을 HTML search/replace 연산으로 처리

import geminiAPI from './gemini.js';
import { htmlOperationsSchema, htmlEditPrompt, validateHTMLOperations, htmlFixSchema, htmlFixPrompt } from './schema.js';
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
      const aiResponse = await geminiAPI.generateStructuredOutput(contextPrompt, htmlOperationsSchema);
      
      // 4. 정보 부족으로 질문이 필요한 경우 처리
      if (aiResponse.response && aiResponse.response.clarification && aiResponse.operations.length === 0) {
        return {
          message: `${aiResponse.response.summary}\n\n${aiResponse.response.clarification}`,
          type: 'clarification',
          needsMoreInfo: true
        };
      }
      
      // 5. 연산 검증
      const validationErrors = validateHTMLOperations(aiResponse);
      if (validationErrors.length > 0) {
        console.warn('연산 검증 경고:', validationErrors);
        throw new Error('생성된 HTML 연산이 유효하지 않습니다: ' + validationErrors.join(', '));
      }
      
      // 6. HTML 연산 적용
      const result = htmlManager.applyOperations(aiResponse.operations);
      
      if (!result.success) {
        // HTML 연산 실패 시 AI 기반 자동 수정 시도
        if (result.error.includes('HTML') || result.error.includes('파싱')) {
          console.log('🤖 AI 기반 HTML 수정 시도...');
          const fixResult = await this.fixHTMLWithAI(userMessage, result.error);
          
          if (fixResult.success) {
            console.log('✅ AI 기반 수정 성공');
            this.updatePreview();
            return fixResult;
          }
        }
        
        throw new Error(result.error);
      }
      
      // 7. 미리보기 업데이트
      this.updatePreview();
      
      // 8. AI의 응답을 사용하여 친절한 메시지 반환
      return this.generateEnhancedResponse(aiResponse.response, aiResponse.operations, result);
      
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

위 HTML 코드를 분석하여 사용자 요청을 처리하세요.
정확한 HTML 문자열 매치가 중요하며, 공백과 줄바꿈을 정확히 맞춰주세요.
response 필드를 반드시 포함하여 사용자에게 친절한 응답을 제공하세요.`;
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
  
  // 개선된 응답 생성 (대화형)
  generateEnhancedResponse(aiResponse, operations, result) {
    // AI가 제공한 response 사용
    let message = aiResponse.summary || `변경사항을 적용했습니다.`;
    
    // 세부 사항이 있으면 추가
    if (aiResponse.details && aiResponse.details.length > 0) {
      message += `\n\n적용된 변경:\n`;
      message += aiResponse.details.map(detail => `• ${detail}`).join('\n');
    }
    
    // 제안사항이 있으면 추가
    if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
      message += `\n\n💡 추가 제안:\n`;
      message += aiResponse.suggestions.map(suggestion => `• ${suggestion}`).join('\n');
    }
    
    return {
      message,
      updated: true,
      type: 'success',
      operationCount: operations.length,
      hasDetails: !!(aiResponse.details && aiResponse.details.length > 0),
      hasSuggestions: !!(aiResponse.suggestions && aiResponse.suggestions.length > 0)
    };
  }
  
  // 기존 메서드 (호환성을 위해 유지)
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
    
    if (error.message.includes('Invalid HTML') || error.message.includes('HTML')) {
      return {
        message: '⚠️ HTML 파싱 오류가 발생했지만 자동 수정을 시도했습니다. 문제가 지속되면 다른 방식으로 요청해주세요.',
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
  
  // AI 기반 HTML 수정 (최후 수단)
  async fixHTMLWithAI(originalUserMessage, errorMessage) {
    try {
      console.log('🤖 AI HTML 수정 요청 시작...');
      
      const currentHTML = htmlManager.getCurrentHTML();
      
      // HTML 수정용 프롬프트 생성
      const fixPrompt = `${htmlFixPrompt}

현재 오류가 있는 HTML:
\`\`\`html
${currentHTML}
\`\`\`

발생한 오류: ${errorMessage}
원본 사용자 요청: "${originalUserMessage}"

위 HTML의 문법 오류를 수정하여 유효한 HTML을 생성해주세요.
사용자의 원본 요청 의도는 유지하되, HTML 파싱 오류만 해결해주세요.`;

      // AI에 HTML 수정 요청
      const aiFixResponse = await geminiAPI.generateStructuredOutput(fixPrompt, htmlFixSchema);
      
      if (!aiFixResponse.success || !aiFixResponse.fixedHTML) {
        console.error('❌ AI HTML 수정 실패');
        return {
          success: false,
          message: 'AI가 HTML을 수정할 수 없습니다.',
          type: 'error'
        };
      }
      
      // 수정된 HTML 유효성 검사
      const isValid = htmlManager.isValidHTML(aiFixResponse.fixedHTML);
      if (!isValid) {
        console.error('❌ AI가 수정한 HTML도 유효하지 않음');
        return {
          success: false,
          message: 'HTML 자동 수정에 실패했습니다.',
          type: 'error'
        };
      }
      
      // 성공적으로 수정된 경우 적용
      const setResult = htmlManager.setHTML(aiFixResponse.fixedHTML);
      if (setResult.success) {
        console.log('✅ AI HTML 수정 완료');
        return {
          success: true,
          message: `HTML 오류를 자동으로 수정했습니다: ${aiFixResponse.fixDescription}`,
          updated: true,
          type: 'success',
          autoFixed: true
        };
      } else {
        return {
          success: false,
          message: 'HTML 적용 중 오류가 발생했습니다.',
          type: 'error'
        };
      }
      
    } catch (error) {
      console.error('AI HTML 수정 중 오류:', error);
      return {
        success: false,
        message: `HTML 자동 수정 실패: ${error.message}`,
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
// Gemini API 연결 및 기본 함수들

import Config from './config.js';

class GeminiAPI {
  constructor() {
    this.ai = null;
    this.isInitialized = false;
  }
  
  // Gemini API 초기화
  async init() {
    try {
      // Config 초기화
      const configSuccess = Config.init();
      if (!configSuccess) {
        throw new Error('API 키 설정에 실패했습니다.');
      }
      
      // 동적으로 Google GenAI 라이브러리 로드
      await this.loadGeminiSDK();
      
      // GoogleGenAI 인스턴스 생성
      this.ai = new window.GoogleGenAI({
        apiKey: Config.getApiKey()
      });
      
      this.isInitialized = true;
      console.log('✅ Gemini API 초기화 완료');
      
      return true;
    } catch (error) {
      console.error('❌ Gemini API 초기화 실패:', error);
      return false;
    }
  }
  
  // Google GenAI SDK 동적 로드 (CDN 사용)
  async loadGeminiSDK() {
    return new Promise((resolve, reject) => {
      // 이미 로드되어 있으면 스킵
      if (window.GoogleGenAI) {
        resolve();
        return;
      }
      
      console.log('🔄 Gemini SDK 로딩 시작...');
      
      // 동적 import 사용
      import('https://esm.run/@google/genai')
        .then(({ GoogleGenAI }) => {
          window.GoogleGenAI = GoogleGenAI;
          console.log('✅ Gemini SDK 로드 완료');
          resolve();
        })
        .catch(error => {
          console.error('❌ Gemini SDK 로드 실패:', error);
          reject(new Error('Gemini SDK 로드 실패: ' + error.message));
        });
    });
  }
  
  // 기본 연결 테스트
  async testConnection() {
    if (!this.isInitialized) {
      throw new Error('Gemini API가 초기화되지 않았습니다. init()을 먼저 호출하세요.');
    }
    
    try {
      console.log('🔄 Gemini 연결 테스트 중...');
      
      const requestData = {
        model: Config.getModelConfig().model,
        contents: "안녕하세요! 연결 테스트입니다. 간단한 인사말로 답해주세요."
      };
      
      console.log('📤 [Gemini API 요청]', {
        timestamp: new Date().toISOString(),
        model: requestData.model,
        contents: requestData.contents,
        type: 'testConnection'
      });
      
      const response = await this.ai.models.generateContent(requestData);
      
      const result = response.text || response.response?.text() || '응답 없음';
      
      console.log('📥 [Gemini API 응답]', {
        timestamp: new Date().toISOString(),
        response: result,
        type: 'testConnection',
        success: true
      });
      
      console.log('✅ Gemini 연결 성공:', result);
      
      return {
        success: true,
        message: result
      };
    } catch (error) {
      console.log('📥 [Gemini API 응답 - 오류]', {
        timestamp: new Date().toISOString(),
        error: error.message,
        type: 'testConnection',
        success: false
      });
      
      console.error('❌ Gemini 연결 실패:', error);
      
      return {
        success: false,
        error: this.parseError(error)
      };
    }
  }
  
  // 에러 메시지 파싱
  parseError(error) {
    if (error.message.includes('API_KEY') || error.message.includes('401')) {
      return 'API 키가 유효하지 않습니다. 설정을 확인해 주세요.';
    }
    
    if (error.message.includes('RATE_LIMIT') || error.message.includes('429')) {
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    }
    
    if (error.message.includes('fetch')) {
      return '네트워크 연결을 확인해 주세요.';
    }
    
    return `연결 오류: ${error.message}`;
  }
  
  // 간단한 텍스트 생성 (테스트용)
  async generateText(prompt) {
    if (!this.isInitialized) {
      throw new Error('Gemini API가 초기화되지 않았습니다.');
    }
    
    try {
      const requestData = {
        model: Config.getModelConfig().model,
        contents: prompt
      };
      
      console.log('📤 [Gemini API 요청]', {
        timestamp: new Date().toISOString(),
        model: requestData.model,
        contents: prompt,
        type: 'generateText'
      });
      
      const response = await this.ai.models.generateContent(requestData);
      const result = response.text || response.response?.text() || '응답 없음';
      
      console.log('📥 [Gemini API 응답]', {
        timestamp: new Date().toISOString(),
        response: result,
        type: 'generateText',
        success: true
      });
      
      return result;
    } catch (error) {
      console.log('📥 [Gemini API 응답 - 오류]', {
        timestamp: new Date().toISOString(),
        error: error.message,
        type: 'generateText',
        success: false
      });
      
      throw new Error(this.parseError(error));
    }
  }
  
  // Structured Output 생성 (프로모션 설정용)
  async generateStructuredOutput(prompt, schema) {
    if (!this.isInitialized) {
      throw new Error('Gemini API가 초기화되지 않았습니다.');
    }
    
    try {
      const requestData = {
        model: Config.getModelConfig().model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: {
            thinkingLevel: Config.getModelConfig().thinkingLevel
          }
        }
      };
      
      console.log('📤 [Gemini API 요청]', {
        timestamp: new Date().toISOString(),
        model: requestData.model,
        contents: prompt,
        config: requestData.config,
        type: 'generateStructuredOutput'
      });
      
      const response = await this.ai.models.generateContent(requestData);
      
      const jsonText = response.text || response.response?.text() || '{}';
      const parsedResult = JSON.parse(jsonText);
      
      console.log('📥 [Gemini API 응답]', {
        timestamp: new Date().toISOString(),
        response: parsedResult,
        rawResponse: jsonText,
        type: 'generateStructuredOutput',
        success: true
      });
      
      return parsedResult;
    } catch (error) {
      console.log('📥 [Gemini API 응답 - 오류]', {
        timestamp: new Date().toISOString(),
        error: error.message,
        type: 'generateStructuredOutput',
        success: false
      });
      
      console.error('Structured Output 생성 실패:', error);
      throw new Error(this.parseError(error));
    }
  }
}

// 전역 인스턴스 생성
const geminiAPI = new GeminiAPI();

export default geminiAPI;
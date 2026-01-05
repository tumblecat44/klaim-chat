// AI 채팅 UI 관리 클래스

import geminiAPI from './gemini.js';
import aiHandler from './ai-handler.js';
import { htmlOperationsSchema, htmlEditPrompt } from './schema.js';

class AIChatUI {
  constructor() {
    this.isVisible = false;
    this.isInitialized = false;
    this.messages = [];
    this.isProcessing = false;
    
    this.initializeUI();
    this.setupEventListeners();
  }
  
  initializeUI() {
    // DOM 요소들 캐시
    this.elements = {
      toggle: document.getElementById('ai-chat-toggle'),
      panel: document.getElementById('ai-chat-panel'),
      close: document.getElementById('ai-chat-close'),
      messages: document.getElementById('ai-chat-messages'),
      input: document.getElementById('ai-input-field'),
      sendBtn: document.getElementById('ai-send-button'),
      quickActions: document.getElementById('ai-quick-actions')
    };
    
    // 웰컴 메시지 추가
    this.addWelcomeMessage();
  }
  
  setupEventListeners() {
    // 토글 버튼
    this.elements.toggle?.addEventListener('click', () => this.toggleChat());
    
    // 닫기 버튼
    this.elements.close?.addEventListener('click', () => this.hideChat());
    
    // 전송 버튼
    this.elements.sendBtn?.addEventListener('click', () => this.sendMessage());
    
    // 엔터키로 전송 (Shift+Enter는 줄바꿈)
    this.elements.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // 빠른 액션 버튼들
    this.elements.quickActions?.addEventListener('click', (e) => {
      if (e.target.classList.contains('ai-quick-button')) {
        const action = e.target.dataset.action;
        if (action) {
          this.sendMessage(action);
        }
      }
    });
    
    // 패널 외부 클릭으로 닫기
    document.addEventListener('click', (e) => {
      if (this.isVisible && 
          !this.elements.panel?.contains(e.target) && 
          !this.elements.toggle?.contains(e.target)) {
        this.hideChat();
      }
    });
    
    // 입력 필드 자동 크기 조절
    this.elements.input?.addEventListener('input', () => {
      this.autoResizeInput();
    });
  }
  
  addWelcomeMessage() {
    const welcomeMessage = `안녕하세요! 저는 프로모션 페이지 빌더 AI 어시스턴트입니다. 🎉

다음과 같은 도움을 드릴 수 있어요:
• 가격 플랜 생성/수정
• 색상 테마 변경  
• 프로모션 정보 설정
• 만료일 설정

아래 버튼을 클릭하거나 자연어로 말씀해주세요!`;

    this.addMessage('bot', welcomeMessage);
  }
  
  toggleChat() {
    if (this.isVisible) {
      this.hideChat();
    } else {
      this.showChat();
    }
  }
  
  async showChat() {
    // Gemini API 초기화 (필요한 경우)
    if (!this.isInitialized) {
      try {
        this.elements.toggle.disabled = true;
        this.elements.toggle.innerHTML = '🔄 Loading...';
        
        const success = await geminiAPI.init();
        if (!success) {
          this.addMessage('bot', '❌ AI 초기화에 실패했습니다. 새로고침 후 다시 시도해주세요.', 'error');
          return;
        }
        
        this.isInitialized = true;
        this.addMessage('bot', '✅ AI가 준비되었습니다! 어떻게 도와드릴까요?', 'success');
      } catch (error) {
        console.error('AI 초기화 실패:', error);
        this.addMessage('bot', `❌ 초기화 오류: ${error.message}`, 'error');
        return;
      } finally {
        this.elements.toggle.disabled = false;
        this.elements.toggle.innerHTML = '💬 AI Assistant';
      }
    }
    
    this.isVisible = true;
    this.elements.panel?.classList.remove('hidden');
    this.elements.panel?.classList.add('visible');
    
    // 입력창에 포커스
    setTimeout(() => {
      this.elements.input?.focus();
    }, 300);
    
    // 메시지 스크롤을 맨 아래로
    this.scrollToBottom();
  }
  
  hideChat() {
    this.isVisible = false;
    this.elements.panel?.classList.remove('visible');
    this.elements.panel?.classList.add('hidden');
  }
  
  async sendMessage(predefinedMessage = null) {
    const message = predefinedMessage || this.elements.input?.value.trim();
    
    if (!message || this.isProcessing) return;
    
    // 사용자 메시지 추가
    this.addMessage('user', message);
    
    // 입력창 클리어
    if (!predefinedMessage) {
      this.elements.input.value = '';
      this.autoResizeInput();
    }
    
    // 처리 중 상태
    this.setProcessing(true);
    this.showTypingIndicator();
    
    try {
      // AI 응답 생성
      const response = await this.processAIRequest(message);
      
      // 타이핑 인디케이터 제거
      this.hideTypingIndicator();
      
      // AI 응답 추가
      this.addMessage('bot', response.message, response.type || 'normal');
      
      // 성공적인 업데이트가 있으면 알림
      if (response.updated) {
        this.addMessage('bot', '✨ 프로모션 설정이 업데이트되었습니다!', 'success');
      }
      
    } catch (error) {
      console.error('AI 처리 오류:', error);
      this.hideTypingIndicator();
      this.addMessage('bot', `죄송합니다. 오류가 발생했습니다: ${error.message}`, 'error');
    } finally {
      this.setProcessing(false);
    }
  }
  
  async processAIRequest(message) {
    try {
      // AIHandler를 사용하여 요청 처리
      const response = await aiHandler.processUserMessage(message);
      return response;
      
    } catch (error) {
      // 에러 처리
      console.error('AI 요청 처리 실패:', error);
      
      // AIHandler의 에러 처리 메서드 사용
      const errorResponse = aiHandler.handleError(error, message);
      return errorResponse;
    }
  }
  
  
  addMessage(sender, content, type = 'normal') {
    const messageId = Date.now();
    const message = {
      id: messageId,
      sender,
      content,
      type,
      timestamp: new Date()
    };
    
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }
  
  renderMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${message.sender} ${message.type}`;
    messageEl.dataset.id = message.id;
    
    const contentEl = document.createElement('div');
    contentEl.className = 'ai-message-content';
    
    // 새로운 대화형 메시지 처리 (제안, 세부사항 등)
    if (message.sender === 'bot' && this.isStructuredResponse(message.content)) {
      contentEl.innerHTML = this.renderStructuredMessage(message.content);
    } else if (message.content.includes('{') && message.content.includes('}')) {
      // 기존 JSON 코드 블록 처리 (디버깅용)
      try {
        const jsonMatch = message.content.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
          const beforeJson = message.content.substring(0, message.content.indexOf(jsonMatch[0]));
          const afterJson = message.content.substring(message.content.indexOf(jsonMatch[0]) + jsonMatch[0].length);
          
          contentEl.innerHTML = `
            ${beforeJson ? `<div>${beforeJson}</div>` : ''}
            <div class="ai-json-code">${jsonMatch[0]}</div>
            ${afterJson ? `<div>${afterJson}</div>` : ''}
          `;
        } else {
          contentEl.textContent = message.content;
        }
      } catch (e) {
        contentEl.textContent = message.content;
      }
    } else {
      // 일반 텍스트는 줄바꿈 처리
      contentEl.innerHTML = message.content.replace(/\\n/g, '<br>');
    }
    
    const timeEl = document.createElement('div');
    timeEl.className = 'ai-message-time';
    timeEl.textContent = message.timestamp.toLocaleTimeString();
    
    messageEl.appendChild(contentEl);
    messageEl.appendChild(timeEl);
    
    this.elements.messages?.appendChild(messageEl);
  }
  
  // 구조화된 메시지인지 판단
  isStructuredResponse(content) {
    return content.includes('💡') || content.includes('•') || content.includes('적용된 변경:');
  }
  
  // 구조화된 메시지 렌더링
  renderStructuredMessage(content) {
    let html = '';
    const lines = content.split('\n');
    let currentSection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) {
        html += '<br>';
        continue;
      }
      
      // 제안 섹션 시작
      if (trimmed.includes('💡')) {
        currentSection = 'suggestions';
        html += `<div class="ai-suggestions-header">${trimmed}</div>`;
        continue;
      }
      
      // 세부사항 섹션 시작
      if (trimmed.includes('적용된 변경:')) {
        currentSection = 'details';
        html += `<div class="ai-details-header">${trimmed}</div>`;
        continue;
      }
      
      // 목록 항목 처리
      if (trimmed.startsWith('•')) {
        const itemText = trimmed.substring(2).trim();
        const itemClass = currentSection === 'suggestions' ? 'ai-suggestion-item' : 'ai-detail-item';
        html += `<div class="${itemClass}">• ${itemText}</div>`;
        continue;
      }
      
      // 일반 텍스트
      html += `<div class="ai-text-line">${trimmed}</div>`;
    }
    
    return html;
  }
  
  showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-typing';
    typingEl.id = 'ai-typing-indicator';
    
    typingEl.innerHTML = `
      <div class="ai-typing-dots">
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
        <div class="ai-typing-dot"></div>
      </div>
      <span>페이지를 편집 중...</span>
    `;
    
    this.elements.messages?.appendChild(typingEl);
    this.scrollToBottom();
  }
  
  hideTypingIndicator() {
    const typingEl = document.getElementById('ai-typing-indicator');
    typingEl?.remove();
  }
  
  setProcessing(processing) {
    this.isProcessing = processing;
    
    if (this.elements.sendBtn) {
      this.elements.sendBtn.disabled = processing;
    }
    
    if (this.elements.input) {
      this.elements.input.disabled = processing;
    }
  }
  
  autoResizeInput() {
    if (!this.elements.input) return;
    
    this.elements.input.style.height = 'auto';
    const scrollHeight = this.elements.input.scrollHeight;
    this.elements.input.style.height = Math.min(scrollHeight, 100) + 'px';
  }
  
  scrollToBottom() {
    if (this.elements.messages) {
      setTimeout(() => {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      }, 100);
    }
  }
  
  // 외부에서 호출 가능한 메서드
  sendPredefinedMessage(message) {
    if (this.isVisible) {
      this.sendMessage(message);
    } else {
      this.showChat().then(() => {
        setTimeout(() => this.sendMessage(message), 500);
      });
    }
  }
}

// 전역 인스턴스 생성
const aiChatUI = new AIChatUI();

// 전역에 노출 (app.js에서 사용)
window.aiHandler = aiHandler;
window.aiChatUI = aiChatUI;

export default aiChatUI;
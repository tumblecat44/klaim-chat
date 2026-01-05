// ActionManager - 복잡한 DOM 조작 전담 클래스
// HTML Search/Replace로 불가능한 구조적 변경을 처리

class ActionManager {
  constructor(htmlManager) {
    this.htmlManager = htmlManager;
    this.pricingActionManager = new PricingActionManager();
    this.expirationActionManager = new ExpirationActionManager();
    this.bulletPointManager = new BulletPointManager();
  }
  
  // 액션 배열 순차 실행
  async executeActions(actions) {
    if (!actions || actions.length === 0) {
      return { success: true, results: [] };
    }
    
    const results = [];
    const errors = [];
    
    console.log(`🚀 ActionManager: ${actions.length}개 액션 실행 시작`);
    
    for (const [index, action] of actions.entries()) {
      try {
        console.log(`  액션 ${index + 1}/${actions.length}: ${action.type}`);
        
        const result = await this.executeAction(action);
        
        if (result.success) {
          results.push({
            action: action.type,
            description: action.description || result.description,
            success: true
          });
        } else {
          errors.push({
            action: action.type,
            error: result.error,
            index: index + 1
          });
          console.error(`❌ 액션 ${index + 1} 실패:`, result.error);
        }
        
      } catch (error) {
        errors.push({
          action: action.type,
          error: error.message,
          index: index + 1
        });
        console.error(`❌ 액션 ${index + 1} 예외:`, error);
      }
    }
    
    // 결과 정리
    if (errors.length === 0) {
      console.log(`✅ 모든 액션 실행 완료 (${results.length}개)`);
      return {
        success: true,
        results,
        executedCount: results.length
      };
    } else if (results.length > 0) {
      console.log(`⚠️ 부분 성공: ${results.length}개 성공, ${errors.length}개 실패`);
      return {
        success: false,
        results,
        errors,
        partialSuccess: true,
        executedCount: results.length
      };
    } else {
      console.log(`❌ 모든 액션 실패`);
      return {
        success: false,
        errors,
        executedCount: 0
      };
    }
  }
  
  // 개별 액션 실행
  async executeAction(action) {
    const { type, data } = action;
    
    try {
      switch (type) {
        // 가격 관련 액션들
        case 'ADD_PLAN':
          return await this.pricingActionManager.addPlan(data);
          
        case 'DELETE_PLAN':
          return await this.pricingActionManager.deletePlan(data);
          
        case 'UPDATE_PLAN':
          return await this.pricingActionManager.updatePlan(data);
          
        case 'REORDER_PLANS':
          return await this.pricingActionManager.reorderPlans(data);
          
        case 'BULK_UPDATE_PRICING':
          return await this.pricingActionManager.bulkUpdatePricing(data);
        
        // 만료일 관련 액션들  
        case 'SET_EXPIRATION':
          return await this.expirationActionManager.setExpiration(data);
          
        case 'CLEAR_EXPIRATION':
          return await this.expirationActionManager.clearExpiration(data);
        
        // Bullet Point 관련 액션들
        case 'ADD_BULLET_POINT':
          return await this.bulletPointManager.addBulletPoint(data);
          
        case 'REMOVE_BULLET_POINT':
          return await this.bulletPointManager.removeBulletPoint(data);
          
        case 'SET_HIGHLIGHT':
          return await this.bulletPointManager.setHighlight(data);
        
        default:
          return {
            success: false,
            error: `지원하지 않는 액션 타입: ${type}`
          };
      }
      
    } catch (error) {
      return {
        success: false,
        error: `액션 실행 오류: ${error.message}`
      };
    }
  }
  
  // 현재 HTML에서 특정 요소 찾기 (유틸리티)
  findElementInHTML(selector) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.htmlManager.getCurrentHTML(), 'text/html');
      return doc.querySelector(selector);
    } catch (error) {
      console.error('HTML 파싱 오류:', error);
      return null;
    }
  }
  
  // DOM 요소들 찾기 (복수)
  findElementsInHTML(selector) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.htmlManager.getCurrentHTML(), 'text/html');
      return Array.from(doc.querySelectorAll(selector));
    } catch (error) {
      console.error('HTML 파싱 오류:', error);
      return [];
    }
  }
  
  // HTML 업데이트 (하위 매니저들이 사용)
  updateHTML(newHTML) {
    return this.htmlManager.setHTML(newHTML);
  }
  
  // 현재 HTML 가져오기
  getCurrentHTML() {
    return this.htmlManager.getCurrentHTML();
  }
}

// PricingActionManager - 가격 플랜 관련 액션 처리
class PricingActionManager {
  
  // 새 플랜 추가
  async addPlan(data) {
    try {
      // AI에서 전달된 planData 사용
      const planData = data.planData || {};
      const { 
        title = 'New Plan', 
        price = '$0', 
        features = ['Basic feature'], 
        isRecommended = false 
      } = planData;
      
      console.log('📊 플랜 추가:', { title, price, features, isRecommended });
      
      // 현재 HTML에서 pricing-cards 컨테이너 찾기
      const parser = new DOMParser();
      const currentHTML = window.htmlManager?.getCurrentHTML() || '';
      const doc = parser.parseFromString(currentHTML, 'text/html');
      
      const container = doc.getElementById('pricing-cards');
      if (!container) {
        return { success: false, error: 'pricing-cards 컨테이너를 찾을 수 없습니다.' };
      }
      
      // 새 플랜 카드 HTML 생성
      const planId = `plan-${Date.now()}`;
      const recommendedClass = isRecommended ? ' recommended' : '';
      const featuresHTML = features.map(feature => `<li>${feature}</li>`).join('');
      
      const newPlanHTML = `
        <div class="pricing-card${recommendedClass}" data-plan="${planId}">
          <h3 class="plan-name" contenteditable="true">${title}</h3>
          <div class="plan-price" contenteditable="true">${price}</div>
          <ul class="plan-features">
            ${featuresHTML}
          </ul>
        </div>`.trim();
      
      // 컨테이너에 추가
      container.insertAdjacentHTML('beforeend', newPlanHTML);
      
      // 수정된 HTML을 문자열로 변환
      const updatedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      
      // HTMLManager를 통해 업데이트
      if (window.htmlManager) {
        const result = window.htmlManager.setHTML(updatedHTML);
        if (result.success) {
          return {
            success: true,
            description: `${title} 플랜이 추가되었습니다 (${price})`
          };
        } else {
          return { success: false, error: result.error };
        }
      }
      
      return { success: false, error: 'HTMLManager를 찾을 수 없습니다.' };
      
    } catch (error) {
      return {
        success: false,
        error: `플랜 추가 실패: ${error.message}`
      };
    }
  }
  
  // 플랜 삭제
  async deletePlan(data) {
    try {
      const { index } = data;
      
      if (typeof index !== 'number' || index < 0) {
        return { success: false, error: '유효한 플랜 인덱스가 필요합니다.' };
      }
      
      console.log('🗑️ 플랜 삭제:', { index });
      
      const parser = new DOMParser();
      const currentHTML = window.htmlManager?.getCurrentHTML() || '';
      const doc = parser.parseFromString(currentHTML, 'text/html');
      
      const cards = doc.querySelectorAll('.pricing-card');
      
      if (index >= cards.length) {
        return { success: false, error: `인덱스 ${index}에 해당하는 플랜이 없습니다. (총 ${cards.length}개)` };
      }
      
      const targetCard = cards[index];
      const planName = targetCard.querySelector('.plan-name')?.textContent || '플랜';
      
      // 플랜 삭제
      targetCard.remove();
      
      // 수정된 HTML 업데이트
      const updatedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      
      if (window.htmlManager) {
        const result = window.htmlManager.setHTML(updatedHTML);
        if (result.success) {
          return {
            success: true,
            description: `${planName} 플랜이 삭제되었습니다`
          };
        } else {
          return { success: false, error: result.error };
        }
      }
      
      return { success: false, error: 'HTMLManager를 찾을 수 없습니다.' };
      
    } catch (error) {
      return {
        success: false,
        error: `플랜 삭제 실패: ${error.message}`
      };
    }
  }
  
  // 플랜 정보 업데이트
  async updatePlan(data) {
    try {
      const { index, name, price, type, description } = data;
      
      if (typeof index !== 'number' || index < 0) {
        return { success: false, error: '유효한 플랜 인덱스가 필요합니다.' };
      }
      
      console.log('✏️ 플랜 업데이트:', data);
      
      const parser = new DOMParser();
      const currentHTML = window.htmlManager?.getCurrentHTML() || '';
      const doc = parser.parseFromString(currentHTML, 'text/html');
      
      const cards = doc.querySelectorAll('.pricing-card');
      
      if (index >= cards.length) {
        return { success: false, error: `인덱스 ${index}에 해당하는 플랜이 없습니다.` };
      }
      
      const targetCard = cards[index];
      
      // 각 필드 업데이트
      if (name !== undefined) {
        const nameElement = targetCard.querySelector('.plan-name');
        if (nameElement) nameElement.textContent = name;
      }
      
      if (price !== undefined || type !== undefined) {
        const priceElement = targetCard.querySelector('.plan-price');
        if (priceElement) {
          const finalType = type || 'paid';
          const priceDisplay = finalType === 'free' ? 'FREE' : `$${price || 0}`;
          priceElement.textContent = priceDisplay;
        }
      }
      
      if (description !== undefined) {
        const descElement = targetCard.querySelector('.plan-description');
        if (descElement) descElement.textContent = description;
      }
      
      // 수정된 HTML 업데이트
      const updatedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      
      if (window.htmlManager) {
        const result = window.htmlManager.setHTML(updatedHTML);
        if (result.success) {
          return {
            success: true,
            description: `플랜 #${index + 1}이 업데이트되었습니다`
          };
        } else {
          return { success: false, error: result.error };
        }
      }
      
      return { success: false, error: 'HTMLManager를 찾을 수 없습니다.' };
      
    } catch (error) {
      return {
        success: false,
        error: `플랜 업데이트 실패: ${error.message}`
      };
    }
  }
  
  // 플랜 순서 변경
  async reorderPlans(data) {
    try {
      const { order } = data; // [0, 2, 1] 같은 새로운 순서 배열
      
      if (!Array.isArray(order)) {
        return { success: false, error: '순서 배열이 필요합니다.' };
      }
      
      console.log('🔀 플랜 순서 변경:', order);
      
      const parser = new DOMParser();
      const currentHTML = window.htmlManager?.getCurrentHTML() || '';
      const doc = parser.parseFromString(currentHTML, 'text/html');
      
      const container = doc.getElementById('pricing-cards');
      const cards = Array.from(doc.querySelectorAll('.pricing-card'));
      
      if (!container || cards.length === 0) {
        return { success: false, error: '플랜 카드를 찾을 수 없습니다.' };
      }
      
      if (order.length !== cards.length) {
        return { success: false, error: '순서 배열 길이가 플랜 수와 일치하지 않습니다.' };
      }
      
      // 기존 카드들 제거
      cards.forEach(card => card.remove());
      
      // 새로운 순서로 다시 추가
      order.forEach(originalIndex => {
        if (originalIndex >= 0 && originalIndex < cards.length) {
          container.appendChild(cards[originalIndex]);
        }
      });
      
      // 수정된 HTML 업데이트
      const updatedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      
      if (window.htmlManager) {
        const result = window.htmlManager.setHTML(updatedHTML);
        if (result.success) {
          return {
            success: true,
            description: `플랜 순서가 변경되었습니다`
          };
        } else {
          return { success: false, error: result.error };
        }
      }
      
      return { success: false, error: 'HTMLManager를 찾을 수 없습니다.' };
      
    } catch (error) {
      return {
        success: false,
        error: `플랜 순서 변경 실패: ${error.message}`
      };
    }
  }
  
  // 대량 플랜 생성/수정
  async bulkUpdatePricing(data) {
    try {
      const { plans } = data; // [{name, price, type, description}, ...]
      
      if (!Array.isArray(plans) || plans.length === 0) {
        return { success: false, error: '플랜 배열이 필요합니다.' };
      }
      
      console.log('📊 대량 플랜 업데이트:', plans);
      
      const parser = new DOMParser();
      const currentHTML = window.htmlManager?.getCurrentHTML() || '';
      const doc = parser.parseFromString(currentHTML, 'text/html');
      
      const container = doc.getElementById('pricing-cards');
      if (!container) {
        return { success: false, error: 'pricing-cards 컨테이너를 찾을 수 없습니다.' };
      }
      
      // 기존 플랜 모두 제거
      container.innerHTML = '';
      
      // 새 플랜들 추가
      plans.forEach((plan, index) => {
        const { name = `Plan ${index + 1}`, price = 0, type = 'paid', description = 'Plan description' } = plan;
        const planId = `plan-${Date.now()}-${index}`;
        const priceDisplay = type === 'free' ? 'FREE' : `$${price}`;
        const selectedClass = index === 0 ? ' selected' : '';
        
        const newPlanHTML = `
          <div class="pricing-card${selectedClass}" data-plan="${planId}">
            <h3 class="plan-name" contenteditable="true">${name}</h3>
            <div class="plan-price" contenteditable="true">${priceDisplay}</div>
            <p class="plan-description" contenteditable="true">${description}</p>
          </div>`.trim();
        
        container.insertAdjacentHTML('beforeend', newPlanHTML);
      });
      
      // 수정된 HTML 업데이트
      const updatedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      
      if (window.htmlManager) {
        const result = window.htmlManager.setHTML(updatedHTML);
        if (result.success) {
          return {
            success: true,
            description: `${plans.length}개 플랜이 생성되었습니다`
          };
        } else {
          return { success: false, error: result.error };
        }
      }
      
      return { success: false, error: 'HTMLManager를 찾을 수 없습니다.' };
      
    } catch (error) {
      return {
        success: false,
        error: `대량 플랜 업데이트 실패: ${error.message}`
      };
    }
  }
}

// ExpirationActionManager - 만료일 관련 액션 처리
class ExpirationActionManager {
  
  async setExpiration(data) {
    try {
      const { date, message = 'Limited time offer!' } = data;
      
      if (!date) {
        return { success: false, error: '만료일이 필요합니다.' };
      }
      
      console.log('⏰ 만료일 설정:', { date, message });
      
      // HTML에 만료일 관련 요소 추가/업데이트
      // 실제로는 카운트다운 컴포넌트나 배너를 추가하는 로직이 들어갈 예정
      
      return {
        success: true,
        description: `만료일이 ${date}로 설정되었습니다`,
        needsImplementation: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: `만료일 설정 실패: ${error.message}`
      };
    }
  }
  
  async clearExpiration(data) {
    try {
      console.log('🗑️ 만료일 제거');
      
      // 만료일 관련 요소들 제거
      // 실제 구현 예정
      
      return {
        success: true,
        description: '만료일이 제거되었습니다',
        needsImplementation: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: `만료일 제거 실패: ${error.message}`
      };
    }
  }
}

// BulletPointManager - Embedded Widget 기능 목록 관리
class BulletPointManager {
  
  async addBulletPoint(data) {
    try {
      const { planIndex, bulletPoint } = data;
      
      console.log('📝 Bullet Point 추가:', { planIndex, bulletPoint });
      
      // Embedded Widget용 기능 목록 추가 로직
      // 실제 구현 예정
      
      return {
        success: true,
        description: `플랜 #${planIndex + 1}에 기능이 추가되었습니다`,
        needsImplementation: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Bullet Point 추가 실패: ${error.message}`
      };
    }
  }
  
  async removeBulletPoint(data) {
    try {
      const { planIndex, bulletIndex } = data;
      
      console.log('🗑️ Bullet Point 제거:', { planIndex, bulletIndex });
      
      return {
        success: true,
        description: `플랜 #${planIndex + 1}에서 기능이 제거되었습니다`,
        needsImplementation: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Bullet Point 제거 실패: ${error.message}`
      };
    }
  }
  
  async setHighlight(data) {
    try {
      const { planIndex, highlighted = true } = data;
      
      console.log('⭐ 플랜 하이라이트 설정:', { planIndex, highlighted });
      
      return {
        success: true,
        description: `플랜 #${planIndex + 1} 하이라이트가 ${highlighted ? '활성화' : '비활성화'}되었습니다`,
        needsImplementation: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: `플랜 하이라이트 설정 실패: ${error.message}`
      };
    }
  }
}

// 전역 인스턴스 생성 (htmlManager 연결은 나중에)
const actionManager = new ActionManager();

export default actionManager;
export { ActionManager, PricingActionManager, ExpirationActionManager, BulletPointManager };
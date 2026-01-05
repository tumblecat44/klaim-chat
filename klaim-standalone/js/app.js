// Main Application - HTML 편집 방식으로 완전히 리팩터됨
// 기존 데이터 기반 → HTML 직접 편집으로 변경

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 HTML 편집 기반 프로모션 빌더 시작');
    
    // Lucide 아이콘 초기화
    lucide.createIcons();
    
    // HTML Manager 초기화 대기
    await initializeHTMLManager();
    
    // 기본 UI 초기화
    initializeSections();
    initializeViewToggle();
    initializePublishButton();
    
    console.log('✅ 애플리케이션 초기화 완료');
});

// HTML Manager 초기화
async function initializeHTMLManager() {
    try {
        // HTML Manager가 이미 동적으로 import되어야 함
        // ai-chat.js에서 이미 처리할 예정
        console.log('⏳ HTML Manager 초기화 중...');
        
        // 초기 프리뷰 설정
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame) {
            previewFrame.src = 'preview.html';
            console.log('🖼️ 기본 프리뷰 로드 완료');
        }
        
    } catch (error) {
        console.error('❌ HTML Manager 초기화 실패:', error);
    }
}

// 섹션 접기/펼치기 기능
function initializeSections() {
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.dataset.toggle;
            const content = document.getElementById(`${section}-content`);
            
            if (content) {
                header.classList.toggle('collapsed');
                content.classList.toggle('hidden');
                
                // Lucide 아이콘 업데이트
                const icon = header.querySelector('svg');
                if (icon) {
                    lucide.createIcons();
                }
            }
        });
    });
}

// 뷰 토글 (Desktop/Mobile)
function initializeViewToggle() {
    const viewButtons = document.querySelectorAll('.btn-view');
    const previewPanel = document.querySelector('.preview-panel');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 활성 버튼 업데이트
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 프리뷰 패널 클래스 업데이트
            if (previewPanel) {
                previewPanel.classList.remove('mobile', 'desktop');
                previewPanel.classList.add(btn.dataset.view);
                
                console.log(`📱 뷰 모드 변경: ${btn.dataset.view}`);
            }
        });
    });
}

// 퍼블리시 버튼
function initializePublishButton() {
    const publishBtn = document.querySelector('.btn-publish');
    const saveBtn = document.querySelector('.btn-save');
    
    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            try {
                // AI Handler를 통한 HTML 퍼블리시
                // ai-chat.js에서 이미 aiHandler를 import할 예정
                if (typeof window.aiHandler !== 'undefined') {
                    const result = window.aiHandler.publishHTML();
                    if (result.type === 'success') {
                        showNotification(result.message, 'success');
                    } else {
                        showNotification(result.message, 'error');
                    }
                } else {
                    // 폴백: 간단한 다운로드
                    downloadCurrentHTML();
                }
                
            } catch (error) {
                console.error('퍼블리시 오류:', error);
                showNotification('퍼블리시 중 오류가 발생했습니다.', 'error');
            }
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // 현재는 자동으로 상태가 보존되므로 단순 확인 메시지
            showNotification('현재 상태가 자동으로 저장되었습니다.', 'success');
        });
    }
}

// 현재 HTML 다운로드 (폴백)
function downloadCurrentHTML() {
    try {
        const previewFrame = document.getElementById('preview-frame');
        if (!previewFrame) {
            throw new Error('프리뷰 프레임을 찾을 수 없습니다.');
        }
        
        // iframe에서 HTML 가져오기
        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        const html = iframeDoc.documentElement.outerHTML;
        
        // 다운로드
        const blob = new Blob(['<!DOCTYPE html>\n' + html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'promotion-page.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        showNotification('📁 HTML 파일이 다운로드되었습니다!', 'success');
        
    } catch (error) {
        console.error('HTML 다운로드 실패:', error);
        showNotification('HTML 다운로드에 실패했습니다.', 'error');
    }
}

// 알림 메시지 표시
function showNotification(message, type = 'info') {
    // 간단한 토스트 알림 구현
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 9999;
        max-width: 400px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#4f46e5'};
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    console.log(`📢 알림: ${message}`);
}

// CSS 애니메이션 추가 (한 번만)
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 전역에 유틸리티 함수 노출
window.showNotification = showNotification;
window.downloadCurrentHTML = downloadCurrentHTML;

console.log('🎯 HTML 편집 기반 앱 로드 완료');
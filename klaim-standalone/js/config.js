// Config.js - 환경 변수 관리 (MVP용)

class Config {
  static #GEMINI_API_KEY = null;

  // MVP용 간단한 API 키 설정
  static init() {
    // 로컬스토리지에서 API 키 확인
    const savedKey = localStorage.getItem("GEMINI_API_KEY");

    if (savedKey) {
      this.#GEMINI_API_KEY = savedKey;
      return true;
    }

    // API 키가 없으면 사용자에게 입력 받기
    return this.promptForApiKey();
  }

  static promptForApiKey() {
    const apiKey = prompt(`
🔑 Gemini API 키를 입력하세요

1. Google AI Studio (https://aistudio.google.com/)에서 API 키 생성
2. 아래 입력창에 API 키 붙여넣기

API Key:`);

    if (apiKey && apiKey.trim()) {
      this.#GEMINI_API_KEY = apiKey.trim();
      localStorage.setItem("GEMINI_API_KEY", apiKey.trim());
      console.log("✅ Gemini API 키가 설정되었습니다.");
      return true;
    } else {
      console.error("❌ API 키가 필요합니다. 새로고침 후 다시 시도하세요.");
      return false;
    }
  }

  static getApiKey() {
    if (!this.#GEMINI_API_KEY) {
      throw new Error(
        "API 키가 설정되지 않았습니다. Config.init()을 먼저 호출하세요."
      );
    }
    return this.#GEMINI_API_KEY;
  }

  // API 키 재설정
  static resetApiKey() {
    localStorage.removeItem("GEMINI_API_KEY");
    this.#GEMINI_API_KEY = null;
    return this.promptForApiKey();
  }

  // 개발용 설정
  static isDevelopment() {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }

  // Gemini 모델 설정
  static getModelConfig() {
    return {
      model: "gemini-2.5-flash-lite",
      // thinkingLevel: "LOW", // 빠른 응답용
    };
  }
}

export default Config;

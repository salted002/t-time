const API_ENV_KEY = 'ttime_api_env';

type ApiEnv = 'production' | 'staging';

// 허용 목록: 이 두 키워드만 선택 가능. 임의의 URL은 절대 받지 않는다.
const API_URLS: Record<ApiEnv, string | undefined> = {
  production: import.meta.env.VITE_API_BASE_URL,
  staging: import.meta.env.VITE_API_STAGING_URL,
};

function resolveApiEnv(): ApiEnv {
  try {
    const param = new URLSearchParams(window.location.search).get('api');
    if (param === 'production' || param === 'staging') {
      localStorage.setItem(API_ENV_KEY, param);
      return param;
    }
    const saved = localStorage.getItem(API_ENV_KEY);
    if (saved === 'production' || saved === 'staging') return saved;
  } catch {
    // localStorage 접근 불가 시 production으로
  }
  return 'production';
}

const requested = resolveApiEnv();

// staging 주소가 빌드에 없으면 production으로 안전하게 되돌림
export const apiEnv: ApiEnv =
  requested === 'staging' && API_URLS.staging ? 'staging' : 'production';

export const API_BASE_URL = API_URLS[apiEnv];

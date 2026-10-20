<div align="center">

<!-- <img src="apps/frontend/src/assets/logo-ko-green.png" alt="티타임" height="64" /> -->

# 🍵 티타임 (T-Time)

**소규모 영어학원을 위한 성적 관리 · AI 피드백 · 리포트 발송 SaaS**

시험 성적을 입력하면 통계와 AI 피드백이 만들어지고, 학부모에게 리포트를 바로 보낼 수 있어요.

[🔗 서비스 바로가기](TODO) · [🎬 시연 영상](TODO)

</div>

---

## 📌 프로젝트 소개

학원 현장에서는 시험 성적 정리, 학생별 피드백 작성, 학부모 전달이 모두 수작업으로 이뤄집니다.
**티타임**은 이 과정을 하나의 웹 서비스로 해결하는 멀티테넌트 SaaS입니다.
학원 강사 출신 팀원들이 현장에서 직접 겪은 문제를 바탕으로 기획했습니다.

- **팀명**: 티트리
- **개발 기간**: 2026.09 ~ 2026.10 (TODO: 정확한 기간)
- **인원**: 3명

## ✨ 주요 기능

| 영역           | 기능                                                             |
| -------------- | ---------------------------------------------------------------- |
| 학생 · 반 관리 | 학생 CRUD, 엑셀 일괄 등록, 반 관리, 재원/휴원/퇴원 상태 관리     |
| 상담           | 학생별 상담 기록 CRUD                                            |
| 시험 · 성적    | 시험 생성/복사, 과목별 성적 입력, 석차(공동순위)·반평균 통계     |
| AI 피드백      | 과목별/종합 피드백 자동 생성 (Azure OpenAI), 구독 학원 전용 편집 |
| 리포트         | 리포트 일괄/개별 생성, 저장 시점 스냅샷, 공유 링크(2주 만료)     |
| 문자 발송      | CoolSMS 연동 리포트 발송, 템플릿, 발송 이력                      |
| 구독           | FREE / AI PRO 플랜 (결제 연동 없이 플래그 전환)                  |
| 운영자 콘솔    | 전체 학원 조회·수정·삭제                                         |
| 데모           | 데모 계정 체험 로그인                                            |

## 🖼 스크린샷

<!-- apps/frontend/src/assets/landing-preview-dashboard.png 외에 주요 화면 캡처를 docs/images/ 등에 추가 -->

| 대시보드 | 성적 통계 | 리포트 |
| -------- | --------- | ------ |
| TODO     | TODO      | TODO   |

## 🛠 기술 스택

**Frontend**

- React 19, TypeScript, Vite
- Tailwind CSS v4, shadcn/ui
- React Router 7, React Hook Form, Zod, axios, Recharts

**Backend**

- Node.js 24, Express 5 (JavaScript, CommonJS)
- PostgreSQL 18, Sequelize 6
- JWT, bcrypt, multer

**External**

- Azure OpenAI (AI 피드백), CoolSMS (문자), Azure Blob Storage (로고 이미지)

**Infra**

- Azure App Service (Backend), Azure Static Web Apps (Frontend), GitHub Actions

## 🏗 아키텍처

```
┌──────────────┐   axios   ┌───────────────┐   Sequelize   ┌────────────────┐
│ React (Vite) │ ────────▶ │ Express API   │ ────────────▶ │ PostgreSQL     │
│ Static Web   │           │ App Service   │               │ (Azure)        │
└──────────────┘           └──────┬────────┘               └────────────────┘
                                  ├──▶ Azure OpenAI  (AI 피드백)
                                  ├──▶ CoolSMS       (문자 발송)
                                  └──▶ Azure Blob    (이미지 저장)
```

- 모든 데이터는 `academy_id` 기준으로 학원별 격리됩니다.
- API 키 등 민감한 연동은 백엔드에서만 호출합니다.

## 📁 폴더 구조

```
t-time/
├─ apps/
│  ├─ backend/
│  │  └─ src/
│  │     ├─ routes/        # 라우트 정의
│  │     ├─ controllers/   # 요청/응답 처리
│  │     ├─ services/      # 비즈니스 로직 (AI, SMS 포함)
│  │     ├─ middlewares/   # 인증, 에러 처리, 데모 차단
│  │     └─ db/            # models, migrations, seeders
│  └─ frontend/
│     └─ src/
│        ├─ pages/         # 화면 단위 페이지
│        ├─ components/    # 공통/도메인 컴포넌트
│        ├─ api/           # API 호출 함수
│        ├─ hooks/         # 데이터 패칭 등 커스텀 훅
│        └─ context/       # 인증 등 전역 상태
└─ .github/workflows/      # CI/CD
```

## 🚀 로컬 실행 방법

**요구사항**: Node.js 24 (`.nvmrc` 참고), PostgreSQL

```bash
# 1. 클론
git clone https://github.com/salted002/t-time.git
cd t-time

# 2. Node 버전 맞추기
nvm use

# 3. 의존성 설치 (루트에서 한 번)
npm install

# 4. 환경변수 설정
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# → apps/backend/.env 에 DB 접속 정보, JWT_SECRET 등을 채웁니다.

# 5. DB 마이그레이션 & 시드
npm run migrate --workspace=apps/backend
npm run seed --workspace=apps/backend

# 6. 개발 서버 (터미널 2개)
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

### 환경변수 (backend)

| 변수                                                  | 설명                           |
| ----------------------------------------------------- | ------------------------------ |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | PostgreSQL 접속 정보           |
| `JWT_SECRET` `JWT_ADMIN_SECRET` `JWT_EXPIRES_IN`      | 인증                           |
| `STORAGE_TYPE` `AZURE_STORAGE_*`                      | 파일 저장소 (local / azure)    |
| `COOLSMS_API_KEY` `COOLSMS_API_SECRET`                | 문자 발송                      |
| `AZURE_OPENAI_*`                                      | AI 피드백                      |
| `FRONTEND_BASE_URL`                                   | 프론트 주소 (공유 링크 생성용) |

## 🗄 데이터베이스

학원, 사용자, 반, 학생, 상담, 시험(과목·학년·참가자·점수), 리포트, 공유 링크, 문자 이력·템플릿, 운영자 등 총 15개 모델로 구성됩니다.
스키마는 Sequelize 마이그레이션(`apps/backend/src/db/migrations`)으로 관리합니다.

<!-- ERD 이미지가 있다면 여기에 첨부 -->

## 🤝 협업 방식

- **브랜치 전략**: `main`(배포) ← `develop`(통합) ← `feat/*`, `fix/*`
- **머지 방식**: feature → develop은 Squash merge, develop → main은 Merge commit
- **커밋 컨벤션**: gitmoji + 한글 설명 (예: `✨ feat: 학생 일괄 등록`)
- **코드 리뷰**: PR 작성자가 아닌 팀원이 리뷰 후 머지

## 👥 팀원

| 이름 | 역할                                             | GitHub                                     |
| ---- | ------------------------------------------------ | ------------------------------------------ |
| TODO | 팀장 · 성적 통계, 리포트, 문자 발송, 운영자 콘솔 | [@salted002](https://github.com/salted002) |
| TODO | 시험 관리                                        | TODO                                       |
| TODO | 계정, 학생, 상담, 반 관리                        | TODO                                       |

## 📄 문서

기획서, 요구사항정의서, 화면정의서, 테이블정의서, API 명세서 → TODO (Notion 링크)

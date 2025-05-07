# AI 학습 루틴 플래너

AI를 활용한 개인 맞춤형 학습 루틴 생성 및 관리 웹 애플리케이션입니다. 사용자의 학습 스타일, 선호 시간대, 과목 정보를 바탕으로 최적화된 학습 계획을 생성하고 캘린더에서 관리할 수 있습니다.

## 주요 기능

- 사용자 맞춤형 학습 루틴 생성
- 캘린더 기반 일정 관리
- 학습 진행 상황 및 통계 확인
- 사용자 계정 관리 (회원가입/로그인)

## 기술 스택

- **프론트엔드**: 바닐라 JavaScript (ES 모듈), FullCalendar
- **백엔드**: Node.js, Express
- **데이터베이스**: MongoDB (Mongoose)
- **인증**: 세션 기반 인증
- **AI**: Hugging Face API (LLaMA-2 모델)

## 설치 및 실행 방법

### 사전 요구사항

- Node.js (v16 이상)
- MongoDB
- Hugging Face API 키

### 설치 단계

1. 저장소 클론
   ```bash
   git clone https://github.com/yourusername/ai-study-planner.git
   cd ai-study-planner
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   `.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정합니다:
   ```
   HF_API_TOKEN=your_huggingface_api_token_here
   SESSION_SECRET=your_session_secret_here
   MONGODB_URI=your_mongodb_uri_here
   PORT=3000
   ```

4. 서버 실행
   ```bash
   npm start
   ```

5. 웹 브라우저에서 접속
   ```
   http://localhost:3000
   ```

## 프로젝트 구조

```
project/
├── .env.example                   # 환경 변수 예제 파일
├── .gitignore                     # Git 무시 파일 목록
├── index.js                       # 서버 메인 파일
├── models/
│   ├── User.js                    # 사용자 모델
│   └── Recommendation.js          # 추천 모델
├── routes/
│   ├── auth.js                    # 인증 관련 라우트
│   └── api.js                     # API 라우트
├── public/
│   ├── css/
│   │   └── style.css              # CSS 스타일
│   ├── js/
│   │   ├── app.js                 # 메인 앱 진입점
│   │   ├── auth.js                # 인증 관련 기능
│   │   ├── ui.js                  # UI 관련 기능
│   │   ├── routine.js             # 루틴 생성 관련 기능
│   │   ├── calendar.js            # 캘린더 관련 기능
│   │   ├── utils.js               # 유틸리티 함수
│   │   └── index.global.min.js    # FullCalendar 라이브러리
│   ├── favicon.ico                # 파비콘
│   └── index.html                 # 메인 HTML 파일
└── README.md                      # 프로젝트 설명 (현재 파일)
```

## 사용 방법

1. 회원가입 및 로그인
2. '새 루틴 생성' 버튼을 클릭하여 학습 정보 입력
3. AI가 생성한 맞춤형 루틴 확인
4. 필요에 따라 일정 수정
5. 캘린더에 저장하여 일정 관리
6. 완료한 일정은 '완료' 버튼으로 체크

## 개발자 안내

- 모듈형 JavaScript를 사용하여 개발됨 (ES 모듈)
- 서버 API는 RESTful 방식으로 설계됨
- 모든 비동기 작업은 Promise 또는 async/await 패턴 사용

## 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참조

## 기여 방법

1. 이슈 등록 또는 확인
2. 저장소 포크
3. 기능 개발 브랜치 생성
4. 변경사항 반영
5. Pull Request 생성

## 연락처

프로젝트 관련 문의: kimsungeun0318@naver.com
# Build Number 테스트

Node.js 24 이상을 사용합니다. 개인 테스트 저장소에서만 릴리스 태그를 생성하며 서비스 배포는 하지 않습니다.

## 단위 테스트

```sh
npm ci
npm test
```

6개 테스트는 임시 Git 저장소에서 실행됩니다.

## 실제 prod 액션

GitHub **Actions → Prod Build Test → Run workflow → main**으로 실행합니다.

1. semantic-release가 최신 정식 태그에서 minor를 올립니다.
2. `public/version.txt`를 작성하고 HEAD에 새 태그를 생성합니다.
3. Vite가 HEAD 태그를 제외해 Build Number를 계산하고 실제 버전과 대조합니다.
4. 빌드된 JS를 JSDOM에서 실행해 화면 값과 HEAD 태그, `dist/version.txt`가 같은지 검증합니다.
5. Actions 요약에 결과를 표시하고 `dist`를 artifact로 업로드합니다.

초기 기준 태그는 `v1.12.0`이고 첫 실행의 기대값은 `1.13.0`입니다. 이후 새 릴리스가 생기면 값은 달라집니다.

같은 실행에서 **Re-run all jobs**를 누르면 새 릴리스 없이 HEAD 태그로 검증하며 `version.txt`를 다시 생성합니다.

## 산출물을 화면에서 확인

Actions 실행 화면의 **Artifacts**에서 ZIP을 다운로드하고 별도 폴더에 압축을 풉니다.
ZIP 안에는 index.html, assets, version.txt, verification.json이 있습니다.

테스트 저장소에서 아래 명령을 실행하되 경로는 압축을 푼 폴더로 바꿉니다.

```sh
npm ci
npm run preview -- --outDir /absolute/path/to/extracted-artifact
```

터미널에 표시된 주소에서 제품 버전·Build Number·UDI PI를 확인합니다.
HTML을 파일로 직접 여는 대신 preview 서버를 사용하세요.

`scripts/build-version.ts`는 AuraVue 모듈의 복사본입니다. 실제 앱이나 회사 인증정보는 포함하지 않습니다.

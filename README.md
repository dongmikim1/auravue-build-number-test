# Build Number 테스트

전 환경에서 최신 정식 릴리스 태그의 minor를 1 올리는 계산과 production 검증을 테스트합니다.

```sh
npm ci
npm test
```

Node.js 24 이상이 필요합니다. GitHub Actions의 **Build Number Tests**에서도 실행할 수 있습니다.

각 테스트는 별도의 임시 Git 저장소에 커밋과 태그를 생성하고 종료 후 삭제합니다.
이 저장소 자체에 릴리스 태그를 만들거나 원격에 푸시하지 않습니다. 배포 단계도 없습니다.

| 상황 | 기대 결과 |
|---|---|
| dev/stage, 최신 prod 태그 v1.12.0 | 1.13.0 |
| 새 prod, HEAD에 v1.13.0 태그 생성 | 1.14.0으로 증가하지 않고 1.13.0 |
| 같은 커밋 재실행, version.txt 없음 | HEAD 태그로 검증 후 파일 생성 |
| 실제 버전과 계산값 불일치 | 오류 발생 |
| 실제 버전 파일과 HEAD 태그 모두 없음 | 오류 발생 |
| 파일에 prerelease 버전 기록 | HEAD 태그가 있어도 오류 발생 |

`scripts/build-version.ts`는 테스트 준비 시점의 모듈 복사본입니다.

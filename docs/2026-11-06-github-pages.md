# 현대해상 스타일 GitHub Pages 배포

- 사이트: https://wkdal1433.github.io/jangsoni/
- QR 이미지: [jangsoni-hyundai.png](qr/jangsoni-hyundai.png), [공개 이미지](https://wkdal1433.github.io/jangsoni/qr.png)
- 배포 브랜치: `v2-hyundai-style`
- 배포한 커밋: `009d3341dc42b1d94c7fb3299886e29bed1bca0d`
- 성공한 실행: [GitHub Actions 42172750135](https://github.com/wkdal1433/jangsoni/actions/runs/42172750135)
- 배포 완료 시각: 2026-11-06 15:10:43 KST (실행 결과의 `2026-11-06T06:10:43Z`)

## 설정

`.github/workflows/pages.yml`이 현대해상 브랜치의 `index.html`·QR·워크플로 변경 시 실행된다. `github-pages` 환경의 허용 브랜치에 `v2-hyundai-style`을 추가했다. 검증된 HTML과 QR만 `_site`로 복사하여 GitHub의 Pages Actions로 배포한다. 저장소의 기존 main과 앱 소스·입력 필드·이미지 묶음은 이번 배포 작업에서 수정하지 않았다.

워크플로의 브랜치 조건과 체크아웃 대상이 배포 버전을 정한다. Pages REST 응답의 `source.branch`는 `main`으로 나타났지만, `build_type`은 `workflow`이며 실제 배포 실행의 브랜치와 커밋은 위 현대해상 버전이다.

## 공개 주소 검증

- 사이트와 `qr.png` 모두 HTTP 200으로 응답했다.
- 공개 HTML과 로컬 `index.html`은 줄바꿈을 통일한 뒤 정확히 일치했다. SHA-256은 `751e1bb5c66c2df86926f3e8a605d4137294665831ceb28eae7b4aa87b868620`이다.
- 공개 QR 파일은 저장소 PNG와 바이트 단위로 일치했다. 로컬 PNG를 OpenCV로 다시 읽은 결과는 `https://wkdal1433.github.io/jangsoni/`였다.
- 1440×900 Chrome에서 첫 화면 → 사건 분석 → 7개 메뉴 → 타임라인 → 브라우저 뒤로가기를 확인했다.
- 390×844 Chrome에서 카드 본문을 마우스→터치 변환으로 3px씩 총 90px 끌어 세 번째 카드에서 네 번째 카드로 전환했다. 판례 기능 진입·첫 안내 닫기·뒤로가기도 확인했다.
- 두 화면 크기에서 가로 넘침과 JavaScript 실행 오류가 없었다. 이 검사는 공개 주소를 사용한 브라우저 자동 검사이며, 실제 휴대전화 실기기 검사는 포함하지 않는다.

설정의 공식 참고 문서: [GitHub Pages 사용자 지정 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Pages API](https://docs.github.com/en/rest/pages/pages), [배포 브랜치 정책 API](https://docs.github.com/en/rest/deployments/branch-policies).

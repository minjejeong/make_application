# 둘이서 한잔 🍻

2인 전용 오프라인 술자리 게임. 폰 하나를 주고받으며 플레이합니다.

## 배포 (GitHub Pages)

터미널에서 이 폴더에 들어와 실행하세요. `<아이디>`와 `<저장소이름>`만 본인 것으로 바꾸면 됩니다.

```bash
cd /workspace/Unist_DOE/make_applicaiton

git init
git add .
git commit -m "둘이서 한잔 - 2인 술자리 게임"
git branch -M main
git remote add origin https://github.com/<아이디>/<저장소이름>.git
git push -u origin main
```

그다음 GitHub 웹에서:

1. 저장소 → **Settings** → 왼쪽 메뉴 **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)** 선택 → **Save**
4. 1~2분 뒤 아래 주소로 접속

```
https://<아이디>.github.io/<저장소이름>/
```

폰에서 열고 → 공유 → **홈 화면에 추가** 하면 앱처럼 씁니다.

## 비밀번호

기본값 **0325**. 바꾸려면 `index.html`에서 이 줄을 고치세요.

```js
const PIN_CODE = "0325";
```

> 참고: 이 PIN은 소스를 보면 노출됩니다. 모르는 사람이 우연히 들어오는 걸 막는 용도이지
> 암호학적 보안이 아닙니다. GitHub Pages는 주소를 아는 사람이면 누구나 접속할 수 있으니,
> 주소를 공유하지 않는 것이 실질적인 방어선입니다.
> 저장소를 Private으로 만들어도 **Pages로 게시된 사이트는 공개**입니다.

## 문항 추가하기

`index.html` 상단의 `CONTENT` 객체만 고치면 됩니다. `level`은 수위입니다 (1=순한맛, 2=매운맛, 3=핵불닭).
`{A}`, `{B}`는 플레이어 이름으로 자동 치환됩니다.

```js
const CONTENT = {
  balance: [
    {a: "평생 여름만", b: "평생 겨울만", level: 1},
  ],
  truth: [
    {q: "{B}한테 고마웠는데 말 못 한 거 있어?", level: 2},
  ],
  // ...
};
```

고친 뒤:

```bash
git add index.html
git commit -m "문항 추가"
git push
```

1분쯤 뒤 사이트에 반영됩니다.

## 게임 모드

**대화가 터지는** — 밸런스 게임 · 질문 카드 · 나에 대한 O/X · 둘 중 누구?
**분위기 전환** — 3초 룰 · 초성 릴레이 · 텔레파시
**길게 가는** — 미션 카드 · 러시안 룰렛 · 스토리 딜레마

## 구조

의존성 없는 단일 HTML 파일입니다. 빌드 과정이 없습니다.

- `index.html` — 게임 전체 (HTML + CSS + JS + 문항)
- `.nojekyll` — GitHub Pages의 Jekyll 처리를 건너뜁니다
- `artifact.html` — claude.ai Artifact 게시용 사본 (`.gitignore`에 포함, 배포에는 불필요)

외부 의존성은 Google Fonts뿐이고, 폰트가 로드되지 않아도 시스템 한글 폰트로 폴백되어
게임 기능은 그대로 동작합니다.

## 나중에 앱으로 옮길 때

게임 로직이 순수 JS이고 `CONTENT` 데이터가 분리돼 있어서, React Native 등으로 옮길 때
문항 데이터는 그대로 복사하고 UI 렌더링 부분만 새로 쓰면 됩니다.
웹에서 충분히 플레이해보고 문항과 규칙을 다듬은 뒤에 옮기는 것을 권합니다.

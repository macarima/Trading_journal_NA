# Trading Journal v1.0.1

매매 기록을 TSV 파일(`data/trades.tsv`)로 저장하고 불러오는 데스크톱 앱입니다.
macOS, Windows 모두 지원합니다.

## 빠른 시작

### 사전 조건
- Node.js v18 이상 (https://nodejs.org)

### 1. 의존성 설치
```bash
cd trading-journal-electron
npm install
```

### 2. 개발 모드 실행
```bash
npm run electron:dev
```

### 3. 빌드

**macOS** (.dmg):
```bash
npm run electron:build:mac
```

**Windows** (무설치 portable .exe):
```bash
npm run electron:build:win
```

**현재 OS 자동 감지**:
```bash
npm run electron:build
```

빌드 완료 후 `release/` 폴더에 결과물이 생성됩니다.

## 데이터 저장 위치

- **macOS**: `~/Library/Application Support/trading-journal/data/trades.tsv`
- **Windows**: `%APPDATA%/trading-journal/data/trades.tsv`
- **개발 모드**: 프로젝트 폴더 내 `data/trades.tsv`

## TSV 파일 형식

```
date	futures	stock	note	rate	nasdaq	sp500
2026-01-02	450	312.50	메모	1350	1.25	0.87
```

엑셀이나 텍스트 편집기에서 직접 편집 가능하고, 앱에서 변경한 내용도 즉시 반영됩니다.

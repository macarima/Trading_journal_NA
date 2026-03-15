# Trading journal for futures and equity

제가 사용하려고 만든 간단한 미국장 트레이딩용 저널 프로그램입니다.
매일의 매매 기록을 남길 수 있게 만들었습니다.
Electron 프레임워크를 사용했으며, 코딩은 클로드AI를 이용했습니다.

기본 입력은 달러화이며, 선물(파생)과 주식 매매 기록을 따로 남길 수 있습니다.
이를 합산하여 일일 달러 수익과 원화 수익을 체크할 수 있으며, 
그날의 NDX(나스닥100)과 SPX(S&P500)의 퍼포먼스와 비교해줍니다.
월말 합계와 연말 합계를 통해서 현재의 수익 상황도 체크할 수 있습니다.
월말 합계는 그달의 최종일 또는 최신 환율을 적용하며, 연말 합계는 그해의 최종일 또는 최신 환율을 적용합니다.
환율과 NDX/SPX의 일일 데이터는 일괄 또는 데이터 입력시에 자동으로 가져올 수 있습니다.
기록은 그래프로도 확인할 수 있습니다. 또한 pdf 리포트로 출력할 수 있습니다.
리포트에는 연말 합계를 포함하여, 월별 기록이 출력되는 구조입니다.

세금은 선물과 주식의 그날의 환율을 적용한 매일 수익을 합산한 뒤,
각각 250만원의 공제 후, 선물은 11%를 주식은 22%로 계산하여 보여줍니다.
이 경우에는 일일 환율이 적용되므로, 앞서 언급한 월말 합계와 연말 합계 금액과는 차이가 있습니다.
자산 상태가 아닌, 실제로 내야하는 원화 세금을 기준으로 새롭게 계산하도록 되어 있습니다. 

---

# Trading Journal

> 미국 주식 & 선물 매매 기록을 관리하는 데스크톱 앱

macOS · Windows 지원 | TSV 기반 데이터 저장 | 환율·지수 자동 수집 | 세금 계산 | PDF 보고서

---

## 주요 기능

### 📊 매매 기록 관리
- 선물 수익, 주식 실현 수익을 일별로 기록
- 일일 수익, 원화 환산 수익 자동 계산
- 월별 탭으로 구분, 연도별 전환 지원 (현재 연도 자동 선택)
- 추가 / 수정 / 삭제 가능

### 📡 시세 자동 수집
- 날짜 선택 시 **USD/KRW 환율** (서울 외환시장 종가 기준) 자동 입력
- **NASDAQ 100**, **S&P 500** 일일 등락률 자동 입력
- 개별 입력 또는 월 단위 일괄 입력 지원
- 자동 입력 후 수동 수정 가능

### 💰 세금 계산
- 선물(파생): 연간 원화 수익 합산 → 250만원 공제 → 11%
- 주식: 연간 원화 수익 합산 → 250만원 공제 → 22%
- 일별 원화 환산(당일 달러 × 당일 환율) 기준으로 정확하게 계산

### 📈 차트
- 일일 손익 막대 차트
- 누적 수익 라인 차트
- 월별 / 연간 요약 통계

### 📄 PDF 보고서
- 연간 요약, 세금 추정, 월별 상세 테이블, 차트를 포함한 A4 보고서 생성
- 버튼 하나로 PDF 파일 저장

### 💾 데이터 관리
- 모든 데이터는 **TSV (탭 구분 텍스트)** 파일로 저장
- 엑셀, 텍스트 편집기에서 직접 편집 가능
- TSV 파일 불러오기 기능으로 데이터 마이그레이션 지원

---

## 설치 및 실행

### 사전 조건

- [Node.js](https://nodejs.org) v18 이상

### 1. 클론 및 의존성 설치

```bash
git clone https://github.com/your-username/trading-journal.git
cd trading-journal
npm install
```

### 2. 개발 모드 실행

```bash
npm run electron:dev
```

### 3. 앱 빌드

```bash
# macOS (.dmg)
npm run electron:build:mac

# Windows (무설치 portable .exe)
npm run electron:build:win

# 현재 OS 자동 감지
npm run electron:build
```

빌드 결과물은 `release/` 폴더에 생성됩니다.

---

## 데이터 저장 위치

| 환경 | 경로 |
|------|------|
| 개발 모드 | `프로젝트/data/trades.tsv` |
| macOS (빌드) | `~/Library/Application Support/trading-journal/data/trades.tsv` |
| Windows (빌드) | `%APPDATA%\trading-journal\data\trades.tsv` |

---

## TSV 파일 형식

```
date	futures	stock	note	rate	nasdaq	sp500
2026-01-02	1821	1528.80	메모	1452.8	-0.17	0.19
2026-01-05	-947	-424.50		1452.8	0.77	0.64
```

| 필드 | 설명 |
|------|------|
| `date` | 매매일 (YYYY-MM-DD) |
| `futures` | 선물 수익 (USD) |
| `stock` | 주식 실현 수익 (USD) |
| `note` | 비고 (선택) |
| `rate` | USD/KRW 환율 |
| `nasdaq` | NASDAQ 100 등락률 (%) |
| `sp500` | S&P 500 등락률 (%) |

---

## 프로젝트 구조

```
trading-journal/
├── data/
│   └── trades.tsv            # 매매 데이터
├── electron/
│   ├── main.cjs              # Electron 메인 프로세스
│   └── preload.cjs           # IPC 브릿지
├── src/
│   ├── main.jsx              # React 진입점
│   └── TradingJournal.jsx    # 메인 UI 컴포넌트
├── index.html
├── vite.config.js
└── package.json
```

---

## 원화 합계 계산 방식

| 항목 | 계산 방식 |
|------|----------|
| 개별 행 원화 수익 | 당일 달러 수익 × 당일 환율 |
| 월간 원화 합계 | 월간 달러 합계 × 해당 월 마지막 거래일 환율 |
| 연간 원화 합계 | 연간 달러 합계 × 해당 연도 최신 거래일 환율 |
| 세금 계산 기준 | 매일 (당일 달러 × 당일 환율)을 각각 합산 |

---

## 기술 스택

- **Electron** — 크로스 플랫폼 데스크톱 앱
- **React 18** — UI
- **Vite** — 빌드 도구
- **electron-builder** — 패키징 및 배포

---

## 라이선스

이 프로젝트는 [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html) 하에 배포됩니다.

자유롭게 사용, 수정, 재배포할 수 있지만, 파생 저작물도 동일한 GPL-3.0 라이선스를 적용해야 합니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

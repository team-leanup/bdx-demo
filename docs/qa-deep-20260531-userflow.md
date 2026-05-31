# QA 심층 — 전체 User Flow 감사 + 수정 (2026-05-31)

> `/goal 모든 user flow를 잘 정의하고, 모든 케이스에서 어색함이나 오류가 없도록`
> 11개 flow를 멀티에이전트(40)로 end-to-end 추적·정의 + 모든 케이스 감사 → 적대검증 → 13개 수정 에이전트로 수정.
> flow 정의: [user-flow.md](user-flow.md)

## 종합 판정

> 전체 플로우는 핵심 동선(사전상담→시술→정산→공유)은 동작하지만, 취소 예약에 시술 CTA 노출·정산 저장 실패 시 wrap-up 이동·공유카드 링크 파괴·스타일 섹션 진행 불가 데드락 등 HIGH 8건이 실 업무를 차단하거나 데이터를 훼손하므로 즉시 수정이 필요하다.

발견 총 127건 — 확정 high+ 27 · medium/low 100.

## 수정 완료 — 반드시 고칠 항목 (mustFix)

| 심각도 | flow | 항목 | 위치 |
|--------|------|------|------|
| HIGH/bug | F3-home | 취소된 예약에 '시술 시작' CTA 노출 및 진입 허용 | `src/components/home/TodayReservationCard.tsx:400 / src/app/(` |
| HIGH/bug | F4-records | DayReservationList에서 pre_consult_done 예약 '상담 시작' 클릭 시 field-mode 처음부터 재시작 | `src/components/calendar/DayReservationList.tsx:347` |
| HIGH/bug | F5-customers | QuickSaleForm 회원권 결제 버튼 항상 비활성 | `src/components/payment/QuickSaleForm.tsx:282-285` |
| HIGH/bug | F6-portfolio | EditPhotoModal Escape 키가 PortfolioOverlay까지 연쇄 닫힘 | `src/components/portfolio/PortfolioOverlay.tsx:69` |
| HIGH/bug | F9-preconsult | 사전상담 style 섹션에서 stylePreference 미선택 시 Next 버튼 영구 미노출 — 진행 불가 데드락 | `src/components/pre-consult/StyleSelector.tsx:89` |
| HIGH/bug | F10-fieldmode | 정산 화면 '파츠 빠른 추가'가 이미 baseEstimate에 포함된 파츠를 이중청구 | `src/app/field-mode/settlement/page.tsx:540` |
| HIGH/bug | F10-fieldmode | 정산 DB 저장 실패 시 에러 배너 표시 전에 wrap-up으로 이동 | `src/app/field-mode/settlement/page.tsx:386-407` |
| HIGH/bug | F11-share | 공유카드 재생성 시 onShareCardCreated 콜백 미전달로 기존 링크 파괴 | `src/app/(main)/records/[id]/page.tsx:655-673 / src/app/field` |
| MEDIUM/bug | F1-auth | 이메일 미인증 상태 로그인 시 영문 에러 메시지 노출 | `src/store/auth-store.ts:241-274` |
| MEDIUM/bug | F7-dashboard | monthlyTargetRevenue 새로고침/재로그인 시 초기화 (DB 미저장) | `src/store/app-store.ts:142-166 / src/types/shop.ts:99-132` |
| MEDIUM/bug | F8-settings | 가격표 저장 실패 시 사용자 피드백 없음 (조용한 실패) | `src/app/(main)/settings/page.tsx:170-203` |
| MEDIUM/bug | F8-settings | 영업시간 openTime > closeTime 역전 저장 허용 | `src/components/settings/OperatingHoursSection.tsx:77-108` |
| MEDIUM/bug | F9-preconsult | wrapping 수정 시 nailStatus 이후 모든 섹션 데이터 소실 | `src/components/pre-consult/ConsultReview.tsx:254` |
| MEDIUM/bug | F11-share | iOS Safari에서 '이미지 저장' 버튼이 저장 대신 새 탭 오픔 | `src/app/share/[shareCardId]/ShareCardClient.tsx:99-104` |
| MEDIUM/bug | F4-records | 딥링크 경유 바텀시트 endTime 공백으로 '09:00 – ' 출력 | `src/app/(main)/records/page.tsx:549, 947` |
| MEDIUM/bug | F11-share | 글로벌 error.tsx가 비로그인 외국인을 인증 필요 경로(/home)로 리다이렉트 | `src/app/error.tsx:28-31` |
| MEDIUM/bug | F7-dashboard | '오늘의 외국인 예약' 링크 /records?filter=foreign 가 dead link | `src/app/(main)/dashboard/page.tsx:354-360 / src/app/(main)/r` |
| MEDIUM/bug | F4-records | 타임그리드 이벤트 블록 높이 — 항상 1시간 고정으로 실제 시술 시간 미반영 | `src/lib/date-utils.ts:62` |
| MEDIUM/bug | F5-customers | 결제 합계 grid-cols-3에 최대 4개 항목 — 레이아웃 깨짐 | `src/app/(main)/customers/[id]/page.tsx:1266` |
| MEDIUM/bug | F4-records | 결제 완료(handleFinalize) 더블탭 시 고객 통계 이중 집계 위험 | `src/app/(main)/records/[id]/page.tsx:146, 524-540` |
| MEDIUM/bug | F8-settings | 탭 전환 시 편집 중 unsaved 상태 유지 (editingCategoryPricing, editingShop) | `src/app/(main)/settings/page.tsx:136-146, 940` |
| MEDIUM/bug | F6-portfolio | toggleMenu DB 실패가 조용히 무시됨 | `src/store/portfolio-store.ts:303 / src/app/(main)/portfolio/` |

## 수정 완료 — 권고 항목 (shouldFix)

- (F1-auth) login/signup 폼에 form 태그 추가 및 Enter 키 제출 지원 @ src/app/(auth)/login/page.tsx:105, src/app/(auth)/signup/page.tsx:182
- (F1-auth) Google OAuth 버튼 연타 방지 — isLoading 상태 추가 @ src/app/(auth)/login/page.tsx:84-92
- (F2-onboarding) 로고 업로드 실패 시 인라인 에러 메시지 표시 (silent failure 제거) @ src/app/onboarding/shop-info/page.tsx:31
- (F2-onboarding) 로고 파일 크기 4MB 상한 검증 코드 추가 @ src/app/onboarding/shop-info/page.tsx:24-33
- (F2-onboarding) notice '완료하기' useRef 가드로 중복 클릭 방지 @ src/app/onboarding/notice/page.tsx:28-30
- (F3-home) ReservationForm 예약 슬롯이 shopSettings.businessHours 무시하고 10:00-20:00 하드코딩 @ src/components/home/ReservationForm.tsx:15-26
- (F3-home) 전화번호 없는 고객 재방문 알림 SMS 버튼 — phone 없을 때 버튼 숨김 또는 disabled 처리 @ src/components/home/RevisitReminderCard.tsx:56-60
- (F4-records) records/[id] 뒤로가기 router.back() → 딥링크 진입 시 스택 없으면 router.push('/records')로 fallback @ src/app/(main)/records/[id]/page.tsx:201
- (F5-customers) 사진 팝업 모달 dead code 제거 @ src/app/(main)/customers/[id]/page.tsx:267, 1484-1515
- (F5-customers) 담당 디자이너 미지정 시 '담당: ' 빈 문자열 표시 제거 (null 가드 추가) @ src/app/(main)/customers/[id]/page.tsx:581
- (F5-customers) '시술 기록 보기' CTA 버튼 중복 — 1개 제거 @ src/app/(main)/customers/[id]/page.tsx:1295-1304 또는 1518-1525
- (F6-portfolio) PortfolioOverlay 인디케이터 도트 가로 오버플로우 방지 — flex-wrap 또는 최대 개수 도트 축약 @ src/components/portfolio/PortfolioOverlay.tsx:309-322
- (F6-portfolio) 업로드 버튼 태그 3개 미달 시 이유 툴팁/인라인 안내 표시 @ src/components/portfolio/UploadPhotoForm.tsx:637
- (F6-portfolio) PortfolioOverlay 스와이프 지원 (터치 이벤트 onTouchStart/onTouchEnd 추가) @ src/components/portfolio/PortfolioOverlay.tsx
- (F7-dashboard) KPICards '이달 상담 건수' daysPassed/daysInMonth UTC→KST 기준 수정 @ src/components/dashboard/KPICards.tsx:35-36
- (F7-dashboard) RevenueChart aggregateWeekly UTC midnight 파싱 → KST 기준 파싱으로 교체 @ src/components/dashboard/RevenueChart.tsx:25-31
- (F7-dashboard) computeGoldenTimeTargets lastVisitDate 빈 문자열 → Invalid Date NaN 전파 방어 코드 추가 @ src/lib/analytics.ts:538-564
- (F7-dashboard) 골든타임 리마인더 recentServiceLabel raw 카테고리 키 → resolveMenuCategoryLabel 또는 CATEGORY_LABELS로 치환 @ src/lib/analytics.ts:543-557
- (F8-settings) 영업시간 OperatingHoursSection 탭 재방문 시 stale state — shopSettings 변경 감지 후 local state 동기화 @ src/components/settings/OperatingHoursSection.tsx:34-58
- (F8-settings) 회원권·파츠·시술토글 DB write 실패 시 toast 피드백 추가 @ src/components/settings/MembershipPlansSection.tsx:72-75 / src/store/membership-plan-store.ts:77
- (F8-settings) 데모 모드 전환 버튼 confirm 다이얼로그 추가 @ src/app/(main)/settings/page.tsx:875-879
- (F9-preconsult) 전화번호 placeholder 외국인 손님에게 국제 형식 또는 locale별 예시 표시 @ src/app/pre-consult/[shopId]/confirm/page.tsx:786
- (F9-preconsult) consult 페이지 직접 URL 진입 시 selectedCategory null 가드 추가 → pre-consult 시작 페이지로 redirect @ src/app/pre-consult/[shopId]/consult/page.tsx
- (F10-fieldmode) 옵션 화면 랩핑 가격 하드코딩 5,000원 → shopSettings.surcharges.wrapping 동적 연동 @ src/components/field-mode/QuickOptionsPanel.tsx:196
- (F10-fieldmode) wrap-up 새로고침 시 afterPhotoUrls 소실 — sessionStorage 또는 서버 임시 저장으로 영속화 @ src/store/field-mode-store.ts:270-273
- (F10-fieldmode) 예약금이 시술금 초과 시 경고 표시 @ src/app/field-mode/settlement/page.tsx:195, 641-642
- (F11-share) 공개 공유카드 페이지에 언어 선택기 추가 (LanguageSelector) @ src/app/share/[shareCardId]/ShareCardClient.tsx:74
- (F11-share) 이미지 저장 실패 시 toast/alert 표시 (silent failure 제거) @ src/app/share/[shareCardId]/ShareCardClient.tsx:105-108
- (F6-portfolio) handleDownload/downloading 데드 코드 제거 @ src/components/portfolio/PortfolioOverlay.tsx:59, 101-105

## medium/low 발견 (상당수 수정, 일부 보고)

| 심각도 | flow | 항목 | 위치 |
|--------|------|------|------|
| medium/bug | F1-auth | 비밀번호 찾기/재설정 기능 없음 — 비밀번호 분실 시 복구 불가 | `src/app/(auth)/login/page.tsx 전체` |
| medium/awkward | F1-auth | 비밀번호 입력 필드에 표시/숨김 토글 없음 | `src/app/(auth)/login/page.tsx:160-169, src/app/(auth)/s` |
| medium/bug | F1-auth | Google OAuth 버튼이 오류 상황에서 연타 가능 — isLoading 미설정 | `src/app/(auth)/login/page.tsx:84-92, src/app/(auth)/sig` |
| medium/awkward | F1-auth | Google 회원가입 완료 페이지(/signup/google)에 취소/뒤로가기 경로 없음 | `src/app/(auth)/signup/google/page.tsx 전체` |
| medium/bug | F1-auth | Supabase 환경변수 미설정 시 기술적 에러 메시지가 샵원장에게 노출 | `src/lib/supabase.ts:8, src/store/auth-store.ts(loginWit` |
| medium/awkward | F1-auth | 온보딩 완료 페이지에서 DB 저장 오류 시 재시도 CTA가 불명확 | `src/app/onboarding/complete/page.tsx:289-308` |
| low/awkward | F1-auth | Input 컴포넌트에 autoComplete 속성이 없어 비밀번호 관리자 연동 안 됨 | `src/components/ui/Input.tsx:13-45` |
| low/awkward | F1-auth | 스플래시 화면에 한국어 하드코딩 — '상담을 정리하는 가장 쉬운 방법' | `src/app/(auth)/splash/page.tsx:64` |
| low/bug | F1-auth | Google 회원가입 페이지 로딩 상태에서 로고 에셋 불일치 (bdx-symbol.svg vs bdx-symbol-v9.svg) | `src/app/(auth)/signup/google/page.tsx:126, 144` |
| medium/bug | F2-onboarding | 분류 단계 카테고리 빠른 더블탭 시 사진 2장 건너뜀 | `src/app/onboarding/portfolio-classify/page.tsx:49-66` |
| medium/bug | F2-onboarding | 가격·시간 모두 0이어도 onboarding 진행 가능 | `src/app/onboarding/pricing/page.tsx:96-99 (handleNext, ` |
| medium/awkward | F2-onboarding | 연장 토글 ON + 금액 0 저장 시 다음 방문에 토글 자동 OFF — 사용자 혼란 | `src/app/onboarding/surcharges/page.tsx:81-82, 94` |
| medium/a11y | F2-onboarding | 포트폴리오 업로드 섬네일 삭제 버튼 터치 타겟 20×20px — 모바일 기준 미달 | `src/app/onboarding/portfolio-upload/page.tsx:162-170` |
| medium/a11y | F2-onboarding | 분류 페이지 '건너뛰기' 버튼 터치 타겟 없음 + 진행바 aria 속성 누락 | `src/app/onboarding/portfolio-classify/page.tsx:254-260 ` |
| low/awkward | F2-onboarding | 고객 안내문구 완전히 비워도 저장 불가 — UX 의도 불명확 | `src/app/onboarding/notice/page.tsx:29` |
| low/awkward | F2-onboarding | 포트폴리오·가격·추가금 단계에 shopName 가드 없음 — URL 직접 접근 시 혼란 | `src/app/onboarding/portfolio-upload/page.tsx (no guard)` |
| low/i18n | F2-onboarding | 온보딩 전체 페이지 한국어 하드코딩 — 다국어 대응 없음 | `src/app/onboarding/* (모든 페이지 — shop-info, pricing, surc` |
| medium/awkward | F3-home | 예약 빈 상태 안내 문구 방향 반전 (한국어만 '위에서'→실제는 아래) | `src/lib/i18n.ts:63 / src/app/(main)/home/page.tsx:288-3` |
| medium/awkward | F3-home | ReservationForm 예약 시간 슬롯이 shopSettings.businessHours 무시, 10:00–20:00 하드코딩 | `src/components/home/ReservationForm.tsx:15-26` |
| medium/awkward | F3-home | ConsultationLinkModal 오픈만 해도 consultationLinkSentAt 자동 기록 — 링크 미발송이어도 stage 전환 | `src/components/reservations/ConsultationLinkModal.tsx:7` |
| low/bug | F3-home | 전화번호 없는 고객의 재방문 알림 SMS 버튼이 빈 수신자로 메시지 앱 오픈 | `src/components/home/RevisitReminderCard.tsx:56-60` |
| low/awkward | F3-home | RecentConsultationCard 0건일 때 아코디언 펼치면 빈 공백만 표시 (빈 상태 없음) | `src/components/home/RecentConsultationCard.tsx:80-89` |
| low/awkward | F3-home | GreetingHeader greeting·todayDateStr 초기 렌더 시 빈값으로 레이아웃 플리커 | `src/app/(main)/home/page.tsx:240-256` |
| low/awkward | F3-home | 사전상담 알림 뱃지 진입 경로 불일치 — AlertBanner vs NotificationCenter가 다른 페이지로 라우팅 | `src/components/home/ConsultationAlertBanner.tsx:46 / sr` |
| low/i18n | F3-home | TodayReservationCard 내 CTA 문구 전체가 한국어 하드코딩 (다국어 키 없음) | `src/components/home/TodayReservationCard.tsx:238, 348, ` |
| medium/bug | F4-records | 딥링크(?bookingId=) 경유 바텀시트 — endTime 공백으로 '09:00 – ' 출력 | `src/app/(main)/records/page.tsx:549, 947` |
| medium/bug | F4-records | 결제 완료(handleFinalize) 더블탭 시 고객 통계 이중 집계 위험 | `src/app/(main)/records/[id]/page.tsx:146, 524-540` |
| medium/awkward | F4-records | 멀티 디자이너(3명 이상) 타임그리드 — 모바일 375px에서 컬럼 폭 극도로 협소 | `src/components/calendar/DesignerDayGridCalendar.tsx:650` |
| medium/awkward | F4-records | 사전상담 확정 후 /records 리다이렉트 — 예약 날짜가 선택되지 않고 오늘로 초기화 | `src/app/(main)/records/preconsult/[bookingId]/page.tsx:` |
| medium/edgecase | F4-records | 모든 DB 쓰기 실패(예약 추가·수정·삭제·기록 삭제) 시 사용자에게 피드백 없음 | `src/store/reservation-store.ts:107, 118, 127 / src/stor` |
| medium/bug | F4-records | 타임그리드 이벤트 블록 높이 — 항상 1시간 고정으로 실제 시술 시간 미반영 | `src/lib/date-utils.ts:62 (endTime 계산: const endH = Math` |
| low/awkward | F4-records | 타임그리드 현재 시각 표시선 — 페이지 진입 시 자동 스크롤 없음 | `src/components/calendar/DesignerDayGridCalendar.tsx:559` |
| low/awkward | F4-records | records/[id] 뒤로가기가 router.back()로만 구현 — 딥링크 진입 시 앱 밖으로 나갈 수 있음 | `src/app/(main)/records/[id]/page.tsx:201` |
| low/edgecase | F4-records | 취소(cancelled) 예약 바텀시트 — 삭제만 가능, 복구/재활성 방법 없음 | `src/app/(main)/records/page.tsx:1330-1345` |
| low/edgecase | F4-records | records/preconsult 페이지 '이 정보로 시술 시작' 더블탭 시 createCustomer 이중 호출 가능 | `src/app/(main)/records/preconsult/[bookingId]/page.tsx:` |
| medium/bug | F5-customers | 사진 팝업 모달 dead code — 절대 열리지 않음 | `src/app/(main)/customers/[id]/page.tsx:267, 1484-1515` |
| medium/awkward | F5-customers | 신규 고객 0명 빈 샵에서 잘못된 empty state 문구 | `src/app/(main)/customers/page.tsx:178-185` |
| medium/awkward | F5-customers | 시술 이력 카드가 빈 상태에서도 항상 렌더링됨 | `src/app/(main)/customers/[id]/page.tsx:1307-1401` |
| medium/bug | F5-customers | 결제 합계 grid-cols-3에 최대 4개 항목 — 레이아웃 깨짐 | `src/app/(main)/customers/[id]/page.tsx:1266` |
| medium/bug | F5-customers | 회원권 DB sync 실패 시 고객 상세·매출 화면에서 사용자 알림 없음 | `src/store/customer-store.ts:604-615, src/app/(main)/cus` |
| low/awkward | F5-customers | 사진 삭제 버튼 터치 타겟 20px — 모바일에서 너무 작음 | `src/app/(main)/customers/[id]/page.tsx:1233-1235` |
| low/awkward | F5-customers | 담당 디자이너 미지정 고객에서 '담당: ' 뒤 공백 표시 | `src/app/(main)/customers/[id]/page.tsx:581` |
| low/awkward | F5-customers | '시술 기록 보기' CTA 버튼 중복 | `src/app/(main)/customers/[id]/page.tsx:1295-1304, 1518-` |
| low/edgecase | F5-customers | handleCreateCustomer — shopId 없을 때 uncaught exception | `src/app/(main)/customers/page.tsx:37-59, src/store/cust` |
| medium/bug | F6-portfolio | PortfolioOverlay 인디케이터 도트: 사진 수 많을 때 가로 오버플로우 | `src/components/portfolio/PortfolioOverlay.tsx:309-322` |
| medium/bug | F6-portfolio | 메뉴 등록/해제 toggleMenu의 DB 실패가 조용히 무시됨 | `src/store/portfolio-store.ts:303 / src/app/(main)/portf` |
| medium/awkward | F6-portfolio | 업로드 버튼: 태그 3개 미달 시 disabled 상태에서 이유 안내 없음 | `src/components/portfolio/UploadPhotoForm.tsx:637` |
| medium/awkward | F6-portfolio | 메뉴 탭 로딩 중 빈 화면 — DB hydration 완료 전 로딩 표시 없음 | `src/app/(main)/portfolio/page.tsx:396-436 / src/store/p` |
| medium/awkward | F6-portfolio | PortfolioOverlay 내 EditPhotoModal 저장 후 토스트 없음 | `src/components/portfolio/PortfolioOverlay.tsx:365-370` |
| medium/awkward | F6-portfolio | 오버레이 갤러리 스와이프 미지원 — 모바일에서 좌우 화살표 버튼만으로 사진 탐색 | `src/components/portfolio/PortfolioOverlay.tsx (전체 JSX)` |
| medium/awkward | F6-portfolio | '글로벌 베스트' 필터 — 기능 설명 없음, 새 샵에서 항상 0건 | `src/app/(main)/portfolio/page.tsx:920-936` |
| low/bug | F6-portfolio | PortfolioOverlay의 handleDownload / downloading 상태가 렌더링에 사용되지 않는 데드 코드 | `src/components/portfolio/PortfolioOverlay.tsx:59, 101-1` |
| low/awkward | F6-portfolio | 메뉴판 가격 0원 등록 허용 — '0원' 메뉴 항목이 고객 화면에 노출 | `src/app/(main)/portfolio/page.tsx:104-105` |
| low/awkward | F6-portfolio | 업로드 폼 고객 드롭다운 최대 10명 / 상담 기록 최대 10건 제한 | `src/components/portfolio/UploadPhotoForm.tsx:347, 414` |
| low/awkward | F6-portfolio | 업로드 폼 '시술 기록 + 메뉴판'으로 업로드 시 가격 입력란이 형식적으로 보임 — 실제로 메뉴 가격 연동 안내 없음 | `src/components/portfolio/UploadPhotoForm.tsx:383-401, 4` |
| medium/bug | F7-dashboard | KPICards 드릴다운 '이달 상담 건수' — daysPassed/daysInMonth를 UTC 기준으로 계산 | `src/components/dashboard/KPICards.tsx:35-36` |
| medium/bug | F7-dashboard | RevenueChart 주별 집계 aggregateWeekly — 날짜 UTC midnight 파싱으로 요일 어긋남 | `src/components/dashboard/RevenueChart.tsx:25-31` |
| medium/bug | F7-dashboard | computeGoldenTimeTargets — lastVisitDate가 빈 문자열일 때 Invalid Date로 NaN 전파 | `src/lib/analytics.ts:538-564, src/store/records-store.t` |
| medium/bug | F7-dashboard | 골든타임 리마인더 문구 내 recentServiceLabel이 번역되지 않은 raw 카테고리 키 | `src/lib/analytics.ts:543-557` |
| medium/edgecase | F7-dashboard | DesignerPerformance·ServiceAnalytics·CustomerAnalytics — 빈 상태(데이터 0건) 안내 없음 | `src/components/dashboard/DesignerPerformance.tsx:51-203` |
| low/bug | F7-dashboard | KPI '오늘 매출' 카드의 어제 대비 변화율 — new Date()가 UTC 기준 어제를 계산 | `src/lib/analytics.ts:700-704` |
| low/awkward | F7-dashboard | 섹션 제목 '상담 추이'와 컴포넌트명 RevenueChart 불일치 — 차트가 실제로는 상담 건수를 보여줌 | `src/app/(main)/dashboard/page.tsx:326, src/components/d` |
| low/edgecase | F7-dashboard | HourlyBookings '상위 예약 시간대' — 이달 예약 없을 때 0건 항목 3개가 리스트에 표시 | `src/components/dashboard/HourlyBookings.tsx:103-121` |
| low/a11y | F7-dashboard | KPI 바텀시트 — focus trap 없이 배경이 tab 포커스를 받을 수 있음 | `src/components/dashboard/KPICards.tsx:239-293` |
| medium/bug | F8-settings | 영업시간 openTime > closeTime 저장 허용 (역전 시간 무검증) | `src/components/settings/OperatingHoursSection.tsx:77-10` |
| medium/bug | F8-settings | 탭 전환 시 편집 중 unsaved 상태 유지 (editingCategoryPricing, editingShop) | `src/app/(main)/settings/page.tsx:136-146, 940` |
| medium/bug | F8-settings | 회원권/파츠/시술토글 DB write 실패 시 완전 침묵 | `src/components/settings/MembershipPlansSection.tsx:72-7` |
| medium/bug | F8-settings | OperatingHoursSection이 탭 재방문 시 stale state 표시 | `src/components/settings/OperatingHoursSection.tsx:34-58` |
| medium/i18n | F8-settings | 서비스 탭 주요 레이블 전체가 하드코딩 한국어 — 영/중/일 i18n 키 미사용 | `src/app/(main)/settings/page.tsx:474, 510-522, 548-554,` |
| medium/edgecase | F8-settings | 커스텀 파츠 등록 상한 없음 — 무한정 추가 가능 | `src/components/settings/CustomPartsManager.tsx (전체)` |
| medium/edgecase | F8-settings | 데모 모드 전환 버튼: 확인 단계 없이 즉시 logout → 현재 세션 데이터 유실 위험 | `src/app/(main)/settings/page.tsx:875-879` |
| medium/edgecase | F8-settings | 매장명 Input에 maxLength 제한 없음 | `src/app/(main)/settings/page.tsx:411-415` |
| medium/edgecase | F8-settings | StorageManagementSection이 settings/page.tsx에서 렌더링되지 않음 (완전 사라진 기능) | `src/app/(main)/settings/page.tsx:73 / src/components/se` |
| low/awkward | F8-settings | 가격표 저장 버튼: 로딩 상태·성공 피드백 없음 (shopInfo 저장과 UX 불일치) | `src/app/(main)/settings/page.tsx:497-503` |
| low/awkward | F8-settings | 선생님 카드 액션 버튼(프로필 수정·사진 업로드·PIN 변경 등) 터치 타겟이 44px 미만 | `src/components/settings/StaffSection.tsx:383, 420, 427,` |
| low/awkward | F8-settings | shopFeedback 메시지가 자동 dismiss 없이 영구 표시됨 | `src/app/(main)/settings/page.tsx:338-349, 298, 113` |
| low/edgecase | F8-settings | 이름 빈 값 에러 피드백이 StaffSection 전역 feedback에 표시 — 어느 폼의 에러인지 모호 | `src/components/settings/StaffSection.tsx:67, 86` |
| medium/i18n | F9-preconsult | 전화번호 placeholder가 외국인 손님에게 한국 번호 형식(010-0000-0000) 표시 | `src/app/pre-consult/[shopId]/confirm/page.tsx:786` |
| medium/bug | F9-preconsult | consult 페이지 직접 URL 진입 시 selectedCategory=null 상태로 진행 — confirm에서 '상담 정보 부족' 오류 | `src/app/pre-consult/[shopId]/consult/page.tsx (가드 없음), ` |
| medium/i18n | F9-preconsult | 파일 업로드 실패 시 한국어 fallback 에러 메시지 노출 | `src/components/pre-consult/ReferenceUpload.tsx:77` |
| medium/i18n | F9-preconsult | ReferenceUpload 확대/삭제 버튼 aria-label이 한국어 하드코딩 | `src/components/pre-consult/ReferenceUpload.tsx:160,170` |
| medium/awkward | F9-preconsult | 기본 카테고리 가격이 '+50,000원'으로 표시 — 추가금처럼 보임 | `src/app/pre-consult/[shopId]/confirm/page.tsx:595-605` |
| medium/awkward | F9-preconsult | 링크 에러 메시지가 최초 언어 설정(ko) 기준으로 고정 — 언어 변경 후에도 한국어 유지 | `src/app/pre-consult/[shopId]/page.tsx:49,83,85,92` |
| medium/edgecase | F9-preconsult | shopData null인데 가격 계산 섹션이 아예 없어 손님이 가격 모르고 접수 | `src/app/pre-consult/[shopId]/confirm/page.tsx:218-233, ` |
| low/i18n | F9-preconsult | 커스텀 파츠 이름이 외국인 손님에게 한국어 그대로 표시 | `src/app/pre-consult/[shopId]/confirm/page.tsx:549-551, ` |
| low/awkward | F9-preconsult | vibe/shape 섹션에 skip 없음 — 미결정 손님이 멈칫 | `src/components/pre-consult/VibeSelector.tsx, src/compon` |
| low/awkward | F9-preconsult | 새로고침 후 consult 페이지에서 upload 섹션 완료 판정 로직이 nailStatus 의존 | `src/app/pre-consult/[shopId]/consult/page.tsx:55` |
| medium/bug | F10-fieldmode | 옵션 선택 화면 랩핑 가격 표시가 샵 설정과 무관하게 하드코딩 5,000원 | `src/components/field-mode/QuickOptionsPanel.tsx:196` |
| medium/edgecase | F10-fieldmode | wrap-up 새로고침 시 afterPhotoUrls 소실 — 포트폴리오 저장 버튼 무용지물 | `src/store/field-mode-store.ts:270-273` |
| medium/i18n | F10-fieldmode | treatment/settlement/wrap-up 주요 UI 문자열이 i18n 우회 하드코딩 | `src/app/field-mode/treatment/page.tsx:176,178,232,325,3` |
| medium/edgecase | F10-fieldmode | 예약금이 시술금 초과해도 차단·경고 없음 — 고객 지출 통계 과산정 | `src/app/field-mode/settlement/page.tsx:195, 641-642, re` |
| low/awkward | F10-fieldmode | 정산 화면 뒤로가기에 확인 다이얼로그 없음 | `src/app/field-mode/settlement/page.tsx:422` |
| low/awkward | F10-fieldmode | 옵션 화면 커스텀 카테고리 선택 시 PriceBar 요약줄에 카테고리 이름 미표시 | `src/components/field-mode/PriceBar.tsx:34-38` |
| low/edgecase | F10-fieldmode | 직접 입력 예약금 '없음'과 '직접 입력' 버튼 활성 상태 중첩 혼란 | `src/app/field-mode/settlement/page.tsx:595-650` |
| medium/bug | F11-share | 이미지 저장 실패 시 사용자 피드백 없음 — 조용한 실패 | `src/app/share/[shareCardId]/ShareCardClient.tsx:105-108` |
| medium/bug | F11-share | iOS Safari에서 '이미지 저장' 버튼이 저장이 아닌 새 탭을 엶 | `src/app/share/[shareCardId]/ShareCardClient.tsx:99-104` |
| medium/i18n | F11-share | 공개 공유카드 페이지 다수 한국어 하드코딩 — 외국인 손님 대상 텍스트 | `src/app/share/[shareCardId]/ShareCardClient.tsx:66-67, ` |
| medium/edgecase | F11-share | 공유카드 모달 다운로드 — html2canvas 캡처 시점에 framer-motion 애니메이션이 진행 중일 수 있음 | `src/app/share/[shareCardId]/ShareCardClient.tsx:126-212` |
| low/i18n | F11-share | OG 메타데이터 타이틀 한국어 하드코딩 — 소셜 공유 미리보기 | `src/app/share/[shareCardId]/page.tsx:19-26` |
| low/i18n | F11-share | QR 페이지 전체 한국어 하드코딩 — i18n 미적용 | `src/app/qr/page.tsx:10-11, 17-18, 50-63, 124-125` |

## 보류 (의도적 / 신규기능 / 큰 작업)
- 비밀번호 찾기/재설정 (신규 기능)
- 포트폴리오 스와이프 제스처 (신규 기능)
- qr/page.tsx 전체 i18n · OG 메타 i18n · 공유카드 scope/shape 라벨 i18n (새 키 다수)
- StorageManagementSection 미연결 (의도된 데드코드 — 함부로 연결 안 함)
- 멀티 디자이너 3명+ 타임그리드 375px 협소 (레이아웃 재설계 필요)

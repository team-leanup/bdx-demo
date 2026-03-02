import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BDX 플랫폼 소개',
  description: '네일샵 현장 상담 & 고객 관리 플랫폼 데모',
};

export default function IntroDemoPage() {
  return (
    <div
      style={{ colorScheme: 'light', backgroundColor: '#ffffff', minHeight: '100vh' }}
      className="font-pretendard"
    >
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:px-8 md:py-16">

        {/* Title */}
        <h1 className="text-[2.5rem] font-bold text-gray-900 leading-tight mb-4">
          BDX — Beauty Decision eXperience
        </h1>

        {/* Subtitle blockquote */}
        <blockquote className="border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 italic rounded-r-md mb-6">
          네일샵 현장 상담 &amp; 고객 관리 플랫폼 데모
        </blockquote>

        {/* Metadata */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-8">
          <span className="text-sm text-gray-500">
            <strong className="font-semibold text-gray-700">데모 URL</strong>:{' '}
            <a
              href="https://bdx-demo.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb' }}
            >
              https://bdx-demo.vercel.app
            </a>
          </span>
          <span className="text-sm text-gray-500">
            <strong className="font-semibold text-gray-700">버전</strong>: v0.1.0 (데모)
          </span>
          <span className="text-sm text-gray-500">
            <strong className="font-semibold text-gray-700">최종 업데이트</strong>: 2026년 3월 2일
          </span>
        </div>

        <hr className="border-gray-200 my-12" />

        {/* Table of Contents */}
        <section id="toc">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            목차
          </h2>
          <nav className="bg-gray-50 rounded-xl p-6">
            <ol className="pl-6 mb-0 space-y-1.5 list-decimal">
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#bdx가-뭔가요" style={{ color: '#2563eb' }} className="hover:underline">
                  BDX가 뭔가요?
                </a>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#데모-사용-방법" style={{ color: '#2563eb' }} className="hover:underline">
                  데모 사용 방법
                </a>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#화면별-기능-안내" style={{ color: '#2563eb' }} className="hover:underline">
                  화면별 기능 안내
                </a>
                <ul className="pl-4 mt-1 space-y-1 list-none">
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#인증-온보딩" style={{ color: '#2563eb' }} className="hover:underline">
                      인증 &amp; 온보딩
                    </a>
                  </li>
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#홈" style={{ color: '#2563eb' }} className="hover:underline">
                      홈
                    </a>
                  </li>
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#상담-플로우" style={{ color: '#2563eb' }} className="hover:underline">
                      상담 플로우
                    </a>
                  </li>
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#시술-확인서" style={{ color: '#2563eb' }} className="hover:underline">
                      시술 확인서
                    </a>
                  </li>
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#기록-관리" style={{ color: '#2563eb' }} className="hover:underline">
                      기록 관리
                    </a>
                  </li>
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#고객-관리" style={{ color: '#2563eb' }} className="hover:underline">
                      고객 관리
                    </a>
                  </li>
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#대시보드" style={{ color: '#2563eb' }} className="hover:underline">
                      대시보드 (사장님 전용)
                    </a>
                  </li>
                  <li className="text-base text-gray-700 leading-[1.75]">
                    <a href="#설정" style={{ color: '#2563eb' }} className="hover:underline">
                      설정
                    </a>
                  </li>
                </ul>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#핵심-특징" style={{ color: '#2563eb' }} className="hover:underline">
                  핵심 특징
                </a>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#시술-메뉴-가격-체계" style={{ color: '#2563eb' }} className="hover:underline">
                  시술 메뉴 &amp; 가격 체계
                </a>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#테마-시스템" style={{ color: '#2563eb' }} className="hover:underline">
                  테마 시스템
                </a>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#기술-구성" style={{ color: '#2563eb' }} className="hover:underline">
                  기술 구성
                </a>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#데모-한계" style={{ color: '#2563eb' }} className="hover:underline">
                  데모 한계 &amp; 실제 서비스 차이점
                </a>
              </li>
              <li className="text-base text-gray-700 leading-[1.75]">
                <a href="#지원-기기" style={{ color: '#2563eb' }} className="hover:underline">
                  지원 기기
                </a>
              </li>
            </ol>
          </nav>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 1: BDX가 뭔가요? */}
        <section id="bdx가-뭔가요">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            BDX가 뭔가요?
          </h2>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            BDX는 네일샵에서 <strong className="font-semibold text-gray-900">고객 상담부터 시술 확인까지</strong> 한 번에 처리할 수 있는 태블릿/모바일 기반 플랫폼입니다.
          </p>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            기존에 종이나 카카오톡으로 주고받던 상담 내용을 <strong className="font-semibold text-gray-900">앱 하나로 체계적으로 관리</strong>할 수 있습니다.
          </p>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">이런 문제를 해결합니다</h3>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                    기존 방식
                  </th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                    BDX
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['카톡으로 디자인 사진 주고받기', '상담 화면에서 디자인/파츠/표현 기법을 체계적으로 선택'],
                  ['종이에 가격 수기 계산', <>옵션 선택만 하면 <strong className="font-semibold text-gray-900">가격 자동 계산</strong></>],
                  ['고객 취향을 기억에 의존', <>고객별 <strong className="font-semibold text-gray-900">시술 이력 + 선호도 + 스몰토크 메모</strong> 기록</>],
                  ['예약을 수첩/달력에 관리', <><strong className="font-semibold text-gray-900">주간 타임그리드 + 월간 캘린더</strong>로 디지털 관리</>],
                  ['매출을 엑셀로 수동 집계', <><strong className="font-semibold text-gray-900">대시보드에서 실시간 매출/고객 분석</strong></>],
                  ['외국인 고객 소통 어려움', <><strong className="font-semibold text-gray-900">4개 국어</strong> 상담 화면 자동 전환</>],
                ].map(([old, bdx], i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{old}</td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{bdx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 2: 데모 사용 방법 */}
        <section id="데모-사용-방법">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            데모 사용 방법
          </h2>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">빠른 시작</h3>
          <ol className="pl-6 mb-4 space-y-1.5 list-decimal">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">https://bdx-demo.vercel.app</strong> 접속
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              스플래시 화면 → 인트로 화면 → 로그인 화면 순서로 자동 진행
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              역할 선택 화면에서 <strong className="font-semibold text-gray-900">"사장님"</strong> 또는 <strong className="font-semibold text-gray-900">"직원"</strong> 선택
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              디자이너(선생님) 선택 후 <strong className="font-semibold text-gray-900">PIN: <code style={{ backgroundColor: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>1234</code></strong> 입력
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              홈 화면 진입 완료
            </li>
          </ol>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">체험 추천 경로</h3>
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm font-mono text-gray-800 overflow-x-auto border border-gray-100 mb-6">
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{`홈 → "새 상담 시작" 버튼 → 상담 5단계 체험 → 시술 확인서 확인
                                                    ↓
홈 → 하단 탭 "기록" → 예약/상담 기록 확인
                                                    ↓
홈 → 하단 탭 "대시보드" → 매출/분석 확인 (사장님 로그인 시만)
                                                    ↓
홈 → 하단 탭 "설정" → 테마 변경 체험`}</pre>
          </div>

          <blockquote className="border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 italic rounded-r-md mb-6">
            데모 데이터(고객, 예약, 상담 기록)가 미리 세팅되어 있어 바로 체험할 수 있습니다.
          </blockquote>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">데모 계정</h3>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['역할', '이름', 'PIN', '볼 수 있는 화면'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['사장님 (Owner)', '소율', '1234', '모든 화면 + 대시보드'],
                  ['직원 (Staff)', '도윤', '1234', '홈, 기록, 고객, 설정 (본인 고객/예약만)'],
                  ['직원 (Staff)', '하린', '1234', '홈, 기록, 고객, 설정 (본인 고객/예약만)'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 3: 화면별 기능 안내 */}
        <section id="화면별-기능-안내">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            화면별 기능 안내
          </h2>

          {/* 3-1: 인증 & 온보딩 */}
          <h3 id="인증-온보딩" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            1. 인증 &amp; 온보딩
          </h3>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">스플래시 &amp; 인트로</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              앱 시작 시 <strong className="font-semibold text-gray-900">BDX 브랜드 스플래시</strong> 화면 → 앱 소개 화면 자동 전환
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              "상담을 정리하는 가장 쉬운 방법" 태그라인
            </li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">로그인 (잠금 화면)</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">역할 기반 로그인</strong>: "사장님" / "직원" 중 선택
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              디자이너(선생님) 선택 → 4자리 PIN 입력
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              사장님은 <strong className="font-semibold text-gray-900">전체 데이터</strong> 접근, 직원은 <strong className="font-semibold text-gray-900">본인 데이터만</strong> 접근
            </li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">온보딩 (초기 설정, 7단계)</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            최초 사용 시 매장 기본 정보를 설정하는 마법사입니다.
          </p>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['단계', '화면', '설정 내용'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['1', '매장 정보', '매장 이름, 전화번호'],
                  ['2', '시술 카테고리', '제공하는 시술 종류 선택 (젤네일, 아크릴, 아트, 케어 등)'],
                  ['3', '기본 가격', '핸드/페디 기본가 설정'],
                  ['4', '추가금 설정', '오프, 연장, 그라데이션, 프렌치, 파츠 등 추가금'],
                  ['5', '소요시간', '시술 종류별 예상 소요 시간'],
                  ['6', '테마 선택', '매장 분위기에 맞는 앱 색상 테마'],
                  ['7', '완료', '설정 완료 확인'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr className="border-gray-200 my-12" />

          {/* 3-2: 홈 */}
          <h3 id="홈" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            2. 홈
          </h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            디자이너가 로그인하면 보이는 <strong className="font-semibold text-gray-900">메인 화면</strong>입니다.
          </p>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">시간대별 인사말</strong>: 오전/오후/저녁에 따라 다른 인사 표시
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">오늘의 통계</strong>: 상담 건수, 예약 건수, 매출 요약을 카드로 표시
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">오늘의 예약 목록</strong>: 당일 예약을 시간순으로 표시, 탭하면 바로 상담 시작
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">최근 상담 기록</strong>: 최근 4건의 상담 기록 빠른 접근
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">빠른 액션 버튼</strong>: 고객 관리 / 일정 / 대시보드 / 설정 바로가기
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">첫 방문 투어</strong>: 처음 사용 시 주요 기능을 안내하는 오버레이 가이드
            </li>
          </ul>

          <hr className="border-gray-200 my-12" />

          {/* 3-3: 상담 플로우 */}
          <h3 id="상담-플로우" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            3. 상담 플로우
          </h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            고객이 매장에 오면, 디자이너가 태블릿으로 아래 순서대로 상담을 진행합니다.
            <strong className="font-semibold text-gray-900"> 하단에 실시간 예상 가격</strong>이 표시되어, 고객과 함께 확인하며 진행할 수 있습니다.
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">시작 화면</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">담당 디자이너 선택</li>
            <li className="text-base text-gray-700 leading-[1.75]">고객 언어 선택 (한국어/영어/중국어/일본어)</li>
            <li className="text-base text-gray-700 leading-[1.75]">진행 중인 상담이 있으면 <strong className="font-semibold text-gray-900">이어하기</strong> 옵션 표시</li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">1단계: 고객 정보</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">고객 이름, 연락처 입력</li>
            <li className="text-base text-gray-700 leading-[1.75]">기존 고객 검색 및 자동 채우기</li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">2단계: 시술 기본 조건</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">시술 부위</strong>: 핸드 / 페디큐어(발)
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">오프(제거)</strong>: 없음 / 자샵오프 / 타샵오프
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">연장/리페어</strong>: 없음 / 리페어(개수 지정) / 연장
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">네일 쉐입</strong>: 7종 중 선택
              <ul className="pl-4 mt-1 space-y-0.5 list-none">
                <li className="text-base text-gray-700 leading-[1.75]">라운드 / 오발 / 스퀘어 / 스퀘어오프 / 아몬드 / 스틸레토 / 코핀(발레리나)</li>
              </ul>
            </li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">3단계: 디자인 범위</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">원컬러</strong>: 단색 심플 (추가금 없음)
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">단색+포인트</strong>: 단색에 포인트 아트 추가 (+₩10,000)
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">풀아트</strong>: 전체 손가락 아트 (+₩20,000)
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">이달의 아트</strong>: 이달의 추천 디자인 (+₩25,000)
            </li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">4단계: 추가 옵션</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">표현 기법</strong> (복수 선택 가능)
              <ul className="pl-4 mt-1 space-y-0.5 list-none">
                <li className="text-base text-gray-700 leading-[1.75]">기본(솔리드) / 그라데이션(+₩5,000) / 프렌치(+₩5,000) / 마그네틱·캣아이(+₩5,000)</li>
              </ul>
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">파츠 추가</strong>: 직접 입력 또는 등급별(S/A/B) 선택
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">추가 컬러</strong>: 추가 색상 수량 선택 (개당 ₩3,000)
            </li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">5단계: 네일 캔버스 (PRO)</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">손가락별 개별 시술 지정</strong>: 각 손가락을 탭하여 개별 설정
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">왼손/오른손/왼발/오른발 전환</li>
            <li className="text-base text-gray-700 leading-[1.75]">손가락별 색상 지정 + 파츠 배치</li>
            <li className="text-base text-gray-700 leading-[1.75]">포인트 손가락 지정</li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">최종 요약</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">가격 상세 분해표</strong>: 기본가 + 각 추가금 항목별 표시
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">할인 적용</strong>: 정액 할인 또는 퍼센트 할인 선택 가능
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">예약금(선입금)</strong> 차감 설정
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">최종 결제 금액</strong> + 예상 소요 시간 한눈에 확인
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">저장 버튼</strong>으로 기록에 자동 저장
            </li>
          </ul>

          <hr className="border-gray-200 my-12" />

          {/* 3-4: 시술 확인서 */}
          <h3 id="시술-확인서" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            4. 시술 확인서
          </h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            상담 완료 후 고객에게 보여주는 <strong className="font-semibold text-gray-900">최종 확인 문서</strong>입니다.
          </p>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">시술 체크리스트</strong>: 쉐입, 길이, 두께, 큐티클 민감도 등 항목별 체크
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">네일 디자인 탭</strong>: 손 일러스트와 함께 손가락별 시술 내용 표시
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">가격 &amp; 소요시간</strong>: 자동 계산된 금액과 예상 시간
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">메모</strong>: 특이사항 기록
            </li>
          </ul>
          <blockquote className="border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 italic rounded-r-md mb-4">
            "이렇게 시술할게요" — 고객에게 보여주며 최종 확인받는 용도
          </blockquote>

          <hr className="border-gray-200 my-12" />

          {/* 3-5: 기록 관리 */}
          <h3 id="기록-관리" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            5. 기록 관리
          </h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            과거 예약 및 상담 기록을 관리하는 화면입니다. <strong className="font-semibold text-gray-900">두 개의 독립 탭</strong>으로 구성됩니다.
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">예약 탭</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">주간 타임그리드</strong>: 일주일 단위로 시간대별 예약 블록 표시
              <ul className="pl-4 mt-1 space-y-0.5 list-none">
                <li className="text-base text-gray-700 leading-[1.75]">디자이너별 <strong className="font-semibold text-gray-900">다른 색상</strong>으로 구분</li>
                <li className="text-base text-gray-700 leading-[1.75]">"예약" / "상담" 유형별 뱃지</li>
                <li className="text-base text-gray-700 leading-[1.75]">현재 시간 <strong className="font-semibold text-gray-900">빨간 줄</strong>로 표시</li>
              </ul>
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">월간 캘린더</strong>: 한 달 전체 일정 한눈에 파악
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">일별 예약 목록</strong>: 특정 날짜의 예약을 타임라인 형태로 표시
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">예약 등록</strong>: 고객명, 연락처, 시간, 채널(카카오/네이버/전화/워크인), 담당 선생님 지정
            </li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">상담 탭</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">기간별 필터</strong>: 전체 / 오늘 / 이번 주 / 이번 달
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">검색</strong>: 고객명, 디자인 종류 등으로 검색
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">직원 모드</strong>: 직원은 "내 상담만 보기" 필터 자동 적용
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              상담 카드 탭 → <strong className="font-semibold text-gray-900">상세 기록</strong> 확인 (가격, 디자인, 표현, 체크리스트 등)
            </li>
          </ul>

          <hr className="border-gray-200 my-12" />

          {/* 3-6: 고객 관리 */}
          <h3 id="고객-관리" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            6. 고객 관리
          </h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            단골 고객의 정보를 체계적으로 관리합니다.
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">고객 목록</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">검색</strong>: 이름, 연락처, 담당 디자이너로 검색
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">필터 탭</strong>: 전체 / VIP / 일반
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">이달 통계</strong>: 신규 고객 수, 평균 객단가, VIP 수
            </li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">고객 상세</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">기본 정보</strong>: 이름, 연락처, 담당 디자이너
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">태그 시스템</strong>: 7개 카테고리별 취향 태그 부착
              <ul className="pl-4 mt-1 space-y-0.5 list-none">
                <li className="text-base text-gray-700 leading-[1.75]">디자인(심플, 글리터, 풀아트...), 쉐입(라운드, 아몬드...), 길이, 표현, 파츠, 색상, 기타</li>
              </ul>
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">선호도 기록</strong>: 선호 쉐입, 길이, 두께, 큐티클 민감도, 손톱 상태
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">스몰토크 메모</strong>: 상담 중 나눈 대화 메모
              <ul className="pl-4 mt-1 space-y-0.5 list-none">
                <li className="text-base text-gray-700 leading-[1.75]">예: "다음 달 결혼식 예정", "알러지 있음 — 아크릴 X"</li>
              </ul>
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">시술 이력</strong>: 과거 상담/시술 기록 전체 조회
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">멤버십</strong>: 회원권 세션 관리 (총 횟수, 사용 횟수, 잔여 횟수, 만료일)
            </li>
          </ul>

          <hr className="border-gray-200 my-12" />

          {/* 3-7: 대시보드 */}
          <h3 id="대시보드" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            7. 대시보드 (사장님 전용)
          </h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            <strong className="font-semibold text-gray-900">사장님(Owner) 로그인 시에만</strong> 접근 가능한 경영 분석 화면입니다.
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">KPI 카드 (6개)</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            이번 달 매출, 상담 건수, 평균 객단가, 신규 고객 수, 재방문율, 예약률
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">이번 주 요약</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            금주 매출, 상담 수, 평균 객단가를 <strong className="font-semibold text-gray-900">전주 대비</strong> 증감률과 함께 표시
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">매출 추이 차트</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            최근 매출 흐름을 <strong className="font-semibold text-gray-900">라인/바 차트</strong>로 시각화
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">선생님별 매출</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            디자이너별 매출, 상담 건수, 평균 객단가 비교
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">서비스 분석</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            가장 많이 선택된 디자인 범위, 표현 기법, 쉐입 등 분석
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">고객 분석</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            신규/재방문 비율, 고객 세그먼트 분포
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">시간대별 예약 분포</h4>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            요일/시간대별 예약 밀집도 히트맵
          </p>

          <hr className="border-gray-200 my-12" />

          {/* 3-8: 설정 */}
          <h3 id="설정" className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">
            8. 설정
          </h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            매장 운영에 필요한 설정을 <strong className="font-semibold text-gray-900">4개 탭</strong>으로 관리합니다.
          </p>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">매장 탭</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">매장 이름, 전화번호</li>
            <li className="text-base text-gray-700 leading-[1.75]">요일별 영업시간 설정 (휴무일 지정 가능)</li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">서비스 탭</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">시술 구조 토글 (제거, 그라데이션, 프렌치, 마그네틱, 포인트/풀아트, 파츠, 리페어, 오버레이, 연장)</li>
            <li className="text-base text-gray-700 leading-[1.75]">추가금 에디터: 항목별 가격 수정</li>
            <li className="text-base text-gray-700 leading-[1.75]">커스텀 파츠 관리: 매장에서 사용하는 파츠 등록/가격 설정</li>
            <li className="text-base text-gray-700 leading-[1.75]">디자인 프리셋 관리: 자주 사용하는 디자인 조합 템플릿 저장</li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">테마 탭</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">9종 컬러 테마 중 선택 (실시간 미리보기)</li>
            <li className="text-base text-gray-700 leading-[1.75]">매장 분위기에 맞는 앱 색상 변경</li>
          </ul>

          <h4 className="text-[1.1rem] font-semibold text-gray-800 mt-8 mb-2">앱 탭</h4>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">언어 설정 (한국어/영어/중국어/일본어)</li>
            <li className="text-base text-gray-700 leading-[1.75]">온보딩 다시 하기</li>
            <li className="text-base text-gray-700 leading-[1.75]">데이터 초기화</li>
          </ul>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 4: 핵심 특징 */}
        <section id="핵심-특징">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            핵심 특징
          </h2>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">1. 다국어 지원 (4개 국어)</h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            외국인 고객이 많은 매장을 위해 <strong className="font-semibold text-gray-900">한국어, 영어, 일본어, 중국어</strong>를 지원합니다.
            상담 시작 시 고객 언어를 선택하면 상담 화면이 해당 언어로 전환되고, 상담이 끝나면 원래 언어로 자동 복귀합니다.
          </p>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">2. 자동 가격 계산</h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            시술 부위, 디자인 범위, 표현 기법, 파츠를 선택할 때마다 <strong className="font-semibold text-gray-900">하단 바에 실시간 가격이 업데이트</strong>됩니다.
            최종 요약에서 할인/예약금까지 적용한 결제 금액을 확인할 수 있습니다.
          </p>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">3. 손가락별 개별 시술 지정</h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            네일 캔버스에서 <strong className="font-semibold text-gray-900">각 손가락마다 다른 시술</strong>을 지정할 수 있습니다.
            "엄지는 풀아트, 검지는 원컬러, 약지에 큐빅 3개" 같은 복잡한 주문도 깔끔하게 기록됩니다.
          </p>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">4. 디자이너별 색상 구분</h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            타임그리드에서 디자이너마다 <strong className="font-semibold text-gray-900">다른 색상</strong>으로 예약이 표시되어, 누가 언제 어떤 시술을 하는지 한눈에 파악할 수 있습니다.
          </p>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">5. 역할 기반 접근 제어</h3>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">사장님</strong>: 전체 고객, 전체 매출, 대시보드 접근 가능
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">직원</strong>: 본인 담당 고객과 예약만 확인 가능
            </li>
          </ul>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">6. 고객 취향 메모 시스템</h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            태그, 선호도, 스몰토크 메모로 고객 취향을 체계적으로 기록합니다.
            재방문 시 이전 시술 이력과 취향을 바로 확인하여 <strong className="font-semibold text-gray-900">맞춤 상담</strong>이 가능합니다.
          </p>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">7. 시술 확인서 자동 생성</h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            상담 완료 후 <strong className="font-semibold text-gray-900">시술 체크리스트 + 디자인 요약 + 가격</strong>이 한 장에 정리됩니다.
            고객에게 보여주며 최종 확인을 받는 워크플로우를 지원합니다.
          </p>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 5: 시술 메뉴 & 가격 체계 */}
        <section id="시술-메뉴-가격-체계">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            시술 메뉴 &amp; 가격 체계
          </h2>
          <blockquote className="border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 italic rounded-r-md mb-8">
            아래는 데모에 설정된 기본 가격입니다. 실제 서비스에서는 설정 화면에서 모두 변경 가능합니다.
          </blockquote>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">기본가</h3>
          <div className="overflow-x-auto mb-8">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['항목', '가격'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['핸드 기본', '₩60,000'],
                  ['페디큐어(발) 기본', '₩70,000'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">오프(제거) 추가금</h3>
          <div className="overflow-x-auto mb-8">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['항목', '추가금'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['없음', '-'],
                  ['자샵오프 (우리 매장에서 했던 것 제거)', '+₩5,000'],
                  ['타샵오프 (다른 매장에서 한 것 제거)', '+₩10,000'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">연장/리페어</h3>
          <div className="overflow-x-auto mb-8">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['항목', '추가금'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['없음', '-'],
                  ['리페어', '+₩3,000 / 개'],
                  ['연장', '+₩20,000'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">디자인 범위</h3>
          <div className="overflow-x-auto mb-8">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['범위', '설명', '추가금'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['원컬러', '단색 심플', '-'],
                  ['단색+포인트', '단색에 포인트 아트 추가', '+₩10,000'],
                  ['풀아트', '모든 손가락 아트 시술', '+₩20,000'],
                  ['이달의 아트', '이달의 추천 디자인', '+₩25,000'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">표현 기법 (복수 선택 가능)</h3>
          <div className="overflow-x-auto mb-8">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['기법', '추가금'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['기본(솔리드)', '-'],
                  ['그라데이션', '+₩5,000'],
                  ['프렌치', '+₩5,000'],
                  ['마그네틱/캣아이', '+₩5,000'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">파츠 (장식)</h3>
          <div className="overflow-x-auto mb-4">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['등급', '예시', '단가'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['S등급', '큐빅, 귀한 스톤, 특수 참', '₩3,000 / 개'],
                  ['A등급', '일반 스톤, 참, 호일 포인트', '₩2,000 / 개'],
                  ['B등급', '글리터, 쉘, 스티커', '₩1,000 / 개'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <blockquote className="border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 italic rounded-r-md mb-4">
            파츠 등급 시스템 외에 <strong className="font-semibold text-gray-700">직접 입력</strong> 방식도 지원합니다.
            설정에서 매장에서 자주 쓰는 파츠를 등록하면 빠른 선택 칩으로 표시됩니다.
          </blockquote>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">추가 컬러</h3>
          <div className="overflow-x-auto mb-8">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['항목', '단가'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>추가 색상</td>
                  <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>₩3,000 / 색</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">네일 쉐입 (7종)</h3>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            라운드 · 오발 · 스퀘어 · 스퀘어오프(스퀘벌) · 아몬드 · 스틸레토 · 코핀(발레리나)
          </p>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 6: 테마 시스템 */}
        <section id="테마-시스템">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            테마 시스템
          </h2>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            매장 분위기에 맞게 앱 전체 색상을 변경할 수 있습니다.
            설정 → 테마 탭에서 실시간 미리보기와 함께 선택합니다.
          </p>
          <div className="overflow-x-auto mb-4">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['테마', '이름', '분위기'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['🧡', '웜 코랄', '따뜻하고 생기 있는 다홍 톤'],
                  ['🩷', '로즈 핑크', '사랑스럽고 여성스러운 핑크 톤 (기본값)'],
                  ['☕', '모카 브라운', '클래식하고 고급스러운 브라운 톤'],
                  ['🤍', '퓨어 아이보리', '내추럴하고 부드러운 아이보리 톤'],
                  ['🫒', '올리브 그린', '자연스럽고 편안한 그린 톤'],
                  ['💙', '파스텔 블루', '시원하고 청량한 블루 톤'],
                  ['💜', '파스텔 라일락', '몽환적이고 은은한 라일락 톤'],
                  ['💎', '화이트 크리스탈', '모던하고 깔끔한 실버 톤'],
                  ['🖤', '클린 블랙', '세련되고 시크한 블랙 톤'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: j === 0 ? '1.125rem' : '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            테마를 변경하면 버튼, 뱃지, 배경, 텍스트 등 <strong className="font-semibold text-gray-900">앱 전체 UI가 해당 컬러에 맞게</strong> 일괄 변경됩니다.
          </p>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 7: 기술 구성 */}
        <section id="기술-구성">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            기술 구성
          </h2>
          <blockquote className="border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-gray-600 italic rounded-r-md mb-8">
            이 섹션은 기술적인 내용으로, 참고 수준으로 작성되었습니다.
          </blockquote>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">프레임워크 &amp; 라이브러리</h3>
          <div className="overflow-x-auto mb-8">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['기술', '용도'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Next.js 15 (App Router)', '웹 프레임워크'],
                  ['React 19', 'UI 라이브러리'],
                  ['TypeScript', '타입 안전성'],
                  ['Tailwind CSS 4', '스타일링'],
                  ['Zustand 5', '상태 관리 (로컬 저장)'],
                  ['Framer Motion 11', '애니메이션'],
                  ['Recharts 2', '대시보드 차트'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">데모 데이터 저장 방식</h3>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              현재 데모는 <strong className="font-semibold text-gray-900">서버/데이터베이스 없이</strong> 브라우저 로컬 스토리지에 데이터를 저장합니다.
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              상담 진행 중 데이터는 <strong className="font-semibold text-gray-900">세션 스토리지</strong>에 저장되어, 탭을 닫으면 초기화됩니다.
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              고객, 예약, 상담 기록 등은 <strong className="font-semibold text-gray-900">로컬 스토리지</strong>에 저장되어, 같은 브라우저에서는 유지됩니다.
            </li>
          </ul>

          <h3 className="text-[1.25rem] font-semibold text-gray-900 mt-10 mb-3">반응형 디자인</h3>
          <ul className="pl-6 mb-4 space-y-1.5 list-disc">
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">모바일</strong>: 하단 탭 바 네비게이션
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">태블릿</strong>: 최적화된 레이아웃 (상담용 주력 기기)
            </li>
            <li className="text-base text-gray-700 leading-[1.75]">
              <strong className="font-semibold text-gray-900">데스크톱</strong>: 사이드 네비게이션 + 넓은 콘텐츠 영역
            </li>
          </ul>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 8: 데모 한계 */}
        <section id="데모-한계">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            데모 한계 &amp; 실제 서비스 차이점
          </h2>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            현재 보시는 것은 <strong className="font-semibold text-gray-900">프론트엔드 데모</strong>입니다.
            향후 업데이트 시 아래 항목이 변경될 수 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['항목', '데모 (현재)', '실제 서비스'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['로그인', 'PIN 기반 간편 인증', '구글 소셜 로그인 + PIN'],
                  ['통계', '목업 데이터', '실제 매출/고객 데이터 기반 분석'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-gray-200 my-12" />

        {/* Section 9: 지원 기기 */}
        <section id="지원-기기">
          <h2 className="text-[1.75rem] font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
            지원 기기
          </h2>
          <div className="overflow-x-auto mb-6">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['기기', '용도', '추천도'].map((h) => (
                    <th key={h} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [<strong className="font-semibold text-gray-900" key="t">태블릿 (iPad 등)</strong>, '매장 내 상담', '★★★ 최적'],
                  ['모바일', '이동 중 확인', '★★☆'],
                  ['데스크톱', '관리자 분석', '★★★'],
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : 'rgba(249,250,251,0.5)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-base text-gray-700 leading-[1.75] mb-4">
            반응형 디자인으로 모든 화면 크기에서 사용 가능합니다.
            상담 플로우는 <strong className="font-semibold text-gray-900">태블릿 가로 모드</strong>에서 가장 편리합니다.
          </p>
        </section>

        {/* Footer */}
        <footer style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p className="text-sm text-gray-400">
            BDX — Beauty Decision eXperience &copy; 2026
          </p>
        </footer>

      </main>
    </div>
  );
}

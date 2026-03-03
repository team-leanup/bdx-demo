'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/cn';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const N = {
  bg: '#ffffff',
  surface: '#f7f6f3',
  surfaceHover: '#eeece9',
  text: '#37352f',
  textSecondary: '#787774',
  accent: '#2383e2',
  accentLight: '#e8f0fc',
  border: '#e5e5e5',
  borderStrong: '#d4d4d4',
  calloutBlue: '#eef4ff',
  calloutYellow: '#fffbeb',
  calloutGreen: '#f0fdf4',
  calloutRed: '#fff1f2',
  tableHeader: '#f7f6f3',
};

// ─── TOC Sections ─────────────────────────────────────────────────────────────
const TOC_ITEMS = [
  { id: 'overview', label: '1. 개요' },
  { id: 'accounts', label: '2. 데모 계정 안내' },
  { id: 'screens', label: '3. 데모 웹 화면 안내' },
  { id: 'screens-nav', label: '  3-0. 네비게이션 구조', indent: true },
  { id: 'screens-splash', label: '  3-1. 스플래시 & 첫 진입', indent: true },
  { id: 'screens-home', label: '  3-2. 홈', indent: true },
  { id: 'screens-consultation', label: '  3-3. 상담 플로우', indent: true },
  { id: 'screens-treatment', label: '  3-4. 시술 확인서', indent: true },
  { id: 'screens-records', label: '  3-5. 기록 관리', indent: true },
  { id: 'screens-customers', label: '  3-6. 고객 관리', indent: true },
  { id: 'screens-dashboard', label: '  3-7. 대시보드', indent: true },
  { id: 'screens-settings', label: '  3-8. 설정', indent: true },
  { id: 'mvp-checklist', label: '4. MVP 확인 사항' },
  { id: 'onboarding', label: '5. 온보딩' },
  { id: 'urls', label: '6. 전체 URL 목록' },
  { id: 'themes', label: '7. 테마 시스템' },
  { id: 'roadmap', label: '8. MVP 발전 부분' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'blue' | 'green' | 'yellow' }) {
  const styles: Record<string, React.CSSProperties> = {
    gray: { background: N.surface, color: N.textSecondary, border: `1px solid ${N.border}` },
    blue: { background: N.calloutBlue, color: N.accent, border: `1px solid #c2d8f8` },
    green: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    yellow: { background: N.calloutYellow, color: '#92400e', border: '1px solid #fde68a' },
  };
  return (
    <span
      style={{
        ...styles[color],
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function CodeBadge({ href, children }: { href?: string; children: React.ReactNode }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 6px',
    background: N.surface,
    border: `1px solid ${N.border}`,
    borderRadius: '3px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    color: N.accent,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>;
  }
  return <code style={style}>{children}</code>;
}

function UrlBadge({ path }: { path: string }) {
  const full = `https://bdx-demo.vercel.app${path}`;
  return (
    <CodeBadge href={full}>{full}</CodeBadge>
  );
}

function Callout({
  icon,
  children,
  type = 'blue',
}: {
  icon?: string;
  children: React.ReactNode;
  type?: 'blue' | 'yellow' | 'green' | 'red';
}) {
  const bgMap = { blue: N.calloutBlue, yellow: N.calloutYellow, green: N.calloutGreen, red: N.calloutRed };
  const borderMap = { blue: N.accent, yellow: '#f59e0b', green: '#22c55e', red: '#f43f5e' };
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '14px 16px',
        background: bgMap[type],
        borderLeft: `3px solid ${borderMap[type]}`,
        borderRadius: '4px',
        margin: '16px 0',
      }}
    >
      {icon && <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: '24px' }}>{icon}</span>}
      <div style={{ color: N.text, fontSize: '14px', lineHeight: '1.7' }}>{children}</div>
    </div>
  );
}

function SectionDivider() {
  return <hr style={{ border: 'none', borderTop: `1px solid ${N.border}`, margin: '40px 0' }} />;
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: '22px',
        fontWeight: 700,
        color: N.text,
        marginTop: '48px',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: `1px solid ${N.border}`,
        scrollMarginTop: '80px',
      }}
    >
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      style={{
        fontSize: '17px',
        fontWeight: 600,
        color: N.text,
        marginTop: '28px',
        marginBottom: '10px',
        scrollMarginTop: '80px',
      }}
    >
      {children}
    </h3>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: N.textSecondary, fontSize: '15px', lineHeight: '1.8', margin: '8px 0' }}>
      {children}
    </p>
  );
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul style={{ margin: '8px 0', paddingLeft: '0', listStyle: 'none' }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '4px 0',
            color: N.textSecondary,
            fontSize: '14px',
            lineHeight: '1.7',
          }}
        >
          <span style={{ color: N.accent, flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>●</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Table({
  headers,
  rows,
  highlight,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  highlight?: boolean;
}) {
  return (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13.5px',
          color: N.text,
        }}
      >
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: '8px 14px',
                  textAlign: 'left',
                  background: N.tableHeader,
                  fontWeight: 600,
                  fontSize: '12px',
                  color: N.textSecondary,
                  border: `1px solid ${N.border}`,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{ background: highlight && ri % 2 === 1 ? '#fafafa' : 'white' }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '9px 14px',
                    border: `1px solid ${N.border}`,
                    verticalAlign: 'top',
                    lineHeight: '1.6',
                    color: ci === 0 ? N.text : N.textSecondary,
                    fontWeight: ci === 0 ? 500 : 400,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThemeDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: color,
        border: `1px solid rgba(0,0,0,0.12)`,
        verticalAlign: 'middle',
        marginRight: '6px',
        flexShrink: 0,
      }}
    />
  );
}

function FeatureGrid() {
  const features = [
    { icon: '💬', title: '상담 구조화', desc: '고객과 함께 태블릿을 보며 단계별 선택, 실시간 예상 가격 계산' },
    { icon: '📋', title: '시술 확인서', desc: '상담 완료 후 자동 생성되는 시술 참고 문서' },
    { icon: '👤', title: '고객 관리', desc: '방문 이력, 선호도, 시술 성향을 기록하여 단골 고객 관리' },
    { icon: '📊', title: '매출 분석', desc: '원장님 전용 대시보드에서 KPI, 매출 추이, 선생님별 성과' },
    { icon: '🌐', title: '다국어 지원', desc: '한국어·영어·중국어·일본어 4개 국어로 상담 진행' },
    { icon: '🎨', title: '테마 시스템', desc: '9종 컬러 테마로 매장 분위기에 맞게 앱 디자인 변경' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px',
        margin: '16px 0',
      }}
    >
      {features.map((f) => (
        <div
          key={f.title}
          style={{
            padding: '16px',
            background: N.surface,
            borderRadius: '6px',
            border: `1px solid ${N.border}`,
          }}
        >
          <div style={{ fontSize: '22px', marginBottom: '8px' }}>{f.icon}</div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: N.text, marginBottom: '4px' }}>
            {f.title}
          </div>
          <div style={{ fontSize: '13px', color: N.textSecondary, lineHeight: '1.6' }}>{f.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ─── TOC Component ─────────────────────────────────────────────────────────────

function TOCSidebar({
  activeId,
  onNavigate,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav style={{ padding: '8px 0' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: N.textSecondary,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '12px',
          padding: '0 12px',
        }}
      >
        목차
      </div>
      {TOC_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: item.indent ? '3px 12px 3px 22px' : '4px 12px',
            fontSize: item.indent ? '12px' : '13px',
            fontWeight: activeId === item.id ? 600 : 400,
            color: activeId === item.id ? N.accent : item.indent ? N.textSecondary : N.text,
            background: activeId === item.id ? N.accentLight : 'transparent',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            lineHeight: '1.5',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (activeId !== item.id) {
              (e.currentTarget as HTMLButtonElement).style.background = N.surfaceHover;
            }
          }}
          onMouseLeave={(e) => {
            if (activeId !== item.id) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }
          }}
        >
          {item.label.trim()}
        </button>
      ))}
    </nav>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function IntroDemoPage() {
  const [activeId, setActiveId] = useState('overview');
  const [isTocOpen, setIsTocOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const navigateTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      setIsTocOpen(false);
    }
  }, []);

  useEffect(() => {
    const sectionIds = TOC_ITEMS.map((t) => t.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const aTop = a.boundingClientRect.top;
            const bTop = b.boundingClientRect.top;
            return aTop - bTop;
          });
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-60px 0px -60% 0px', threshold: 0 }
    );

    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const BASE = 'https://bdx-demo.vercel.app';

  return (
    <div style={{ background: N.bg, minHeight: '100vh', fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>

      {/* Mobile TOC overlay */}
      {isTocOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setIsTocOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '280px',
              background: N.bg,
              padding: '24px 12px',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsTocOpen(false)}
              style={{
                marginBottom: '16px',
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: N.textSecondary,
                fontSize: '20px',
              }}
            >
              ✕
            </button>
            <TOCSidebar activeId={activeId} onNavigate={navigateTo} />
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '52px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${N.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          zIndex: 40,
        }}
        className="lg:hidden"
      >
        <button
          onClick={() => setIsTocOpen(true)}
          style={{
            padding: '6px 8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: N.text,
            fontSize: '18px',
            lineHeight: 1,
          }}
        >
          ☰
        </button>
        <span style={{ marginLeft: '12px', fontSize: '15px', fontWeight: 600, color: N.text }}>
          BDX 데모 안내
        </span>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: 'flex',
          maxWidth: '1180px',
          margin: '0 auto',
        }}
      >
        {/* Desktop TOC sidebar */}
        <aside
          style={{
            width: '240px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
            padding: '40px 8px 40px 0',
            borderRight: `1px solid ${N.border}`,
          }}
          className="hidden lg:block"
        >
          <TOCSidebar activeId={activeId} onNavigate={navigateTo} />
        </aside>

        {/* Content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: '60px 56px 100px 56px',
            maxWidth: '900px',
          }}
          className="px-4 lg:px-14 pt-16 lg:pt-10"
        >
          {/* ── Cover / Header ── */}
          <header style={{ marginBottom: '48px' }}>
            {/* Logo */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px 6px 10px',
                background: N.surface,
                borderRadius: '6px',
                marginBottom: '24px',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: N.text,
                  fontFamily: 'inherit',
                }}
              >
                BDX
              </span>
              <span
                style={{
                  width: '1px',
                  height: '18px',
                  background: N.border,
                }}
              />
              <span style={{ fontSize: '12px', color: N.textSecondary, fontWeight: 500 }}>
                Beauty Decision eXperience
              </span>
            </div>

            {/* Page title */}
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: N.text,
                lineHeight: '1.2',
                letterSpacing: '-0.02em',
                marginBottom: '12px',
              }}
            >
              💅 BDX 데모 웹 안내
            </h1>

            <p
              style={{
                fontSize: '18px',
                color: N.textSecondary,
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              네일샵 현장 상담 &amp; 고객 관리 플랫폼
            </p>

            {/* Badges row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <a
                href={BASE}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: N.calloutBlue,
                  color: N.accent,
                  border: `1px solid #c2d8f8`,
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                🔗 bdx-demo.vercel.app
              </a>
              <Badge color="gray">v0.1.0 · 2026년 3월</Badge>
              <Badge color="yellow">📱 태블릿 (iPad 가로 모드) 추천</Badge>
              <Badge color="green">🖥️ 데스크톱 지원</Badge>
              <Badge color="gray">📲 모바일 지원</Badge>
            </div>
          </header>

          <SectionDivider />

          {/* ── Section 1: 개요 ── */}
          <section>
            <H2 id="overview">1. 개요</H2>
            <Para>
              BDX는 네일샵에서 고객 상담부터 가격 산출, 시술 기록, 고객 관리까지 전체 워크플로우를
              태블릿 하나로 처리할 수 있는 플랫폼입니다.
            </Para>
            <Para>
              본 데모 웹은 실제 서비스의 전체 흐름을 체험하실 수 있도록 제작된 프론트엔드
              프로토타입입니다. 데이터는 브라우저에 임시 저장되며, MVP 개발 시 서버 DB로 전환됩니다.
            </Para>
            <FeatureGrid />
          </section>

          <SectionDivider />

          {/* ── Section 2: 데모 계정 ── */}
          <section>
            <H2 id="accounts">2. 데모 계정 안내</H2>
            <Para>
              데모는 온보딩이 완료된 상태로, 잠금 화면에서 바로 시작합니다. 역할을 선택하고
              선생님을 고른 후 비밀번호를 입력하면 됩니다.
            </Para>

            <Callout icon="🔐" type="blue">
              <strong>로그인 방법</strong>
              <br />
              잠금 화면(<UrlBadge path="/auth/lock" />) 접속 → 역할 선택 → 선생님 선택 →
              PIN 입력 (아래 표 참고)
            </Callout>

            <Table
              headers={['역할', '이름', 'PIN', '접근 권한']}
              rows={[
                [
                  <Badge key="owner" color="yellow">원장님</Badge>,
                  '소율',
                  <CodeBadge key="pin1">1234</CodeBadge>,
                  '모든 화면 + 대시보드 + 설정 전체',
                ],
                [
                  <Badge key="staff1" color="gray">직원</Badge>,
                  '도윤',
                  <CodeBadge key="pin2">1234</CodeBadge>,
                  '본인 고객/예약만 접근',
                ],
                [
                  <Badge key="staff2" color="gray">직원</Badge>,
                  '하린',
                  <CodeBadge key="pin3">1234</CodeBadge>,
                  '본인 고객/예약만 접근',
                ],
              ]}
            />

            <Callout icon="💡" type="yellow">
              <strong>원장님으로 로그인하시면 모든 기능을 체험하실 수 있습니다.</strong>
              <br />
              직원 계정은 본인이 담당하는 고객, 예약, 상담 기록만 조회할 수 있으며, 다른 선생님의
              데이터나 대시보드는 접근할 수 없습니다.
            </Callout>
          </section>

          <SectionDivider />

          {/* ── Section 3: 화면 안내 ── */}
          <section>
            <H2 id="screens">3. 데모 웹 화면 안내</H2>
            <Para>선생님이 고객과 태블릿을 함께 보며 진행하는 각 화면의 구조와 URL 안내입니다.</Para>

            {/* 3-0 네비게이션 */}
            <H3 id="screens-nav">3-0. 네비게이션 구조</H3>
            <Para>
              데스크톱/태블릿에서는 좌측 사이드 네비게이션, 모바일에서는 하단 탭 바로 전환됩니다.
              상담 플로우 진행 중에는 네비게이션이 숨겨지고 상담 전용 UI로 전환됩니다.
            </Para>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '12px 0' }}>
              <div style={{ padding: '14px', background: N.surface, borderRadius: '6px', border: `1px solid ${N.border}` }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: N.text, marginBottom: '8px' }}>
                  🖥️ 사이드 네비게이션 (데스크톱/태블릿)
                </div>
                <BulletList items={['상단: BDX 로고', '홈, 기록, 고객, 대시보드, 설정', '하단: 언어 전환']} />
              </div>
              <div style={{ padding: '14px', background: N.surface, borderRadius: '6px', border: `1px solid ${N.border}` }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: N.text, marginBottom: '8px' }}>
                  📱 하단 탭 바 (모바일)
                </div>
                <BulletList items={['동일한 5개 메뉴', '홈, 기록, 고객, 대시보드, 설정']} />
              </div>
            </div>

            {/* 3-1 스플래시 */}
            <H3 id="screens-splash">3-1. 스플래시 &amp; 첫 진입 화면</H3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: N.textSecondary }}>URL</span>
              <UrlBadge path="/auth/splash" />
            </div>
            <Para>
              앱에 처음 접속하면 BDX 로고와 "상담을 정리하는 가장 쉬운 방법" 메시지가 표시되는
              스플래시 화면이 나타납니다. 5초 후 자동으로 다음 화면으로 전환됩니다.
            </Para>
            <Table
              headers={['화면', 'URL']}
              rows={[
                ['스플래시', <UrlBadge key="s1" path="/auth/splash" />],
                ['인트로 슬라이드', <UrlBadge key="s2" path="/auth/intro" />],
                ['로그인 / 회원가입', <UrlBadge key="s3" path="/auth/login" />],
                ['잠금 화면 (데모 시작점)', <UrlBadge key="s4" path="/auth/lock" />],
              ]}
            />

            {/* 3-2 홈 */}
            <H3 id="screens-home">3-2. 홈</H3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: N.textSecondary }}>URL</span>
              <UrlBadge path="/home" />
            </div>
            <Para>로그인 후 첫 화면. 매장명, 인사말, 역할 뱃지가 표시됩니다.</Para>
            <BulletList
              items={[
                <>
                  <strong>새 상담 / 새 예약 등록</strong>: 메인 버튼으로 바로 상담 시작 또는 예약 등록
                </>,
                <>
                  <strong>오늘의 예약</strong>: 시간순 목록, 탭하면 바로 상담 시작
                </>,
                <>
                  <strong>최근 상담 기록</strong>: 최근 4건 빠르게 확인
                </>,
                <>
                  <strong>오늘 요약</strong>: 오늘 상담 건수, 예약 건수, 매출
                </>,
              ]}
            />

            {/* 3-3 상담 플로우 */}
            <H3 id="screens-consultation">3-3. 상담 플로우 (핵심 기능)</H3>
            <Para>
              선생님이 고객과 태블릿을 함께 보며 진행하는 핵심 플로우. 화면 하단에 실시간 예상 가격
              표시.
            </Para>
            <Table
              headers={['단계', '화면', '설명', 'URL']}
              rows={[
                ['시작', '상담 시작', '담당 선생님 선택, 상담 언어 선택', <UrlBadge key="c0" path="/consultation" />],
                ['1', '고객 정보', '고객명, 연락처, 참고 이미지 첨부', <UrlBadge key="c1" path="/consultation/customer" />],
                ['2', '기본 조건', '시술 부위, 오프, 연장/리페어, 네일 쉐입', <UrlBadge key="c2" path="/consultation/step1" />],
                ['3', '디자인 범위', '원컬러/단색+포인트/풀아트/이달의 아트', <UrlBadge key="c3" path="/consultation/step2" />],
                ['4', '추가 옵션', '표현 기법, 파츠(장식), 추가 컬러', <UrlBadge key="c4" path="/consultation/step3" />],
                ['✨', '네일 캔버스', '손가락별 개별 색상/아트/파츠 지정', <UrlBadge key="c5" path="/consultation/canvas" />],
                ['✅', '최종 요약', '전체 상담 요약 + 가격 분해표 + 할인 적용', <UrlBadge key="c6" path="/consultation/summary" />],
              ]}
              highlight
            />

            {/* 3-4 시술 확인서 */}
            <H3 id="screens-treatment">3-4. 시술 확인서</H3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: N.textSecondary }}>URL</span>
              <UrlBadge path="/consultation/treatment-sheet" />
            </div>
            <Para>시술 과정에 참고하실 수 있는 확인서.</Para>
            <BulletList
              items={[
                '시술 내용 & 가격 & 소요시간',
                '당일 시술 체크리스트: 쉐입, 길이, 두께, 큐티클 민감도',
                '네일 디자인: 손 일러스트 + 손가락별 시술 내용',
                '참고 이미지',
                '메모: 특이사항 기록',
              ]}
            />

            {/* 3-5 기록 관리 */}
            <H3 id="screens-records">3-5. 기록 관리</H3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: N.textSecondary }}>URL</span>
              <UrlBadge path="/records" />
            </div>
            <Para>2개의 탭으로 구성됩니다.</Para>
            <BulletList
              items={[
                <><strong>예약 관리 탭</strong>: 주간 타임그리드 / 월간 캘린더</>,
                <><strong>상담 기록 탭</strong>: 고객명/전화번호 검색, 기간별 필터</>,
              ]}
            />

            {/* 3-6 고객 관리 */}
            <H3 id="screens-customers">3-6. 고객 관리</H3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: N.textSecondary }}>URL</span>
              <UrlBadge path="/customers" />
            </div>
            <Para>고객별 상세 페이지 구성 요소:</Para>
            <BulletList
              items={[
                <>
                  <strong>기본 정보</strong>: 이름, 단골 여부, 연락처, 담당 선생님
                </>,
                <>
                  <strong>선호도 프로필</strong>: 선호 쉐입, 길이, 두께감, 큐티클 상태
                </>,
                <>
                  <strong>이미지 갤러리</strong>: 시술/상담 사진 업로드 및 관리
                </>,
                <>
                  <strong>시술 이력</strong>: 과거 상담 타임라인
                </>,
                <>
                  <strong>시술 성향 태그</strong>
                </>,
                <>
                  <strong>고객 메모</strong>: 스몰토크 메모
                </>,
              ]}
            />

            {/* 3-7 대시보드 */}
            <H3 id="screens-dashboard">3-7. 대시보드 (원장님 전용)</H3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: N.textSecondary }}>URL</span>
              <UrlBadge path="/dashboard" />
            </div>
            <BulletList
              items={[
                <>
                  <strong>KPI 카드</strong>: 이번 달 매출, 상담 건수, 평균 객단가, 신규 고객
                </>,
                '매출 추이 차트',
                '선생님별 매출',
                '시간대별 예약 히트맵',
                '인기 시술 Top 3, 단골 방문율, 피크타임, 고객 분석',
              ]}
            />

            {/* 3-8 설정 */}
            <H3 id="screens-settings">3-8. 설정</H3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: N.textSecondary }}>URL</span>
              <UrlBadge path="/settings" />
            </div>
            <Para>4개 탭 (직원은 테마와 앱 탭만 접근 가능):</Para>
            <Table
              headers={['탭', '내용', '접근']}
              rows={[
                ['매장', '매장 이름, 전화번호, 주소, 영업시간, 선생님 관리', <Badge key="r1" color="yellow">원장님 전용</Badge>],
                ['서비스', '가격표, 커스텀 파츠 관리, 디자인 프리셋 관리', <Badge key="r2" color="yellow">원장님 전용</Badge>],
                ['테마', '9종 컬러 테마 실시간 미리보기 및 변경', <Badge key="r3" color="green">전체</Badge>],
                ['앱', '언어 설정, 비밀번호 변경, 사용 가이드, 로그아웃', <Badge key="r4" color="green">전체</Badge>],
              ]}
            />
          </section>

          <SectionDivider />

          {/* ── Section 4: MVP 확인 사항 ── */}
          <section>
            <H2 id="mvp-checklist">4. MVP 개발 전 확인 사항</H2>
            <Table
              headers={['항목', '확인이 필요한 내용']}
              rows={[
                ['가격 체계', '현재 데모는 기본가 + 추가금 구조. MVP에서는 파츠별·디자인별 정확한 단가 필요.'],
                ['Pro 모드', '별도 구독 상품으로 분리할지, 전체 사용자에게 제공할지 결정 필요.'],
                ['대시보드 KPI', '정확한 가격 체계가 전제되어야 신뢰할 수 있는 KPI.'],
                ['디자인 프리셋', '자주 사용하는 디자인 조합을 프리셋으로 등록하고 가격 연동 여부.'],
              ]}
              highlight
            />
            <Callout icon="⚠️" type="yellow">
              <strong>핵심:</strong> 가격 범위가 아닌 <strong>정확한 가격 체계</strong>가 전체 시스템의 기반입니다.
            </Callout>
          </section>

          <SectionDivider />

          {/* ── Section 5: 온보딩 ── */}
          <section>
            <H2 id="onboarding">5. 온보딩</H2>
            <Para>
              데모는 온보딩이 완료된 상태입니다. 실제 서비스에서는 아래 단계를 순서대로 진행하여
              매장 설정을 완료합니다.
            </Para>
            <Table
              headers={['단계', '화면', '설정 내용', 'URL']}
              rows={[
                ['1', '매장 정보', '매장 이름, 전화번호, 주소, 영업시간', <UrlBadge key="o1" path="/onboarding/shop-info" />],
                ['2', '서비스 선택', '네일, 페디, 추가 서비스 카테고리', <UrlBadge key="o2" path="/onboarding/services" />],
                ['3', '기본 가격', '핸드 기본가, 페디큐어, 오프 가격', <UrlBadge key="o3" path="/onboarding/pricing" />],
                ['4', '추가금 설정', '그라데이션, 프렌치, 마그네틱, 아트 등', <UrlBadge key="o4" path="/onboarding/surcharges" />],
                ['5', '시술 시간', '서비스별 평균 소요 시간', <UrlBadge key="o5" path="/onboarding/time" />],
                ['6', '테마 선택', '9종 컬러 테마 중 선택', <UrlBadge key="o6" path="/onboarding/theme" />],
                ['7', '완료', '설정 요약 확인 → 홈으로 이동', <UrlBadge key="o7" path="/onboarding/complete" />],
              ]}
              highlight
            />
          </section>

          <SectionDivider />

          {/* ── Section 6: 전체 URL ── */}
          <section>
            <H2 id="urls">6. 전체 URL 목록</H2>

            <H3>인증 / 첫 진입</H3>
            <Table
              headers={['화면', 'URL']}
              rows={[
                ['스플래시', <UrlBadge key="a1" path="/auth/splash" />],
                ['인트로 슬라이드', <UrlBadge key="a2" path="/auth/intro" />],
                ['로그인 / 회원가입', <UrlBadge key="a3" path="/auth/login" />],
                ['잠금 화면 (데모 시작점)', <UrlBadge key="a4" path="/auth/lock" />],
              ]}
            />

            <H3>메인 화면</H3>
            <Table
              headers={['화면', 'URL']}
              rows={[
                ['홈', <UrlBadge key="u1" path="/home" />],
                ['기록 관리', <UrlBadge key="u2" path="/records" />],
                ['고객 목록', <UrlBadge key="u3" path="/customers" />],
                ['대시보드', <UrlBadge key="u4" path="/dashboard" />],
                ['설정', <UrlBadge key="u5" path="/settings" />],
              ]}
            />

            <H3>상담 플로우</H3>
            <Table
              headers={['화면', 'URL']}
              rows={[
                ['상담 시작', <UrlBadge key="f1" path="/consultation" />],
                ['고객 정보', <UrlBadge key="f2" path="/consultation/customer" />],
                ['기본 조건', <UrlBadge key="f3" path="/consultation/step1" />],
                ['디자인 범위', <UrlBadge key="f4" path="/consultation/step2" />],
                ['추가 옵션', <UrlBadge key="f5" path="/consultation/step3" />],
                ['네일 캔버스', <UrlBadge key="f6" path="/consultation/canvas" />],
                ['최종 요약', <UrlBadge key="f7" path="/consultation/summary" />],
                ['Pro 모드', <UrlBadge key="f8" path="/consultation/pro" />],
                ['시술 확인서', <UrlBadge key="f9" path="/consultation/treatment-sheet" />],
                ['저장 완료', <UrlBadge key="f10" path="/consultation/save-complete" />],
              ]}
            />
          </section>

          <SectionDivider />

          {/* ── Section 7: 테마 ── */}
          <section>
            <H2 id="themes">7. 테마 시스템</H2>
            <Para>
              9종 컬러 테마로 매장 분위기에 맞게 앱 디자인을 실시간으로 변경할 수 있습니다.
              설정 탭에서 미리보기 후 적용 가능.
            </Para>
            <Table
              headers={['테마', '분위기', '컬러']}
              rows={[
                [
                  <span key="t1" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#E8725C" />웜 코랄</span>,
                  '따뜻한 다홍',
                  <CodeBadge key="c1">#E8725C</CodeBadge>,
                ],
                [
                  <span key="t2" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#E8A0BF" />로즈 핑크</span>,
                  '사랑스러운 핑크 (기본)',
                  <CodeBadge key="c2">#E8A0BF</CodeBadge>,
                ],
                [
                  <span key="t3" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#A0785A" />모카 브라운</span>,
                  '클래식 브라운',
                  <CodeBadge key="c3">#A0785A</CodeBadge>,
                ],
                [
                  <span key="t4" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#E8D5B7" />퓨어 아이보리</span>,
                  '부드러운 아이보리',
                  <CodeBadge key="c4">#E8D5B7</CodeBadge>,
                ],
                [
                  <span key="t5" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#7D9B76" />올리브 그린</span>,
                  '편안한 그린',
                  <CodeBadge key="c5">#7D9B76</CodeBadge>,
                ],
                [
                  <span key="t6" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#7EB3D8" />파스텔 블루</span>,
                  '청량한 블루',
                  <CodeBadge key="c6">#7EB3D8</CodeBadge>,
                ],
                [
                  <span key="t7" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#B39DDB" />파스텔 라일락</span>,
                  '몽환적 라일락',
                  <CodeBadge key="c7">#B39DDB</CodeBadge>,
                ],
                [
                  <span key="t8" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#C0C0C0" />화이트 크리스탈</span>,
                  '모던 실버',
                  <CodeBadge key="c8">#C0C0C0</CodeBadge>,
                ],
                [
                  <span key="t9" style={{ display: 'flex', alignItems: 'center' }}><ThemeDot color="#2D2D2D" />클린 블랙</span>,
                  '시크한 블랙',
                  <CodeBadge key="c9">#2D2D2D</CodeBadge>,
                ],
              ]}
              highlight
            />
          </section>

          <SectionDivider />

          {/* ── Section 8: 로드맵 ── */}
          <section>
            <H2 id="roadmap">8. MVP에서 발전될 부분</H2>
            <Para>
              현재 데모는 프론트엔드 프로토타입입니다. MVP에서 아래 항목들이 완전히 구현됩니다.
            </Para>
            <Table
              headers={['항목', '현재 (데모)', 'MVP에서 발전']}
              rows={[
                ['데이터 저장', '브라우저 로컬 스토리지', '서버 DB 연동'],
                ['로그인', '로그인 UI만 구현', '완전 구현 (구글 로그인 포함)'],
                ['계정 전환', '앱 재시작 필요', '잠금 화면에서 빠른 전환'],
                ['가격 체계', '기본가 + 추가금', '파츠/디자인별 정확한 단가'],
                ['상담 플로우', '기본 구현', '피드백 반영 고도화'],
                ['Pro 모드', '기본 구현', '피드백 반영 고도화'],
                ['통계', '목업 데이터', '실제 데이터 기반'],
              ]}
              highlight
            />
            <Callout icon="🚀" type="green">
              MVP 개발은 이 데모에서 확인한 피드백을 기반으로 진행됩니다. 체험 후 의견을 공유해
              주시면 반영하겠습니다.
            </Callout>
          </section>

          {/* ── Footer ── */}
          <footer
            style={{
              marginTop: '64px',
              paddingTop: '24px',
              borderTop: `1px solid ${N.border}`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: N.textSecondary }}>
              BDX 데모 v0.1.0 &nbsp;·&nbsp; 2026년 3월
            </p>
            <a
              href={BASE}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', color: N.accent, textDecoration: 'none' }}
            >
              bdx-demo.vercel.app
            </a>
          </footer>
        </main>
      </div>

      {/* Responsive overrides via style tag */}
      <style>{`
        @media (max-width: 1023px) {
          .hidden.lg\\:block { display: none !important; }
          .lg\\:hidden { display: flex !important; }
          main { padding-left: 20px !important; padding-right: 20px !important; padding-top: 68px !important; }
        }
        @media (min-width: 1024px) {
          .lg\\:hidden { display: none !important; }
          .hidden.lg\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}

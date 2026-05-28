/**
 * BDX 현황표 자동 동기화 (Google Apps Script)
 *
 * 구글 시트에서 [확장 프로그램] → [Apps Script] 열고 본 파일 내용 붙여넣기.
 *
 * 1. Project Settings → Script properties 에 다음 키 추가:
 *    - SUPABASE_URL = https://pzwmqorvrhdkckkdqemo.supabase.co
 *    - SUPABASE_ANON_KEY = (Supabase Dashboard → Settings → API → anon key)
 *    - SUPABASE_SERVICE_KEY = (Supabase Dashboard → Settings → API → service_role)
 *      ※ 샵별 상세 테이블이 필요 없으면 SERVICE_KEY 생략 가능
 *
 * 2. 실행 → syncAll() 1회 수동 실행 (권한 승인)
 *
 * 3. 트리거 설정 (시계 아이콘):
 *    - 함수: syncAll
 *    - 이벤트: 시간 기반 → 시간 마다 / 일 단위 등 원하는 주기
 */

const SHEET_OVERVIEW = '전체 현황';
const SHEET_SHOPS = '샵별 현황';

function syncAll() {
  syncOverview();
  syncShopStats();
}

function syncOverview() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY 가 Script properties 에 설정되지 않았습니다.');

  const res = UrlFetchApp.fetch(`${url}/rest/v1/rpc/get_bdx_admin_stats`, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    payload: '{}',
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`Supabase RPC 실패: ${res.getResponseCode()} ${res.getContentText()}`);
  }
  const stats = JSON.parse(res.getContentText());

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_OVERVIEW) || ss.insertSheet(SHEET_OVERVIEW);
  sheet.clear();

  const rows = [
    ['항목', '값'],
    ['최종 갱신', formatDate_(stats.generated_at)],
    ['', ''],
    ['── 가입 현황 ──', ''],
    ['전체 가입 계정 (auth.users)', stats.auth_users_total],
    ['  최근 7일 가입', stats.signups_last_7d],
    ['  최근 30일 가입', stats.signups_last_30d],
    ['샵 (shops)', stats.shops_total],
    ['디자이너', stats.designers_total],
    ['', ''],
    ['── 활동 ──', ''],
    ['고객', stats.customers_total],
    ['상담 기록', stats.consultations_total],
    ['예약', stats.bookings_total],
    ['사전 상담', stats.pre_consultations_total],
    ['포트폴리오 사진', stats.portfolio_photos_total],
    ['회원권 상품', stats.membership_plans_total],
    ['회원권 거래', stats.membership_transactions_total],
    ['', ''],
    ['── 스토리지 ──', ''],
    ['총 객체 수', stats.storage_objects_total],
    ['총 사용량', `${formatBytes_(stats.storage_bytes_total)} / 1 GB (${((stats.storage_bytes_total / (1024 * 1024 * 1024)) * 100).toFixed(2)}%)`],
    ['Supabase Free 한도', '1 GB (= 1,073,741,824 B)'],
  ];

  if (Array.isArray(stats.storage_by_bucket)) {
    stats.storage_by_bucket.forEach((b) => {
      rows.push([`  ${b.bucket_id}`, `${b.object_count}개 / ${formatBytes_(b.bytes)}`]);
    });
  }

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 200);
  sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#222').setFontColor('#fff');
  ['A4', 'A11', 'A20'].forEach((a) => sheet.getRange(a).setFontWeight('bold').setBackground('#f1f3f5'));
}

function syncShopStats() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) {
    Logger.log('SUPABASE_SERVICE_KEY 미설정 → 샵별 현황 동기화 스킵');
    return;
  }

  const res = UrlFetchApp.fetch(`${url}/rest/v1/rpc/get_bdx_shop_stats`, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    payload: '{}',
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`Supabase RPC 실패: ${res.getResponseCode()} ${res.getContentText()}`);
  }
  const shops = JSON.parse(res.getContentText());

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SHOPS) || ss.insertSheet(SHEET_SHOPS);
  sheet.clear();

  const header = [
    '가입일', '샵 ID', '샵 이름', '오너 이메일',
    '고객수', '디자이너수', '상담', '예약', '포트폴리오', '스토리지',
  ];
  const rows = [header].concat(
    shops.map((s) => [
      formatDate_(s.created_at),
      s.shop_id,
      s.shop_name,
      s.owner_email || '',
      s.customers_count,
      s.designers_count,
      s.consultations_count,
      s.bookings_count,
      s.portfolio_photos_count,
      formatBytes_(s.storage_bytes),
    ]),
  );

  sheet.getRange(1, 1, rows.length, header.length).setValues(rows);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#222').setFontColor('#fff');
  sheet.setFrozenRows(1);
  const widths = [140, 240, 180, 240, 80, 100, 80, 80, 100, 110];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
}

function formatBytes_(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = Number(bytes);
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate_(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
}

import Link from 'next/link';

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-xl font-bold text-text">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-text-secondary">요청하신 페이지가 존재하지 않거나 이동되었어요.</p>
      <Link
        href="/home"
        className="mt-4 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all active:scale-[0.97]"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

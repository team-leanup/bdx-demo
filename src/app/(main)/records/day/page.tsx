import { redirect } from 'next/navigation';

export default function RecordsDayPage(): never {
  redirect('/records?view=day');
}

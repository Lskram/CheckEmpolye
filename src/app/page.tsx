import { redirect } from 'next/navigation';

export default function RootPage() {
  // Direct auto-redirect to Executive Management Dashboard
  redirect('/admin');
}

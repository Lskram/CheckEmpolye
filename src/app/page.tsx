import { redirect } from 'next/navigation';

export default function RootPage() {
  // Direct auto-redirect to Employee Check-In Portal for pure mobile PWA experience
  // Admin dashboard is kept strictly isolated at /admin
  redirect('/employee');
}

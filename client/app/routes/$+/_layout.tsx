import { Outlet } from '@remix-run/react';
import HandsomeError from '~/components/HandsomeError';

export const ErrorBoundary = () => <HandsomeError basePath='/' />;

export default function Layout() {
  return <Outlet />;
}

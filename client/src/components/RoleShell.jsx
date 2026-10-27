import Layout from './Layout';
import ParentNavbar from './ParentNavbar';

// Page frame for screens shared by every role: parents get their navbar, staff the portal layout
export default function RoleShell({ role, children }) {
  if (role === 'parent') {
    return (
      <div style={{ minHeight: '100vh', background: '#f0fdff' }}>
        <ParentNavbar />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 90px' }}>{children}</div>
      </div>
    );
  }
  return <Layout role={role}>{children}</Layout>;
}

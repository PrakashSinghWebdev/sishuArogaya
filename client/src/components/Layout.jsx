import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children, role }) => {
  return (
    <div className="d-flex">
      <Sidebar role={role} />
      <div className="main-content flex-grow-1">
        <Topbar />
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Layout;

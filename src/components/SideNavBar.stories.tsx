import React from 'react';
import type { Meta } from '@storybook/react';
import SideNavBar from './SideNavBar.js';

const meta: Meta<typeof SideNavBar> = {
  title: 'XDS/SideNavBar',
  component: SideNavBar,
};

export default meta;

export const Default = () => {
  return (
    <div style={{ background: '#071129', minHeight: '100vh', padding: 20 }}>
      <SideNavBar />
    </div>
  );
};

export const WithLogout = () => {
  return (
    <div style={{ background: '#071129', minHeight: '100vh', padding: 20 }}>
      <SideNavBar
        title="Ensured Marketplace"
        subtitle="Institutional Session"
        isOpen
        onLogout={() => {
          window.alert('Signed out');
        }}
      />
    </div>
  );
};

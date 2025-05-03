// client/src/components/Sidebar/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaChartBar, FaCog, FaMoneyBill } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ expandedGroup, setExpandedGroup }) => {
  const navigate = useNavigate();

  const toggleGroup = (group) => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  const handleHomeClick = () => {
    navigate('/');
    setExpandedGroup(null);
  };

  const sidebarGroups = [
    {
      name: 'Home',
      icon: <FaHome />,
      isDirectLink: true,
    },
    {
      name: 'Management',
      icon: <FaChartBar />,
      subPages: [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Product Manager', path: '/product-manager' },
        { name: 'Stock Management', path: '/stock-management' },
        { name: 'Customers', path: '/customers' },
        { name: 'Suppliers', path: '/suppliers' },
        { name: 'Accounting', path: '/accounting' },
        { name: 'Reports', path: '/reports' },
      ],
    },
    {
      name: 'Settings',
      icon: <FaCog />,
      subPages: [
        { name: 'Company Info', path: '/settings' },
        { name: 'Customize Receipt', path: '/receipt-format' },
        { name: 'Document Format', path: '/document-format' },
        { name: 'Tax Rates', path: '/tax-rates' },
        { name: 'Backup Tools', path: '/backup' },
        { name: 'Users', path: '/users' },
      ],
    },
    {
      name: 'Sales Manager',
      icon: <FaMoneyBill />,
      subPages: [
        { name: 'POS Interface', path: '/' },
        { name: 'Saved Sales', path: '/sales-manager/saved-sales' },
        { name: 'Refund History', path: '/refunds/history' },
      ],
    },
  ];

  return (
    <div className="sidebar-wrapper">
      <div className="sidebar-icon-bar">
        {sidebarGroups.map((group) => (
          <div
            key={group.name}
            className="sidebar-icon-row"
            onClick={group.isDirectLink ? handleHomeClick : () => toggleGroup(group.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              (group.isDirectLink ? handleHomeClick() : toggleGroup(group.name))
            }
            aria-expanded={group.isDirectLink ? undefined : expandedGroup === group.name}
          >
            <span className="sidebar-icon">{group.icon}</span>
          </div>
        ))}
      </div>

      <div className={`sidebar-expandable ${expandedGroup ? 'expanded' : ''}`}>
        {expandedGroup && (
          <>
            <div className="sidebar-group">
              <div className="sidebar-group-header">
                <span className="group-name">{expandedGroup}</span>
              </div>
              <div className="sidebar-sub-pages">
                {sidebarGroups
                  .find((group) => group.name === expandedGroup)
                  ?.subPages.map((page) => (
                    <NavLink
                      key={page.path}
                      to={page.path}
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      onClick={() => setExpandedGroup(null)}
                    >
                      {page.name}
                    </NavLink>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
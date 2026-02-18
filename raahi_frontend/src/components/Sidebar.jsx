const Sidebar = ({ activeTab, onTabChange, sosNotificationCount = 0 }) => {
  const tabs = ["Students", "SOS Alerts", "Analytics", "Buses", "Routes", "Logout"];

  return (
    <div className="sidebar">
      <h3 className="sidebar_h3">Raahi Admin</h3>
      <ul className="sidebar_ul">
        {tabs.map((tab) => (
          <li
            key={tab}
            className={`sidebar_li ${activeTab === tab ? "sidebar_li_active" : ""}`}
            onClick={() => onTabChange && onTabChange(tab)}
          >
            <span>{tab}</span>
            {tab === "SOS Alerts" && sosNotificationCount > 0 && (
              <span className="sidebar_alert_wrap">
                <span className="sidebar_badge">{sosNotificationCount}</span>
                <span className="sidebar_dot" />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;

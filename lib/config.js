const LEAD_STATUSES = ["New", "Contacted", "Closed", "Spam"];

const SERVICES = [
  "Software Development",
  "Web Development",
  "Mobile App Development",
  "Artificial Intelligence",
  "Blockchain",
  "Digital Marketing",
  "Automation",
];

const DEFAULT_WEBSITES = [
  { name: "ClickMasters Digital Marketing", domain: "clickmastersdigitalmarketing.com" },
  { name: "ClickMasters Software", domain: "clickmasterssoftwaredevelopmentcompany.com" },
  { name: "ClickMasters Mobile", domain: "clickmastersmobiledevelopmentcompany.com" },
  { name: "ClickMasters Blockchain", domain: "clickmastersblockchaintechnologies.com" },
  { name: "ClickMasters Web", domain: "clickmasterswebdevelopmentcompany.com" },
  { name: "ClickMasters AI", domain: "clickmastersartificialintelligencecompany.com" },
  { name: "ClickMasters Application", domain: "clickmastersapplicationdevelopment.com" },
  { name: "ClickMasters AI Automation", domain: "clickmastersaiautomation.com" },
  { name: "ClickMasters Software UK", domain: "clickmasterssoftwaredevelopmentcompany.co.uk" },
  { name: "ClickMasters AI UK", domain: "clickmastersartificialintelligencecompany.co.uk" },
];

// Normalize a user-entered website domain: strip protocol, www, paths, spaces
function normalizeDomain(input = "") {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
}

// ---- User roles ----
const USER_ROLES = ["admin", "sales_agent", "team_lead", "manager", "viewer"];

// Roles allowed to work leads (edit status/notes/service). Viewer is read-only.
const WRITE_ROLES = ["admin", "sales_agent", "team_lead", "manager"];

const ROLE_LABELS = {
  admin: "Admin",
  sales_agent: "Sales Agent",
  team_lead: "Team Lead",
  manager: "Manager",
  viewer: "Viewer",
};

function roleLabel(role) {
  return ROLE_LABELS[role] || "Viewer";
}

module.exports = {
  LEAD_STATUSES,
  SERVICES,
  DEFAULT_WEBSITES,
  normalizeDomain,
  USER_ROLES,
  WRITE_ROLES,
  roleLabel,
};

const LEAD_STATUSES = ["New", "Contacted", "Closed Won", "Closed Lost", "Spam"];

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

// A lead with no assignee and still "New" after this many days is "overdue"
const OVERDUE_DAYS = 7;

// Days after last activity before a follow-up reminder is triggered
const FOLLOWUP_REMINDER_DAYS = 3;

// Lead scoring weights — used to auto-score every lead on creation/update
const LEAD_SCORING = {
  hasEmail: 10,
  hasPhone: 15,
  hasCompany: 10,
  hasMessage: 5,
  hasUtmSource: 10,
  hasUtmCampaign: 10,
  hasService: 10,
  recencyMaxBonus: 20, // full bonus for leads <1d old, linear decay to 0 at 30d
};

// ---- ERP Project Connectors (Phase 2) ----
const INTEGRATION_PROVIDER = "clickmasters-erp";
const INTEGRATION_TARGET = "lead-crm";
const DEFAULT_INTEGRATION_SCOPES = [
  "crm.leads.read",
  "crm.leads.create",
  "crm.customers.read",
];

module.exports = {
  LEAD_STATUSES,
  SERVICES,
  DEFAULT_WEBSITES,
  normalizeDomain,
  USER_ROLES,
  WRITE_ROLES,
  ROLE_LABELS,
  roleLabel,
  OVERDUE_DAYS,
  FOLLOWUP_REMINDER_DAYS,
  LEAD_SCORING,
  INTEGRATION_PROVIDER,
  INTEGRATION_TARGET,
  DEFAULT_INTEGRATION_SCOPES,
};

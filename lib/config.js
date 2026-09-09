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

module.exports = { LEAD_STATUSES, SERVICES, DEFAULT_WEBSITES, normalizeDomain };

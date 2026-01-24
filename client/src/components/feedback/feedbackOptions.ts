type Option = {
  value: string;
  label: string;
};

export const GOAL_OPTIONS: Option[] = [
  { value: "sell_faster", label: "Help my listing sell faster" },
  { value: "win_listing", label: "Win a new client or listing" },
  { value: "test_tool", label: "Explore or test AI staging tools" },
  { value: "compare_results", label: "Compare against another staging service" },
  { value: "impress_clients", label: "Impress sellers or buyers with visuals" },
  { value: "other", label: "Something else" },
];

export const ISSUE_OPTIONS: Option[] = [
  { value: "render_quality", label: "Render quality issues" },
  { value: "speed", label: "Too slow" },
  { value: "pricing_confusion", label: "Pricing or plan confusion" },
  { value: "ui_ux", label: "Product UI / UX" },
  { value: "support", label: "Needed support / onboarding" },
  { value: "none", label: "No issues" },
];

export const FEATURE_OPTIONS: Option[] = [
  { value: "batch_upload", label: "Batch upload" },
  {
    value: "bulk_notify",
    label: "Bulk staging + email me when the batch is ready",
  },
  { value: "branding_controls", label: "Branding / watermark controls" },
  { value: "revision_tools", label: "Better revision / edit tools" },
  {
    value: "notes_instructions",
    label: "Add notes/instructions to guide the staging (job-level or per-image)",
  },
  { value: "portfolio_mode", label: "Portfolio or sharing mode" },
  { value: "team_collab", label: "Team collaboration" },
  { value: "other", label: "Other" },
];

export const PERSONA_OPTIONS: Option[] = [
  { value: "agent", label: "Real estate agent" },
  { value: "broker", label: "Broker / team lead" },
  { value: "investor", label: "Investor / flipper" },
  { value: "stager", label: "Professional stager" },
  { value: "photographer", label: "Photographer / media" },
  { value: "owner", label: "Homeowner / seller" },
  { value: "other", label: "Other" },
];

export const USAGE_FREQUENCY_OPTIONS: Option[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "occasionally", label: "Occasionally" },
];

export const PRICING_PREFERENCE_OPTIONS: Option[] = [
  { value: "per_render", label: "Pay per render" },
  { value: "credit_packs", label: "Credit packs" },
  { value: "subscription", label: "Monthly subscription" },
  { value: "enterprise", label: "Enterprise / invoicing" },
  { value: "not_sure", label: "Not sure yet" },
];

export const WTP_RANGE_OPTIONS: Option[] = [
  { value: "under_10", label: "Under $10 per render" },
  { value: "10_25", label: "$10 – $25 per render" },
  { value: "25_50", label: "$25 – $50 per render" },
  { value: "50_plus", label: "$50+ per render" },
];

export const WATERMARK_PREF_OPTIONS: Option[] = [
  { value: "always", label: "Always include my watermark" },
  { value: "sometimes", label: "Sometimes, depending on listing" },
  { value: "never", label: "Never use a watermark" },
];

export const WATERMARK_TEXT_OPTIONS: Option[] = [
  { value: "agent_name", label: "Agent name" },
  { value: "team_or_brokerage", label: "Team or brokerage name" },
  { value: "website_url", label: "Website / URL" },
  { value: "phone", label: "Phone number" },
  { value: "custom_logo", label: "Custom logo or upload" },
];

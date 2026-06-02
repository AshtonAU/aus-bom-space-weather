/**
 * AUS BOM Space Weather Card for Home Assistant.
 *
 * Frontend-only Lovelace card. API keys and BOM SWS polling stay in the
 * Home Assistant backend integration.
 */

const CARD_VERSION = '0.1.0';
const CARD_TYPE = 'aus-bom-space-weather-card';
const CARD_CUSTOM_TYPE = `custom:${CARD_TYPE}`;
const DEFAULT_GAUGES = Object.freeze(['k_index', 'a_index', 'dst_index']);
const DEFAULT_GLANCE_GAUGES = Object.freeze(['k_index']);
const DEFAULT_GLANCE_METRICS = Object.freeze(['active_alerts', 'aurora_visibility', 'g_scale', 'data_age']);
const DEFAULT_GLANCE_CHIPS = Object.freeze(['dst_index', 'a_index', 'k_station']);
const DEFAULT_FACTS = Object.freeze(['k_station', 'active_alerts', 'data_health', 'aurora_band']);
const DEFAULT_SECTIONS = Object.freeze(['gauges', 'activity', 'alert_chips', 'timeline', 'facts', 'freshness', 'diagnostics', 'alerts']);
const DEFAULT_ALERT_TYPES = Object.freeze(['aurora_alert', 'aurora_watch', 'aurora_outlook', 'magnetic_alert', 'magnetic_warning']);
const DEFAULT_STATUS_ALERT_TYPES = Object.freeze(['aurora_alert', 'magnetic_alert', 'magnetic_warning', 'aurora_watch', 'aurora_outlook']);
const MAX_GLANCE_METRICS = 4;
const MAX_GLANCE_CHIPS = 3;
const PRESET_CONFIGS = Object.freeze({
  default: Object.freeze({}),
  status: Object.freeze({
    display_mode: 'glance',
    sections: ['gauges'],
    show_gauges: false,
    show_alert_chips: false,
    show_refresh: false,
    show_freshness: false,
    show_status: true,
    show_eyebrow: false,
    show_icon: true,
  }),
  tile: Object.freeze({
    display_mode: 'tile',
    show_refresh: false,
    show_freshness: false,
    show_status: false,
  }),
  aurora: Object.freeze({
    display_mode: 'dashboard',
    gauges: ['k_index'],
    facts: ['aurora_visibility', 'aurora_band', 'k_aus', 'active_alerts', 'data_health'],
    sections: ['gauges', 'facts', 'alerts', 'freshness'],
    alert_types: ['aurora_alert', 'aurora_watch', 'aurora_outlook'],
    status_alert_types: ['aurora_alert', 'aurora_watch', 'aurora_outlook'],
  }),
  magnetic: Object.freeze({
    display_mode: 'dashboard',
    gauges: ['k_index', 'a_index', 'dst_index'],
    facts: ['g_scale', 'severity_level', 'active_alerts', 'data_health'],
    sections: ['gauges', 'activity', 'facts', 'alerts'],
    alert_types: ['magnetic_alert', 'magnetic_warning'],
    status_alert_types: ['magnetic_alert', 'magnetic_warning'],
  }),
  diagnostics: Object.freeze({
    display_mode: 'dashboard',
    sections: ['facts', 'freshness', 'diagnostics'],
    facts: ['data_health', 'endpoint_status', 'api_errors', 'active_alerts'],
    show_gauges: false,
    show_activity: false,
    show_alerts: false,
  }),
});
const DEFAULT_THRESHOLDS = Object.freeze({
  k_index: Object.freeze({
    unsettled: 3,
    active: 4,
    minor_storm: 5,
    moderate_storm: 6,
    severe_storm: 8,
  }),
  a_index: Object.freeze({
    active: 15,
    watch: 30,
    warning: 50,
    storm: 100,
  }),
  dst_index: Object.freeze({
    active: -30,
    watch: -50,
    warning: -100,
    storm: -250,
  }),
});
const DEFAULT_GAUGE_OPTIONS = Object.freeze({
  k_index: Object.freeze({
    min: 0,
    max: 9,
    precision: 1,
    unit: '',
  }),
  a_index: Object.freeze({
    min: 0,
    max: 400,
    precision: 0,
    unit: '',
  }),
  dst_index: Object.freeze({
    min: -200,
    max: 300,
    precision: 0,
    unit: 'nT',
  }),
});
const DEFAULT_LABELS = Object.freeze({
  eyebrow: 'BOM Space Weather',
  loading: 'Loading space weather',
  refresh: 'Refresh BOM Space Weather',
  activity: 'Geomagnetic activity',
  status: 'Status',
  freshness: 'Freshness',
  region: 'Australian region',
  k_index: 'K index',
  a_index: 'A index',
  dst_index: 'Dst',
  quiet: 'Quiet',
  unsettled: 'Unsettled',
  active: 'Active',
  storm: 'Storm',
  unknown: 'Unknown',
  minor_storm: 'Minor storm',
  moderate_storm: 'Moderate storm',
  severe_storm: 'Severe storm',
  k_station: 'K station',
  severity_level: 'Severity',
  active_alerts: 'Active alerts',
  data_age: 'Data age',
  data_stale: 'Data stale',
  data_health: 'Data health',
  endpoint_status: 'Endpoints',
  aurora_visibility: 'Aurora visibility',
  aurora_band: 'Aurora band',
  k_aus: 'K-Aus',
  g_scale: 'G scale',
  api_errors: 'API errors',
  aurora_alert: 'Aurora alert',
  aurora_watch: 'Aurora watch',
  aurora_outlook: 'Aurora outlook',
  magnetic_alert: 'Magnetic alert',
  magnetic_warning: 'Magnetic warning',
  timeline_title: '{hours}h activity rail',
  timeline_subtitle: 'K index, newest at right',
  timeline_peak: 'Peak K {value}',
  timeline_start: '-{hours}h',
  timeline_now: 'now',
  no_alerts_title: 'No current alerts',
  no_alerts_copy: 'BOM SWS has no active magnetic or aurora alert payloads.',
  pending: 'Pending',
  expired: 'Expired',
  data_unavailable: 'Waiting for BOM data',
  diagnostics_title: 'Data partially unavailable',
  endpoint_failed_singular: '1 BOM endpoint failed',
  endpoint_failed_plural: '{count} BOM endpoints failed',
  stale_title: 'Data may be stale',
});

const DEFAULT_CONFIG = {
  title: 'Australian Space Weather',
  icon: 'mdi:weather-lightning',
  preset: 'default',
  display_mode: 'glance',
  density: 'compact',
  theme_mode: 'auto',
  sun_entity: 'sun.sun',
  card_size: 0,
  alert_detail: 'auto',
  primary_metric: 'k_index',
  secondary_metric: 'status',
  refresh_entry_id: '',
  history_entry_id: '',
  entity_match: '',
  entity_id_prefix: '',
  entity_id_suffix: '',
  tap_action: { action: 'more-info' },
  hold_action: { action: 'more-info' },
  double_tap_action: { action: 'more-info' },
  gauges: DEFAULT_GAUGES,
  glance_metrics: DEFAULT_GLANCE_METRICS,
  glance_chips: DEFAULT_GLANCE_CHIPS,
  facts: DEFAULT_FACTS,
  sections: DEFAULT_SECTIONS,
  alert_types: DEFAULT_ALERT_TYPES,
  status_alert_types: DEFAULT_STATUS_ALERT_TYPES,
  entities: {},
  grid_options: {},
  thresholds: DEFAULT_THRESHOLDS,
  gauge_options: DEFAULT_GAUGE_OPTIONS,
  labels: DEFAULT_LABELS,
  colors: {},
  compact: false,
  show_header: true,
  show_title: true,
  show_eyebrow: true,
  show_icon: true,
  show_alerts: true,
  show_alert_chips: false,
  show_inactive_alerts: false,
  show_clear_alerts: false,
  show_gauges: true,
  show_activity: true,
  show_history: false,
  show_diagnostics: false,
  show_refresh: true,
  show_status: true,
  show_timeline: false,
  show_facts: true,
  show_freshness: true,
  show_timestamps: false,
  history_hours: 24,
  stale_after_minutes: 90,
};

const DISPLAY_MODES = ['dashboard', 'glance', 'full', 'tile'];
const DENSITIES = ['compact', 'comfortable', 'spacious'];
const THEME_MODES = ['auto', 'light', 'dark', 'sun'];
const ALERT_DETAILS = ['auto', 'summary', 'full'];
const PRESETS = Object.keys(PRESET_CONFIGS);
const COLOR_KEYS = ['quiet', 'active', 'outlook', 'watch', 'warning', 'storm', 'aurora', 'neutral'];
const HOLD_ACTION_DELAY = 500;
const TAP_ACTION_DELAY = 220;
const ACTION_ALIASES = {
  more_info: 'more-info',
  'more-info': 'more-info',
  toggle: 'toggle',
  perform_action: 'perform-action',
  'perform-action': 'perform-action',
  call_service: 'call-service',
  'call-service': 'call-service',
  navigate: 'navigate',
  url: 'url',
  assist: 'assist',
  none: 'none',
  fire_dom_event: 'fire-dom-event',
  'fire-dom-event': 'fire-dom-event',
};
const PRESET_ALIASES = {
  default: 'default',
  standard: 'default',
  custom: 'default',
  status: 'status',
  chip: 'status',
  minimal: 'status',
  tile: 'tile',
  native_tile: 'tile',
  ha_tile: 'tile',
  aurora: 'aurora',
  southern_lights: 'aurora',
  magnetic: 'magnetic',
  geomagnetic: 'magnetic',
  storm: 'magnetic',
  diagnostics: 'diagnostics',
  diagnostic: 'diagnostics',
  health: 'diagnostics',
};
const THEME_MODE_ALIASES = {
  auto: 'auto',
  system: 'auto',
  home_assistant: 'auto',
  ha: 'auto',
  light: 'light',
  day: 'light',
  daylight: 'light',
  dark: 'dark',
  night: 'dark',
  nighttime: 'dark',
  sun: 'sun',
  solar: 'sun',
  sunrise_sunset: 'sun',
  sunrise: 'sun',
  sunset: 'sun',
};
const ALERT_TYPE_ALIASES = {
  aurora: 'aurora_alert',
  aurora_alert: 'aurora_alert',
  auroraalert: 'aurora_alert',
  aurora_watch: 'aurora_watch',
  aurorawatch: 'aurora_watch',
  watch: 'aurora_watch',
  aurora_outlook: 'aurora_outlook',
  auroraoutlook: 'aurora_outlook',
  outlook: 'aurora_outlook',
  magnetic: 'magnetic_alert',
  magnetic_alert: 'magnetic_alert',
  magneticalert: 'magnetic_alert',
  mag_alert: 'magnetic_alert',
  magalert: 'magnetic_alert',
  magnetic_warning: 'magnetic_warning',
  magneticwarning: 'magnetic_warning',
  mag_warning: 'magnetic_warning',
  magwarning: 'magnetic_warning',
  warning: 'magnetic_warning',
};
const COLOR_ALIASES = {
  quiet: 'quiet',
  active: 'active',
  unsettled: 'outlook',
  outlook: 'outlook',
  watch: 'watch',
  warning: 'warning',
  storm: 'storm',
  severe: 'storm',
  aurora: 'aurora',
  neutral: 'neutral',
};
const LABEL_ALIASES = {
  eyebrow: 'eyebrow',
  header: 'eyebrow',
  loading: 'loading',
  refresh: 'refresh',
  refresh_title: 'refresh',
  activity: 'activity',
  geomagnetic_activity: 'activity',
  status: 'status',
  condition: 'status',
  freshness: 'freshness',
  age: 'freshness',
  region: 'region',
  australian_region: 'region',
  k: 'k_index',
  k_index: 'k_index',
  a: 'a_index',
  a_index: 'a_index',
  dst: 'dst_index',
  dst_index: 'dst_index',
  quiet: 'quiet',
  unsettled: 'unsettled',
  active: 'active',
  storm: 'storm',
  unknown: 'unknown',
  minor: 'minor_storm',
  minor_storm: 'minor_storm',
  moderate: 'moderate_storm',
  moderate_storm: 'moderate_storm',
  severe: 'severe_storm',
  severe_storm: 'severe_storm',
  station: 'k_station',
  k_station: 'k_station',
  active_alerts: 'active_alerts',
  alerts: 'active_alerts',
  severity: 'severity_level',
  severity_level: 'severity_level',
  risk: 'severity_level',
  risk_level: 'severity_level',
  endpoint_status: 'endpoint_status',
  endpoints: 'endpoint_status',
  data_age: 'data_age',
  age_minutes: 'data_age',
  data_stale: 'data_stale',
  stale: 'data_stale',
  data_health: 'data_health',
  aurora_visibility: 'aurora_visibility',
  visibility: 'aurora_visibility',
  viewing: 'aurora_visibility',
  aurora_band: 'aurora_band',
  band: 'aurora_band',
  k_aus: 'k_aus',
  kaus: 'k_aus',
  g_scale: 'g_scale',
  gscale: 'g_scale',
  api_errors: 'api_errors',
  aurora_alert: 'aurora_alert',
  aurora_watch: 'aurora_watch',
  aurora_outlook: 'aurora_outlook',
  magnetic_alert: 'magnetic_alert',
  magnetic_warning: 'magnetic_warning',
  timeline_title: 'timeline_title',
  timeline_subtitle: 'timeline_subtitle',
  timeline_peak: 'timeline_peak',
  timeline_start: 'timeline_start',
  timeline_now: 'timeline_now',
  no_alerts_title: 'no_alerts_title',
  no_alerts_copy: 'no_alerts_copy',
  pending: 'pending',
  expired: 'expired',
  unavailable: 'data_unavailable',
  data_unavailable: 'data_unavailable',
  waiting_for_data: 'data_unavailable',
  waiting_for_bom_data: 'data_unavailable',
  diagnostics_title: 'diagnostics_title',
  endpoint_failed_singular: 'endpoint_failed_singular',
  endpoint_failed_plural: 'endpoint_failed_plural',
  stale_title: 'stale_title',
};
const THRESHOLD_GROUP_ALIASES = {
  k: 'k_index',
  kindex: 'k_index',
  k_index: 'k_index',
  a: 'a_index',
  aindex: 'a_index',
  a_index: 'a_index',
  dst: 'dst_index',
  dstindex: 'dst_index',
  dst_index: 'dst_index',
};
const GAUGE_OPTION_GROUP_ALIASES = THRESHOLD_GROUP_ALIASES;
const GAUGE_OPTION_KEY_ALIASES = {
  minimum: 'min',
  min: 'min',
  maximum: 'max',
  max: 'max',
  precision: 'precision',
  decimals: 'precision',
  decimal_places: 'precision',
  unit: 'unit',
  unit_of_measurement: 'unit',
};

const THRESHOLD_KEY_ALIASES = {
  k_index: {
    unsettled: 'unsettled',
    active: 'active',
    minor: 'minor_storm',
    minor_storm: 'minor_storm',
    watch: 'minor_storm',
    moderate: 'moderate_storm',
    moderate_storm: 'moderate_storm',
    warning: 'moderate_storm',
    severe: 'severe_storm',
    severe_storm: 'severe_storm',
    storm: 'severe_storm',
  },
  a_index: {
    active: 'active',
    watch: 'watch',
    warning: 'warning',
    storm: 'storm',
  },
  dst_index: {
    active: 'active',
    watch: 'watch',
    warning: 'warning',
    storm: 'storm',
  },
};

const MODE_SECTION_DEFAULTS = {
  dashboard: {
    show_header: true,
    show_title: true,
    show_eyebrow: true,
    show_alerts: true,
    show_alert_chips: false,
    show_inactive_alerts: false,
    show_clear_alerts: false,
    show_gauges: true,
    show_activity: true,
    show_history: false,
    show_diagnostics: false,
    show_refresh: true,
    show_status: true,
    show_timeline: false,
    show_facts: true,
    show_freshness: true,
    show_timestamps: false,
  },
  glance: {
    show_header: true,
    show_title: true,
    show_eyebrow: false,
    show_alerts: false,
    show_alert_chips: false,
    show_inactive_alerts: false,
    show_clear_alerts: false,
    show_gauges: true,
    show_activity: false,
    show_history: false,
    show_diagnostics: false,
    show_refresh: false,
    show_status: true,
    show_timeline: false,
    show_facts: false,
    show_freshness: false,
    show_timestamps: false,
  },
  tile: {
    show_header: false,
    show_title: true,
    show_eyebrow: false,
    show_alerts: false,
    show_alert_chips: false,
    show_inactive_alerts: false,
    show_clear_alerts: false,
    show_gauges: false,
    show_activity: false,
    show_history: false,
    show_diagnostics: false,
    show_refresh: false,
    show_status: false,
    show_timeline: false,
    show_facts: false,
    show_freshness: false,
    show_timestamps: false,
  },
  full: {
    show_header: true,
    show_title: true,
    show_eyebrow: true,
    show_alerts: true,
    show_alert_chips: false,
    show_inactive_alerts: false,
    show_clear_alerts: true,
    show_gauges: true,
    show_activity: true,
    show_history: true,
    show_diagnostics: true,
    show_refresh: true,
    show_status: true,
    show_timeline: true,
    show_facts: true,
    show_freshness: true,
    show_timestamps: true,
  },
};

const SECTION_CONFIG_KEYS = Object.keys(MODE_SECTION_DEFAULTS.dashboard);
const PRESET_RESET_KEYS = [
  'display_mode',
  'sections',
  'gauges',
  'glance_metrics',
  'glance_chips',
  'facts',
  'alert_types',
  'status_alert_types',
  ...SECTION_CONFIG_KEYS,
];

const SECTION_SHOW_KEYS = {
  gauges: ['show_gauges'],
  activity: ['show_activity'],
  alert_chips: ['show_alert_chips'],
  timeline: ['show_history', 'show_timeline'],
  facts: ['show_facts'],
  freshness: ['show_freshness'],
  diagnostics: ['show_diagnostics'],
  alerts: ['show_alerts'],
};

const ENTITY_DEFAULTS = {
  a_index_entity: ['sensor.aus_bom_space_weather_a_index', ['a', 'index']],
  k_index_entity: ['sensor.aus_bom_space_weather_k_index', ['k', 'index']],
  dst_index_entity: ['sensor.aus_bom_space_weather_dst_index', ['dst', 'index']],
  activity_entity: ['sensor.aus_bom_space_weather_geomagnetic_activity', ['geomagnetic', 'activity']],
  condition_entity: ['sensor.aus_bom_space_weather_condition', ['condition']],
  severity_level_entity: ['sensor.aus_bom_space_weather_severity_level', ['severity', 'level']],
  active_alert_count_entity: ['sensor.aus_bom_space_weather_active_alert_count', ['active', 'alert', 'count']],
  api_error_count_entity: ['sensor.aus_bom_space_weather_api_error_count', ['api', 'error', 'count']],
  endpoint_status_entity: ['sensor.aus_bom_space_weather_endpoint_status', ['endpoint', 'status']],
  data_age_entity: ['sensor.aus_bom_space_weather_data_age', ['data', 'age']],
  data_health_entity: ['sensor.aus_bom_space_weather_data_health', ['data', 'health']],
  data_stale_entity: ['binary_sensor.aus_bom_space_weather_data_stale', ['data', 'stale']],
  aurora_visibility_entity: ['sensor.aus_bom_space_weather_aurora_visibility', ['aurora', 'visibility']],
  aurora_k_aus_entity: ['sensor.aus_bom_space_weather_aurora_k_aus', ['aurora', 'k', 'aus']],
  aurora_latitude_band_entity: ['sensor.aus_bom_space_weather_aurora_latitude_band', ['aurora', 'latitude', 'band']],
  magnetic_storm_scale_entity: ['sensor.aus_bom_space_weather_magnetic_storm_scale', ['magnetic', 'storm', 'scale']],
  k_index_location_entity: ['select.aus_bom_space_weather_k_index_location', ['k', 'index', 'location']],
  magnetic_alert_entity: ['binary_sensor.aus_bom_space_weather_magnetic_alert', ['magnetic', 'alert']],
  magnetic_warning_entity: ['binary_sensor.aus_bom_space_weather_magnetic_warning', ['magnetic', 'warning']],
  aurora_alert_entity: ['binary_sensor.aus_bom_space_weather_aurora_alert', ['aurora', 'alert']],
  aurora_watch_entity: ['binary_sensor.aus_bom_space_weather_aurora_watch', ['aurora', 'watch']],
  aurora_outlook_entity: ['binary_sensor.aus_bom_space_weather_aurora_outlook', ['aurora', 'outlook']],
};
const ENTITY_CONFIG_ALIASES = {
  a: 'a_index_entity',
  a_index: 'a_index_entity',
  aindex: 'a_index_entity',
  a_index_entity: 'a_index_entity',
  k: 'k_index_entity',
  k_index: 'k_index_entity',
  kindex: 'k_index_entity',
  k_index_entity: 'k_index_entity',
  dst: 'dst_index_entity',
  dst_index: 'dst_index_entity',
  dstindex: 'dst_index_entity',
  dst_index_entity: 'dst_index_entity',
  activity: 'activity_entity',
  geomagnetic_activity: 'activity_entity',
  activity_entity: 'activity_entity',
  condition: 'condition_entity',
  condition_entity: 'condition_entity',
  severity: 'severity_level_entity',
  severity_level: 'severity_level_entity',
  severity_level_entity: 'severity_level_entity',
  risk: 'severity_level_entity',
  risk_level: 'severity_level_entity',
  active_alerts: 'active_alert_count_entity',
  active_alert_count: 'active_alert_count_entity',
  active_alert_count_entity: 'active_alert_count_entity',
  api_errors: 'api_error_count_entity',
  api_error_count: 'api_error_count_entity',
  api_error_count_entity: 'api_error_count_entity',
  endpoint_status: 'endpoint_status_entity',
  endpoint_status_entity: 'endpoint_status_entity',
  endpoints: 'endpoint_status_entity',
  data_age: 'data_age_entity',
  data_age_entity: 'data_age_entity',
  age: 'data_age_entity',
  data_health: 'data_health_entity',
  data_health_entity: 'data_health_entity',
  data_stale: 'data_stale_entity',
  data_stale_entity: 'data_stale_entity',
  stale: 'data_stale_entity',
  aurora_visibility: 'aurora_visibility_entity',
  aurora_visibility_entity: 'aurora_visibility_entity',
  visibility: 'aurora_visibility_entity',
  viewing: 'aurora_visibility_entity',
  aurora_k_aus: 'aurora_k_aus_entity',
  aurora_k_aus_entity: 'aurora_k_aus_entity',
  k_aus: 'aurora_k_aus_entity',
  k_aus_entity: 'aurora_k_aus_entity',
  aurora_latitude_band: 'aurora_latitude_band_entity',
  aurora_latitude_band_entity: 'aurora_latitude_band_entity',
  aurora_band: 'aurora_latitude_band_entity',
  aurora_band_entity: 'aurora_latitude_band_entity',
  latitude_band: 'aurora_latitude_band_entity',
  lat_band: 'aurora_latitude_band_entity',
  magnetic_storm_scale: 'magnetic_storm_scale_entity',
  magnetic_storm_scale_entity: 'magnetic_storm_scale_entity',
  storm_scale: 'magnetic_storm_scale_entity',
  storm_scale_entity: 'magnetic_storm_scale_entity',
  g_scale: 'magnetic_storm_scale_entity',
  g_scale_entity: 'magnetic_storm_scale_entity',
  k_station: 'k_index_location_entity',
  station: 'k_index_location_entity',
  k_index_location: 'k_index_location_entity',
  k_index_location_entity: 'k_index_location_entity',
  aurora_alert: 'aurora_alert_entity',
  aurora_alert_entity: 'aurora_alert_entity',
  aurora_watch: 'aurora_watch_entity',
  aurora_watch_entity: 'aurora_watch_entity',
  aurora_outlook: 'aurora_outlook_entity',
  aurora_outlook_entity: 'aurora_outlook_entity',
  magnetic_alert: 'magnetic_alert_entity',
  magnetic_alert_entity: 'magnetic_alert_entity',
  magnetic_warning: 'magnetic_warning_entity',
  magnetic_warning_entity: 'magnetic_warning_entity',
};

const ALERT_CONFIGS = [
  ['aurora_alert_entity', 'aurora_alert', 'Aurora alert', 'aurora'],
  ['aurora_watch_entity', 'aurora_watch', 'Aurora watch', 'watch'],
  ['aurora_outlook_entity', 'aurora_outlook', 'Aurora outlook', 'outlook'],
  ['magnetic_alert_entity', 'magnetic_alert', 'Magnetic alert', 'storm'],
  ['magnetic_warning_entity', 'magnetic_warning', 'Magnetic warning', 'warning'],
];
const ALERT_CONFIG_BY_KEY = Object.freeze(Object.fromEntries(
  ALERT_CONFIGS.map((config) => [config[1], config]),
));

const METRIC_SELECT_OPTIONS = [
  ['k_index', 'K index'],
  ['a_index', 'A index'],
  ['dst_index', 'Dst'],
  ['status', 'Status'],
  ['freshness', 'Freshness'],
  ['k_station', 'K station'],
  ['severity_level', 'Severity'],
  ['active_alerts', 'Active alerts'],
  ['endpoint_status', 'Endpoint status'],
  ['data_age', 'Data age'],
  ['data_stale', 'Data stale'],
  ['data_health', 'Data health'],
  ['aurora_visibility', 'Aurora visibility'],
  ['aurora_band', 'Aurora band'],
  ['k_aus', 'K-Aus'],
  ['g_scale', 'G scale'],
  ['api_errors', 'API errors'],
];

const EDITOR_FIELDS = [
  ['title', 'Title'],
  ['refresh_entry_id', 'Refresh entry ID'],
  ['history_entry_id', 'History entry ID'],
  ['sun_entity', 'Sun entity'],
  ['entity_match', 'Entity match text'],
  ['entity_id_prefix', 'Entity ID prefix'],
  ['entity_id_suffix', 'Entity ID suffix'],
  ['sections', 'Section order'],
  ['gauges', 'Gauge order'],
  ['glance_metrics', 'Glance metrics'],
  ['glance_chips', 'Glance chips'],
  ['facts', 'Fact order'],
  ['alert_types', 'Alert order'],
  ['status_alert_types', 'Status alert priority'],
];

const EDITOR_FIELD_HELP = Object.freeze({
  sections: 'Comma-separated order: gauges, activity, alert_chips, timeline, facts, freshness, diagnostics, alerts.',
  gauges: 'Comma-separated gauges: k_index, a_index, dst_index. Glance stays smallest with one gauge.',
  facts: 'Dashboard fact strip keys: k_station, active_alerts, data_health, aurora_band, k_aus, g_scale, api_errors.',
  alert_types: 'Order BOM notice cards: aurora_alert, aurora_watch, aurora_outlook, magnetic_alert, magnetic_warning.',
  status_alert_types: 'First active key wins the header status chip.',
});
const EDITOR_FIELD_BY_KEY = new Map(EDITOR_FIELDS.map((field) => [field[0], field]));
const BASIC_EDITOR_TEXT_FIELDS = ['title'];
const CONTENT_EDITOR_TEXT_FIELDS = ['sections', 'gauges', 'facts', 'alert_types', 'status_alert_types'];
const TARGETING_EDITOR_TEXT_FIELDS = ['refresh_entry_id', 'history_entry_id', 'sun_entity', 'entity_match', 'entity_id_prefix', 'entity_id_suffix'];

const GLANCE_SLOT_FIELDS = Object.freeze([
  ...Array.from({ length: MAX_GLANCE_METRICS }, (_, index) => Object.freeze({
    key: `glance_metric_${index + 1}`,
    label: `Metric ${index + 1}`,
    configKey: 'glance_metrics',
    index,
    max: MAX_GLANCE_METRICS,
    fallback: DEFAULT_GLANCE_METRICS,
  })),
  ...Array.from({ length: MAX_GLANCE_CHIPS }, (_, index) => Object.freeze({
    key: `glance_chip_${index + 1}`,
    label: `Footer chip ${index + 1}`,
    configKey: 'glance_chips',
    index,
    max: MAX_GLANCE_CHIPS,
    fallback: DEFAULT_GLANCE_CHIPS,
  })),
]);
const GLANCE_SLOT_FIELD_BY_KEY = new Map(GLANCE_SLOT_FIELDS.map((field) => [field.key, field]));

const ENTITY_EDITOR_FIELDS = [
  ['a_index_entity', 'A index entity'],
  ['k_index_entity', 'K index entity'],
  ['dst_index_entity', 'Dst index entity'],
  ['activity_entity', 'Activity entity'],
  ['condition_entity', 'Condition entity'],
  ['severity_level_entity', 'Severity level entity'],
  ['active_alert_count_entity', 'Active alert count entity'],
  ['api_error_count_entity', 'API error count entity'],
  ['endpoint_status_entity', 'Endpoint status entity'],
  ['data_age_entity', 'Data age entity'],
  ['data_health_entity', 'Data health entity'],
  ['data_stale_entity', 'Data stale entity'],
  ['aurora_visibility_entity', 'Aurora visibility entity'],
  ['aurora_k_aus_entity', 'Aurora K-Aus entity'],
  ['aurora_latitude_band_entity', 'Aurora latitude band entity'],
  ['magnetic_storm_scale_entity', 'Magnetic storm scale entity'],
  ['k_index_location_entity', 'K index location select'],
  ['aurora_alert_entity', 'Aurora alert entity'],
  ['aurora_watch_entity', 'Aurora watch entity'],
  ['aurora_outlook_entity', 'Aurora outlook entity'],
  ['magnetic_alert_entity', 'Magnetic alert entity'],
  ['magnetic_warning_entity', 'Magnetic warning entity'],
];

const OBJECT_EDITOR_FIELDS = [
  ['entities', 'Entity map'],
  ['grid_options', 'Grid options'],
  ['thresholds', 'Thresholds'],
  ['gauge_options', 'Gauge options'],
  ['labels', 'Labels'],
  ['colors', 'Colors'],
  ['tap_action', 'Tap action'],
  ['hold_action', 'Hold action'],
  ['double_tap_action', 'Double tap action'],
];
const OBJECT_EDITOR_FIELD_KEYS = new Set(OBJECT_EDITOR_FIELDS.map(([key]) => key));

const NUMBER_FIELDS = [
  ['card_size', 'Card size', 1, 12],
  ['history_hours', 'History hours', 1, 168],
  ['stale_after_minutes', 'Stale after minutes', 15, 1440],
];

const SELECT_FIELDS = [
  ['preset', 'Preset', [
    ['default', 'Default'],
    ['status', 'Status chip'],
    ['tile', 'Native tile'],
    ['aurora', 'Aurora watch'],
    ['magnetic', 'Magnetic storm'],
    ['diagnostics', 'Diagnostics'],
  ], normalisePreset],
  ['display_mode', 'Display mode', [
    ['tile', 'Tile'],
    ['dashboard', 'Dashboard'],
    ['glance', 'Glance'],
    ['full', 'Full telemetry'],
  ], normaliseDisplayMode],
  ['density', 'Density', [
    ['compact', 'Compact'],
    ['comfortable', 'Comfortable'],
    ['spacious', 'Spacious'],
  ], normaliseDensity],
  ['theme_mode', 'Theme mode', [
    ['auto', 'Auto'],
    ['light', 'Light'],
    ['dark', 'Dark'],
    ['sun', 'Sunrise/sunset'],
  ], normaliseThemeMode],
  ['alert_detail', 'Alert detail', [
    ['auto', 'Auto'],
    ['summary', 'Summary'],
    ['full', 'Full text'],
  ], normaliseAlertDetail],
  ['primary_metric', 'Primary metric', METRIC_SELECT_OPTIONS, (value) => normaliseMetricKey(value, DEFAULT_CONFIG.primary_metric)],
  ['secondary_metric', 'Secondary metric', METRIC_SELECT_OPTIONS, (value) => normaliseMetricKey(value, DEFAULT_CONFIG.secondary_metric)],
];

const GAUGE_CONFIGS = {
  k_index: {
    labelKey: 'k_index',
    label: 'K index',
    entityKey: 'k_index_entity',
    severity: (value, thresholds) => severityFromK(value, thresholds.k_index),
  },
  a_index: {
    labelKey: 'a_index',
    label: 'A index',
    entityKey: 'a_index_entity',
    severity: (value, thresholds) => severityFromA(value, thresholds.a_index),
  },
  dst_index: {
    labelKey: 'dst_index',
    label: 'Dst',
    entityKey: 'dst_index_entity',
    severity: (value, thresholds) => severityFromDst(value, thresholds.dst_index),
  },
};

const GAUGE_ALIASES = {
  k: 'k_index',
  kindex: 'k_index',
  k_index: 'k_index',
  a: 'a_index',
  aindex: 'a_index',
  a_index: 'a_index',
  dst: 'dst_index',
  dstindex: 'dst_index',
  dst_index: 'dst_index',
};

const FACT_ALIASES = {
  station: 'k_station',
  k_station: 'k_station',
  kstation: 'k_station',
  active_alerts: 'active_alerts',
  activealerts: 'active_alerts',
  alerts: 'active_alerts',
  alert_count: 'active_alerts',
  severity: 'severity_level',
  severity_level: 'severity_level',
  severitylevel: 'severity_level',
  risk: 'severity_level',
  risk_level: 'severity_level',
  risklevel: 'severity_level',
  endpoint_status: 'endpoint_status',
  endpointstatus: 'endpoint_status',
  endpoints: 'endpoint_status',
  data_age: 'data_age',
  dataage: 'data_age',
  age: 'data_age',
  age_minutes: 'data_age',
  data_stale: 'data_stale',
  datastale: 'data_stale',
  stale: 'data_stale',
  data_health: 'data_health',
  datahealth: 'data_health',
  health: 'data_health',
  aurora_visibility: 'aurora_visibility',
  auroravisibility: 'aurora_visibility',
  visibility: 'aurora_visibility',
  viewing: 'aurora_visibility',
  aurora_band: 'aurora_band',
  auroraband: 'aurora_band',
  band: 'aurora_band',
  k_aus: 'k_aus',
  kaus: 'k_aus',
  g_scale: 'g_scale',
  gscale: 'g_scale',
  api_errors: 'api_errors',
  apierrors: 'api_errors',
  error_count: 'api_errors',
  errors: 'api_errors',
};

const METRIC_ALIASES = {
  status: 'status',
  condition: 'status',
  current_condition: 'status',
  activity: 'status',
  geomag: 'status',
  geomagnetic: 'status',
  geomagnetic_activity: 'status',
  freshness: 'freshness',
  age: 'freshness',
  updated: 'freshness',
  ...GAUGE_ALIASES,
  ...FACT_ALIASES,
};

const SECTION_ALIASES = {
  gauge: 'gauges',
  gauges: 'gauges',
  metric: 'gauges',
  metrics: 'gauges',
  activity: 'activity',
  summary: 'activity',
  geomagnetic_activity: 'activity',
  alert_chip: 'alert_chips',
  alert_chips: 'alert_chips',
  chip: 'alert_chips',
  chips: 'alert_chips',
  notice_chips: 'alert_chips',
  timeline: 'timeline',
  history: 'timeline',
  rail: 'timeline',
  activity_rail: 'timeline',
  fact: 'facts',
  facts: 'facts',
  fact_strip: 'facts',
  freshness: 'freshness',
  stale: 'freshness',
  stale_data: 'freshness',
  diagnostic: 'diagnostics',
  diagnostics: 'diagnostics',
  health: 'diagnostics',
  alert: 'alerts',
  alerts: 'alerts',
  notices: 'alerts',
};

console.info(
  `%c AUS-BOM-SPACE-WEATHER-CARD %c v${CARD_VERSION} `,
  'color: #1DD3B0; font-weight: 700; background: #111827',
  'color: #ffffff; font-weight: 700; background: #374151',
);

class AusBomSpaceWeatherCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = DEFAULT_CONFIG;
    this._rawConfig = {};
    this._hass = null;
    this._history = {};
    this._historyRequestKey = '';
    this._historyRequestAt = 0;
    this._refreshing = false;
    this._tapActionTimer = null;
    this._holdActionTimer = null;
    this._holdActionTriggered = false;
    this._holdActionContext = null;
  }

  static getConfigElement() {
    return document.createElement('aus-bom-space-weather-card-editor');
  }

  static getStubConfig() {
    return compactStubConfig();
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    this._rawConfig = { ...config };
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._loadHistory();
    this._render();
  }

  getCardSize() {
    const display = effectiveCardConfig(this._config || DEFAULT_CONFIG, this._rawConfig || {});
    if (display.card_size) {
      return display.card_size;
    }
    const headerOffset = display.show_header ? 0 : -1;
    if (display.display_mode === 'tile') {
      return 1;
    }
    if (display.display_mode === 'glance') {
      if (!display.show_gauges && !display.show_facts && !display.show_alerts && !display.show_alert_chips) {
        return 1;
      }
      const metricRows = Math.ceil(Math.min(display.glance_metrics.length, MAX_GLANCE_METRICS) / 2);
      const chipRows = Math.ceil(Math.min(display.glance_chips.length, MAX_GLANCE_CHIPS) / 3);
      return Math.max(1, (display.gauges.length === 1 ? 1 : 2) + headerOffset + Math.max(0, metricRows - 1) + Math.max(0, chipRows - 1));
    }
    if (display.display_mode === 'full') {
      return display.density === 'compact' ? 5 : 6;
    }
    return display.density === 'spacious' ? 4 : 3;
  }

  getGridOptions() {
    return gridOptionsForConfig(this._config || DEFAULT_CONFIG, this._rawConfig || {});
  }

  _resolveEntities() {
    const entities = {};
    const configuredEntities = normaliseEntityOverrides(this._config.entities || this._config.entity_overrides);
    const discovery = normaliseEntityDiscovery(this._config);
    for (const [configKey, [fallback, parts]] of Object.entries(ENTITY_DEFAULTS)) {
      entities[configKey] = this._config[configKey] || configuredEntities[configKey] || this._findEntity(fallback, parts, discovery);
    }
    return entities;
  }

  _findEntity(fallback, parts, discovery = {}) {
    if (!this._hass) {
      return fallback;
    }
    for (const entityId of entityCandidateIds(fallback, discovery)) {
      if (this._hass.states[entityId] && entityMatchesDiscovery(entityId, this._hass.states[entityId], discovery)) {
        return entityId;
      }
    }
    if (this._hass.states[fallback] && entityMatchesDiscovery(fallback, this._hass.states[fallback], discovery)) {
      return fallback;
    }
    const loweredParts = parts.map((part) => part.toLowerCase());
    return Object.keys(this._hass.states).find((entityId) => {
      if (!entityId.includes('aus_bom_space_weather')) {
        return false;
      }
      if (!entityMatchesDiscovery(entityId, this._hass.states[entityId], discovery)) {
        return false;
      }
      const haystack = entityId.toLowerCase().replaceAll('_', ' ');
      return loweredParts.every((part) => haystack.includes(part));
    }) || fallback;
  }

  _loadHistory() {
    if (!this._hass || !this._historyEnabled() || typeof this._hass.callApi !== 'function') {
      return;
    }

    const entities = this._resolveEntities();
    const ids = [
      entities.a_index_entity,
      entities.k_index_entity,
      entities.dst_index_entity,
    ].filter((entityId) => entityId && this._hass.states[entityId]);

    if (!ids.length) {
      return;
    }

    const hours = historyHours(this._config.history_hours);
    const entryId = this._historyEntryId(entities);
    const requestKey = `${ids.join(',')}|${hours}|${entryId}`;
    const now = Date.now();
    if (this._historyRequestKey === requestKey && now - this._historyRequestAt < 300000) {
      return;
    }

    this._historyRequestKey = requestKey;
    this._historyRequestAt = now;
    this._hass.callApi('GET', backendHistoryPath(hours, entryId))
      .then((series) => {
        this._history = normaliseBackendHistory(series, entities);
        this._render();
      })
      .catch(() => {
        this._loadRecorderHistory(requestKey, hours);
      });
  }

  _historyEntryId(entities) {
    return this._entryIdForPurpose('history', entities);
  }

  _refreshEntryId(entities) {
    return this._entryIdForPurpose('refresh', entities);
  }

  _entryIdForPurpose(purpose, entities) {
    const configuredEntryId = purpose === 'refresh'
      ? safeRefreshEntryId(this._config.refresh_entry_id || this._config.history_entry_id)
      : safeEntryId(this._config.history_entry_id || this._config.refresh_entry_id);
    return configuredEntryId || this._entryIdFromEntities(entities);
  }

  _entryIdFromEntities(entities) {
    for (const entityId of entryIdCandidateEntities(entities)) {
      const entryId = safeEntryId(this._hass.states[entityId]?.attributes?.entry_id);
      if (entryId) {
        return entryId;
      }
    }
    return '';
  }

  _loadRecorderHistory(requestKey, hours) {
    const entityIds = requestKey.split('|')[0];
    const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const path = `history/period/${encodeURIComponent(start)}?filter_entity_id=${encodeURIComponent(entityIds)}&minimal_response`;

    this._hass.callApi('GET', path)
      .then((series) => {
        this._history = normaliseRecorderHistory(series);
        this._render();
      })
      .catch(() => {
        this._history = {};
      });
  }

  _historyEnabled() {
    const display = effectiveCardConfig(this._config, this._rawConfig);
    return display.show_history && (display.show_gauges || display.show_timeline);
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    const display = effectiveCardConfig(this._config, this._rawConfig);
    const labels = display.labels;
    const visual = visualTheme(display, this._hass);

    if (!this._hass) {
      const compactClass = display.density === 'compact' ? ' compact' : '';
      this.shadowRoot.innerHTML = `
        ${styles()}
        <ha-card class="card${compactClass} density-${display.density} mode-loading history-off ${visual.cardClass}" style="${colorStyle(display.colors)}">
          ${loadingTemplate(display, labels)}
        </ha-card>
      `;
      return;
    }

    const entities = this._resolveEntities();
    const aState = stateObj(this._hass, entities.a_index_entity);
    const kState = stateObj(this._hass, entities.k_index_entity);
    const dstState = stateObj(this._hass, entities.dst_index_entity);
    const activityState = stateObj(this._hass, entities.activity_entity);
    const conditionState = stateObj(this._hass, entities.condition_entity);
    const severityLevelState = stateObj(this._hass, entities.severity_level_entity);
    const activeAlertCountState = stateObj(this._hass, entities.active_alert_count_entity);
    const apiErrorCountState = stateObj(this._hass, entities.api_error_count_entity);
    const endpointStatusState = stateObj(this._hass, entities.endpoint_status_entity);
    const dataAgeState = stateObj(this._hass, entities.data_age_entity);
    const dataHealthState = stateObj(this._hass, entities.data_health_entity);
    const dataStaleState = stateObj(this._hass, entities.data_stale_entity);
    const auroraVisibilityState = stateObj(this._hass, entities.aurora_visibility_entity);
    const auroraKAusState = stateObj(this._hass, entities.aurora_k_aus_entity);
    const auroraLatitudeBandState = stateObj(this._hass, entities.aurora_latitude_band_entity);
    const magneticStormScaleState = stateObj(this._hass, entities.magnetic_storm_scale_entity);
    const kIndexLocationState = stateObj(this._hass, entities.k_index_location_entity);

    const aValue = numberState(aState);
    const kValue = numberState(kState);
    const dstValue = numberState(dstState);
    const thresholds = display.thresholds;
    const status = this._status(entities, kValue, activityState, conditionState, thresholds, labels, display.status_alert_types);
    const freshness = freshnessStatus(
      [conditionState, dataHealthState, kState, aState, dstState],
      positiveInteger(this._config.stale_after_minutes, DEFAULT_CONFIG.stale_after_minutes, 15, 1440),
    );
    const alerts = this._alerts(entities, labels, display.alert_types, display.show_inactive_alerts);
    const kHistory = this._history[entities.k_index_entity];
    const hours = historyHours(this._config.history_hours);
    const factContext = {
      kState,
      kIndexLocationState,
      alerts,
      severityLevelState,
      activeAlertCountState,
      apiErrorCountState,
      endpointStatusState,
      dataAgeState,
      dataHealthState,
      dataStaleState,
      auroraVisibilityState,
      auroraKAusState,
      auroraLatitudeBandState,
      magneticStormScaleState,
      entities,
      labels,
    };
    const facts = spaceWeatherFacts(display.facts, factContext);
    const compactClass = display.density === 'compact' ? ' compact' : '';
    const densityClass = ` density-${display.density}`;
    const modeClass = ` mode-${display.display_mode}`;
    const historyClass = display.show_history ? ' history-on' : ' history-off';
    const gaugeKeys = configuredGaugeKeys(display.gauges);
    const gaugeData = {
      k_index: {
        value: kValue,
        state: kState,
        history: this._history[entities.k_index_entity],
      },
      a_index: {
        value: aValue,
        state: aState,
        history: this._history[entities.a_index_entity],
      },
      dst_index: {
        value: dstValue,
        state: dstState,
        history: this._history[entities.dst_index_entity],
      },
    };
    const metricContext = {
      ...factContext,
      aValue,
      kValue,
      dstValue,
      status,
      freshness,
      thresholds,
      gaugeOptions: display.gauge_options,
    };
    const primaryMetric = tileMetric(display.primary_metric, metricContext);
    const secondaryMetric = tileMetric(display.secondary_metric, metricContext);
    const sectionTemplates = {
      gauges: display.show_gauges ? gaugeSectionTemplate({
        display,
        gaugeKeys,
        gaugeData,
        entities,
        thresholds,
        labels,
        metricContext,
        status,
        freshness,
      }) : '',
      activity: display.show_activity ? `
        <div class="summary" role="button" tabindex="0" data-entity-id="${escapeAttribute(entities.activity_entity)}" aria-label="Open geomagnetic activity more info">
          <div class="summary-main">
            <div class="summary-label">${escapeHtml(labels.activity)}</div>
            <div class="summary-value">${escapeHtml(stateLabel(activityState) || activityLabelFromK(kValue, thresholds.k_index, labels) || labels.unknown)}</div>
            <div class="summary-meta">${escapeHtml(kState?.attributes?.location || kState?.attributes?.friendly_name || labels.region)}</div>
          </div>
          <div class="bands">
            ${bandTemplate(labels.quiet, kValue !== null && kValue < thresholds.k_index.unsettled)}
            ${bandTemplate(labels.unsettled, kValue !== null && kValue >= thresholds.k_index.unsettled && kValue < thresholds.k_index.active)}
            ${bandTemplate(labels.active, kValue !== null && kValue >= thresholds.k_index.active && kValue < thresholds.k_index.minor_storm)}
            ${bandTemplate(labels.storm, kValue !== null && kValue >= thresholds.k_index.minor_storm)}
          </div>
        </div>
      ` : '',
      alert_chips: display.show_alert_chips ? alertChipsTemplate(alerts, labels) : '',
      timeline: display.show_history && display.show_timeline ? timelineSectionTemplate(kHistory, kValue, hours, entities.k_index_entity, thresholds.k_index, labels) : '',
      facts: display.show_facts ? factSectionTemplate(facts) : '',
      freshness: display.show_freshness && freshness.stale ? staleSectionTemplate(freshness, labels) : '',
      diagnostics: display.show_diagnostics ? diagnosticSectionTemplate(conditionState, apiErrorCountState, dataHealthState, endpointStatusState, entities, labels) : '',
      alerts: display.show_alerts ? alertSectionTemplate(alerts, display.show_clear_alerts, display.alert_detail, display.display_mode, labels) : '',
    };
    const bodySections = display.sections.map((section) => sectionTemplates[section] || '').join('');
    const bodyContent = bodySections.trim();
    const title = this._config.title || DEFAULT_CONFIG.title;
    const headerSubtitle = display.display_mode === 'glance'
      ? kIndexLocationLabel(kState, kIndexLocationState, labels)
      : '';
    const headerText = [
      display.show_eyebrow ? `<div class="eyebrow">${escapeHtml(labels.eyebrow)}</div>` : '',
      display.show_title ? `<div class="title">${escapeHtml(title)}</div>` : '',
      display.show_title && headerSubtitle ? `<div class="header-subtitle">${escapeHtml(headerSubtitle)}</div>` : '',
    ].filter(Boolean).join('');
    const headerActions = [
      display.show_refresh ? refreshButtonTemplate(this._refreshing, labels) : '',
      display.show_freshness ? freshnessPillTemplate(freshness) : '',
      display.show_status ? statusChipTemplate(status) : '',
    ].filter(Boolean).join('');
    const headerTemplate = display.show_header && (headerText || headerActions)
      ? `
        <div class="header${headerText ? '' : ' header-actions-only'} tone-${status.tone}">
          ${headerText ? `
          <div class="header-main">
            ${display.display_mode === 'glance' && display.show_icon ? `
            <div class="header-icon" aria-hidden="true">
              <ha-icon icon="${escapeAttribute(display.icon)}"></ha-icon>
            </div>
            ` : ''}
            <div class="header-text">${headerText}</div>
          </div>
          ` : ''}
          ${headerActions ? `<div class="header-actions">${headerActions}</div>` : ''}
        </div>
        `
      : '';
    const cardContent = display.display_mode === 'tile'
      ? tileTemplate({
        display,
        labels,
        primaryMetric,
        secondaryMetric,
        status,
        freshness,
        refreshing: this._refreshing,
        title,
      })
      : `
        ${headerTemplate}
        ${bodyContent ? `<div class="body">${bodySections}</div>` : ''}
      `;

    this.shadowRoot.innerHTML = `
      ${styles()}
      <ha-card class="card${compactClass}${densityClass}${modeClass}${historyClass} ${visual.cardClass}" style="${colorStyle(display.colors)}">
        ${cardContent}
      </ha-card>
    `;

    this.shadowRoot.querySelector('.refresh-button')?.addEventListener('click', () => {
      this._refresh();
    });
    this.shadowRoot.querySelectorAll('[data-entity-id]').forEach((element) => {
      this._bindActionElement(element);
    });
  }

  _bindActionElement(element) {
    element.addEventListener('click', (event) => this._scheduleTapAction(event));
    element.addEventListener('dblclick', (event) => this._handleActionEvent(event, 'double_tap_action'));
    element.addEventListener('keydown', (event) => this._handleKeyboardAction(event));
    element.addEventListener('pointerdown', (event) => this._startHoldAction(event));
    element.addEventListener('pointerup', (event) => this._finishHoldAction(event));
    for (const eventName of ['pointercancel', 'pointerleave']) {
      element.addEventListener(eventName, () => this._cancelHoldAction());
    }
  }

  async _refresh() {
    if (this._refreshing || !this._hass || typeof this._hass.callService !== 'function') {
      return;
    }

    this._refreshing = true;
    this._render();
    try {
      const entryId = this._refreshEntryId(this._resolveEntities());
      const serviceData = entryId ? { entry_id: entryId } : undefined;
      await this._hass.callService('aus_bom_space_weather', 'refresh', serviceData);
      this._historyRequestKey = '';
      this._historyRequestAt = 0;
      this._loadHistory();
    } finally {
      this._refreshing = false;
      this._render();
    }
  }

  _scheduleTapAction(event) {
    const entityId = event.currentTarget?.dataset?.entityId;
    if (!entityId) {
      return;
    }
    if (this._holdActionTriggered) {
      this._holdActionTriggered = false;
      event.preventDefault?.();
      return;
    }
    if (event.detail && event.detail > 1) {
      return;
    }
    this._clearTapActionTimer();
    this._tapActionTimer = setTimeout(() => {
      this._tapActionTimer = null;
      this._runAction('tap_action', entityId, event);
    }, TAP_ACTION_DELAY);
  }

  _handleActionEvent(event, actionKey) {
    const entityId = event.currentTarget?.dataset?.entityId;
    if (!entityId) {
      return;
    }
    this._clearTapActionTimer();
    event.preventDefault?.();
    this._runAction(actionKey, entityId, event);
  }

  _handleKeyboardAction(event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this._handleActionEvent(event, 'tap_action');
  }

  _startHoldAction(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    const entityId = event.currentTarget?.dataset?.entityId;
    if (!entityId) {
      return;
    }
    this._holdActionTriggered = false;
    this._holdActionContext = { entityId, event };
    this._clearHoldActionTimer();
    this._holdActionTimer = setTimeout(() => {
      this._holdActionTriggered = true;
    }, HOLD_ACTION_DELAY);
  }

  _finishHoldAction(event) {
    const context = this._holdActionContext;
    this._clearHoldActionTimer();
    this._holdActionContext = null;
    if (!this._holdActionTriggered || !context?.entityId) {
      return;
    }
    this._runAction('hold_action', context.entityId, event || context.event);
    setTimeout(() => {
      this._holdActionTriggered = false;
    }, TAP_ACTION_DELAY + 100);
  }

  _cancelHoldAction() {
    this._clearHoldActionTimer();
    this._holdActionTriggered = false;
    this._holdActionContext = null;
  }

  _clearTapActionTimer() {
    if (this._tapActionTimer) {
      clearTimeout(this._tapActionTimer);
      this._tapActionTimer = null;
    }
  }

  _clearHoldActionTimer() {
    if (this._holdActionTimer) {
      clearTimeout(this._holdActionTimer);
      this._holdActionTimer = null;
    }
  }

  async _runAction(actionKey, entityId, event) {
    const display = effectiveCardConfig(this._config, this._rawConfig);
    const action = display[actionKey] || DEFAULT_CONFIG[actionKey] || DEFAULT_CONFIG.tap_action;
    const actionName = action.action || 'more-info';
    const targetEntityId = safeEntityId(action.entity) || entityId;

    if (actionName !== 'none') {
      event?.preventDefault?.();
      event?.stopPropagation?.();
    }
    if (!this._confirmAction(action)) {
      return;
    }

    if (actionName === 'more-info') {
      this._showMoreInfo(targetEntityId);
      return;
    }
    if (actionName === 'toggle') {
      await this._toggleEntity(targetEntityId);
      return;
    }
    if (actionName === 'perform-action' || actionName === 'call-service') {
      await this._performHomeAssistantAction(action, targetEntityId);
      return;
    }
    if (actionName === 'navigate') {
      this._navigateAction(action);
      return;
    }
    if (actionName === 'url') {
      this._urlAction(action);
      return;
    }
    if (actionName === 'assist') {
      this._assistAction(action);
      return;
    }
    if (actionName === 'fire-dom-event') {
      this._fireDomAction(action, actionKey, targetEntityId);
    }
  }

  _confirmAction(action) {
    if (!action.confirmation) {
      return true;
    }
    const browserWindow = globalThis.window;
    const text = typeof action.confirmation === 'object'
      ? action.confirmation.text || action.confirmation.title || 'Are you sure?'
      : 'Are you sure?';
    return typeof browserWindow?.confirm === 'function'
      ? browserWindow.confirm(text)
      : true;
  }

  _showMoreInfo(entityId) {
    if (!entityId) {
      return;
    }
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  async _toggleEntity(entityId) {
    if (!this._hass || typeof this._hass.callService !== 'function' || !entityId) {
      return;
    }
    await this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
  }

  async _performHomeAssistantAction(action, entityId) {
    if (!this._hass || typeof this._hass.callService !== 'function') {
      return;
    }
    const serviceName = action.perform_action || action.service;
    if (!serviceName || !String(serviceName).includes('.')) {
      return;
    }
    const [domain, service] = String(serviceName).split('.', 2);
    const data = { ...(action.service_data || {}), ...(action.data || {}) };
    const target = action.target || {};
    if (!Object.keys(target).length && entityId && !data.entity_id) {
      data.entity_id = entityId;
    }
    await this._hass.callService(domain, service, data, target);
  }

  _navigateAction(action) {
    const browserWindow = globalThis.window;
    const path = safeNavigationPath(action.navigation_path);
    if (!path) {
      return;
    }
    if (browserWindow?.history && typeof browserWindow.history.pushState === 'function') {
      if (action.navigation_replace && typeof browserWindow.history.replaceState === 'function') {
        browserWindow.history.replaceState(null, '', path);
      } else {
        browserWindow.history.pushState(null, '', path);
      }
      browserWindow.dispatchEvent?.(new CustomEvent('location-changed', {
        detail: { replace: !!action.navigation_replace },
      }));
      return;
    }
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path, replace: !!action.navigation_replace },
      bubbles: true,
      composed: true,
    }));
  }

  _urlAction(action) {
    const browserWindow = globalThis.window;
    const url = safeUrlPath(action.url_path);
    if (!url) {
      return;
    }
    if (typeof browserWindow?.open === 'function') {
      browserWindow.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    this.dispatchEvent(new CustomEvent('hass-url', {
      detail: { url },
      bubbles: true,
      composed: true,
    }));
  }

  _assistAction(action) {
    this.dispatchEvent(new CustomEvent('hass-assist', {
      detail: {
        pipelineId: action.pipeline_id,
        startListening: action.start_listening,
      },
      bubbles: true,
      composed: true,
    }));
  }

  _fireDomAction(action, actionKey, entityId) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: { ...action, actionKey, entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _status(entities, kValue, activityState, conditionState, thresholds, labels, statusAlertTypes) {
    if (isKnownState(conditionState)) {
      return {
        label: conditionState.state,
        tone: normaliseTone(conditionState.attributes?.tone),
      };
    }

    for (const [configKey, labelKey, fallbackLabel, tone] of alertConfigsFromKeys(statusAlertTypes)) {
      const entityId = entities[configKey];
      if (isOn(stateObj(this._hass, entityId))) {
        return { label: labelFrom(labels, labelKey, fallbackLabel), tone };
      }
    }

    const severity = severityFromK(kValue, thresholds.k_index, labels);
    return {
      label: stateLabel(activityState) || severity.label,
      tone: severity.tone,
    };
  }

  _alerts(entities, labels, alertTypes, includeInactive = false) {
    return alertConfigsFromKeys(alertTypes)
      .map(([configKey, labelKey, fallbackLabel, tone]) => {
        const entityId = entities[configKey];
        const state = stateObj(this._hass, entityId);
        const active = isOn(state);
        const pending = booleanConfig(state?.attributes?.pending, false);
        const expired = booleanConfig(state?.attributes?.expired, false);
        const visibleInactive = includeInactive && isKnownState(state) && (pending || expired);
        return {
          entityId,
          label: labelFrom(labels, labelKey, fallbackLabel),
          labelKey,
          tone: active ? normaliseTone(state?.attributes?.tone || tone) : 'neutral',
          state,
          active,
          pending,
          expired,
          inactive: !active && visibleInactive,
        };
      })
      .filter((alert) => alert.active || alert.inactive);
  }
}

class AusBomSpaceWeatherCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._rawConfig = {};
  }

  setConfig(config) {
    this._rawConfig = { ...(config || {}) };
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }
    const display = effectiveCardConfig(this._config, this._rawConfig);
    const toggleFields = [
      ['compact', 'Compact layout', display.density === 'compact'],
      ['show_header', 'Show header', display.show_header],
      ['show_title', 'Show title', display.show_title],
      ['show_eyebrow', 'Show eyebrow label', display.show_eyebrow],
      ['show_icon', 'Show icon', display.show_icon],
      ['show_gauges', 'Show gauges', display.show_gauges],
      ['show_activity', 'Show activity summary', display.show_activity],
      ['show_alert_chips', 'Show alert chips', display.show_alert_chips],
      ['show_facts', 'Show fact strip', display.show_facts],
      ['show_alerts', 'Show alerts', display.show_alerts],
      ['show_inactive_alerts', 'Show pending and expired notices', display.show_inactive_alerts],
      ['show_clear_alerts', 'Show clear alert state', display.show_clear_alerts],
      ['show_history', 'Show history sparklines', display.show_history],
      ['show_timeline', 'Show activity timeline', display.show_timeline],
      ['show_freshness', 'Show data freshness', display.show_freshness],
      ['show_diagnostics', 'Show API diagnostics', display.show_diagnostics],
      ['show_refresh', 'Show refresh action', display.show_refresh],
      ['show_status', 'Show status chip', display.show_status],
      ['show_timestamps', 'Show gauge timestamps', display.show_timestamps],
    ];

    this.shadowRoot.innerHTML = `
      ${editorStyles()}
      <div class="editor">
        ${editorGroupTemplate('Basic card', 'Start with a preset, choose the layout, and set the main title/icon/metrics.', [
          ...BASIC_EDITOR_TEXT_FIELDS.map((key) => editorTextFieldTemplate(key, this._config[key] || '')),
          iconFieldTemplate('icon', 'Icon', this._config.icon),
          ...SELECT_FIELDS.map(([key, label, options, normalise]) => selectFieldTemplate(key, label, this._config[key], options, normalise)),
          ...NUMBER_FIELDS.map(([key, label, min, max]) => numberFieldTemplate(key, label, this._config[key], min, max)),
        ].join(''), 'layout-group')}
        ${glanceSlotEditorTemplate(this._config)}
        ${editorGroupTemplate('Content order', 'Tune dashboard/full layouts while keeping the default glance card compact.', CONTENT_EDITOR_TEXT_FIELDS.map((key) => editorTextFieldTemplate(key, this._config[key] || '')).join(''), 'content-group')}
        ${editorGroupTemplate('Entity targeting', 'Auto-discovery works by default; use these fields for multi-location dashboards or renamed entities.', [
          ...TARGETING_EDITOR_TEXT_FIELDS.map((key) => editorTextFieldTemplate(key, this._config[key] || '')),
          ...ENTITY_EDITOR_FIELDS.map(([key, label]) => entityFieldTemplate(key, label, this._config[key] || '')),
        ].join(''), 'entity-group')}
        ${editorGroupTemplate('Visibility toggles', 'Override what each preset shows without switching to YAML.', `<div class="toggle-grid">${toggleFields.map(([key, label, checked]) => checkboxTemplate(key, label, checked)).join('')}</div>`, 'toggle-group')}
        ${editorGroupTemplate('Advanced YAML objects', 'Paste structured JSON for options that are easier to manage in YAML.', OBJECT_EDITOR_FIELDS.map(([key, label]) => textareaFieldTemplate(key, label, this._rawConfig[key])).join(''), 'advanced-group')}
      </div>
    `;

    this.shadowRoot.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('change', (event) => this._valueChanged(event));
      input.addEventListener('input', (event) => {
        if (event.target.type !== 'checkbox') {
          this._valueChanged(event);
        }
      });
    });
    this._hydrateHomeAssistantFields();
  }

  _valueChanged(event) {
    const target = event.target;
    const key = target.dataset.key;
    const value = fieldValue(event, target);
    const nextConfig = { ...this._rawConfig };
    if (target.type === 'checkbox') {
      nextConfig[key] = target.checked;
      if (key === 'compact') {
        if (target.checked) {
          nextConfig.density = 'compact';
        } else if (nextConfig.density === 'compact') {
          nextConfig.density = 'comfortable';
        }
      }
    } else if (target.type === 'number' && value) {
      nextConfig[key] = numberFieldValue(key, value);
    } else if (OBJECT_EDITOR_FIELD_KEYS.has(key)) {
      const parsed = parseEditorObject(value);
      if (parsed === null) {
        target.setAttribute?.('aria-invalid', 'true');
        return;
      }
      target.removeAttribute?.('aria-invalid');
      if (Object.keys(parsed).length) {
        nextConfig[key] = parsed;
      } else {
        delete nextConfig[key];
      }
    } else if (key === 'sections') {
      nextConfig[key] = configuredSectionKeys(value);
    } else if (key === 'gauges') {
      nextConfig[key] = configuredGaugeKeys(value);
    } else if (GLANCE_SLOT_FIELD_BY_KEY.has(key)) {
      updateGlanceSlotConfig(nextConfig, GLANCE_SLOT_FIELD_BY_KEY.get(key), value);
    } else if (key === 'glance_metrics') {
      nextConfig[key] = configuredMetricKeys(value, DEFAULT_GLANCE_METRICS);
    } else if (key === 'glance_chips') {
      nextConfig[key] = configuredMetricKeys(value, DEFAULT_GLANCE_CHIPS);
    } else if (key === 'facts') {
      nextConfig[key] = configuredFactKeys(value);
    } else if (key === 'alert_types') {
      nextConfig[key] = configuredAlertKeys(value, DEFAULT_ALERT_TYPES);
    } else if (key === 'status_alert_types') {
      nextConfig[key] = configuredAlertKeys(value, DEFAULT_STATUS_ALERT_TYPES);
    } else if (target.tagName === 'SELECT' && value) {
      nextConfig[key] = value;
      if (key === 'preset') {
        for (const presetKey of PRESET_RESET_KEYS) {
          delete nextConfig[presetKey];
        }
      }
      if (key === 'display_mode') {
        for (const sectionKey of SECTION_CONFIG_KEYS) {
          delete nextConfig[sectionKey];
        }
      }
    } else if (value) {
      nextConfig[key] = value;
    } else {
      delete nextConfig[key];
    }
    this._rawConfig = nextConfig;
    this._config = { ...DEFAULT_CONFIG, ...nextConfig };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: nextConfig },
      bubbles: true,
      composed: true,
    }));
  }

  _hydrateHomeAssistantFields() {
    this.shadowRoot.querySelectorAll('ha-entity-picker, ha-icon-picker').forEach((control) => {
      const key = control.dataset.key;
      if (!key) {
        return;
      }
      control.hass = this._hass;
      control.value = this._config[key] || '';
      control.addEventListener('value-changed', (event) => this._valueChanged(event));
    });
  }
}

function stateObj(hass, entityId) {
  return entityId ? hass.states[entityId] : undefined;
}

function numberState(state) {
  if (!state || state.state === 'unknown' || state.state === 'unavailable') {
    return null;
  }
  return numericValue(state.state);
}

function numericValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function gScaleFromKIndex(kIndex) {
  const value = numericValue(kIndex);
  if (value === null) {
    return null;
  }
  if (value >= 9) {
    return 5;
  }
  if (value >= 8) {
    return 4;
  }
  if (value >= 7) {
    return 3;
  }
  if (value >= 6) {
    return 2;
  }
  if (value >= 5) {
    return 1;
  }
  return 0;
}

function isOn(state) {
  return state?.state === 'on';
}

function isKnownState(state) {
  return !!state && state.state !== 'unknown' && state.state !== 'unavailable';
}

function stateLabel(state) {
  return isKnownState(state) ? state.state : '';
}

function sourceTime(state) {
  return state?.attributes?.source_time ||
    state?.attributes?.analysis_time ||
    state?.attributes?.valid_time ||
    state?.attributes?.fetched_at ||
    state?.last_updated ||
    '';
}

function severityFromK(value, thresholds = DEFAULT_THRESHOLDS.k_index, labels = DEFAULT_LABELS) {
  if (value === null) {
    return { label: labels.unknown, tone: 'neutral' };
  }
  if (value >= thresholds.severe_storm) return { label: labels.severe_storm, tone: 'storm' };
  if (value >= thresholds.moderate_storm) return { label: labels.moderate_storm, tone: 'warning' };
  if (value >= thresholds.minor_storm) return { label: labels.minor_storm, tone: 'watch' };
  if (value >= thresholds.active) return { label: labels.active, tone: 'active' };
  if (value >= thresholds.unsettled) return { label: labels.unsettled, tone: 'outlook' };
  return { label: labels.quiet, tone: 'quiet' };
}

function severityFromA(value, thresholds = DEFAULT_THRESHOLDS.a_index) {
  if (value === null) return { tone: 'neutral' };
  if (value >= thresholds.storm) return { tone: 'storm' };
  if (value >= thresholds.warning) return { tone: 'warning' };
  if (value >= thresholds.watch) return { tone: 'watch' };
  if (value >= thresholds.active) return { tone: 'active' };
  return { tone: 'quiet' };
}

function severityFromDst(value, thresholds = DEFAULT_THRESHOLDS.dst_index) {
  if (value === null) return { tone: 'neutral' };
  if (value <= thresholds.storm) return { tone: 'storm' };
  if (value <= thresholds.warning) return { tone: 'warning' };
  if (value <= thresholds.watch) return { tone: 'watch' };
  if (value <= thresholds.active) return { tone: 'active' };
  return { tone: 'quiet' };
}

function activityLabelFromK(value, thresholds = DEFAULT_THRESHOLDS.k_index, labels = DEFAULT_LABELS) {
  return severityFromK(value, thresholds, labels).label;
}

function normaliseTone(value) {
  const tone = String(value || '').toLowerCase();
  return [
    'quiet',
    'active',
    'outlook',
    'watch',
    'warning',
    'storm',
    'aurora',
    'neutral',
  ].includes(tone) ? tone : 'neutral';
}

function historyHours(value) {
  return positiveInteger(value, DEFAULT_CONFIG.history_hours, 1, 168);
}

function positiveInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.round(clamp(parsed, min, max));
}

function cardSizeOverride(value) {
  if (value === undefined || value === null || value === '' || value === 0 || value === '0') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(clamp(parsed, 1, 12));
}

function mergeGridOptions(defaultOptions, configuredOptions) {
  const overrides = normaliseGridOptions(configuredOptions);
  if (!Object.keys(overrides).length) {
    return defaultOptions;
  }
  return normaliseGridBounds({ ...defaultOptions, ...overrides });
}

function normaliseGridOptions(value) {
  const configured = objectConfig(value);
  if (!configured) {
    return {};
  }
  const options = {};
  const columns = gridColumnsValue(configured.columns);
  if (columns) {
    options.columns = columns;
  }
  for (const [key, max] of [
    ['rows', 24],
    ['min_columns', 12],
    ['max_columns', 12],
    ['min_rows', 24],
    ['max_rows', 24],
  ]) {
    const optionValue = gridIntegerValue(configured[key], max);
    if (optionValue) {
      options[key] = optionValue;
    }
  }
  return normaliseGridBounds(options);
}

function gridColumnsValue(value) {
  if (String(value || '').trim().toLowerCase() === 'full') {
    return 'full';
  }
  return gridIntegerValue(value, 12);
}

function gridIntegerValue(value, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(clamp(parsed, 1, max));
}

function normaliseGridBounds(options) {
  const result = { ...options };
  if (Number.isFinite(result.min_columns) && Number.isFinite(result.max_columns) && result.min_columns > result.max_columns) {
    result.max_columns = result.min_columns;
  }
  if (Number.isFinite(result.columns)) {
    if (Number.isFinite(result.min_columns) && result.min_columns > result.columns) {
      result.min_columns = result.columns;
    }
    if (Number.isFinite(result.max_columns) && result.max_columns < result.columns) {
      result.max_columns = result.columns;
    }
  }
  if (Number.isFinite(result.min_rows) && Number.isFinite(result.max_rows) && result.min_rows > result.max_rows) {
    result.max_rows = result.min_rows;
  }
  if (Number.isFinite(result.rows)) {
    if (Number.isFinite(result.min_rows) && result.min_rows > result.rows) {
      result.min_rows = result.rows;
    }
    if (Number.isFinite(result.max_rows) && result.max_rows < result.rows) {
      result.max_rows = result.rows;
    }
  }
  return result;
}

function compactStubConfig() {
  return {
    title: DEFAULT_CONFIG.title,
    display_mode: 'glance',
    density: 'compact',
    sections: ['gauges'],
    gauges: ['k_index'],
    show_eyebrow: false,
  };
}

function gridOptionsForConfig(config, rawConfig = {}) {
  const display = effectiveCardConfig(config || DEFAULT_CONFIG, rawConfig || {});
  let options;
  if (display.display_mode === 'tile') {
    options = {
      columns: 6,
      rows: 1,
      min_columns: 3,
      max_columns: 12,
      min_rows: 1,
      max_rows: 2,
    };
  } else if (display.display_mode === 'full') {
    options = {
      columns: 'full',
      rows: display.density === 'compact' ? 6 : 7,
      min_columns: 6,
      min_rows: 5,
      max_rows: 10,
    };
  } else if (display.display_mode === 'dashboard') {
    options = {
      columns: 6,
      rows: display.density === 'spacious' ? 6 : 5,
      min_columns: 6,
      max_columns: 12,
      min_rows: 3,
      max_rows: 8,
    };
  } else if (!display.show_gauges && !display.show_facts && !display.show_alerts && !display.show_alert_chips) {
    options = {
      columns: 6,
      rows: 1,
      min_columns: 3,
      max_columns: 12,
      min_rows: 1,
      max_rows: 2,
    };
  } else {
    const metricRows = Math.ceil(Math.min(display.glance_metrics.length, MAX_GLANCE_METRICS) / 2);
    const chipRows = Math.ceil(Math.min(display.glance_chips.length, MAX_GLANCE_CHIPS) / 3);
    const rows = display.gauges.length === 1
      ? 3 + Math.max(0, metricRows - 2) + Math.max(0, chipRows - 1)
      : 3 + Math.max(0, metricRows - 1) + Math.max(0, chipRows - 1);
    options = {
      columns: 6,
      rows,
      min_columns: 3,
      max_columns: 12,
      min_rows: 2,
      max_rows: 5,
    };
  }
  return mergeGridOptions(options, display.grid_options);
}

function numberFieldValue(key, value) {
  if (key === 'card_size') {
    return cardSizeOverride(value) || '';
  }
  if (key === 'history_hours') {
    return historyHours(value);
  }
  if (key === 'stale_after_minutes') {
    return positiveInteger(value, DEFAULT_CONFIG.stale_after_minutes, 15, 1440);
  }
  return Number(value);
}

function updateGlanceSlotConfig(config, field, value) {
  const source = Object.prototype.hasOwnProperty.call(config, field.configKey)
    ? config[field.configKey]
    : field.fallback;
  const current = configuredMetricKeys(source, field.fallback).slice(0, field.max);
  const selected = normaliseMetricKeyStrict(value);
  current[field.index] = selected || '';

  const seen = new Set();
  const next = [];
  for (const candidate of current) {
    const key = normaliseMetricKeyStrict(candidate);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    next.push(key);
  }

  if (next.length) {
    config[field.configKey] = next;
  } else {
    delete config[field.configKey];
  }
}

function effectiveCardConfig(config, rawConfig) {
  const hasRawConfig = rawConfig !== undefined;
  const raw = rawConfig || {};
  const sourceConfig = hasRawConfig ? raw : (config || {});
  const presetConfig = presetDefaults(sourceConfig.preset || (config || {}).preset);
  const baseConfig = { ...DEFAULT_CONFIG, ...presetConfig, ...sourceConfig };
  const configured = { ...presetConfig, ...sourceConfig };
  const displayMode = normaliseDisplayMode(baseConfig.display_mode);
  const sectionDefaults = MODE_SECTION_DEFAULTS[displayMode];
  const effective = {
    ...baseConfig,
    preset: normalisePreset(baseConfig.preset),
    display_mode: displayMode,
    density: effectiveDensity(baseConfig, configured),
    theme_mode: normaliseThemeMode(baseConfig.theme_mode),
    sun_entity: safeEntityId(baseConfig.sun_entity) || DEFAULT_CONFIG.sun_entity,
    card_size: cardSizeOverride(baseConfig.card_size),
    alert_detail: normaliseAlertDetail(baseConfig.alert_detail),
    icon: safeIcon(baseConfig.icon),
    primary_metric: normaliseMetricKey(baseConfig.primary_metric, DEFAULT_CONFIG.primary_metric),
    secondary_metric: normaliseMetricKey(baseConfig.secondary_metric, DEFAULT_CONFIG.secondary_metric),
    tap_action: normaliseAction(baseConfig.tap_action, DEFAULT_CONFIG.tap_action),
    hold_action: normaliseAction(baseConfig.hold_action, DEFAULT_CONFIG.hold_action),
    double_tap_action: normaliseAction(baseConfig.double_tap_action, DEFAULT_CONFIG.double_tap_action),
    show_icon: booleanConfig(baseConfig.show_icon, DEFAULT_CONFIG.show_icon),
    grid_options: normaliseGridOptions(baseConfig.grid_options),
    thresholds: normaliseThresholds(baseConfig.thresholds),
    gauge_options: normaliseGaugeOptions(baseConfig.gauge_options || baseConfig.gauge_ranges),
    labels: normaliseLabels(baseConfig.labels),
    colors: normaliseColors(baseConfig.colors),
    sections: configuredSectionKeys(baseConfig.sections),
    gauges: effectiveGaugeKeys(baseConfig, configured, displayMode),
    glance_metrics: configuredMetricKeys(baseConfig.glance_metrics, DEFAULT_GLANCE_METRICS),
    glance_chips: configuredMetricKeys(baseConfig.glance_chips, DEFAULT_GLANCE_CHIPS),
    facts: configuredFactKeys(baseConfig.facts),
    alert_types: configuredAlertKeys(baseConfig.alert_types, DEFAULT_ALERT_TYPES),
    status_alert_types: configuredAlertKeys(baseConfig.status_alert_types, DEFAULT_STATUS_ALERT_TYPES),
  };

  for (const key of SECTION_CONFIG_KEYS) {
    effective[key] = Object.prototype.hasOwnProperty.call(configured, key)
      ? booleanConfig(configured[key], sectionDefaults[key])
      : sectionDefaults[key];
  }
  if (Object.prototype.hasOwnProperty.call(configured, 'sections')) {
    for (const section of effective.sections) {
      for (const showKey of SECTION_SHOW_KEYS[section] || []) {
        if (!Object.prototype.hasOwnProperty.call(configured, showKey)) {
          effective[showKey] = true;
        }
      }
    }
  }

  return effective;
}

function configuredSectionKeys(value) {
  const candidates = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const seen = new Set();
  const keys = [];

  for (const candidate of candidates) {
    const key = normaliseSectionKey(candidate);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    keys.push(key);
  }

  return keys.length ? keys : [...DEFAULT_SECTIONS];
}

function normaliseSectionKey(value) {
  const key = normaliseConfigKey(value);
  return SECTION_ALIASES[key] || null;
}

function configuredGaugeKeys(value) {
  const candidates = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const seen = new Set();
  const keys = [];

  for (const candidate of candidates) {
    const key = normaliseGaugeKey(candidate);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    keys.push(key);
  }

  return keys.length ? keys : [...DEFAULT_GAUGES];
}

function effectiveGaugeKeys(config, rawConfig = {}, displayMode = DEFAULT_CONFIG.display_mode) {
  if (Object.prototype.hasOwnProperty.call(rawConfig, 'gauges')) {
    return configuredGaugeKeys(config.gauges);
  }
  return normaliseDisplayMode(displayMode) === 'glance'
    ? [...DEFAULT_GLANCE_GAUGES]
    : configuredGaugeKeys(config.gauges);
}

function normaliseGaugeKey(value) {
  const key = normaliseConfigKey(value);
  return GAUGE_ALIASES[key] || null;
}

function configuredFactKeys(value) {
  const candidates = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const seen = new Set();
  const keys = [];

  for (const candidate of candidates) {
    const key = normaliseFactKey(candidate);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    keys.push(key);
  }

  return keys.length ? keys : [...DEFAULT_FACTS];
}

function normaliseFactKey(value) {
  const key = normaliseConfigKey(value);
  return FACT_ALIASES[key] || null;
}

function configuredAlertKeys(value, fallback = DEFAULT_ALERT_TYPES) {
  const candidates = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const seen = new Set();
  const keys = [];

  for (const candidate of candidates) {
    const key = normaliseAlertKey(candidate);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    keys.push(key);
  }

  return keys.length ? keys : [...fallback];
}

function normaliseAlertKey(value) {
  const key = normaliseConfigKey(value);
  return ALERT_TYPE_ALIASES[key] || null;
}

function alertConfigsFromKeys(keys) {
  return configuredAlertKeys(keys).map((key) => ALERT_CONFIG_BY_KEY[key]).filter(Boolean);
}

function normaliseEntityOverrides(value) {
  const configured = objectConfig(value);
  const entities = {};

  if (!configured) {
    return entities;
  }

  for (const [rawKey, rawValue] of Object.entries(configured)) {
    const key = ENTITY_CONFIG_ALIASES[normaliseConfigKey(rawKey)];
    const entityId = safeEntityId(rawValue);
    if (key && entityId) {
      entities[key] = entityId;
    }
  }

  return entities;
}

function normaliseEntityDiscovery(config = {}) {
  return {
    prefix: safeEntityObjectStem(config.entity_id_prefix || config.entity_prefix),
    suffix: safeEntityObjectStem(config.entity_id_suffix || config.entity_suffix),
    matchTerms: normaliseEntityMatchTerms(config.entity_match || config.entity_filter || config.entity_name_filter),
  };
}

function entityCandidateIds(fallback, discovery = {}) {
  const [domain, objectId] = String(fallback || '').split('.', 2);
  if (!domain || !objectId) {
    return [];
  }
  const keyPart = objectId.startsWith('aus_bom_space_weather_')
    ? objectId.slice('aus_bom_space_weather_'.length)
    : objectId;
  const candidates = [];
  if (discovery.prefix) {
    candidates.push(`${domain}.${discovery.prefix}_${keyPart}`);
  }
  if (discovery.suffix) {
    candidates.push(`${domain}.${objectId}_${discovery.suffix}`);
    candidates.push(`${domain}.aus_bom_space_weather_${discovery.suffix}_${keyPart}`);
  }
  return [...new Set(candidates)];
}

function entityMatchesDiscovery(entityId, state, discovery = {}) {
  const terms = discovery.matchTerms || [];
  if (!terms.length) {
    return true;
  }
  const haystack = [
    entityId,
    state?.attributes?.friendly_name,
    state?.attributes?.location,
    state?.attributes?.k_index_location,
    state?.attributes?.device_class,
    state?.state,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => normaliseSearchText(value))
    .join(' ');
  return terms.every((term) => haystack.includes(term));
}

function normaliseEntityMatchTerms(value) {
  if (Array.isArray(value)) {
    return value.map(normaliseSearchText).filter(Boolean);
  }
  const text = String(value || '').trim();
  if (!text) {
    return [];
  }
  return text.split(',').map(normaliseSearchText).filter(Boolean);
}

function safeEntityObjectStem(value) {
  const stem = String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return stem.slice(0, 100);
}

function normaliseSearchText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ');
}

function safeEntityId(value) {
  const entityId = String(value ?? '').trim();
  if (!entityId || entityId.length > 128) {
    return '';
  }
  return /^[a-z_]+\.[a-zA-Z0-9_]+$/.test(entityId) ? entityId : '';
}

function normaliseConfigKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_');
}

function normaliseDisplayMode(value) {
  const mode = String(value || DEFAULT_CONFIG.display_mode).toLowerCase().replaceAll('-', '_');
  return DISPLAY_MODES.includes(mode) ? mode : DEFAULT_CONFIG.display_mode;
}

function safeIcon(value) {
  const icon = String(value || DEFAULT_CONFIG.icon).trim();
  if (!icon || icon.length > 80 || /[<>"'`{};]/.test(icon)) {
    return DEFAULT_CONFIG.icon;
  }
  return /^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(icon) ? icon : DEFAULT_CONFIG.icon;
}

function safeNavigationPath(value) {
  const path = String(value ?? '').trim();
  if (!path || path.length > 2048 || /[\u0000-\u001F<>`]/.test(path)) {
    return '';
  }
  if (path.startsWith('/') || path.startsWith('#')) {
    return path;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return '';
}

function safeUrlPath(value) {
  const url = String(value ?? '').trim();
  if (!url || url.length > 2048 || /[\u0000-\u001F<>`]/.test(url)) {
    return '';
  }
  if (url.startsWith('/') || /^https?:\/\//i.test(url)) {
    return url;
  }
  return '';
}

function safeEntryId(value) {
  const entryId = String(value ?? '').trim();
  if (!entryId || entryId.length > 128 || /[^a-zA-Z0-9_-]/.test(entryId)) {
    return '';
  }
  return entryId;
}

function safeRefreshEntryId(value) {
  return safeEntryId(value);
}

function backendHistoryPath(hours, entryId = '') {
  const safeHours = historyHours(hours);
  const safeId = safeEntryId(entryId);
  return `aus_bom_space_weather/history?hours=${safeHours}${safeId ? `&entry_id=${encodeURIComponent(safeId)}` : ''}`;
}

function entryIdCandidateEntities(entities = {}) {
  return [
    entities.data_health_entity,
    entities.data_age_entity,
    entities.data_stale_entity,
    entities.condition_entity,
    entities.k_index_entity,
  ].filter(Boolean);
}

function configuredMetricKeys(value, fallback = DEFAULT_GLANCE_METRICS) {
  const candidates = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const seen = new Set();
  const keys = [];

  for (const candidate of candidates) {
    const key = normaliseMetricKeyStrict(candidate);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    keys.push(key);
  }

  return keys.length ? keys : [...fallback];
}

function normaliseMetricKeyStrict(value) {
  const key = normaliseConfigKey(value);
  return METRIC_ALIASES[key] || null;
}

function normaliseMetricKey(value, fallback = DEFAULT_CONFIG.primary_metric) {
  return normaliseMetricKeyStrict(value) ||
    normaliseMetricKeyStrict(fallback) ||
    DEFAULT_CONFIG.primary_metric;
}

function normalisePreset(value) {
  const preset = normaliseConfigKey(value || DEFAULT_CONFIG.preset);
  return PRESETS.includes(preset) ? preset : PRESET_ALIASES[preset] || DEFAULT_CONFIG.preset;
}

function presetDefaults(value) {
  return PRESET_CONFIGS[normalisePreset(value)] || PRESET_CONFIGS.default;
}

function effectiveDensity(config, rawConfig = {}) {
  if (Object.prototype.hasOwnProperty.call(rawConfig, 'density')) {
    return normaliseDensity(config.density);
  }
  if (booleanConfig(config.compact, false)) {
    return 'compact';
  }
  return normaliseDensity(config.density);
}

function normaliseDensity(value) {
  const density = String(value || DEFAULT_CONFIG.density).toLowerCase().replaceAll('-', '_');
  return DENSITIES.includes(density) ? density : DEFAULT_CONFIG.density;
}

function normaliseThemeMode(value) {
  const mode = normaliseConfigKey(value || DEFAULT_CONFIG.theme_mode);
  return THEME_MODES.includes(mode) ? mode : THEME_MODE_ALIASES[mode] || DEFAULT_CONFIG.theme_mode;
}

function visualTheme(display, hass) {
  const themeMode = normaliseThemeMode(display?.theme_mode);
  const sunEntity = safeEntityId(display?.sun_entity) || DEFAULT_CONFIG.sun_entity;
  const solarPhase = solarPhaseFromSun(sunEntity && hass?.states ? stateObj(hass, sunEntity) : undefined);
  let mode = 'auto';

  if (themeMode === 'light' || themeMode === 'dark') {
    mode = themeMode;
  } else if (themeMode === 'sun') {
    mode = solarPhase === 'night'
      ? 'dark'
      : solarPhase === 'day'
        ? 'light'
        : homeAssistantThemeMode(hass);
  }

  return {
    mode,
    solarPhase,
    cardClass: `theme-${mode} theme-mode-${themeMode} solar-${solarPhase}`,
  };
}

function solarPhaseFromSun(state) {
  const sunState = String(state?.state || '').toLowerCase();
  if (sunState === 'above_horizon') {
    return 'day';
  }
  if (sunState === 'below_horizon') {
    return 'night';
  }
  return 'unknown';
}

function homeAssistantThemeMode(hass) {
  const themes = hass?.themes || {};
  if (typeof themes.darkMode === 'boolean') {
    return themes.darkMode ? 'dark' : 'light';
  }
  if (typeof themes.dark === 'boolean') {
    return themes.dark ? 'dark' : 'light';
  }
  return 'auto';
}

function normaliseAlertDetail(value) {
  const detail = String(value || DEFAULT_CONFIG.alert_detail).toLowerCase().replaceAll('-', '_');
  return ALERT_DETAILS.includes(detail) ? detail : DEFAULT_CONFIG.alert_detail;
}

function normaliseAction(value, fallback = DEFAULT_CONFIG.tap_action) {
  const configured = typeof value === 'string'
    ? { action: value }
    : objectConfig(value);
  const fallbackConfig = typeof fallback === 'string'
    ? { action: fallback }
    : fallback || DEFAULT_CONFIG.tap_action;

  if (!configured) {
    return { ...fallbackConfig, action: normaliseActionName(fallbackConfig.action) || 'more-info' };
  }

  const action = normaliseActionName(configured.action) ||
    normaliseActionName(fallbackConfig.action) ||
    'more-info';
  return {
    ...configured,
    action,
  };
}

function normaliseActionName(value) {
  const key = normaliseConfigKey(value);
  return ACTION_ALIASES[key] || null;
}

function normaliseThresholds(value) {
  const configured = objectConfig(value);
  const thresholds = {
    k_index: { ...DEFAULT_THRESHOLDS.k_index },
    a_index: { ...DEFAULT_THRESHOLDS.a_index },
    dst_index: { ...DEFAULT_THRESHOLDS.dst_index },
  };

  if (!configured) {
    return thresholds;
  }

  for (const [rawGroup, rawValues] of Object.entries(configured)) {
    const group = normaliseThresholdGroup(rawGroup);
    if (!group || !rawValues || typeof rawValues !== 'object' || Array.isArray(rawValues)) {
      continue;
    }
    thresholds[group] = normaliseThresholdValues(group, rawValues, thresholds[group]);
  }

  return thresholds;
}

function normaliseGaugeOptions(value) {
  const configured = objectConfig(value);
  const options = {
    k_index: { ...DEFAULT_GAUGE_OPTIONS.k_index },
    a_index: { ...DEFAULT_GAUGE_OPTIONS.a_index },
    dst_index: { ...DEFAULT_GAUGE_OPTIONS.dst_index },
  };

  if (!configured) {
    return options;
  }

  for (const [rawGroup, rawValues] of Object.entries(configured)) {
    const group = normaliseGaugeOptionGroup(rawGroup);
    if (!group || !rawValues || typeof rawValues !== 'object' || Array.isArray(rawValues)) {
      continue;
    }
    options[group] = normaliseGaugeOptionValues(group, rawValues, options[group]);
  }

  return options;
}

function normaliseGaugeOptionGroup(value) {
  const key = normaliseConfigKey(value);
  return GAUGE_OPTION_GROUP_ALIASES[key] || null;
}

function normaliseGaugeOptionValues(group, rawValues, fallback) {
  const values = { ...fallback };
  for (const [rawKey, rawValue] of Object.entries(rawValues)) {
    const key = GAUGE_OPTION_KEY_ALIASES[normaliseConfigKey(rawKey)];
    if (!key) {
      continue;
    }
    if (key === 'unit') {
      values.unit = safeGaugeUnit(rawValue, fallback.unit);
      continue;
    }
    if (key === 'precision') {
      values.precision = positiveInteger(rawValue, fallback.precision, 0, 3);
      continue;
    }
    values[key] = gaugeOptionNumber(group, key, rawValue, values[key]);
  }
  if (values.max <= values.min) {
    return { ...fallback, precision: values.precision, unit: values.unit };
  }
  return values;
}

function gaugeOptionNumber(group, key, value, fallback) {
  if (group === 'k_index') {
    return numberConfig(value, fallback, 0, 20);
  }
  if (group === 'a_index') {
    return numberConfig(value, fallback, 0, 2000);
  }
  if (group === 'dst_index') {
    return numberConfig(value, fallback, -2e3, 2000);
  }
  return numberConfig(value, fallback, -2e3, 2000);
}

function safeGaugeUnit(value, fallback = '') {
  const unit = String(value ?? '').trim();
  if (unit.length > 12 || /[<>`{}]/.test(unit)) {
    return fallback;
  }
  return unit;
}

function normaliseLabels(value) {
  const configured = objectConfig(value);
  const labels = { ...DEFAULT_LABELS };

  if (!configured) {
    return labels;
  }

  for (const [rawKey, rawValue] of Object.entries(configured)) {
    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      for (const [nestedKey, nestedValue] of Object.entries(rawValue)) {
        applyLabel(labels, nestedKey, nestedValue);
      }
      continue;
    }
    applyLabel(labels, rawKey, rawValue);
  }

  return labels;
}

function applyLabel(labels, rawKey, rawValue) {
  const key = normaliseLabelKey(rawKey);
  const value = String(rawValue ?? '').trim();
  if (!key || !value) {
    return;
  }
  labels[key] = value.slice(0, 120);
}

function normaliseLabelKey(value) {
  return LABEL_ALIASES[normaliseConfigKey(value)] || null;
}

function labelFrom(labels, key, fallback) {
  return labels?.[key] || fallback;
}

function normaliseColors(value) {
  const configured = objectConfig(value);
  const colors = {};

  if (!configured) {
    return colors;
  }

  for (const [rawKey, rawValue] of Object.entries(configured)) {
    const key = normaliseColorKey(rawKey);
    const color = safeCssColor(rawValue);
    if (key && color) {
      colors[key] = color;
    }
  }

  return colors;
}

function normaliseColorKey(value) {
  return COLOR_ALIASES[normaliseConfigKey(value)] || null;
}

function safeCssColor(value) {
  const color = String(value ?? '').trim();
  if (!color || color.length > 80 || /[;{}]/.test(color)) {
    return '';
  }
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    return color;
  }
  if (/^var\(--[a-zA-Z0-9_-]+\)$/.test(color)) {
    return color;
  }
  if (/^(rgb|rgba|hsl|hsla)\([\d\s,.%+-]+\)$/.test(color)) {
    return color;
  }
  if (/^[a-zA-Z]+$/.test(color)) {
    return color;
  }
  return '';
}

function colorStyle(colors) {
  if (!colors || typeof colors !== 'object') {
    return '';
  }
  return COLOR_KEYS
    .filter((key) => colors[key])
    .map((key) => `--asw-${key}:${colors[key]}`)
    .join(';');
}

function objectConfig(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (_err) {
    return null;
  }
}

function normaliseThresholdGroup(value) {
  const key = normaliseConfigKey(value);
  return THRESHOLD_GROUP_ALIASES[key] || null;
}

function normaliseThresholdValues(group, rawValues, fallback) {
  const values = { ...fallback };
  const aliases = THRESHOLD_KEY_ALIASES[group] || {};
  for (const [rawKey, rawValue] of Object.entries(rawValues)) {
    const key = aliases[normaliseConfigKey(rawKey)];
    if (!key) {
      continue;
    }
    values[key] = thresholdNumber(group, key, rawValue, values[key]);
  }
  return values;
}

function thresholdNumber(group, key, value, fallback) {
  if (group === 'k_index') {
    return numberConfig(value, fallback, 0, 9);
  }
  if (group === 'a_index') {
    return numberConfig(value, fallback, 0, 1000);
  }
  if (group === 'dst_index') {
    return numberConfig(value, fallback, -1e3, 500);
  }
  return numberConfig(value, fallback, -1e3, 1000);
}

function numberConfig(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
}

function booleanConfig(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', 'yes', 'on', '1'].includes(normalised)) {
      return true;
    }
    if (['false', 'no', 'off', '0'].includes(normalised)) {
      return false;
    }
  }
  return fallback;
}

function gaugeSectionTemplate({
  display,
  gaugeKeys,
  gaugeData,
  entities,
  thresholds,
  labels,
  metricContext,
  status,
  freshness,
}) {
  if (display.display_mode === 'glance' && gaugeKeys.length === 1) {
    return `
      <div class="gauges gauge-count-1 glance-gauges">
        ${glanceGaugeTemplate(
    gaugeKeys[0],
    gaugeData[gaugeKeys[0]],
    entities,
    thresholds,
    display.gauge_options,
    labels,
    metricContext,
    status,
    freshness,
    display.glance_metrics,
    display.glance_chips,
  )}
      </div>
    `;
  }

  return `
    <div class="gauges gauge-count-${gaugeKeys.length}">
      ${gaugeKeys.map((key) => gaugeTemplateFromConfig(key, gaugeData[key], entities, thresholds, display.gauge_options, labels, display.show_history, display.show_timestamps)).join('')}
    </div>
  `;
}

function gaugeTemplateFromConfig(key, data, entities, thresholds, gaugeOptions, labels, showHistory, showTimestamps) {
  const config = GAUGE_CONFIGS[key];
  const options = gaugeOptions[key] || DEFAULT_GAUGE_OPTIONS[key];
  const severity = config.severity(data.value, thresholds);
  return gaugeTemplate(
    labelFrom(labels, config.labelKey, config.label),
    data.value,
    options.max,
    options.unit,
    severity.tone,
    sourceTime(data.state),
    data.history,
    entities[config.entityKey],
    options.min,
    { precision: options.precision, showSparkline: showHistory, showTime: showTimestamps },
  );
}

function glanceGaugeTemplate(key, data, entities, thresholds, gaugeOptions, labels, metricContext, status, freshness, glanceMetrics, glanceChips) {
  const config = GAUGE_CONFIGS[key];
  const options = gaugeOptions[key] || DEFAULT_GAUGE_OPTIONS[key];
  const severity = config.severity(data.value, thresholds, labels);
  const unavailable = data.value === null;
  const display = unavailable ? '--' : formatNumber(data.value, options.precision);
  const range = options.max - options.min;
  const percent = unavailable ? 0 : clamp(((data.value - options.min) / range) * 100, 0, 100);
  const label = labelFrom(labels, config.labelKey, config.label);
  const station = key === 'k_index'
    ? kIndexLocationLabel(data.state, metricContext.kIndexLocationState, labels)
    : data.state?.attributes?.friendly_name || label;
  const metricItems = configuredMetricKeys(glanceMetrics, DEFAULT_GLANCE_METRICS)
    .slice(0, MAX_GLANCE_METRICS)
    .map((metricKey) => glanceMetricData(metricKey, metricContext, freshness));
  const chipItems = configuredMetricKeys(glanceChips, DEFAULT_GLANCE_CHIPS)
    .slice(0, MAX_GLANCE_CHIPS)
    .map((metricKey) => glanceMetricData(metricKey, metricContext, freshness));
  const metricColumns = Math.min(2, Math.max(1, metricItems.length));
  const chipColumns = Math.min(3, Math.max(1, chipItems.length));

  return `
    <section class="glance-panel tone-${severity.tone}${unavailable ? ' unavailable' : ''}">
      <div class="glance-overview">
        ${glancePrimaryMetricTemplate({
    label,
    value: display,
    unit: options.unit,
    station,
    statusLabel: severity.label || displayStatusLabel(status.label),
    range: glanceKRangeText(key, thresholds, data.value, labels),
    entityId: entities[config.entityKey],
    percent,
    tone: severity.tone,
    icon: metricIcon(key),
  })}
      ${glanceScaleTemplate(key, thresholds, data.value, labels)}
        <div class="glance-metrics" style="--glance-metric-columns:${metricColumns}">
          ${metricItems.map((item) => glanceMetricTemplate(item.label, item.value, item.entityId, item.tone, item.icon)).join('')}
        </div>
      </div>
      <div class="glance-footer" style="--glance-chip-columns:${chipColumns}">
        ${chipItems.map((item) => glanceFooterChipTemplate(item.label, item.value, item.entityId, item.tone, item.icon)).join('')}
      </div>
    </section>
  `;
}

function glancePrimaryMetricTemplate({ label, value, unit, station, statusLabel, range, entityId, percent, tone, icon }) {
  return `
    <div class="glance-primary tone-${tone}" role="button" tabindex="0" data-entity-id="${escapeAttribute(entityId)}" aria-label="${escapeAttribute(`Open ${label} more info`)}">
      <div class="glance-primary-gauge" style="--percent:${percent}" aria-hidden="true">
        <div class="glance-primary-gauge-inner">
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(unit || label)}</span>
        </div>
      </div>
      <div class="glance-primary-copy">
        <div class="glance-primary-head">
          <ha-icon icon="${escapeAttribute(icon)}"></ha-icon>
          <span>${escapeHtml(label)}</span>
        </div>
        <strong>${escapeHtml(statusLabel)}</strong>
        <div class="glance-primary-meta">
          <span>${escapeHtml(station)}</span>
          <small>${escapeHtml(range)}</small>
        </div>
      </div>
      <div class="glance-primary-rail" style="--percent:${percent}" aria-hidden="true"></div>
    </div>
  `;
}

function glanceScaleTemplate(key, thresholds, value, labels = DEFAULT_LABELS) {
  if (key !== 'k_index') {
    return '';
  }
  if (value === null) {
    return glanceUnavailableTemplate(labels);
  }
  const marker = value === null ? 0 : clamp((value / 9) * 100, 0, 100);
  return `
    <div class="glance-scale" style="--marker:${marker}%">
      <div class="glance-scale-rail" aria-hidden="true">
        <span class="quiet"></span>
        <span class="outlook"></span>
        <span class="watch"></span>
        <span class="storm"></span>
      </div>
      <div class="glance-scale-labels">
        <span>0 ${escapeHtml(labels.quiet)}</span>
        <span>${escapeHtml(thresholds.k_index.active)} ${escapeHtml(labels.active)}</span>
        <span>${escapeHtml(thresholds.k_index.minor_storm)}+ ${escapeHtml(labels.storm)}</span>
      </div>
    </div>
  `;
}

function glanceUnavailableTemplate(labels = DEFAULT_LABELS) {
  return `
    <div class="glance-state-note tone-neutral">
      <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
      <span>${escapeHtml(labels.data_unavailable)}</span>
    </div>
  `;
}

function glanceMetricData(metricKey, context, freshness) {
  const key = normaliseMetricKey(metricKey);
  const metric = tileMetric(key, context);
  const dataAgeState = key === 'data_age' ? compactDataAgeState(context, freshness, metric.value) : null;
  const compactLabels = {
    active_alerts: 'Alerts',
    data_age: 'Data',
    data_health: 'Health',
    endpoint_status: 'Endpoints',
    aurora_visibility: 'Aurora',
    severity_level: 'Severity',
    status: 'Geomag',
    freshness: 'Fresh',
    dst_index: 'Dst',
    a_index: 'A',
    k_index: 'K',
    k_station: 'Station',
    g_scale: 'Storm',
  };
  const value = compactMetricValue(key, key === 'data_age'
    ? dataAgeState.value
    : displayStatusValue(key, metric.value));
  const tone = key === 'data_age'
    ? dataAgeState.tone
    : metric.tone;
  return {
    label: dataAgeState?.label || compactMetricLabel(compactLabels[key] || metric.label, compactLabels[key] || metric.label),
    value,
    entityId: metric.entityId,
    tone,
    icon: metricIcon(key),
  };
}

function compactDataAgeState(context, freshness, metricValue) {
  if (compactDataIsStale(context, freshness)) {
    return {
      label: 'Stale',
      value: compactDataAgeValue(freshness.label || metricValue),
      tone: 'watch',
    };
  }

  const health = String(context?.dataHealthState?.state || '').trim().toLowerCase();
  const errorCount = numberState(context?.apiErrorCountState);
  if (health && !['ok', 'healthy', 'unknown', 'unavailable'].includes(health)) {
    return {
      label: 'Data',
      value: titleCase(health),
      tone: health === 'partial' ? 'watch' : 'warning',
    };
  }
  if (errorCount !== null && errorCount > 0) {
    return {
      label: 'Data',
      value: errorCount === 1 ? '1 issue' : `${errorCount} issues`,
      tone: 'watch',
    };
  }

  return {
    label: 'Data',
    value: compactDataAgeValue(metricValue),
    tone: 'quiet',
  };
}

function compactMetricValue(key, value) {
  const text = String(value ?? '').trim();
  if (key !== 'status' && ['unknown', 'unavailable'].includes(text.toLowerCase())) {
    return '--';
  }
  return text;
}

function compactDataIsStale(context, freshness) {
  if (isKnownState(context?.dataStaleState)) {
    return context.dataStaleState.state === 'on';
  }
  return !!freshness?.stale || context?.dataStaleState?.state === 'on';
}

function displayStatusValue(key, value) {
  return key === 'status' ? displayStatusLabel(value) : value;
}

function metricIcon(key) {
  return {
    k_index: 'mdi:earth',
    a_index: 'mdi:chart-timeline-variant',
    dst_index: 'mdi:pulse',
    status: 'mdi:magnet',
    freshness: 'mdi:database-clock',
    k_station: 'mdi:map-marker',
    severity_level: 'mdi:alert-decagram',
    active_alerts: 'mdi:bell-outline',
    endpoint_status: 'mdi:server-network',
    data_age: 'mdi:database-clock',
    data_stale: 'mdi:clock-alert-outline',
    data_health: 'mdi:shield-check-outline',
    aurora_visibility: 'mdi:weather-night',
    aurora_band: 'mdi:map-marker-radius-outline',
    k_aus: 'mdi:weather-night',
    g_scale: 'mdi:magnet-on',
    api_errors: 'mdi:api',
  }[key] || 'mdi:information-outline';
}

function glanceMetricTemplate(label, value, entityId, tone = 'neutral', icon = '') {
  return `
    <div class="glance-metric tone-${tone}" role="button" tabindex="0" data-entity-id="${escapeAttribute(entityId)}" aria-label="${escapeAttribute(`Open ${label} more info`)}">
      <ha-icon icon="${escapeAttribute(icon)}"></ha-icon>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function glanceFooterChipTemplate(label, value, entityId, tone = 'neutral', icon = '') {
  return `
    <div class="glance-footer-chip tone-${tone}" role="button" tabindex="0" data-entity-id="${escapeAttribute(entityId)}" aria-label="${escapeAttribute(`Open ${label} more info`)}">
      <ha-icon icon="${escapeAttribute(icon)}"></ha-icon>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function kIndexLocationLabel(kState, kIndexLocationState, labels = DEFAULT_LABELS) {
  return isKnownState(kIndexLocationState)
    ? kIndexLocationState.state
    : kState?.attributes?.location || labels.region;
}

function compactMetricLabel(label, fallback) {
  const compact = String(label || fallback)
    .replace(/^Active\s+/i, '')
    .replace(/\s+age$/i, '')
    .trim();
  return titleCase(compact || fallback);
}

function compactDataAgeValue(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d+(?:\.\d+)?)\s*min$/i);
  return match ? `${match[1]}m` : text;
}

function glanceKRangeText(key, thresholds, value, labels = DEFAULT_LABELS) {
  if (key !== 'k_index') {
    return labels.status;
  }
  if (value === null) {
    return labels.unknown;
  }
  if (value < thresholds.k_index.active) {
    return `K < ${thresholds.k_index.active}`;
  }
  if (value < thresholds.k_index.minor_storm) {
    return `K ${thresholds.k_index.active}-${thresholds.k_index.minor_storm}`;
  }
  return `K >= ${thresholds.k_index.minor_storm}`;
}

function displayStatusLabel(value) {
  const text = String(value || '').trim();
  return text === text.toLowerCase() ? titleCase(text) : text;
}

function entitySuggestion(hass, entityId) {
  const entity = safeEntityId(entityId);
  if (!entity || !isAusBomSpaceWeatherEntity(hass, entity)) {
    return null;
  }
  const override = suggestionEntityOverride(entity);
  const context = suggestionContextConfig(hass, entity);
  const baseConfig = {
    type: CARD_CUSTOM_TYPE,
    ...compactStubConfig(),
    ...context,
    ...(override ? { entities: override } : {}),
  };
  const metric = suggestionMetric(entity);
  const suggestions = [
    {
      label: 'Compact space weather card',
      config: baseConfig,
    },
  ];
  if (metric) {
    suggestions.push({
      label: 'Space weather tile',
      config: {
        type: CARD_CUSTOM_TYPE,
        preset: 'tile',
        primary_metric: metric,
        secondary_metric: 'status',
        ...context,
        ...(override ? { entities: override } : {}),
      },
    });
  }
  return suggestions;
}

function suggestionContextConfig(hass, entityId) {
  const state = hass?.states?.[entityId];
  const entryId = safeEntryId(state?.attributes?.entry_id);
  const location = safeSuggestionMatchText(
    state?.attributes?.k_index_location ||
    state?.attributes?.location,
  );
  return {
    ...(location ? { entity_match: location } : {}),
    ...(entryId ? { refresh_entry_id: entryId, history_entry_id: entryId } : {}),
  };
}

function safeSuggestionMatchText(value) {
  const text = String(value || '').trim();
  if (!text || text.length > 80 || /[\u0000-\u001F<>`{};]/.test(text)) {
    return '';
  }
  return text.replace(/\s+/g, ' ');
}

function isAusBomSpaceWeatherEntity(hass, entityId) {
  const [domain, objectId] = entityId.split('.', 2);
  if (!['sensor', 'binary_sensor', 'select'].includes(domain)) {
    return false;
  }
  if (objectId?.includes('aus_bom_space_weather')) {
    return true;
  }
  const state = hass?.states?.[entityId];
  const friendlyName = normaliseSearchText(state?.attributes?.friendly_name);
  return friendlyName.includes('aus bom space weather')
    || friendlyName.includes('bom space weather')
    || friendlyName.includes('space weather');
}

function suggestionEntityOverride(entityId) {
  const objectId = entityId.split('.', 2)[1] || '';
  const matches = [
    ['k_index', 'k_index'],
    ['a_index', 'a_index'],
    ['dst_index', 'dst_index'],
    ['geomagnetic_activity', 'activity'],
    ['condition', 'condition'],
    ['severity_level', 'severity_level'],
    ['active_alert_count', 'active_alerts'],
    ['api_error_count', 'api_errors'],
    ['endpoint_status', 'endpoint_status'],
    ['data_age', 'data_age'],
    ['data_health', 'data_health'],
    ['data_stale', 'data_stale'],
    ['aurora_visibility', 'aurora_visibility'],
    ['k_index_location', 'k_index_location'],
    ['aurora_alert', 'aurora_alert'],
    ['aurora_watch', 'aurora_watch'],
    ['aurora_outlook', 'aurora_outlook'],
    ['magnetic_alert', 'magnetic_alert'],
    ['magnetic_warning', 'magnetic_warning'],
  ];
  const match = matches.find(([suffix]) => objectId.endsWith(suffix));
  return match ? { [match[1]]: entityId } : null;
}

function suggestionMetric(entityId) {
  const objectId = entityId.split('.', 2)[1] || '';
  if (objectId.endsWith('k_index')) return 'k_index';
  if (objectId.endsWith('a_index')) return 'a_index';
  if (objectId.endsWith('dst_index')) return 'dst_index';
  if (objectId.endsWith('severity_level')) return 'severity_level';
  if (objectId.endsWith('aurora_visibility')) return 'aurora_visibility';
  if (objectId.endsWith('data_age')) return 'data_age';
  if (objectId.endsWith('data_health')) return 'data_health';
  if (objectId.endsWith('endpoint_status')) return 'endpoint_status';
  if (objectId.endsWith('active_alert_count')) return 'active_alerts';
  return null;
}

function gaugeTemplate(label, value, max, unit, tone, time, history, entityId, min = 0, options = {}) {
  const display = value === null ? '--' : formatNumber(value, options.precision);
  const range = max - min;
  const percent = value === null ? 0 : clamp(((value - min) / range) * 100, 0, 100);
  const sparklineClass = options.showSparkline === false ? ' no-spark' : '';
  const timestampClass = options.showTime === false ? ' no-time' : '';
  return `
    <section class="gauge-card tone-${tone}${sparklineClass}${timestampClass}" role="button" tabindex="0" data-entity-id="${escapeAttribute(entityId)}" aria-label="${escapeAttribute(`Open ${label} more info`)}">
      <div class="gauge-top">
        <span>${escapeHtml(label)}</span>
        ${options.showTime === false ? '' : `<small>${escapeHtml(formatTime(time))}</small>`}
      </div>
      <div class="gauge-row">
        <div class="gauge" style="--percent:${percent}">
          <div class="gauge-inner">
            <strong>${escapeHtml(display)}</strong>
            <span>${escapeHtml(unit)}</span>
          </div>
        </div>
        ${options.showSparkline === false ? '' : `<div class="spark">${sparklineTemplate(history)}</div>`}
      </div>
    </section>
  `;
}

function refreshButtonTemplate(refreshing, labels = DEFAULT_LABELS) {
  return `
    <button
      class="refresh-button${refreshing ? ' refreshing' : ''}"
      type="button"
      title="${escapeAttribute(labels.refresh)}"
      aria-label="${escapeAttribute(labels.refresh)}"
      ${refreshing ? 'disabled' : ''}
    >
      <ha-icon icon="mdi:refresh"></ha-icon>
    </button>
  `;
}

function loadingTemplate(display, labels = DEFAULT_LABELS) {
  return `
    <div class="loading loading-card tone-neutral" role="status" aria-live="polite">
      <div class="loading-icon" aria-hidden="true">
        <ha-icon icon="${escapeAttribute(display.icon || DEFAULT_CONFIG.icon)}"></ha-icon>
      </div>
      <div class="loading-copy">
        <strong>${escapeHtml(labels.loading)}</strong>
        <span>${escapeHtml(labels.data_unavailable)}</span>
      </div>
      <div class="loading-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
}

function statusChipTemplate(status) {
  return `
    <div class="status">
      <span class="pulse"></span>
      <span>${escapeHtml(displayStatusLabel(status.label))}</span>
    </div>
  `;
}

function freshnessPillTemplate(freshness) {
  return `
    <div class="freshness-pill ${freshness.stale ? 'stale' : 'fresh'}" title="${escapeAttribute(freshness.title)}">
      <span></span>
      <strong>${escapeHtml(freshness.label)}</strong>
    </div>
  `;
}

function tileTemplate({ display, labels, primaryMetric, secondaryMetric, status, freshness, refreshing, title }) {
  const tone = primaryMetric.tone || status.tone || 'neutral';
  const secondaryMarkup = tileSecondaryTemplate(secondaryMetric);
  const primaryEntityId = primaryMetric.entityId || secondaryMetric.entityId || '';
  const titleEntityId = secondaryMetric.entityId || primaryEntityId;
  const actions = [
    display.show_refresh ? refreshButtonTemplate(refreshing, labels) : '',
    display.show_freshness ? freshnessPillTemplate(freshness) : '',
    display.show_status ? statusChipTemplate(status) : '',
  ].filter(Boolean).join('');

  return `
    <div class="tile-card${actions ? ' has-actions' : ''} tone-${tone}">
      ${display.show_icon ? `
      <div class="tile-icon" aria-hidden="true">
        <ha-icon icon="${escapeAttribute(display.icon)}"></ha-icon>
      </div>
      ` : ''}
      <div class="tile-main" role="button" tabindex="0" data-entity-id="${escapeAttribute(titleEntityId)}" aria-label="${escapeAttribute(`Open ${title} more info`)}">
        <div class="tile-title">${escapeHtml(title)}</div>
        ${secondaryMarkup}
      </div>
      <div class="tile-metric" role="button" tabindex="0" data-entity-id="${escapeAttribute(primaryEntityId)}" aria-label="${escapeAttribute(`Open ${primaryMetric.label} more info`)}">
        <strong>${escapeHtml(primaryMetric.value)}</strong>
        <span>${escapeHtml(primaryMetric.label)}</span>
      </div>
      ${actions ? `<div class="tile-actions">${actions}</div>` : ''}
    </div>
  `;
}

function tileSecondaryTemplate(metric) {
  if (!metric || !metric.value) {
    return '<div class="tile-subtitle"></div>';
  }
  if (metric.key === 'status') {
    return `
      <div class="tile-subtitle tile-status-pill tone-${metric.tone || 'neutral'}">
        <span></span>
        <strong>${escapeHtml(displayStatusLabel(metric.value))}</strong>
      </div>
    `;
  }
  return `<div class="tile-subtitle">${escapeHtml(tileSecondaryText(metric))}</div>`;
}

function tileSecondaryText(metric) {
  if (!metric || !metric.value) {
    return '';
  }
  return metric.label ? `${metric.label}: ${metric.value}` : String(metric.value);
}

function tileMetric(metricKey, context) {
  const key = normaliseMetricKey(metricKey);
  const gaugeMetric = tileGaugeMetric(key, context);
  if (gaugeMetric) {
    return gaugeMetric;
  }

  if (key === 'status') {
    return {
      key,
      label: context.labels.status,
      value: context.status.label,
      tone: context.status.tone,
      entityId: context.entities.condition_entity || context.entities.activity_entity,
    };
  }

  if (key === 'freshness') {
    return {
      key,
      label: context.labels.freshness,
      value: context.freshness.label,
      tone: context.freshness.stale ? 'watch' : 'quiet',
      entityId: context.entities.data_health_entity,
    };
  }

  const fact = spaceWeatherFact(key, context);
  if (fact) {
    return {
      key,
      ...fact,
      value: String(fact.value),
      tone: fact.tone || factTone(key, fact.value),
    };
  }

  return {
    key,
    label: context.labels.status,
    value: context.status.label,
    tone: context.status.tone,
    entityId: context.entities.condition_entity || context.entities.activity_entity,
  };
}

function tileGaugeMetric(key, context) {
  const gaugeConfig = GAUGE_CONFIGS[key];
  if (!gaugeConfig) {
    return null;
  }
  const options = context.gaugeOptions[key] || DEFAULT_GAUGE_OPTIONS[key];
  const valueMap = {
    k_index: context.kValue,
    a_index: context.aValue,
    dst_index: context.dstValue,
  };
  const value = valueMap[key];
  const severity = gaugeConfig.severity(value, context.thresholds, context.labels);
  const displayValue = value === null ? '--' : formatNumber(value, options.precision);
  const unit = options.unit ? ` ${options.unit}` : '';
  return {
    key,
    label: labelFrom(context.labels, gaugeConfig.labelKey, gaugeConfig.label),
    value: `${displayValue}${unit}`,
    tone: severity.tone,
    entityId: context.entities[gaugeConfig.entityKey],
  };
}

function factTone(key, value) {
  if (key === 'severity_level') {
    const level = Number(value);
    if (!Number.isFinite(level)) return 'neutral';
    if (level >= 5) return 'storm';
    if (level >= 4) return 'warning';
    if (level >= 3) return 'watch';
    if (level >= 2) return 'active';
    if (level >= 1) return 'outlook';
    return 'quiet';
  }
  if (key === 'api_errors') {
    return Number(value) > 0 ? 'watch' : 'quiet';
  }
  if (key === 'endpoint_status') {
    const status = String(value).toLowerCase();
    if (status === '--' || status === 'unknown') return 'neutral';
    if (status.includes('/')) {
      const [ok, total] = status.split('/').map((part) => Number.parseInt(part, 10));
      return Number.isFinite(ok) && Number.isFinite(total) && ok < total ? 'watch' : 'quiet';
    }
    return status === 'ok' ? 'quiet' : 'watch';
  }
  if (key === 'data_stale') {
    return String(value).toLowerCase() === 'on' || String(value).toLowerCase() === 'stale'
      ? 'watch'
      : 'quiet';
  }
  if (key === 'active_alerts') {
    return Number(value) > 0 ? 'warning' : 'quiet';
  }
  if (key === 'data_health') {
    return String(value).toLowerCase() === 'ok' || String(value).toLowerCase() === 'healthy'
      ? 'quiet'
      : 'watch';
  }
  if (key === 'aurora_visibility') {
    const visibility = String(value).toLowerCase();
    if (visibility === 'likely') return 'aurora';
    if (visibility === 'possible') return 'watch';
    if (visibility === 'low') return 'outlook';
    return 'quiet';
  }
  if (key === 'g_scale') {
    const scale = String(value).toUpperCase().match(/G(\d+)/);
    if (!scale) return 'quiet';
    const level = Number(scale[1]);
    if (level >= 4) return 'storm';
    if (level >= 3) return 'warning';
    if (level >= 2) return 'watch';
    if (level >= 1) return 'outlook';
    return 'quiet';
  }
  return 'neutral';
}

function bandTemplate(label, active) {
  return `<div class="band${active ? ' active' : ''}">${escapeHtml(label)}</div>`;
}

function factSectionTemplate(facts) {
  const factCount = clamp(facts.length || 1, 1, 4);
  return `
    <div class="facts fact-count-${facts.length}" style="--fact-count:${factCount}">
      ${facts.map((fact) => factTemplate(fact)).join('')}
    </div>
  `;
}

function factTemplate(fact) {
  const entityAttrs = fact.entityId
    ? ` role="button" tabindex="0" data-entity-id="${escapeAttribute(fact.entityId)}" aria-label="${escapeAttribute(`Open ${fact.label} more info`)}"`
    : '';
  const icon = metricIcon(fact.key);
  return `
    <div class="fact tone-${fact.tone || 'neutral'}"${entityAttrs}>
      <ha-icon class="fact-icon" icon="${escapeAttribute(icon)}"></ha-icon>
      <span>${escapeHtml(fact.label)}</span>
      <strong>${escapeHtml(fact.value)}</strong>
    </div>
  `;
}

function alertChipsTemplate(alerts, labels = DEFAULT_LABELS) {
  if (!alerts.length) {
    return '';
  }
  return `
    <div class="alert-chips">
      ${alerts.map((alert) => alertChipTemplate(alert, labels)).join('')}
    </div>
  `;
}

function alertChipTemplate(alert, labels = DEFAULT_LABELS) {
  const attrs = alert.state?.attributes || {};
  const icon = alertChipIcon(alert);
  const metrics = [
    alert.pending ? labels.pending : alert.expired ? labels.expired : '',
    attrs.k_aus !== undefined ? `K-Aus ${attrs.k_aus}` : '',
    attrs.g_scale !== undefined ? `G${attrs.g_scale}` : '',
    attrs.lat_band ? titleCase(attrs.lat_band) : '',
  ].filter(Boolean).join(' · ');
  return `
    <button
      class="alert-chip ${alert.inactive ? 'inactive ' : ''}tone-${alert.tone}"
      type="button"
      data-entity-id="${escapeAttribute(alert.entityId)}"
      aria-label="${escapeAttribute(`Open ${alert.label} more info`)}"
    >
      <ha-icon class="alert-chip-icon" icon="${escapeAttribute(icon)}"></ha-icon>
      <span>${escapeHtml(alert.label)}</span>
      ${metrics ? `<strong>${escapeHtml(metrics)}</strong>` : ''}
    </button>
  `;
}

function alertChipIcon(alert) {
  const key = normaliseConfigKey(alert?.labelKey || alert?.label || '');
  if (key.includes('aurora')) {
    return 'mdi:weather-night';
  }
  if (key.includes('magnetic')) {
    return 'mdi:magnet';
  }
  return 'mdi:bell-outline';
}

function timelineSectionTemplate(history, currentKValue, hours, entityId, kThresholds = DEFAULT_THRESHOLDS.k_index, labels = DEFAULT_LABELS) {
  const points = timelinePoints(history, currentKValue, hours);
  if (!points.length) {
    return '';
  }

  return `
    <section class="timeline" role="button" tabindex="0" data-entity-id="${escapeAttribute(entityId)}" aria-label="Open K index more info">
      <div class="timeline-head">
        <div>
          <strong>${escapeHtml(formatTemplate(labels.timeline_title, { hours }))}</strong>
          <span>${escapeHtml(labels.timeline_subtitle)}</span>
        </div>
        <span>${escapeHtml(timelineSummary(points, labels))}</span>
      </div>
      <div class="timeline-rail" style="--segment-count:${points.length}" aria-label="K index activity over the last ${hours} hours">
        ${points.map((point) => timelineSegmentTemplate(point, kThresholds, labels)).join('')}
      </div>
      <div class="timeline-scale" aria-hidden="true">
        <span>${escapeHtml(formatTemplate(labels.timeline_start, { hours }))}</span>
        <span>${escapeHtml(labels.timeline_now)}</span>
      </div>
    </section>
  `;
}

function timelineSegmentTemplate(point, kThresholds = DEFAULT_THRESHOLDS.k_index, labels = DEFAULT_LABELS) {
  const severity = severityFromK(point.value, kThresholds, labels);
  const height = 10 + clamp(point.value || 0, 0, 9) * 4;
  return `
    <span
      class="timeline-segment tone-${severity.tone}"
      style="--bar-height:${height}px"
      title="${escapeAttribute(`K ${point.value} · ${severity.label}`)}"
    ></span>
  `;
}

function timelinePoints(history, currentKValue, hours) {
  const source = Array.isArray(history) && history.length
    ? history
    : Number.isFinite(currentKValue)
      ? [{ value: currentKValue }]
      : [];
  const points = source
    .filter((point) => Number.isFinite(point.value))
    .slice(-hours);
  return sampleTimelinePoints(points, 48);
}

function timelineSummary(points, labels = DEFAULT_LABELS) {
  const maxK = points.reduce((max, point) => Math.max(max, point.value), 0);
  return formatTemplate(labels.timeline_peak, { value: Math.round(maxK * 10) / 10 });
}

function sampleTimelinePoints(points, maxPoints) {
  if (points.length <= maxPoints) {
    return points;
  }
  const step = points.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, index) => {
    const start = Math.floor(index * step);
    const end = Math.max(start + 1, Math.floor((index + 1) * step));
    return points.slice(start, end).reduce(
      (peak, point) => (point.value > peak.value ? point : peak),
      points[start],
    );
  });
}

function alertSectionTemplate(alerts, showClearState = true, alertDetail = 'auto', displayMode = DEFAULT_CONFIG.display_mode, labels = DEFAULT_LABELS) {
  if (!alerts.length) {
    if (!showClearState) {
      return '';
    }
    return `
      <div class="alerts quiet-state">
        <div class="alert-title">${escapeHtml(labels.no_alerts_title)}</div>
        <div class="alert-copy">${escapeHtml(labels.no_alerts_copy)}</div>
      </div>
    `;
  }

  return `
    <div class="alerts">
      ${alerts.map((alert) => alertTemplate(alert, shouldShowAlertDetails(alertDetail, displayMode), labels)).join('')}
    </div>
  `;
}

function shouldShowAlertDetails(alertDetail, displayMode) {
  const detail = normaliseAlertDetail(alertDetail);
  if (detail === 'full') {
    return true;
  }
  if (detail === 'summary') {
    return false;
  }
  return normaliseDisplayMode(displayMode) === 'full';
}

function diagnosticSectionTemplate(conditionState, apiErrorCountState, dataHealthState, endpointStatusState, entities, labels = DEFAULT_LABELS) {
  const attrs = mergedApiErrorAttributes(conditionState, apiErrorCountState, dataHealthState, endpointStatusState);
  const errors = attrs.api_errors && typeof attrs.api_errors === 'object' ? attrs.api_errors : {};
  const failed = Array.isArray(attrs.failed_endpoints) && attrs.failed_endpoints.length
    ? attrs.failed_endpoints
    : Object.keys(errors);
  const errorCount = numberState(apiErrorCountState) ?? failed.length;
  const codes = apiErrorCodeSummary(attrs);
  const errorMeta = errorCount === 1
    ? labels.endpoint_failed_singular
    : formatTemplate(labels.endpoint_failed_plural, { count: errorCount });
  const codeMeta = codes.length ? ` - code ${codes.join(', ')}` : '';

  if (!failed.length && errorCount <= 0) {
    return '';
  }

  return `
    <section class="diagnostics" role="button" tabindex="0" data-entity-id="${escapeAttribute(entities.data_health_entity)}" aria-label="Open data health more info">
      <div>
        <strong>${escapeHtml(labels.diagnostics_title)}</strong>
        <span class="diagnostic-meta">${escapeHtml(`${errorMeta}${codeMeta}`)}</span>
      </div>
      <div class="diagnostic-chips">
        ${failed.map((endpoint) => endpointErrorChipTemplate(endpoint, attrs)).join('')}
      </div>
    </section>
  `;
}

function staleSectionTemplate(freshness, labels = DEFAULT_LABELS) {
  return `
    <section class="stale-panel">
      <div>
        <strong>${escapeHtml(labels.stale_title)}</strong>
        <span>${escapeHtml(freshness.title)}</span>
      </div>
    </section>
  `;
}

function alertTemplate(alert, showDetail = true, labels = DEFAULT_LABELS) {
  const attrs = alert.state?.attributes || {};
  const dateLine = attrs.expires_at || attrs.valid_until
    ? `Valid until ${formatTime(attrs.expires_at || attrs.valid_until)}`
    : dateRange(attrs.starts_at || attrs.start_date, attrs.ends_at || attrs.end_date) || formatTime(attrs.issued_at || attrs.issue_time || attrs.start_time);
  const detail = attrs.summary || attrs.comments || attrs.description || attrs.forecast || attrs.cause || '';
  const forecastRows = showDetail ? alertForecastRows(attrs) : [];
  const badge = alert.pending ? labels.pending : alert.expired ? labels.expired : '';
  const metrics = [
    badge,
    attrs.k_aus !== undefined ? `${labels.k_aus} ${attrs.k_aus}` : '',
    attrs.g_scale !== undefined ? `G${attrs.g_scale}` : '',
    attrs.lat_band ? `${attrs.lat_band} latitudes` : '',
  ].filter(Boolean).join(' · ');

  return `
    <article class="alert-card ${alert.inactive ? 'inactive ' : ''}tone-${alert.tone}" role="button" tabindex="0" data-entity-id="${escapeAttribute(alert.entityId)}" aria-label="${escapeAttribute(`Open ${alert.label} more info`)}">
      <div class="alert-head">
        <strong>${escapeHtml(alert.label)}</strong>
        <span>${escapeHtml(metrics)}</span>
      </div>
      <div class="alert-date">${escapeHtml(dateLine)}</div>
      ${detail && showDetail ? `<p>${escapeHtml(detail)}</p>` : ''}
      ${forecastRows.length ? alertForecastTemplate(forecastRows) : ''}
    </article>
  `;
}

function alertForecastRows(attrs) {
  const source = Array.isArray(attrs.forecast_days)
    ? attrs.forecast_days
    : Array.isArray(attrs.activity)
      ? attrs.activity
      : [];
  return source
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const date = firstString(item.date, item.day, item.valid_time);
      const forecast = firstString(item.forecast, item.summary, item.activity, item.description);
      if (!date && !forecast) {
        return null;
      }
      return { date, forecast };
    })
    .filter(Boolean);
}

function alertForecastTemplate(rows) {
  return `
    <div class="alert-forecast">
      ${rows.map((row) => `
        <div class="alert-forecast-row">
          ${row.date ? `<span>${escapeHtml(row.date)}</span>` : ''}
          ${row.forecast ? `<strong>${escapeHtml(row.forecast)}</strong>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function spaceWeatherFacts(factKeys, context) {
  return configuredFactKeys(factKeys)
    .map((key) => spaceWeatherFact(key, context))
    .filter(Boolean);
}

function spaceWeatherFact(key, context) {
  const {
    kState,
    kIndexLocationState,
    alerts,
    severityLevelState,
    activeAlertCountState,
    apiErrorCountState,
    endpointStatusState,
    dataAgeState,
    dataHealthState,
    dataStaleState,
    auroraVisibilityState,
    auroraKAusState,
    auroraLatitudeBandState,
    magneticStormScaleState,
    entities,
    labels,
  } = context;
  const auroraAttrs = firstAlertAttrs(alerts, (alert) => alert.labelKey?.startsWith('aurora'));
  const magneticAttrs = firstAlertAttrs(alerts, (alert) => alert.labelKey === 'magnetic_alert');
  const severityLevel = numberState(severityLevelState);
  const activeAlertCount = numberState(activeAlertCountState);
  const apiErrorCount = numberState(apiErrorCountState);

  if (key === 'k_station') {
    return {
      key,
      tone: 'neutral',
      label: labels.k_station,
      value: isKnownState(kIndexLocationState)
        ? kIndexLocationState.state
        : kState?.attributes?.location || labels.region,
      entityId: kIndexLocationState ? entities.k_index_location_entity : entities.k_index_entity,
    };
  }
  if (key === 'active_alerts') {
    return {
      key,
      tone: factTone(key, activeAlertCount ?? alerts.length),
      label: labels.active_alerts,
      value: activeAlertCount ?? alerts.length,
      entityId: entities.active_alert_count_entity,
    };
  }
  if (key === 'severity_level') {
    return {
      key,
      tone: factTone(key, severityLevel ?? '--'),
      label: labels.severity_level,
      value: severityLevel ?? '--',
      entityId: entities.severity_level_entity,
    };
  }
  if (key === 'endpoint_status') {
    const value = endpointStatusLabel(endpointStatusState);
    return {
      key,
      tone: factTone(key, value),
      label: labels.endpoint_status,
      value,
      entityId: entities.endpoint_status_entity,
    };
  }
  if (key === 'data_age') {
    return {
      key,
      tone: factTone(key, isKnownState(dataStaleState) ? dataStaleState.state : dataAgeState?.state),
      label: labels.data_age,
      value: isKnownState(dataAgeState) ? `${dataAgeState.state} min` : '--',
      entityId: entities.data_age_entity,
    };
  }
  if (key === 'data_stale') {
    const value = isKnownState(dataStaleState) ? (dataStaleState.state === 'on' ? 'Stale' : 'Fresh') : '--';
    return {
      key,
      tone: factTone(key, value),
      label: labels.data_stale,
      value,
      entityId: entities.data_stale_entity,
    };
  }
  if (key === 'data_health') {
    const value = isKnownState(dataHealthState) ? titleCase(dataHealthState.state) : '--';
    return {
      key,
      tone: factTone(key, value),
      label: labels.data_health,
      value,
      entityId: entities.data_health_entity,
    };
  }
  if (key === 'aurora_visibility') {
    const value = titleCase(auroraVisibilityState?.state || 'none');
    return {
      key,
      tone: factTone(key, value),
      label: labels.aurora_visibility,
      value,
      entityId: entities.aurora_visibility_entity,
    };
  }
  if (key === 'aurora_band') {
    const value = isKnownState(auroraLatitudeBandState)
      ? auroraLatitudeBandState.state
      : auroraAttrs.lat_band || 'none';
    return {
      key,
      tone: factTone('aurora_visibility', value === 'none' ? 'none' : stateLabel(auroraVisibilityState) || 'possible'),
      label: labels.aurora_band,
      value: titleCase(value),
      entityId: isKnownState(auroraLatitudeBandState)
        ? entities.aurora_latitude_band_entity
        : auroraAttrs.lat_band ? auroraAlertEntityId(alerts) : entities.aurora_alert_entity,
    };
  }
  if (key === 'k_aus') {
    const value = isKnownState(auroraKAusState)
      ? auroraKAusState.state
      : auroraAttrs.k_aus ?? kState?.state ?? '--';
    return {
      key,
      tone: factTone('aurora_visibility', value !== '--' && value !== 'none' ? stateLabel(auroraVisibilityState) || 'possible' : 'none'),
      label: labels.k_aus,
      value,
      entityId: isKnownState(auroraKAusState)
        ? entities.aurora_k_aus_entity
        : auroraAttrs.k_aus !== undefined ? auroraAlertEntityId(alerts) : entities.k_index_entity,
    };
  }
  if (key === 'g_scale') {
    const scale = numberState(magneticStormScaleState)
      ?? numericValue(magneticAttrs.g_scale)
      ?? gScaleFromKIndex(numberState(kState));
    const value = scale !== null ? `G${formatNumber(scale, Number.isInteger(scale) ? 0 : 1)}` : 'None';
    return {
      key,
      tone: factTone(key, value),
      label: labels.g_scale,
      value,
      entityId: isKnownState(magneticStormScaleState)
        ? entities.magnetic_storm_scale_entity
        : magneticAttrs.g_scale !== undefined ? entities.magnetic_alert_entity : entities.k_index_entity,
    };
  }
  if (key === 'api_errors') {
    return {
      key,
      tone: factTone(key, apiErrorCount ?? 0),
      label: labels.api_errors,
      value: apiErrorCountValue(apiErrorCount, apiErrorCountState, dataHealthState),
      entityId: entities.api_error_count_entity,
    };
  }
  return null;
}

function apiErrorCountValue(apiErrorCount, ...states) {
  const count = Number.isFinite(Number(apiErrorCount)) ? Number(apiErrorCount) : 0;
  if (count <= 0) {
    return count;
  }
  const codes = apiErrorCodeSummary(mergedApiErrorAttributes(...states), 2);
  return codes.length ? `${count} (${codes.join(', ')})` : count;
}

function mergedApiErrorAttributes(...states) {
  return states.reduce((attrs, state) => ({
    ...attrs,
    ...(state?.attributes || {}),
  }), {});
}

function apiErrorCodeSummary(attrs, limit = 3) {
  const codes = uniqueApiErrorCodes(attrs);
  if (codes.length <= limit) {
    return codes;
  }
  return [...codes.slice(0, limit), `+${codes.length - limit}`];
}

function uniqueApiErrorCodes(attrs, endpoint = '') {
  const codes = [];
  const seen = new Set();
  const addCode = (value) => {
    const text = String(value ?? '').trim();
    const normalised = /^\d+$/.test(text) ? text.padStart(2, '0') : text;
    if (!normalised || seen.has(normalised)) {
      return;
    }
    seen.add(normalised);
    codes.push(normalised);
  };

  const codesByEndpoint = attrs?.api_error_codes;
  if (codesByEndpoint && typeof codesByEndpoint === 'object') {
    const source = endpoint ? codesByEndpoint[endpoint] : Object.values(codesByEndpoint).flat();
    const values = Array.isArray(source) ? source : [source];
    values.forEach(addCode);
  }

  const detailsByEndpoint = attrs?.api_error_details;
  if (detailsByEndpoint && typeof detailsByEndpoint === 'object') {
    const detailSource = endpoint ? detailsByEndpoint[endpoint] : Object.values(detailsByEndpoint).flat();
    const details = Array.isArray(detailSource) ? detailSource : [detailSource];
    details.forEach((detail) => {
      if (detail && typeof detail === 'object') {
        addCode(detail.code);
      }
    });
  }

  const errors = attrs?.api_errors;
  if (errors && typeof errors === 'object') {
    const errorSource = endpoint ? [errors[endpoint]] : Object.values(errors);
    errorSource.forEach((message) => {
      for (const match of String(message || '').matchAll(/(?:^|;\s*)(\d{1,2})\s*:/g)) {
        addCode(match[1].padStart(2, '0'));
      }
    });
  }

  return codes;
}

function endpointErrorChipTemplate(endpoint, attrs) {
  const label = endpointErrorChipLabel(endpoint, attrs);
  const title = endpointErrorTitle(endpoint, attrs);
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : '';
  return `<span${titleAttr}>${escapeHtml(label)}</span>`;
}

function endpointErrorChipLabel(endpoint, attrs) {
  const codes = uniqueApiErrorCodes(attrs, endpoint);
  const summary = codes.length > 2 ? [...codes.slice(0, 2), `+${codes.length - 2}`] : codes;
  return summary.length ? `${formatEndpoint(endpoint)} (${summary.join(', ')})` : formatEndpoint(endpoint);
}

function endpointErrorTitle(endpoint, attrs) {
  const detailsByEndpoint = attrs?.api_error_details;
  const details = detailsByEndpoint && typeof detailsByEndpoint === 'object' && Array.isArray(detailsByEndpoint[endpoint])
    ? detailsByEndpoint[endpoint]
    : [];
  const messages = details
    .map((detail) => {
      if (!detail || typeof detail !== 'object') {
        return '';
      }
      const code = firstString(detail.code);
      const meaning = firstString(detail.meaning);
      const message = firstString(detail.message);
      const detailText = meaning && message && meaning !== message ? `${meaning} - ${message}` : meaning || message;
      return [code ? `Code ${code}` : '', detailText].filter(Boolean).join(': ');
    })
    .filter(Boolean);
  if (!messages.length) {
    const meaningsByEndpoint = attrs?.api_error_meanings;
    const meanings = meaningsByEndpoint && typeof meaningsByEndpoint === 'object' && Array.isArray(meaningsByEndpoint[endpoint])
      ? meaningsByEndpoint[endpoint].map(firstString).filter(Boolean)
      : [];
    messages.push(...meanings);
  }
  const metadataTitle = endpointMetadataTitle(endpoint, attrs);
  if (metadataTitle) {
    messages.push(metadataTitle);
  }
  return messages.join(' | ');
}

function endpointMetadataTitle(endpoint, attrs) {
  const metadata = endpointMetadata(endpoint, attrs);
  if (!metadata) {
    return '';
  }
  const parts = [
    firstString(metadata.bom_api_method),
    firstString(metadata.category),
  ].filter(Boolean);
  const fields = Array.isArray(metadata.response_fields)
    ? metadata.response_fields.map(firstString).filter(Boolean).slice(0, 5)
    : [];
  if (fields.length) {
    parts.push(`response fields: ${fields.join(', ')}`);
  }
  return parts.join(' - ');
}

function endpointMetadata(endpoint, attrs) {
  const endpoints = Array.isArray(attrs?.endpoints) ? attrs.endpoints : [];
  return endpoints.find((item) => item && typeof item === 'object' && item.endpoint === endpoint) || null;
}

function auroraAlertEntityId(alerts) {
  return alerts.find((alert) => alert.labelKey?.startsWith('aurora'))?.entityId;
}

function endpointStatusLabel(state) {
  if (!isKnownState(state)) {
    return '--';
  }
  if (String(state.state).toLowerCase() === 'unknown') {
    return 'Unknown';
  }
  const okCount = Number(state.attributes?.ok_count);
  const totalCount = Number(state.attributes?.total_count);
  if (Number.isFinite(okCount) && Number.isFinite(totalCount) && totalCount > 0) {
    return `${okCount}/${totalCount} ok`;
  }
  return titleCase(state.state);
}

function firstAlertAttrs(alerts, predicate) {
  const alert = alerts.find((item) => predicate(item));
  return alert?.state?.attributes || {};
}

function sparklineTemplate(history) {
  if (!history || history.length < 2) {
    return '<svg viewBox="0 0 120 34" aria-hidden="true"><path d="M2 25 L118 25" /></svg>';
  }
  const values = history.map((point) => point.value).filter((value) => Number.isFinite(value));
  if (values.length < 2) {
    return '<svg viewBox="0 0 120 34" aria-hidden="true"><path d="M2 25 L118 25" /></svg>';
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const step = 116 / (values.length - 1);
  const points = values.map((value, index) => {
    const x = 2 + index * step;
    const y = 30 - ((value - min) / spread) * 26;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg viewBox="0 0 120 34" aria-hidden="true"><polyline points="${points}" /></svg>`;
}

function normaliseBackendHistory(payload, entities) {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return {
    [entities.a_index_entity]: indexSeries(payload.a_index),
    [entities.k_index_entity]: indexSeries(payload.k_index),
    [entities.dst_index_entity]: indexSeries(payload.dst_index),
  };
}

function indexSeries(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => ({
      value: Number(item.index),
      time: item.valid_time || item.analysis_time,
    }))
    .filter((point) => Number.isFinite(point.value));
}

function normaliseRecorderHistory(series) {
  if (!Array.isArray(series)) {
    return {};
  }
  const result = {};
  for (const entitySeries of series) {
    if (!Array.isArray(entitySeries) || !entitySeries.length) {
      continue;
    }
    const entityId = entitySeries[0].entity_id;
    if (!entityId) {
      continue;
    }
    result[entityId] = entitySeries
      .map((point) => ({ value: Number(point.state), time: point.last_changed }))
      .filter((point) => Number.isFinite(point.value));
  }
  return result;
}

function textFieldTemplate(key, label, value, help = '') {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <input data-key="${escapeHtml(key)}" type="text" value="${escapeAttribute(value)}">
      ${help ? `<small class="field-help">${escapeHtml(help)}</small>` : ''}
    </label>
  `;
}

function editorTextFieldTemplate(key, value) {
  const field = EDITOR_FIELD_BY_KEY.get(key);
  if (!field) {
    return '';
  }
  return textFieldTemplate(key, field[1], value, EDITOR_FIELD_HELP[key]);
}

function editorGroupTemplate(title, description, body, className = '') {
  const classSuffix = className ? ` ${className}` : '';
  return `
    <section class="editor-group${classSuffix}" aria-label="${escapeAttribute(title)}">
      <div class="editor-group-head">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(description)}</small>
      </div>
      ${body}
    </section>
  `;
}

function glanceSlotEditorTemplate(config) {
  return editorGroupTemplate(
    'Compact glance slots',
    'Choose up to four metric tiles and three footer chips for the default Lovelace card.',
    `<div class="slot-grid">${GLANCE_SLOT_FIELDS.map((field) => glanceSlotSelectTemplate(field, config)).join('')}</div>`,
    'compact-slots',
  );
}

function glanceSlotSelectTemplate(field, config) {
  const values = configuredMetricKeys(config[field.configKey], field.fallback).slice(0, field.max);
  return selectFieldTemplate(
    field.key,
    field.label,
    values[field.index] || '',
    [['', 'None'], ...METRIC_SELECT_OPTIONS],
    (value) => normaliseMetricKeyStrict(value) || '',
  );
}

function iconFieldTemplate(key, label, value) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <ha-icon-picker data-key="${escapeHtml(key)}" value="${escapeAttribute(value)}"></ha-icon-picker>
    </label>
  `;
}

function entityFieldTemplate(key, label, value) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <ha-entity-picker data-key="${escapeHtml(key)}" value="${escapeAttribute(value)}" allow-custom-entity></ha-entity-picker>
    </label>
  `;
}

function textareaFieldTemplate(key, label, value) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <textarea data-key="${escapeHtml(key)}" rows="5" spellcheck="false">${escapeHtml(editorObjectValue(value))}</textarea>
    </label>
  `;
}

function editorObjectValue(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function parseEditorObject(value) {
  const text = String(value || '').trim();
  if (!text) {
    return {};
  }
  const parsed = objectConfig(text);
  return parsed || null;
}

function fieldValue(event, target) {
  if (event?.detail && Object.prototype.hasOwnProperty.call(event.detail, 'value')) {
    return event.detail.value;
  }
  return target?.value;
}

function selectFieldTemplate(key, label, value, options, normalise = (item) => String(item || '')) {
  const current = normalise(value);
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select data-key="${escapeHtml(key)}">
        ${options.map(([optionValue, optionLabel]) => `
          <option value="${escapeAttribute(optionValue)}" ${optionValue === current ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>
        `).join('')}
      </select>
    </label>
  `;
}

function numberFieldTemplate(key, label, value, min, max) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <input
        data-key="${escapeHtml(key)}"
        type="number"
        min="${escapeAttribute(min)}"
        max="${escapeAttribute(max)}"
        step="1"
        value="${escapeAttribute(numberFieldValue(key, value))}"
      >
    </label>
  `;
}

function checkboxTemplate(key, label, checked) {
  return `
    <label class="check">
      <input data-key="${escapeHtml(key)}" type="checkbox" ${checked ? 'checked' : ''}>
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function dateRange(start, end) {
  if (start && end) {
    return `${start} to ${end}`;
  }
  return start || end || '';
}

function formatTime(value) {
  if (!value) {
    return '';
  }
  const normalised = String(value).includes('T')
    ? value
    : `${String(value).replace(' ', 'T')}Z`;
  const date = new Date(normalised);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function freshnessStatus(states, staleAfterMinutes) {
  const dates = states
    .flatMap((state) => [
      state?.attributes?.fetched_at,
      state?.attributes?.valid_time,
      state?.attributes?.analysis_time,
      state?.last_updated,
    ])
    .map((value) => parseDate(value))
    .filter((date) => date && !Number.isNaN(date.getTime()));

  if (!dates.length) {
    return {
      stale: false,
      label: 'No timestamp',
      title: 'No source timestamp is available',
    };
  }

  const latest = dates.reduce((newest, date) => date > newest ? date : newest, dates[0]);
  const ageMinutes = Math.max(0, Math.round((Date.now() - latest.getTime()) / 60000));
  return {
    stale: ageMinutes > staleAfterMinutes,
    label: relativeAgeLabel(ageMinutes),
    title: `Last updated ${formatTime(latest.toISOString())}; stale threshold ${staleAfterMinutes} minutes`,
  };
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const normalised = String(value).includes('T')
    ? value
    : `${String(value).replace(' ', 'T')}Z`;
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

function relativeAgeLabel(ageMinutes) {
  if (ageMinutes < 1) {
    return 'Just updated';
  }
  if (ageMinutes < 60) {
    return `${ageMinutes}m old`;
  }
  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;
  return minutes ? `${hours}h ${minutes}m old` : `${hours}h old`;
}

function formatNumber(value, precision = 1) {
  const digits = positiveInteger(precision, 1, 0, 3);
  return Number(value).toFixed(digits).replace(/\.?0+$/, '') || '0';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function titleCase(value) {
  return String(value)
    .split(' ')
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '')
    .join(' ');
}

function firstString(...values) {
  for (const value of values) {
    if (value === undefined || value === null || Array.isArray(value) || typeof value === 'object') {
      continue;
    }
    const text = String(value).trim().replace(/\s+/g, ' ');
    if (text) {
      return text;
    }
  }
  return '';
}

function formatTemplate(template, values) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

function formatEndpoint(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function styles() {
  return `
    <style>
      :host {
        display: block;
        --asw-quiet: #1dd3b0;
        --asw-active: #38bdf8;
        --asw-outlook: #f5c542;
        --asw-watch: #fb923c;
        --asw-warning: #f43f5e;
        --asw-storm: #d946ef;
        --asw-aurora: var(--asw-quiet);
        --asw-text: var(--primary-text-color, #111827);
        --asw-muted: var(--secondary-text-color, #64748b);
        --asw-neutral: var(--asw-muted);
        --asw-surface: var(--ha-card-background, var(--card-background-color, #ffffff));
        --asw-elevated: color-mix(in srgb, var(--asw-surface) 92%, var(--secondary-background-color, #f1f5f9));
        --asw-panel: var(--asw-elevated);
        --asw-soft-panel: var(--secondary-background-color, rgba(148, 163, 184, 0.12));
        --asw-border: var(--divider-color, rgba(148, 163, 184, 0.24));
        --asw-card-border: var(--ha-card-border-color, var(--asw-border));
        --asw-card-shadow: var(--ha-card-box-shadow, none);
      }

      ha-card {
        display: block;
        container-type: inline-size;
        overflow: hidden;
        border: 1px solid var(--asw-card-border);
        background: var(--asw-surface);
        color: var(--asw-text);
        box-shadow: var(--asw-card-shadow);
        -webkit-tap-highlight-color: transparent;
      }

      ha-card.theme-light {
        color-scheme: light;
        --primary-text-color: #111827;
        --secondary-text-color: #64748b;
        --divider-color: #d7dee9;
        --asw-text: #111827;
        --asw-muted: #64748b;
        --asw-neutral: #64748b;
        --asw-surface: #ffffff;
        --asw-elevated: #f8fbff;
        --asw-panel: var(--asw-elevated);
        --asw-soft-panel: #edf2f7;
        --asw-border: #d7dee9;
        --asw-card-border: #dbe4ef;
        --asw-card-shadow: none;
      }

      ha-card.theme-dark {
        color-scheme: dark;
        --primary-text-color: #eef4ff;
        --secondary-text-color: #9dafc8;
        --divider-color: rgba(148, 163, 184, 0.24);
        --asw-text: #eef4ff;
        --asw-muted: #9dafc8;
        --asw-neutral: #9dafc8;
        --asw-surface: #111827;
        --asw-elevated: #172033;
        --asw-panel: var(--asw-elevated);
        --asw-soft-panel: #0b1220;
        --asw-border: rgba(148, 163, 184, 0.28);
        --asw-card-border: rgba(148, 163, 184, 0.22);
        --asw-card-shadow: none;
      }

      ha-card.solar-day {
        --asw-quiet: #0fba9b;
        --asw-active: #0ea5e9;
        --asw-aurora: #0fba9b;
      }

      ha-card.solar-night {
        --asw-quiet: #34d399;
        --asw-active: #38bdf8;
        --asw-aurora: #34d399;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px 12px;
        border-bottom: 1px solid var(--asw-border);
        background: var(--asw-surface);
      }

      .header-actions-only {
        justify-content: flex-end;
      }

      .header-main {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .header-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border: 1px solid color-mix(in srgb, var(--tone) 30%, var(--asw-border));
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 4%, var(--asw-surface));
        color: var(--tone);
      }

      .header-icon ha-icon {
        width: 22px;
        height: 22px;
      }

      .header-text {
        min-width: 0;
      }

      .eyebrow {
        color: var(--asw-muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .title {
        margin-top: 3px;
        font-size: 19px;
        line-height: 1.15;
        font-weight: 750;
      }

      .header-subtitle {
        margin-top: 3px;
        color: var(--asw-muted);
        font-size: 12px;
        line-height: 1.2;
        font-weight: 650;
      }

      .header-actions {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        min-width: 0;
      }

      .refresh-button {
        width: 32px;
        height: 32px;
        border: 1px solid var(--asw-border);
        border-radius: 999px;
        display: inline-grid;
        place-items: center;
        flex: 0 0 auto;
        padding: 0;
        background: var(--asw-surface);
        color: var(--asw-text);
        cursor: pointer;
        touch-action: manipulation;
      }

      .refresh-button:hover,
      .refresh-button:focus-visible {
        border-color: color-mix(in srgb, var(--tone) 42%, var(--asw-border));
        background: color-mix(in srgb, var(--tone) 4%, var(--asw-surface));
      }

      .refresh-button:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--tone) 52%, transparent);
        outline-offset: 2px;
      }

      .refresh-button:disabled {
        cursor: progress;
        opacity: 0.7;
      }

      .refresh-button ha-icon {
        width: 18px;
        height: 18px;
      }

      .refresh-button.refreshing ha-icon {
        animation: asw-spin 0.9s linear infinite;
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 32px;
        padding: 0 11px;
        border: 1px solid color-mix(in srgb, var(--tone) 42%, transparent);
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 6%, transparent);
        color: var(--asw-text);
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
      }

      .freshness-pill {
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid var(--asw-border);
        border-radius: 999px;
        padding: 0 10px;
        background: color-mix(in srgb, var(--asw-surface) 94%, var(--asw-active));
        color: var(--asw-text);
        font-size: 12px;
        font-weight: 750;
        white-space: nowrap;
      }

      .freshness-pill span {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: var(--asw-quiet);
      }

      .freshness-pill.stale {
        border-color: color-mix(in srgb, var(--asw-watch) 48%, var(--asw-border));
        background: color-mix(in srgb, var(--asw-watch) 7%, var(--asw-surface));
      }

      .freshness-pill.stale span {
        background: var(--asw-watch);
      }

      .pulse {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: var(--tone);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--tone) 20%, transparent);
      }

      @keyframes asw-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .body {
        padding: 12px;
        display: grid;
        gap: 10px;
      }

      .gauges {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .gauge-count-1 {
        grid-template-columns: minmax(0, 1fr);
      }

      .gauge-count-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .gauge-count-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .gauge-card,
      .summary,
      .alert-chips,
      .timeline,
      .facts,
      .stale-panel,
      .diagnostics,
      .alerts {
        border: 1px solid var(--asw-border);
        border-radius: 8px;
        background: var(--asw-panel);
      }

      .gauge-card {
        --gauge-size: 82px;
        padding: 10px;
        min-width: 0;
        cursor: pointer;
        touch-action: manipulation;
      }

      .glance-panel {
        min-width: 0;
        display: grid;
        gap: 7px;
        padding: 8px;
        border: 1px solid color-mix(in srgb, var(--tone) 26%, var(--asw-border));
        border-radius: 8px;
        background: var(--asw-panel);
      }

      .glance-panel.unavailable {
        border-color: color-mix(in srgb, var(--asw-neutral) 28%, var(--asw-border));
        background: var(--asw-panel);
      }

      .glance-overview {
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas:
          "primary"
          "scale"
          "metrics";
        gap: 7px;
        align-items: stretch;
      }

      .glance-primary:focus-visible,
      .glance-metric:focus-visible,
      .glance-footer-chip:focus-visible {
        border-radius: 8px;
        outline: 2px solid color-mix(in srgb, var(--tone, var(--asw-active)) 48%, transparent);
        outline-offset: 2px;
      }

      .glance-primary {
        grid-area: primary;
        min-width: 0;
        min-height: 74px;
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr);
        grid-template-areas:
          "gauge copy"
          "rail rail";
        align-items: center;
        gap: 5px 8px;
        padding: 7px 8px;
        border: 1px solid color-mix(in srgb, var(--tone) 32%, var(--asw-border));
        border-radius: 8px;
        background: color-mix(in srgb, var(--tone) 3%, var(--asw-elevated));
        cursor: pointer;
        touch-action: manipulation;
      }

      .glance-primary-gauge {
        grid-area: gauge;
        width: 44px;
        aspect-ratio: 1;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: conic-gradient(
          var(--tone) calc(var(--percent) * 1%),
          color-mix(in srgb, var(--tone) 8%, transparent) 0
        );
      }

      .glance-primary-gauge-inner {
        width: 35px;
        aspect-ratio: 1;
        border-radius: 50%;
        display: grid;
        place-items: center;
        align-content: center;
        background: var(--asw-surface);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tone) 6%, transparent);
      }

      .glance-primary-gauge-inner strong {
        color: color-mix(in srgb, var(--tone) 76%, var(--asw-text));
        font-size: 18px;
        line-height: 1;
        font-weight: 850;
      }

      .glance-primary-gauge-inner span {
        max-width: 28px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--asw-muted);
        font-size: 7px;
        line-height: 1;
        font-weight: 750;
      }

      .glance-primary-copy {
        grid-area: copy;
        min-width: 0;
        display: grid;
        gap: 2px;
        align-content: center;
      }

      .glance-primary-head {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .glance-primary-head ha-icon {
        width: 17px;
        height: 17px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 8%, transparent);
        color: var(--tone);
      }

      .glance-primary-head span,
      .glance-primary-meta span,
      .glance-primary-meta small,
      .glance-metric span,
      .glance-footer-chip span {
        color: var(--asw-muted);
      }

      .glance-primary-head span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        font-weight: 750;
      }

      .glance-primary-copy > strong {
        min-width: 0;
        overflow: hidden;
        overflow-wrap: anywhere;
        color: var(--asw-text);
        font-size: 14px;
        line-height: 1.08;
        font-weight: 820;
      }

      .glance-primary-meta {
        min-width: 0;
        display: grid;
        gap: 1px;
      }

      .glance-primary-meta span,
      .glance-primary-meta small {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        line-height: 1.15;
        font-weight: 720;
      }

      .glance-primary-rail {
        grid-area: rail;
        height: 3px;
        overflow: hidden;
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 7%, transparent);
      }

      .glance-primary-rail::before {
        content: "";
        display: block;
        width: calc(var(--percent) * 1%);
        height: 100%;
        border-radius: inherit;
        background: var(--tone);
      }

      .glance-metrics {
        grid-area: metrics;
        display: grid;
        grid-template-columns: repeat(var(--glance-metric-columns, 2), minmax(0, 1fr));
        gap: 6px;
      }

      .glance-metric,
      .glance-footer-chip {
        min-width: 0;
        border: 1px solid color-mix(in srgb, var(--tone) 28%, var(--asw-border));
        border-radius: 8px;
        background: color-mix(in srgb, var(--tone) 3%, var(--asw-surface));
        cursor: pointer;
        touch-action: manipulation;
      }

      .glance-metric {
        display: grid;
        grid-template-columns: 17px minmax(0, 1fr);
        grid-template-areas:
          "icon label"
          "icon value";
        column-gap: 5px;
        row-gap: 1px;
        align-items: center;
        min-height: 36px;
        padding: 5px 6px;
      }

      .glance-metric ha-icon,
      .glance-footer-chip ha-icon {
        display: grid;
        place-items: center;
        width: 17px;
        height: 17px;
        color: var(--tone);
        border-radius: 50%;
        background: color-mix(in srgb, var(--tone) 7%, transparent);
        flex: 0 0 auto;
      }

      .glance-metric ha-icon {
        grid-area: icon;
      }

      .glance-metric span {
        grid-area: label;
        font-size: 10px;
        font-weight: 750;
      }

      .glance-metric strong {
        grid-area: value;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--asw-text);
        font-size: 13px;
        line-height: 1.05;
        font-weight: 820;
      }

      .glance-panel.unavailable .glance-metric strong {
        font-size: 13px;
      }

      .glance-scale {
        grid-area: scale;
        position: relative;
        display: grid;
        gap: 4px;
        padding: 0 1px 1px;
      }

      .glance-scale-rail {
        position: relative;
        display: grid;
        grid-template-columns: 3fr 1fr 1fr 4fr;
        gap: 3px;
        height: 7px;
        border-radius: 999px;
      }

      .glance-scale-rail::after {
        content: "";
        position: absolute;
        top: -3px;
        left: clamp(0%, var(--marker), 100%);
        width: 4px;
        height: 14px;
        border-radius: 999px;
        background: var(--asw-text);
        box-shadow: 0 0 0 2px var(--asw-surface);
        transform: translateX(-50%);
      }

      .glance-scale-rail span {
        min-width: 0;
        border-radius: 999px;
      }

      .glance-scale-rail .quiet {
        background: var(--asw-quiet);
      }

      .glance-scale-rail .outlook {
        background: var(--asw-outlook);
      }

      .glance-scale-rail .watch {
        background: var(--asw-watch);
      }

      .glance-scale-rail .storm {
        background: var(--asw-storm);
      }

      .glance-scale-labels {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        color: var(--asw-muted);
        font-size: 9px;
        line-height: 1;
        font-weight: 750;
      }

      .glance-scale-labels span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .glance-state-note {
        min-width: 0;
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        min-height: 32px;
        padding: 5px 8px;
        border: 1px solid color-mix(in srgb, var(--tone) 28%, var(--asw-border));
        border-radius: 8px;
        background: color-mix(in srgb, var(--tone) 3%, var(--asw-surface));
        color: var(--asw-text);
        font-size: 12px;
        font-weight: 780;
      }

      .glance-panel.unavailable .glance-state-note {
        grid-column: 1 / -1;
      }

      .glance-state-note ha-icon {
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: var(--tone);
        background: color-mix(in srgb, var(--tone) 6%, transparent);
      }

      .glance-state-note span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .glance-footer {
        display: grid;
        grid-template-columns: repeat(var(--glance-chip-columns, 2), minmax(0, 1fr));
        gap: 6px;
      }

      .glance-footer-chip {
        display: grid;
        grid-template-columns: 16px minmax(0, 1fr);
        grid-template-areas:
          "icon label"
          "icon value";
        align-items: center;
        column-gap: 5px;
        row-gap: 0;
        min-height: 31px;
        padding: 5px 6px;
      }

      .glance-footer-chip ha-icon {
        grid-area: icon;
        width: 16px;
        height: 16px;
      }

      .glance-footer-chip span,
      .glance-footer-chip strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
      }

      .glance-footer-chip span {
        grid-area: label;
        font-weight: 750;
      }

      .glance-footer-chip strong {
        grid-area: value;
        color: var(--asw-text);
        font-weight: 800;
      }

      .gauge-card:hover,
      .summary:hover,
      .timeline:hover,
      .diagnostics:hover,
      .alert-card:hover,
      .fact[role="button"]:hover,
      .glance-primary:hover,
      .glance-metric:hover,
      .glance-footer-chip:hover {
        border-color: color-mix(in srgb, var(--tone, var(--asw-active)) 36%, var(--asw-border));
      }

      .gauge-card:focus-visible,
      .summary:focus-visible,
      .timeline:focus-visible,
      .diagnostics:focus-visible,
      .alert-card:focus-visible,
      .fact[role="button"]:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--tone, var(--asw-active)) 48%, transparent);
        outline-offset: 2px;
      }

      .gauge-top {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: baseline;
        min-height: 20px;
        font-weight: 750;
      }

      .gauge-top small {
        color: var(--asw-muted);
        font-size: 10px;
        font-weight: 500;
        text-align: right;
      }

      .gauge-row {
        display: grid;
        grid-template-columns: var(--gauge-size) minmax(0, 1fr);
        gap: 12px;
        align-items: center;
        margin-top: 10px;
      }

      .gauge {
        width: var(--gauge-size);
        aspect-ratio: 1;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: conic-gradient(var(--tone) calc(var(--percent) * 1%), color-mix(in srgb, var(--tone) 8%, transparent) 0);
      }

      .gauge-inner {
        width: calc(var(--gauge-size) - 18px);
        aspect-ratio: 1;
        border-radius: 50%;
        display: grid;
        place-items: center;
        align-content: center;
        background: var(--asw-surface);
      }

      .gauge-inner strong {
        font-size: 24px;
        line-height: 1;
      }

      .gauge-inner span {
        color: var(--asw-muted);
        font-size: 11px;
        min-height: 13px;
      }

      .spark svg {
        display: block;
        width: 100%;
        height: 42px;
      }

      .spark path,
      .spark polyline {
        fill: none;
        stroke: var(--tone);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.9;
      }

      .summary {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        touch-action: manipulation;
      }

      .summary-label {
        color: var(--asw-muted);
        font-size: 12px;
        font-weight: 700;
      }

      .summary-value {
        margin-top: 2px;
        font-size: 21px;
        line-height: 1.15;
        font-weight: 800;
      }

      .summary-meta {
        margin-top: 4px;
        color: var(--asw-muted);
        font-size: 12px;
      }

      .bands {
        display: grid;
        grid-template-columns: repeat(4, minmax(70px, 1fr));
        gap: 6px;
      }

      .band {
        min-height: 30px;
        display: grid;
        place-items: center;
        border-radius: 6px;
        background: var(--asw-soft-panel);
        color: var(--asw-muted);
        font-size: 12px;
        font-weight: 750;
      }

      .band.active {
        background: color-mix(in srgb, var(--tone) 18%, transparent);
        color: var(--asw-text);
      }

      .facts {
        display: grid;
        grid-template-columns: repeat(var(--fact-count, 4), minmax(0, 1fr));
        gap: 0;
        overflow: hidden;
      }

      .fact {
        min-width: 0;
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        grid-template-areas:
          "icon label"
          "icon value";
        align-items: center;
        column-gap: 7px;
        row-gap: 2px;
        padding: 9px 11px;
        border-right: 1px solid var(--asw-border);
      }

      .fact[role="button"] {
        cursor: pointer;
        touch-action: manipulation;
      }

      .fact:last-child {
        border-right: 0;
      }

      .fact-icon {
        grid-area: icon;
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 6%, transparent);
        color: var(--tone);
      }

      .fact span {
        grid-area: label;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--asw-muted);
        font-size: 11px;
        font-weight: 750;
      }

      .fact strong {
        grid-area: value;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
      }

      .alert-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        padding: 8px;
      }

      .alert-chip {
        min-height: 30px;
        min-width: 0;
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid color-mix(in srgb, var(--tone) 38%, var(--asw-border));
        border-radius: 999px;
        padding: 3px 10px 3px 5px;
        background: color-mix(in srgb, var(--tone) 4%, var(--asw-surface));
        color: var(--asw-text);
        font: inherit;
        font-size: 12px;
        font-weight: 750;
        cursor: pointer;
        touch-action: manipulation;
      }

      .alert-chip.inactive {
        border-style: dashed;
        border-color: color-mix(in srgb, var(--asw-neutral) 48%, var(--asw-border));
        background: color-mix(in srgb, var(--asw-neutral) 8%, var(--asw-surface));
      }

      .alert-chip:hover {
        border-color: color-mix(in srgb, var(--tone, var(--asw-active)) 56%, var(--asw-border));
      }

      .alert-chip:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--tone, var(--asw-active)) 48%, transparent);
        outline-offset: 2px;
      }

      .alert-chip-icon {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 8%, transparent);
        color: var(--tone);
        flex: 0 0 auto;
      }

      .alert-chip span,
      .alert-chip strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .alert-chip strong {
        color: var(--asw-muted);
        font-size: 11px;
      }

      .timeline {
        display: grid;
        gap: 11px;
        padding: 13px;
        cursor: pointer;
        touch-action: manipulation;
      }

      .timeline-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
      }

      .timeline-head strong,
      .timeline-head span {
        display: block;
      }

      .timeline-head strong {
        font-size: 13px;
      }

      .timeline-head span {
        color: var(--asw-muted);
        font-size: 12px;
      }

      .timeline-rail {
        min-height: 48px;
        display: grid;
        grid-template-columns: repeat(var(--segment-count), minmax(2px, 1fr));
        gap: clamp(2px, 0.45vw, 4px);
        align-items: end;
        padding: 8px;
        border-radius: 7px;
        background: color-mix(in srgb, var(--asw-soft-panel) 70%, transparent);
      }

      .timeline-segment {
        min-width: 0;
        height: var(--bar-height);
        border-radius: 999px 999px 3px 3px;
        background: var(--tone);
        opacity: 0.86;
      }

      .timeline-scale {
        display: flex;
        justify-content: space-between;
        color: var(--asw-muted);
        font-size: 10px;
        font-weight: 700;
      }

      .stale-panel {
        padding: 12px 13px;
        border-color: color-mix(in srgb, var(--asw-watch) 44%, var(--asw-border));
        background: color-mix(in srgb, var(--asw-watch) 5%, var(--asw-surface));
      }

      .stale-panel strong,
      .stale-panel span {
        display: block;
      }

      .stale-panel strong {
        font-size: 13px;
      }

      .stale-panel span {
        margin-top: 2px;
        color: var(--asw-muted);
        font-size: 12px;
      }

      .diagnostics {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        padding: 11px 13px;
        border-color: color-mix(in srgb, var(--asw-watch) 40%, var(--asw-border));
        background: color-mix(in srgb, var(--asw-watch) 5%, var(--asw-surface));
        cursor: pointer;
        touch-action: manipulation;
      }

      .diagnostics strong,
      .diagnostics span {
        display: block;
      }

      .diagnostics strong {
        font-size: 13px;
      }

      .diagnostic-meta {
        margin-top: 2px;
        color: var(--asw-muted);
        font-size: 12px;
      }

      .diagnostic-chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
      }

      .diagnostic-chips span {
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0 9px;
        background: color-mix(in srgb, var(--asw-watch) 16%, transparent);
        color: var(--asw-text);
        font-size: 11px;
        font-weight: 750;
      }

      .alerts {
        display: grid;
        gap: 10px;
        padding: 10px;
      }

      .alert-card {
        border-left: 4px solid var(--tone);
        border-radius: 6px;
        padding: 10px 11px;
        background: color-mix(in srgb, var(--tone) 4%, transparent);
        cursor: pointer;
        touch-action: manipulation;
      }

      .alert-card.inactive {
        border-left-style: dashed;
        background: color-mix(in srgb, var(--asw-neutral) 8%, transparent);
      }

      .alert-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: baseline;
      }

      .alert-head strong {
        font-size: 14px;
      }

      .alert-head span,
      .alert-date,
      .alert-copy {
        color: var(--asw-muted);
        font-size: 12px;
      }

      .alert-card p {
        margin: 8px 0 0;
        font-size: 13px;
        line-height: 1.4;
      }

      .alert-forecast {
        display: grid;
        gap: 5px;
        margin-top: 8px;
      }

      .alert-forecast-row {
        display: grid;
        grid-template-columns: minmax(74px, max-content) minmax(0, 1fr);
        gap: 8px;
        align-items: baseline;
        border-top: 1px solid color-mix(in srgb, var(--tone) 18%, transparent);
        padding-top: 5px;
        font-size: 12px;
      }

      .alert-forecast-row span {
        color: var(--asw-muted);
        font-weight: 650;
        white-space: nowrap;
      }

      .alert-forecast-row strong {
        min-width: 0;
        color: var(--asw-text);
        font-weight: 650;
        line-height: 1.35;
      }

      .quiet-state {
        padding: 13px 14px;
      }

      .alert-title {
        font-weight: 750;
      }

      .loading-card {
        min-height: 56px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--asw-surface);
      }

      .loading-icon {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 1px solid color-mix(in srgb, var(--tone) 26%, var(--asw-border));
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 3%, var(--asw-surface));
        color: var(--tone);
      }

      .loading-icon ha-icon {
        width: 19px;
        height: 19px;
      }

      .loading-copy {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .loading-copy strong,
      .loading-copy span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .loading-copy strong {
        color: var(--asw-text);
        font-size: 13px;
        font-weight: 800;
      }

      .loading-copy span {
        color: var(--asw-muted);
        font-size: 11px;
        font-weight: 700;
      }

      .loading-dots {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding-right: 2px;
      }

      .loading-dots span {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--tone);
        animation: asw-loading-dot 1.1s ease-in-out infinite;
      }

      .loading-dots span:nth-child(2) {
        animation-delay: 0.16s;
      }

      .loading-dots span:nth-child(3) {
        animation-delay: 0.32s;
      }

      @keyframes asw-loading-dot {
        0%,
        80%,
        100% {
          opacity: 0.32;
          transform: translateY(0);
        }

        40% {
          opacity: 1;
          transform: translateY(-3px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .loading-dots span,
        .refresh-button.refreshing ha-icon {
          animation: none;
        }
      }

      .tile-card {
        min-height: 58px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 10px 12px;
        background: var(--asw-surface);
      }

      .tile-card.has-actions {
        grid-template-columns: auto minmax(0, 1fr) auto auto;
      }

      .tile-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: color-mix(in srgb, var(--tone) 8%, transparent);
        color: var(--tone);
      }

      .tile-icon ha-icon {
        width: 23px;
        height: 23px;
      }

      .tile-main,
      .tile-metric {
        min-width: 0;
        cursor: pointer;
        touch-action: manipulation;
      }

      .tile-main:focus-visible,
      .tile-metric:focus-visible {
        border-radius: 6px;
        outline: 2px solid color-mix(in srgb, var(--tone) 48%, transparent);
        outline-offset: 3px;
      }

      .tile-title,
      .tile-subtitle,
      .tile-metric span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tile-title {
        font-size: 14px;
        line-height: 1.2;
        font-weight: 760;
      }

      .tile-subtitle {
        margin-top: 2px;
        color: var(--asw-muted);
        font-size: 12px;
        line-height: 1.25;
      }

      .tile-status-pill {
        width: fit-content;
        max-width: 100%;
        min-height: 22px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid color-mix(in srgb, var(--tone) 34%, var(--asw-border));
        border-radius: 999px;
        padding: 0 8px;
        background: color-mix(in srgb, var(--tone) 4%, var(--asw-surface));
        color: var(--asw-text);
      }

      .tile-status-pill span {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: var(--tone);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--tone) 18%, transparent);
        flex: 0 0 auto;
      }

      .tile-status-pill strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
        line-height: 1;
        font-weight: 780;
      }

      .tile-metric {
        display: grid;
        justify-items: end;
        gap: 1px;
        text-align: right;
      }

      .tile-metric strong {
        font-size: 23px;
        line-height: 1;
      }

      .tile-metric span {
        max-width: 86px;
        color: var(--asw-muted);
        font-size: 11px;
        font-weight: 700;
      }

      .tile-actions {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        min-width: 0;
      }

      .tone-quiet { --tone: var(--asw-quiet); }
      .tone-active { --tone: var(--asw-active); }
      .tone-outlook { --tone: var(--asw-outlook); }
      .tone-watch { --tone: var(--asw-watch); }
      .tone-warning { --tone: var(--asw-warning); }
      .tone-storm { --tone: var(--asw-storm); }
      .tone-aurora { --tone: var(--asw-aurora); }
      .tone-neutral { --tone: var(--asw-neutral); }

      .density-compact .header {
        gap: 8px;
        padding: 11px 12px 10px;
      }

      .density-compact .title {
        font-size: 16px;
      }

      .density-compact .body {
        gap: 8px;
        padding: 9px;
      }

      .density-compact .header-actions {
        gap: 6px;
        flex-wrap: wrap;
      }

      .density-compact .refresh-button,
      .density-compact .freshness-pill,
      .density-compact .status {
        min-height: 28px;
      }

      .density-compact .refresh-button {
        width: 28px;
        height: 28px;
      }

      .density-compact .gauge-card {
        --gauge-size: 64px;
        padding: 8px;
      }

      .density-compact .summary {
        gap: 10px;
        padding: 10px;
      }

      .density-compact .summary-value {
        font-size: 18px;
      }

      .density-compact .band {
        min-height: 26px;
        font-size: 11px;
      }

      .density-compact .fact {
        padding: 7px 9px;
      }

      .density-compact .alert-chips {
        gap: 6px;
        padding: 7px;
      }

      .density-compact .alert-chip {
        min-height: 28px;
        padding: 3px 9px 3px 5px;
      }

      .density-compact .diagnostics,
      .density-compact .stale-panel {
        padding: 9px 10px;
      }

      .density-compact .alerts {
        gap: 8px;
        padding: 8px;
      }

      .density-compact .alert-card {
        padding: 8px 9px;
      }

      .density-compact .tile-card {
        min-height: 52px;
        gap: 10px;
        padding: 8px 10px;
      }

      .density-compact .tile-icon {
        width: 34px;
        height: 34px;
      }

      .density-compact .tile-icon ha-icon {
        width: 21px;
        height: 21px;
      }

      .density-compact .tile-metric strong {
        font-size: 21px;
      }

      .density-spacious .header {
        padding: 18px 20px 16px;
      }

      .density-spacious .title {
        font-size: 21px;
      }

      .density-spacious .body {
        gap: 14px;
        padding: 16px;
      }

      .density-spacious .gauge-card {
        --gauge-size: 92px;
        padding: 12px;
      }

      .density-spacious .summary {
        gap: 18px;
        padding: 14px;
      }

      .density-spacious .summary-value {
        font-size: 24px;
      }

      .gauge-card.no-spark {
        text-align: center;
      }

      .gauge-card.no-spark .gauge-top {
        justify-content: center;
      }

      .gauge-card.no-spark .gauge-top small {
        display: none;
      }

      .gauge-card.no-spark .gauge-row {
        grid-template-columns: 1fr;
        justify-items: center;
      }

      .mode-dashboard .body {
        gap: 9px;
      }

      .mode-dashboard.history-off .gauge-card {
        --gauge-size: 64px;
      }

      .mode-glance .header {
        align-items: center;
        gap: 8px;
        padding: 9px 10px 7px;
      }

      .mode-glance .header-icon {
        width: 28px;
        height: 28px;
      }

      .mode-glance .header-icon ha-icon {
        width: 17px;
        height: 17px;
      }

      .mode-glance .header-actions {
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .mode-glance .status {
        min-height: 24px;
        gap: 5px;
        padding: 0 8px;
        font-size: 11px;
      }

      .mode-glance .status .pulse {
        width: 6px;
        height: 6px;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--tone) 18%, transparent);
      }

      .mode-glance .title {
        font-size: 14px;
      }

      .mode-glance .header-subtitle {
        margin-top: 1px;
        font-size: 10px;
      }

      .mode-glance .body {
        gap: 7px;
        padding: 8px;
      }

      .mode-glance .gauges {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .mode-glance .gauges.gauge-count-1 {
        grid-template-columns: minmax(0, 1fr);
      }

      .mode-glance .gauges.gauge-count-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .mode-glance .gauge-card {
        --gauge-size: 54px;
        padding: 8px;
      }

      .mode-glance .gauge-top {
        justify-content: center;
        min-height: 16px;
        text-align: center;
      }

      .mode-glance .gauge-top span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
      }

      .mode-glance .gauge-top small {
        display: none;
      }

      .mode-glance .gauge-row {
        grid-template-columns: 1fr;
        justify-items: center;
        gap: 0;
        margin-top: 7px;
      }

      .mode-glance .gauge-inner {
        width: calc(var(--gauge-size) - 14px);
      }

      .mode-glance .gauge-inner strong {
        font-size: 18px;
      }

      .mode-glance .gauge-inner span {
        min-height: 10px;
        font-size: 9px;
      }

      .mode-glance .spark {
        display: none;
      }

      .mode-glance .glance-gauges {
        grid-template-columns: minmax(0, 1fr);
      }

      .mode-tile .refresh-button,
      .mode-tile .freshness-pill,
      .mode-tile .status {
        min-height: 28px;
      }

      .mode-tile .refresh-button {
        width: 28px;
        height: 28px;
      }

      @container (min-width: 360px) {
        .mode-glance .glance-overview {
          grid-template-columns: minmax(140px, 0.9fr) minmax(0, 1.1fr);
          grid-template-areas:
            "primary metrics"
            "scale metrics";
        }
      }

      @container (min-width: 360px) {
        .mode-glance .glance-footer {
          grid-template-columns: repeat(var(--glance-chip-columns, 3), minmax(0, 1fr));
        }
      }

      @container (max-width: 359px) {
        .mode-glance .glance-footer {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .mode-glance .glance-footer-chip:first-child {
          grid-column: span 2;
        }

        .mode-glance .glance-footer-chip strong {
          font-size: 12px;
        }
      }

      @container (max-width: 359px) {
        .mode-glance .glance-overview {
          grid-template-columns: minmax(0, 1fr);
          grid-template-areas:
            "primary"
            "scale"
            "metrics";
        }

        .mode-glance .glance-primary {
          min-height: 72px;
        }
      }

      @media (max-width: 640px) {
        .header,
        .summary {
          grid-template-columns: 1fr;
          flex-direction: column;
        }

        .header-actions {
          justify-content: space-between;
          width: 100%;
        }

        .mode-glance .header {
          flex-direction: row;
          align-items: center;
        }

        .mode-glance .header-actions {
          justify-content: flex-end;
          width: auto;
        }

        .mode-glance .header-main {
          min-width: 0;
        }

        .mode-glance .status {
          max-width: 108px;
        }

        .mode-glance .status span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mode-glance .glance-primary {
          min-height: 72px;
        }

        .mode-glance .glance-footer-chip strong {
          font-size: 12px;
        }

        .gauges {
          grid-template-columns: 1fr;
        }

        .bands {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .facts {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .facts.fact-count-1 {
          grid-template-columns: minmax(0, 1fr);
        }

        .timeline-head {
          align-items: flex-start;
          flex-direction: column;
          gap: 4px;
        }

        .diagnostics {
          align-items: flex-start;
          flex-direction: column;
        }

        .diagnostic-chips {
          justify-content: flex-start;
        }

        .fact:nth-child(2n) {
          border-right: 0;
        }

        .mode-glance .gauges {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .mode-glance .gauges.gauge-count-1,
        .mode-dashboard.history-off .gauges.gauge-count-1 {
          grid-template-columns: minmax(0, 1fr);
        }

        .mode-glance .gauges.gauge-count-2,
        .mode-dashboard.history-off .gauges.gauge-count-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .mode-glance .gauges.gauge-count-3,
        .mode-dashboard.history-off .gauges.gauge-count-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .mode-dashboard.history-off .gauge-card {
          --gauge-size: 64px;
          padding: 10px 8px;
        }

        .tile-card,
        .tile-card.has-actions {
          grid-template-columns: auto minmax(0, 1fr) auto;
        }

        .tile-actions {
          grid-column: 2 / -1;
          justify-content: flex-start;
        }
      }
    </style>
  `;
}

function editorStyles() {
  return `
    <style>
      .editor {
        display: grid;
        gap: 12px;
        padding: 12px 0;
      }

      label {
        display: grid;
        gap: 5px;
        color: var(--asw-text);
        font-size: 13px;
        font-weight: 650;
      }

      .editor-group {
        display: grid;
        gap: 10px;
        padding: 11px;
        border: 1px solid var(--divider-color, #cbd5e1);
        border-radius: 8px;
        background: color-mix(in srgb, var(--card-background-color, #ffffff) 92%, var(--secondary-background-color, #f1f5f9));
      }

      .editor-group-head {
        display: grid;
        gap: 3px;
      }

      .editor-group-head strong {
        color: var(--asw-text);
        font-size: 13px;
        font-weight: 760;
      }

      .editor-group-head small {
        color: var(--asw-muted);
        font-size: 11px;
        font-weight: 500;
        line-height: 1.35;
      }

      .slot-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .toggle-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 12px;
      }

      input[type="text"],
      input[type="number"],
      textarea,
      select,
      ha-entity-picker,
      ha-icon-picker {
        box-sizing: border-box;
        width: 100%;
      }

      input[type="text"],
      input[type="number"],
      textarea,
      select {
        border: 1px solid var(--divider-color, #cbd5e1);
        border-radius: 6px;
        padding: 0 10px;
        background: var(--card-background-color, #ffffff);
        color: var(--asw-text);
        font: inherit;
        font-weight: 500;
      }

      input[type="text"]:focus-visible,
      input[type="number"]:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 2px solid var(--accent-color, #14b8a6);
        outline-offset: 2px;
      }

      input[type="text"],
      input[type="number"],
      select {
        min-height: 38px;
      }

      textarea {
        min-height: 104px;
        resize: vertical;
        padding: 10px;
        font-family: var(--code-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
        line-height: 1.45;
      }

      textarea[aria-invalid="true"] {
        border-color: var(--error-color, #dc2626);
      }

      .check {
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 8px;
      }

      .field-help {
        color: var(--asw-muted);
        font-size: 11px;
        font-weight: 500;
        line-height: 1.35;
      }

      @media (max-width: 520px) {
        .slot-grid,
        .toggle-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    </style>
  `;
}

function defineCustomElement(name, ctor) {
  if (!customElements.get(name)) {
    customElements.define(name, ctor);
  }
}

defineCustomElement('aus-bom-space-weather-card', AusBomSpaceWeatherCard);
defineCustomElement('aus-bom-space-weather-card-editor', AusBomSpaceWeatherCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TYPE,
  name: 'AUS BOM Space Weather Card',
  preview: true,
  description: 'Compact graphical Lovelace card for BOM Space Weather Services entities.',
  documentationURL: 'https://github.com/AshtonAU/aus-bom-space-weather',
  getEntitySuggestion: entitySuggestion,
});

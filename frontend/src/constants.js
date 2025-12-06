export const availableRequestTypes = [
  { label: "Flat Tyre", value: "FLAT_TYRE" },
  { label: "Battery Jumpstart", value: "BATTERY_JUMPSTART" },
  { label: "Towing Service", value: "TOWING_SERVICE" },
  { label: "Out of Fuel", value: "OUT_OF_FUEL" },
  { label: "Key Lockout", value: "KEY_LOCKOUT" },
  { label: "Minor Repairs", value: "MINOR_REPAIRS" },
];

export const UserActivityStatus = {
  IDLE: 'IDLE',
  WAITING: 'WAITING',
  ASSIGNED: 'ASSIGNED',
  COMPLETED: 'COMPLETED',
};

export const VENDOR_ACCEPT_TIMEOUT_SECONDS = 30;
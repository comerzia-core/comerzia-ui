export interface MfaPolicyStatusResponse {
  platformMandatory: boolean;
  updatedAt: string | null;
  updatedByUsername: string | null;
}

export interface KeyringCheck {
  configured: boolean;
  activeKeyId: string;
  keyLengthBits: number;
  roundTripCryptoOk: boolean;
  previousKeysCount: number;
}

export interface DatabaseCheck {
  connectionOk: boolean;
  mfaFactorsTableExists: boolean;
  recoveryCodesTableExists: boolean;
  stepUpGrantsTableExists: boolean;
  emergencyRequestsTableExists: boolean;
}

export interface RedisCheck {
  available: boolean;
  rateLimitingFunctional: boolean;
}

export interface ClockCheck {
  utcNow: string;
  timezone: string;
  utcSynchronized: boolean;
}

export interface PlatformInventoryCheck {
  totalPlatformAccounts: number;
  enrolledAccounts: number;
  unenrolledAccounts: number;
  independentOperatorsCount: number;
  unenrolledUsernames: string[];
}

export interface EmergencyCheck {
  breakGlassToolAvailable: boolean;
  dualControlActive: boolean;
}

export interface MfaPreflightResponse {
  status: 'READY' | 'NOT_READY';
  evaluatedAt: string;
  keyring: KeyringCheck;
  database: DatabaseCheck;
  redis: RedisCheck;
  clock: ClockCheck;
  platformInventory: PlatformInventoryCheck;
  emergencyReadiness: EmergencyCheck;
  warnings: string[];
  blockers: string[];
}


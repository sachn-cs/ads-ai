export class CinestudioError extends Error {
  constructor(public override readonly cause?: unknown, message?: string) {
    super(message ?? 'Cinestudio operation failed');
    this.name = 'CinestudioError';
  }
}

export class ProviderNotConfiguredError extends CinestudioError {
  constructor(provider: string) {
    super(undefined, `Provider "${provider}" is not configured. Complete the onboarding screen first.`);
    this.name = 'ProviderNotConfiguredError';
  }
}

export class RenderProviderDisabledError extends CinestudioError {
  constructor(provider: string) {
    super(undefined, `Render provider "${provider}" is disabled in the configuration.`);
    this.name = 'RenderProviderDisabledError';
  }
}

export class SchemaValidationFailedError extends CinestudioError {
  constructor(public readonly schemaName: string, public readonly issues: unknown) {
    super(undefined, `Schema "${schemaName}" failed validation.`);
    this.name = 'SchemaValidationFailedError';
  }
}

export class RunCancelledError extends CinestudioError {
  constructor(public readonly runId: string) {
    super(undefined, `Run ${runId} was cancelled.`);
    this.name = 'RunCancelledError';
  }
}

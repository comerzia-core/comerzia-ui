// Material transitorio en memoria: jamás forma parte del historial ni de Web Storage.
export interface GoogleRegistrationContinuation {
  registrationToken: string;
  email?: string;
  name?: string;
}

export interface GoogleInvitationContinuation {
  token: string;
  googleContinuationToken: string;
}

let registration: GoogleRegistrationContinuation | null = null;
let invitation: GoogleInvitationContinuation | null = null;

export function rememberGoogleRegistration(value: GoogleRegistrationContinuation): void { registration = value; }
export function getGoogleRegistration(): GoogleRegistrationContinuation | null { return registration; }
export function clearGoogleRegistration(): void { registration = null; }
export function rememberGoogleInvitation(value: GoogleInvitationContinuation): void { invitation = value; }
export function getGoogleInvitation(): GoogleInvitationContinuation | null { return invitation; }
export function clearGoogleInvitation(): void { invitation = null; }

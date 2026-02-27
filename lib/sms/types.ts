export interface SMSMessage {
  to: string;   // E.164 format, e.g. +12125551234
  from: string; // Sender number or alphanumeric ID
  body: string;
}

export interface SMSSendResult {
  messageId: string;
  status: string;
}

export interface SMSService {
  send(message: SMSMessage): Promise<SMSSendResult>;
}

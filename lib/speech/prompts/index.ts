export { BASE_SYSTEM_PROMPT } from './shelly-base';
export { GOODBYE_EXCEPTION_SECTION } from './shelly-ending';
export { buildSystemPrompt, type ShellyPromptContext } from './shelly-build';
export { getFirstMessageInstruction } from './first-message';
export {
  SHELLY_MODES,
  getModeSystemPromptBlock,
  EXPLICIT_MODE_SIGNALS,
  DEFAULT_MODE,
  type ShellyMode,
  type ModeStyleGuide,
} from './shelly-modes';
export {
  getEscalationResponse,
  getTier1Response,
  getTier2Response,
  getTier3Response,
  TIER_1_RESPONSE_TEMPLATES,
  TIER_2_RESPONSE_TEMPLATES,
  TIER_2_MAIN_PHRASE,
  TIER_3_RESPONSE_TEMPLATES,
  buildParentAlertPayload,
  type ParentAlertPayload,
} from './escalation';


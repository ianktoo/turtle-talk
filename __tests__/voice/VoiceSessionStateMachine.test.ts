import { VoiceSessionStateMachine } from '@/lib/speech/voice/state';

describe('VoiceSessionStateMachine', () => {
  let machine: VoiceSessionStateMachine;

  beforeEach(() => {
    machine = new VoiceSessionStateMachine();
  });

  describe('initial state', () => {
    it('starts in idle', () => {
      expect(machine.getState()).toBe('idle');
      expect(machine.getSnapshot().mood).toBe('idle');
      expect(machine.getSnapshot().idleCountdownRemaining).toBeNull();
    });
  });

  describe('START', () => {
    it('idle + START -> listening', () => {
      machine.transition('START');
      expect(machine.getState()).toBe('listening');
      expect(machine.getSnapshot().mood).toBe('listening');
    });

    it('ended + START -> listening', () => {
      machine.transition('START');
      machine.transition('END');
      expect(machine.getState()).toBe('ended');
      machine.transition('START');
      expect(machine.getState()).toBe('listening');
    });
  });

  describe('VAD and recording', () => {
    it('listening + VAD_SPEECH_START -> recording', () => {
      machine.transition('START');
      machine.transition('VAD_SPEECH_START');
      expect(machine.getState()).toBe('recording');
    });

    it('recording + VAD_SPEECH_END -> processing', () => {
      machine.transition('START');
      machine.transition('VAD_SPEECH_START');
      machine.transition('VAD_SPEECH_END');
      expect(machine.getState()).toBe('processing');
      expect(machine.getSnapshot().mood).toBe('confused');
    });
  });

  describe('META_RECEIVED and speaking', () => {
    it('processing + META_RECEIVED -> speaking with payload mood', () => {
      machine.transition('START');
      machine.transition('VAD_SPEECH_START');
      machine.transition('VAD_SPEECH_END');
      machine.transition('META_RECEIVED', { mood: 'happy' });
      expect(machine.getState()).toBe('speaking');
      expect(machine.getSnapshot().mood).toBe('happy');
    });

    it('speaking + AUDIO_ENDED -> listening', () => {
      machine.transition('START');
      machine.transition('VAD_SPEECH_START');
      machine.transition('VAD_SPEECH_END');
      machine.transition('META_RECEIVED', { mood: 'talking' });
      machine.transition('AUDIO_ENDED');
      expect(machine.getState()).toBe('listening');
      expect(machine.getSnapshot().mood).toBe('listening');
    });
  });

  describe('MUTE / UNMUTE', () => {
    it('listening + MUTE -> muted', () => {
      machine.transition('START');
      machine.transition('MUTE');
      expect(machine.getState()).toBe('muted');
      expect(machine.getSnapshot().mood).toBe('idle');
    });

    it('muted + UNMUTE -> listening', () => {
      machine.transition('START');
      machine.transition('MUTE');
      machine.transition('UNMUTE');
      expect(machine.getState()).toBe('listening');
    });

    it('muted + USER_WAKE -> listening', () => {
      machine.transition('START');
      machine.transition('MUTE');
      machine.transition('USER_WAKE');
      expect(machine.getState()).toBe('listening');
    });
  });

  describe('END', () => {
    it('listening + END -> ended', () => {
      machine.transition('START');
      machine.transition('END');
      expect(machine.getState()).toBe('ended');
    });

    it('recording + END -> ended', () => {
      machine.transition('START');
      machine.transition('VAD_SPEECH_START');
      machine.transition('END');
      expect(machine.getState()).toBe('ended');
    });

    it('speaking + END -> ended', () => {
      machine.transition('START');
      machine.transition('VAD_SPEECH_START');
      machine.transition('VAD_SPEECH_END');
      machine.transition('META_RECEIVED', { mood: 'happy' });
      machine.transition('END');
      expect(machine.getState()).toBe('ended');
    });
  });

  describe('invalid transitions', () => {
    it('idle + VAD_SPEECH_START does nothing', () => {
      machine.transition('VAD_SPEECH_START');
      expect(machine.getState()).toBe('idle');
    });

    it('listening + AUDIO_ENDED does nothing', () => {
      machine.transition('START');
      machine.transition('AUDIO_ENDED');
      expect(machine.getState()).toBe('listening');
    });

    it('ended + any event except START does nothing', () => {
      machine.transition('START');
      machine.transition('END');
      machine.transition('UNMUTE');
      machine.transition('VAD_SPEECH_START');
      expect(machine.getState()).toBe('ended');
    });
  });

  describe('subscribe', () => {
    it('notifies on transition', () => {
      const spy = jest.fn();
      machine.subscribe(spy);
      machine.transition('START');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'listening', mood: 'listening' }),
      );
    });

    it('unsubscribe stops notifications', () => {
      const spy = jest.fn();
      const unsub = machine.subscribe(spy);
      machine.transition('START');
      expect(spy).toHaveBeenCalledTimes(1);
      unsub();
      machine.transition('MUTE');
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('idle countdown', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('startIdleCountdown sets idleCountdownRemaining and decrements', () => {
      machine.transition('START');
      machine.startIdleCountdown(3);
      expect(machine.getSnapshot().idleCountdownRemaining).toBe(3);
      jest.advanceTimersByTime(1000);
      expect(machine.getSnapshot().idleCountdownRemaining).toBe(2);
      jest.advanceTimersByTime(1000);
      expect(machine.getSnapshot().idleCountdownRemaining).toBe(1);
      jest.advanceTimersByTime(1000);
      expect(machine.getSnapshot().idleCountdownRemaining).toBeNull();
      expect(machine.getState()).toBe('muted');
    });

    it('cancelIdleCountdown clears countdown', () => {
      machine.transition('START');
      machine.startIdleCountdown(5);
      expect(machine.getSnapshot().idleCountdownRemaining).toBe(5);
      machine.cancelIdleCountdown();
      expect(machine.getSnapshot().idleCountdownRemaining).toBeNull();
      expect(machine.getState()).toBe('listening');
    });

    it('VAD_SPEECH_START cancels countdown', () => {
      machine.transition('START');
      machine.startIdleCountdown(5);
      machine.transition('VAD_SPEECH_START');
      expect(machine.getSnapshot().idleCountdownRemaining).toBeNull();
      expect(machine.getState()).toBe('recording');
    });
  });
});

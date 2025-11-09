import { Device, Call } from '@twilio/voice-sdk';
import { apiClient } from './api';

let device: Device | null = null;

export async function initializeTwilioDevice(identity: string): Promise<Device> {
  if (device) {
    device.destroy();
  }

  // Get access token from backend
  const response = await apiClient.post('/twilio/access-token', { identity });
  const { token } = response.data;

  // Initialize Twilio Device
  device = new Device(token, {
    logLevel: 1,
  });

  // Set up event listeners
  device.on('registered', () => {
    console.log('Twilio Device Ready');
  });

  device.on('error', (error: Error) => {
    console.error('Twilio Device Error:', error);
  });

  device.on('incoming', (call: Call) => {
    console.log('Incoming call from:', call.parameters.From);
  });

  // Register the device
  await device.register();

  return device;
}

export function getTwilioDevice(): Device | null {
  return device;
}

export function destroyTwilioDevice(): void {
  if (device) {
    device.destroy();
    device = null;
  }
}

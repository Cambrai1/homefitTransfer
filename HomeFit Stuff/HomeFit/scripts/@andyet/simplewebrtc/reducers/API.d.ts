import { AnyAction } from 'redux';
import { TelemetryEvent } from '../actions';
import { APIConfig } from '../Definitions';
import { SignalingClient } from '../signaling';
export interface ServiceState {
    connectionAttempts: number;
    connectionState: string;
    signalingClient?: SignalingClient;
    config: APIConfig;
    configUrl: string;
    queuedTelemetry: TelemetryEvent[];
    token: string;
}
export default function (state: ServiceState | undefined, action: AnyAction): ServiceState;

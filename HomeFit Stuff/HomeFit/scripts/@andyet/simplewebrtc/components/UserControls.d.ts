import * as React from 'react';
import { User } from '../Definitions';
export interface UserControlsProps {
    user?: User;
    customerData?: object;
    isDeafened?: boolean;
    isMuted?: boolean;
    isPaused?: boolean;
    deafen?: () => void;
    undeafen?: () => void;
    mute?: () => void;
    unmute?: () => void;
    pauseVideo?: () => void;
    resumeVideo?: () => void;
    setDisplayName?: (name: string) => void;
    setAudioOutputDevice?: (deviceId: string) => void;
    setVoiceActivityThreshold?: (threshold: number) => void;
    setGlobalVolumeLimit?: (volumeLimit: number) => void;
    render?: (props: UserControlsRenderProps) => React.ReactNode;
    children?: React.ReactNode | ((props: UserControlsRenderProps) => React.ReactNode);
}
export interface UserControlsRenderProps {
    user: User;
    customerData: object;
    isDeafened: boolean;
    isMuted: boolean;
    isPaused: boolean;
    deafen: () => void;
    undeafen: () => void;
    mute: () => void;
    unmute: () => void;
    pauseVideo: () => void;
    resumeVideo: () => void;
    setAudioOutputDevice: (deviceId: string) => void;
    setDisplayName: (name: string) => void;
    setVoiceActivityThreshold: (threshold: number) => void;
    setGlobalVolumeLimit: (volumeLimit: number) => void;
}
/**
 * @description
 *
 * @public
 *
 */
export declare class UserControls extends React.Component<UserControlsProps, any> {
    render(): {} | null | undefined;
}
declare const _default: import("react-redux").ConnectedComponentClass<typeof UserControls, Pick<UserControlsProps, never> & UserControlsProps>;
export default _default;

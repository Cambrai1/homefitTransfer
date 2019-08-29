import { AnyAction } from 'redux';
import { Media } from '../Definitions';
export interface MediaState {
    [key: string]: Media;
}
export default function (state: MediaState | undefined, action: AnyAction): MediaState;

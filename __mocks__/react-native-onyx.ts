/* eslint-disable rulesdir/prefer-onyx-connect-in-libs */
import type {ConnectOptions, OnyxKey} from 'react-native-onyx';
import Onyx, { withOnyx} from 'react-native-onyx';

let connectCallbackDelay = 0;
function addDelayToConnectCallback(delay: number) {
    connectCallbackDelay = delay;
}

type ReactNativeOnyxMock = {
    addDelayToConnectCallback: (delay: number) => void;
} & typeof Onyx;

type ConnectionCallback<TKey extends OnyxKey> = NonNullable<ConnectOptions<TKey>['callback']>;
type ConnectionCallbackParams<TKey extends OnyxKey> = Parameters<ConnectionCallback<TKey>>;

const reactNativeOnyxMock: ReactNativeOnyxMock = {
    ...Onyx,
    connect: <TKey extends OnyxKey>(mapping: ConnectOptions<TKey>) => {
        const callback = (...params: ConnectionCallbackParams<TKey>) => {
            if (connectCallbackDelay > 0) {
                setTimeout(() => {
                    (mapping.callback as (...args: ConnectionCallbackParams<TKey>) => void)?.(...params);
                }, connectCallbackDelay);
            } else {
                (mapping.callback as (...args: ConnectionCallbackParams<TKey>) => void)?.(...params);
            }
        };
        return Onyx.connect({
            ...mapping,
            callback,
        });
    },
    addDelayToConnectCallback,
};

export default reactNativeOnyxMock;
export {withOnyx};
/* eslint-enable rulesdir/prefer-onyx-connect-in-libs */

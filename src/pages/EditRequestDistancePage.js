import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {withOnyx} from 'react-native-onyx';
import _ from 'underscore';
import DistanceRequest from '@components/DistanceRequest';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import transactionPropTypes from '@components/transactionPropTypes';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import usePrevious from '@hooks/usePrevious';
import Navigation from '@libs/Navigation/Navigation';
import * as IOU from '@userActions/IOU';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import reportPropTypes from './reportPropTypes';
import * as TransactionUtils from '@libs/TransactionUtils'; 
import * as NumberUtils from '@libs/NumberUtils';

const propTypes = {
    /** The transactionID we're currently editing */
    transactionID: PropTypes.string.isRequired,

    /** The report to with which the distance request is associated */
    report: reportPropTypes.isRequired,

    /** Passed from the navigator */
    route: PropTypes.shape({
        /** Parameters the route gets */
        params: PropTypes.shape({
            /** Type of IOU */
            iouType: PropTypes.oneOf(_.values(CONST.IOU.TYPE)),

            /** Id of the report on which the distance request is being created */
            reportID: PropTypes.string,
        }),
    }).isRequired,

    /* Onyx props */
    /** The original transaction that is being edited */
    transaction: transactionPropTypes,

};

const defaultProps = {
    transaction: {},
};

function EditRequestDistancePage({report, route, transaction}) {
    const {isOffline} = useNetwork();
    const {translate} = useLocalize();
    const hasWaypointError = useRef(false);
    const prevIsLoading = usePrevious(transaction.isLoading);

    useEffect(() => {
        hasWaypointError.current = Boolean(lodashGet(transaction, 'errorFields.route') || lodashGet(transaction, 'errorFields.waypoints'));

        // When the loading goes from true to false, then we know the transaction has just been
        // saved to the server. Check for errors. If there are no errors, then the modal can be closed.
        if (prevIsLoading && !transaction.isLoading && !hasWaypointError.current) {
            Navigation.dismissModal(report.reportID);
        }
    }, [transaction, prevIsLoading, report]);

    /**
     * Save the changes to the original transaction object
     * @param {Object} waypoints
     */
    const saveTransaction = (waypoints) => {
        // If nothing was changed, simply go to transaction thread
        // We compare only addresses in case numbers are rounded
        const oldWaypoints = lodashGet(transaction, 'comment.waypoints', {});
        const oldAddresses = _.mapObject(oldWaypoints, (waypoint) => _.pick(waypoint, 'address'));
        const addresses = _.mapObject(waypoints, (waypoint) => _.pick(waypoint, 'address'));
        if (_.isEqual(oldAddresses, addresses)) {
            Navigation.dismissModal(report.reportID);
            return;
        }

        IOU.updateMoneyRequestDistance(transaction.transactionID, report.reportID, waypoints);

        // If the client is offline, then the modal can be closed as well (because there are no errors or other feedback to show them
        // until they come online again and sync with the server).
        if (isOffline) {
            Navigation.dismissModal(report.reportID);
        }
    };

    //const tempTransactionID = NumberUtils.rand64();
    const tempTransactionID = 1;
    useEffect(() => {
      const waypoints = TransactionUtils.getWaypoints(transaction);
      const tempTransaction = { 
        transactionID: tempTransactionID,
        comment: (waypoints) ? {waypoints} : null, 
      };
      Onyx.set(`${ONYXKEYS.COLLECTION.TRANSACTION}${tempTransactionID}`, tempTransaction);
      return () => {
        Onyx.set(`${ONYXKEYS.COLLECTION.TRANSACTION}${tempTransactionID}`, null);
      };
    }, [transaction]);

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            shouldEnableMaxHeight
            testID={EditRequestDistancePage.displayName}
        >
            <HeaderWithBackButton
                title={translate('common.distance')}
                onBackButtonPress={() => Navigation.goBack()}
            />
            <DistanceRequest
                report={report}
                route={route}
                transactionID={tempTransactionID}
                onSubmit={saveTransaction}
                isEditingRequest
            />
        </ScreenWrapper>
    );
}

EditRequestDistancePage.propTypes = propTypes;
EditRequestDistancePage.defaultProps = defaultProps;
EditRequestDistancePage.displayName = 'EditRequestDistancePage';
export default withOnyx({
    transaction: {
        key: (props) => `${ONYXKEYS.COLLECTION.TRANSACTION}${props.transactionID}`,
    },
})(EditRequestDistancePage);

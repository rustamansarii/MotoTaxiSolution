import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { fetchDriverRides } from '../../redux/features/driver/driverSlice';
import { isGuestMode } from '../../utils/storage';

/**
 * Format ISO datetime string to user-friendly string
 */
const formatTripDate = (dateString, t, language = 'en') => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const localeMap = {
      en: 'en-US',
      fr: 'fr-FR',
      hi: 'hi-IN',
    };
    const currentLocale = localeMap[language] || 'en-US';
    const timeStr = date.toLocaleTimeString(currentLocale, {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) return `${t ? t('common.today', 'Today') : 'Today'}, ${timeStr}`;
    if (isYesterday)
      return `${t ? t('common.yesterday', 'Yesterday') : 'Yesterday'}, ${timeStr}`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString(currentLocale, { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}, ${timeStr}`;
  } catch {
    return dateString;
  }
};

/**
 * Check if ISO date string is today
 */
const isTripToday = (dateString) => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
};

/**
 * Map vehicle_type to display name and icon
 */
const getVehicleTypeInfo = (vehicleType, t) => {
  const type = (vehicleType || '').toUpperCase();
  switch (type) {
    case 'BIKE':
      return {
        label: t ? t('rider.motoStandard', 'Moto Taxi Standard') : 'Moto Taxi Standard',
        icon: 'bike',
      };
    case 'AUTO':
      return {
        label: t ? t('rider.motoAuto', 'Moto Auto') : 'Moto Auto',
        icon: 'auto',
      };
    case 'CAR':
    default:
      return {
        label: t ? t('rider.motoCar', 'Moto Cab / Car') : 'Moto Cab / Car',
        icon: 'car',
      };
  }
};

/**
 * Map status string to StatusBadge config
 */
const getStatusInfo = (status, t) => {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'COMPLETED':
      return {
        status: 'completed',
        label: t ? t('rider.statusCompleted', 'Completed') : 'Completed',
      };
    case 'CANCELLED':
      return {
        status: 'cancelled',
        label: t ? t('rider.statusCancelled', 'Cancelled') : 'Cancelled',
      };
    case 'IN_PROGRESS':
    case 'STARTED':
      return {
        status: 'in_progress',
        label: t ? t('rider.statusInProgress', 'In Progress') : 'In Progress',
      };
    case 'ARRIVED':
      return {
        status: 'arrived',
        label: t ? t('rider.statusDriverArrived', 'Arrived') : 'Arrived',
      };
    case 'ACCEPTED':
      return {
        status: 'accepted',
        label: t ? t('rider.statusAccepted', 'Accepted') : 'Accepted',
      };
    case 'PENDING':
    default:
      return {
        status: 'pending',
        label: t ? t('rider.statusPending', 'Pending') : 'Pending',
      };
  }
};

/**
 * Format payment method for display
 */
const formatPaymentMethod = (method, t) => {
  const m = (method || 'CASH').toUpperCase();
  if (m === 'CASH') return t ? t('rider.payCash', 'Cash') : 'Cash';
  if (m === 'ONLINE' || m === 'CARD' || m === 'UPI')
    return t ? t('rider.payOnline', 'Online') : 'Online';
  if (m === 'WALLET') return t ? t('rider.payWallet', 'Wallet') : 'Wallet';
  return method || 'Cash';
};

/**
 * Format payment status for display
 */
const formatPaymentStatus = (status, t) => {
  const s = (status || '').toUpperCase();
  if (s === 'PAID' || s === 'COMPLETED')
    return t ? t('rider.statusCompleted', 'Paid') : 'Paid';
  if (s === 'PENDING') return t ? t('rider.statusPending', 'Pending') : 'Pending';
  if (s === 'FAILED') return t ? t('rider.statusCancelled', 'Failed') : 'Failed';
  return status || '';
};

/**
 * Format cancelled by for display
 */
const formatCancelledBy = (by, t) => {
  const b = (by || 'RIDER').toUpperCase();
  if (b === 'DRIVER') return t ? t('rider.cancelledByDriver', 'Driver') : 'Driver';
  if (b === 'SYSTEM' || b === 'ADMIN')
    return t ? t('rider.cancelledBySystem', 'System') : 'System';
  return t ? t('rider.cancelledByRider', 'Rider') : 'Rider';
};

export const DriverTripsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language || 'en';
  const dispatch = useDispatch();
  const { isFoldableOrTablet, insets } = useResponsive();

  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'completed'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const authUser = useSelector((state) => state.auth?.user);

  // null = not yet determined (pending), true/false = resolved
  const [isGuestStored, setIsGuestStored] = useState(null);

  useEffect(() => {
    let mounted = true;
    isGuestMode()
      .then((val) => {
        if (mounted) setIsGuestStored(!!val);
      })
      .catch(() => {
        if (mounted) setIsGuestStored(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Guest check is still pending if we have no auth user AND storage hasn't resolved
  const isGuestCheckPending = !authUser?.id && isGuestStored === null;

  // Guest if: no auth user OR storage says guest
  const isGuest = !authUser?.id || isGuestStored === true;

  const promptGuestLogin = useCallback(
    (
      msgKey = 'auth.loginRequiredTripsMsg',
      defMsg = 'Please log in first to view and manage your trips.'
    ) => {
      Alert.alert(
        t('auth.loginRequired', 'Login Required'),
        t(msgKey, defMsg),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('auth.login', 'Log In'),
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
          },
        ],
        { cancelable: true }
      );
    },
    [t, navigation]
  );

  // Redux driver rides state
  const {
    driverRides = [],
    driverRidesCount = 0,
    driverRidesNext = null,
    driverRidesCurrentPage = 1,
    isDriverRidesLoading = false,
    isLoadingMoreDriverRides = false,
    driverRidesError = null,
  } = useSelector((state) => state.driver);

  // Fetch page 1 when screen gains focus (skips guests & waits for guest check)
  useFocusEffect(
    useCallback(() => {
      if (isGuestCheckPending) return; // wait until guest status resolves
      if (isGuest) {
        // promptGuestLogin(); 
        return; // 🚫 no API call for guests
      }
      dispatch(fetchDriverRides({ page: 1, page_size: 10 }));
    }, [dispatch, isGuest, isGuestCheckPending, promptGuestLogin])
  );

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (isGuestCheckPending) return;
    if (isGuest) {
      promptGuestLogin();
      return; // 🚫 no API call
    }
    setIsRefreshing(true);
    await dispatch(fetchDriverRides({ page: 1, page_size: 10 }));
    setIsRefreshing(false);
  }, [dispatch, isGuest, isGuestCheckPending, promptGuestLogin]);

  // Infinite scroll pagination: load next page
  const handleLoadMore = useCallback(() => {
    if (isGuestCheckPending || isGuest) return; // 🚫 explicit guest guard
    if (!isDriverRidesLoading && !isLoadingMoreDriverRides && driverRidesNext) {
      dispatch(
        fetchDriverRides({ page: driverRidesCurrentPage + 1, page_size: 10 })
      );
    }
  }, [
    dispatch,
    isGuest,
    isGuestCheckPending,
    isDriverRidesLoading,
    isLoadingMoreDriverRides,
    driverRidesNext,
    driverRidesCurrentPage,
  ]);

  // Source trips: hide any stale Redux data from guests
  const visibleTrips = isGuest ? [] : driverRides;

  // Filter trips based on active filter tab
  const filteredTrips = useMemo(() => {
    if (filter === 'today') {
      return visibleTrips.filter((t) => isTripToday(t.created_at));
    }
    if (filter === 'completed') {
      return visibleTrips.filter(
        (t) => (t.status || '').toUpperCase() === 'COMPLETED'
      );
    }
    return visibleTrips;
  }, [visibleTrips, filter]);

  // Render individual trip card item
  const renderTripItem = ({ item }) => {
    const typeInfo = getVehicleTypeInfo(item.vehicle_type, t);
    const statusInfo = getStatusInfo(item.status, t);
    const isCancelled = (item.status || '').toUpperCase() === 'CANCELLED';

    const driverPayout =
      item.driver_payout || item.final_fare || item.estimated_fare || '0';
    const totalFare = item.final_fare || item.estimated_fare || '0';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => {
          if (isGuest) {
            promptGuestLogin();
            return;
          }
          setSelectedTrip(item);
        }}
        style={[styles.tripCard, isFoldableOrTablet && { flex: 1 }]}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.topLeftCol}>
            <View style={styles.tripIdRow}>
              <View style={styles.vehicleIconBadge}>
                <Icon
                  name={typeInfo.icon}
                  size={14}
                  color={COLORS.secondPrimary}
                />
              </View>
              <Text style={styles.tripIdText}>
                {t('driver.tripNumber', 'Trip #{{id}}', { id: item.id })}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {formatTripDate(item.created_at, t, currentLanguage)}
            </Text>
            <Text style={styles.vehicleTypeText}>{typeInfo.label}</Text>
          </View>

          <View style={styles.earningsCol}>
            <Text
              style={[
                styles.payoutText,
                isCancelled && styles.cancelledPayoutText,
              ]}
            >
              +{formatCurrency(driverPayout)}
            </Text>
            <Text style={styles.fareSubText}>
              {t('driver.fareLabel', 'Fare: {{fare}}', {
                fare: formatCurrency(totalFare),
              })}
            </Text>
            <StatusBadge
              status={statusInfo.status}
              label={statusInfo.label}
              size="small"
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        {/* Route Locations */}
        <View style={styles.routeBox}>
          <View style={styles.routeRow}>
            <View style={styles.dotPickup} />
            <Text numberOfLines={1} style={styles.addressText}>
              {item.pickup_address ||
                t('rider.pickupLocation', 'Pickup Location')}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.squareDest} />
            <Text numberOfLines={1} style={styles.addressText}>
              {item.drop_address ||
                t('rider.dropoffLocation', 'Drop Location')}
            </Text>
          </View>
        </View>

        {/* Meta badges: Distance, Payment, OTP */}
        <View style={styles.metaRow}>
          {item.distance_km ? (
            <View style={styles.metaPill}>
              <Icon name="navigation" size={11} color={COLORS.textLight} />
              <Text style={styles.metaPillText}>{item.distance_km} km</Text>
            </View>
          ) : null}

          {item.payment_method ? (
            <View style={styles.metaPill}>
              <Icon name="cash" size={11} color={COLORS.textLight} />
              <Text style={styles.metaPillText}>
                {formatPaymentMethod(item.payment_method, t)}
                {item.payment_status
                  ? ` • ${formatPaymentStatus(item.payment_status, t)}`
                  : ''}
              </Text>
            </View>
          ) : null}

          {item.otp && !isCancelled && item.status !== 'COMPLETED' ? (
            <View style={[styles.metaPill, styles.otpPill]}>
              <Text style={styles.otpPillText}>
                {t('rider.otpLabel', 'OTP: {{otp}}', { otp: item.otp })}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Cancellation Reason if cancelled */}
        {isCancelled && item.cancel_reason ? (
          <View style={styles.cancelBox}>
            <Icon name="alert-circle" size={12} color={COLORS.danger} />
            <Text numberOfLines={1} style={styles.cancelText}>
              {item.cancel_reason}
            </Text>
          </View>
        ) : null}

        {/* Card Footer: Tap for details hint */}
        <View style={styles.cardFooter}>
          <Text style={styles.tapDetailsHint}>
            {t('driver.tapForDetails', 'Tap to view trip breakdown')}
          </Text>
          <Icon name="chevron-right" size={14} color={COLORS.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  // Render footer spinner when loading more trips
  const renderFooter = () => {
    if (!isLoadingMoreDriverRides) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerLoaderText}>
          {t('driver.loadingMoreTrips', 'Loading more trips...')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveContainer maxWidth={880} style={{ flex: 1 }}>
        <Header
          title={t('driver.tripHistory', 'Trip History')}
          showBack={false}
          variant="light"
          showLanguage={true}
        />

        {/* Guest Mode Notice Banner */}
        {isGuest && !isGuestCheckPending && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => promptGuestLogin()}
            style={styles.guestNoticeCard}
          >
            <View style={styles.guestNoticeIconBox}>
              <Icon name="user" size={16} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestNoticeTitle}>
                {t('auth.guestMode', 'GUEST MODE')}
              </Text>
              <Text style={styles.guestNoticeSub}>
                {t(
                  'auth.guestTripsNotice',
                  'Guest Mode: Log in to view your real trip history and completed rides.'
                )}
              </Text>
            </View>
            <Icon name="arrow-right" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            onPress={() => {
              if (isGuest) {
                promptGuestLogin();
                return;
              }
              setFilter('all');
            }}
            style={[styles.filterBtn, filter === 'all' && styles.activeFilterBtn]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.activeFilterText,
              ]}
            >
              {t('rider.allTrips', 'All Trips')}
              {!isGuest && driverRidesCount > 0 ? ` (${driverRidesCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isGuest) {
                promptGuestLogin();
                return;
              }
              setFilter('today');
            }}
            style={[
              styles.filterBtn,
              filter === 'today' && styles.activeFilterBtn,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'today' && styles.activeFilterText,
              ]}
            >
              {t('driver.today', 'Today')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isGuest) {
                promptGuestLogin();
                return;
              }
              setFilter('completed');
            }}
            style={[
              styles.filterBtn,
              filter === 'completed' && styles.activeFilterBtn,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'completed' && styles.activeFilterText,
              ]}
            >
              {t('rider.completed', 'Completed')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {!isGuest && driverRidesError && visibleTrips.length === 0 ? (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{String(driverRidesError)}</Text>
            <TouchableOpacity
              onPress={() => {
                if (isGuest) {
                  promptGuestLogin();
                  return;
                }
                dispatch(fetchDriverRides({ page: 1, page_size: 10 }));
              }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryBtnText}>
                {t('common.retry', 'Retry')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Content List */}
        {isGuestCheckPending ||
        (isDriverRidesLoading && visibleTrips.length === 0 && !isGuest) ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {isGuestCheckPending
                ? t('common.loading', 'Loading...')
                : t('driver.loadingYourTrips', 'Loading your trips...')}
            </Text>
          </View>
        ) : filteredTrips.length > 0 ? (
          <FlatList
            key={isFoldableOrTablet ? 'grid-2' : 'list-1'}
            data={filteredTrips}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderTripItem}
            numColumns={isFoldableOrTablet ? 2 : 1}
            columnWrapperStyle={
              isFoldableOrTablet ? { gap: SPACING.md } : undefined
            }
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: Math.max(
                  insets.bottom + SPACING.lg,
                  SPACING.xxxl
                ),
              },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
          />
        ) : (
          <EmptyState
            icon={isGuest ? 'lock' : 'clock'}
            title={
              isGuest
                ? t('auth.loginRequired', 'Login Required')
                : t('driver.noTripsFoundTitle', 'No Trips Found')
            }
            description={
              isGuest
                ? t(
                    'auth.loginRequiredTripsMsg',
                    'Please log in first to view and manage your trips.'
                  )
                : filter === 'today'
                ? t(
                    'driver.noTripsTodayDesc',
                    "You haven't completed any trips today. Go online to start receiving ride requests!"
                  )
                : t(
                    'driver.noTripsMatchDesc',
                    'No trips match this filter. When you complete trips, they will appear here.'
                  )
            }
            buttonTitle={
              isGuest
                ? t('auth.login', 'Log In')
                : t('driver.goToDashboard', 'Go to Dashboard')
            }
            onButtonPress={() => {
              if (isGuest) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
                return;
              }
              navigation.navigate('DriverHome');
            }}
            style={styles.emptyContainer}
          />
        )}

        {/* Detailed Trip Modal */}
        <Modal
          visible={Boolean(selectedTrip) && !isGuest}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTrip(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedTrip(null)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {t('driver.tripDetailsTitle', 'Trip #{{id}} Details', {
                      id: selectedTrip?.id,
                    })}
                  </Text>
                  <Text style={styles.modalDate}>
                    {formatTripDate(
                      selectedTrip?.created_at,
                      t,
                      currentLanguage
                    )}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedTrip(null)}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
              >
                {/* Earnings Highlight Box */}
                <View style={styles.modalHighlightBox}>
                  <View>
                    <Text style={styles.modalEarningsLabel}>
                      {t('driver.yourEarnings', 'Your Earnings')}
                    </Text>
                    <Text style={styles.modalEarningsValue}>
                      +
                      {formatCurrency(
                        selectedTrip?.driver_payout ||
                          selectedTrip?.final_fare ||
                          '0'
                      )}
                    </Text>
                    <Text style={styles.modalCustomerFareLabel}>
                      {t('driver.customerFareLabel', 'Customer Fare: {{fare}}', {
                        fare: formatCurrency(
                          selectedTrip?.final_fare ||
                            selectedTrip?.estimated_fare ||
                            '0'
                        ),
                      })}
                    </Text>
                  </View>
                  <StatusBadge
                    status={getStatusInfo(selectedTrip?.status, t).status}
                    label={getStatusInfo(selectedTrip?.status, t).label}
                    size="medium"
                  />
                </View>

                {/* Locations Box */}
                <View style={styles.modalRouteBlock}>
                  <View style={styles.routeRow}>
                    <View style={styles.dotPickup} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLocLabel}>
                        {t('driver.pickupAddress', 'Pickup Address')}
                      </Text>
                      <Text style={styles.modalLocText}>
                        {selectedTrip?.pickup_address || '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalRouteConnector} />

                  <View style={styles.routeRow}>
                    <View style={styles.squareDest} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLocLabel}>
                        {t('driver.destinationAddress', 'Destination Address')}
                      </Text>
                      <Text style={styles.modalLocText}>
                        {selectedTrip?.drop_address || '—'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Trip Info Grid */}
                <View style={styles.modalGrid}>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalGridLabel}>
                      {t('rider.vehicle', 'Vehicle')}
                    </Text>
                    <Text style={styles.modalGridValue}>
                      {getVehicleTypeInfo(selectedTrip?.vehicle_type, t).label}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalGridLabel}>
                      {t('rider.distance', 'Distance')}
                    </Text>
                    <Text style={styles.modalGridValue}>
                      {selectedTrip?.distance_km
                        ? `${selectedTrip.distance_km} km`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalGridLabel}>
                      {t('rider.paymentMethod', 'Payment Method')}
                    </Text>
                    <Text style={styles.modalGridValue}>
                      {formatPaymentMethod(selectedTrip?.payment_method, t)}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalGridLabel}>
                      {t('rider.paymentStatus', 'Payment Status')}
                    </Text>
                    <Text style={styles.modalGridValue}>
                      {formatPaymentStatus(selectedTrip?.payment_status, t)}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalGridLabel}>
                      {t('driver.driverId', 'Driver ID')}
                    </Text>
                    <Text style={styles.modalGridValue}>
                      #{selectedTrip?.driver || '—'}
                    </Text>
                  </View>
                  <View style={styles.modalGridCol}>
                    <Text style={styles.modalGridLabel}>
                      {t('rider.otpCode', 'OTP Code')}
                    </Text>
                    <Text
                      style={[
                        styles.modalGridValue,
                        { color: COLORS.secondPrimary, fontWeight: '700' },
                      ]}
                    >
                      {selectedTrip?.otp || '—'}
                    </Text>
                  </View>
                </View>

                {/* Cancellation Details */}
                {selectedTrip?.status === 'CANCELLED' ? (
                  <View style={styles.modalCancelBox}>
                    <Text style={styles.modalCancelTitle}>
                      {t('rider.cancellationInfo', 'Cancellation Details')}
                    </Text>
                    <Text style={styles.modalCancelText}>
                      {t('rider.cancelledBy', 'Cancelled By: {{by}}', {
                        by: formatCancelledBy(selectedTrip?.cancelled_by, t),
                      })}
                    </Text>
                    {selectedTrip?.cancel_reason ? (
                      <Text style={styles.modalCancelText}>
                        {t('rider.cancelReason', 'Reason: {{reason}}', {
                          reason: selectedTrip?.cancel_reason,
                        })}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Dismiss Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedTrip(null)}
                  style={styles.modalDismissBtn}
                >
                  <Text style={styles.modalDismissBtnText}>
                    {t('common.close', 'Close')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  guestNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#E6FAF7',
    borderWidth: 1,
    borderColor: '#B2F0E6',
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  guestNoticeIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestNoticeTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '800',
    color: '#0e7061',
    letterSpacing: 0.5,
  },
  guestNoticeSub: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.text,
    marginTop: 2,
    lineHeight: 16,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
  },
  activeFilterBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeFilterText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  retryBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700',
  },
  tripCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  topLeftCol: {
    flex: 1,
  },
  tripIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  vehicleIconBadge: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripIdText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  vehicleTypeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  earningsCol: {
    alignItems: 'flex-end',
  },
  payoutText: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cancelledPayoutText: {
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  fareSubText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
    marginTop: 1,
  },
  routeBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotPickup: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  squareDest: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.sm,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  addressText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
  },
  metaPillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
  },
  otpPill: {
    backgroundColor: COLORS.secondPrimaryLight,
  },
  otpPillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondPrimaryDark,
    fontWeight: '700',
    fontSize: responsiveFont(11),
  },
  cancelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  cancelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontSize: responsiveFont(11),
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBg,
  },
  tapDetailsHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  footerLoaderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  emptyContainer: {
    flex: 1,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.lg,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.text,
  },
  modalDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    gap: SPACING.md,
  },
  modalHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
  },
  modalEarningsLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  modalEarningsValue: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginTop: 2,
  },
  modalCustomerFareLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
    marginTop: 2,
  },
  modalRouteBlock: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
  },
  modalRouteConnector: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 4,
  },
  modalLocLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
  },
  modalLocText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 1,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modalGridCol: {
    width: '48%',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.small,
  },
  modalGridLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
  },
  modalGridValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCancelBox: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: 4,
  },
  modalCancelTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger,
  },
  modalCancelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
  },
  modalDismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.round,
    marginTop: SPACING.sm,
  },
  modalDismissBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
  },
});

export default DriverTripsScreen;
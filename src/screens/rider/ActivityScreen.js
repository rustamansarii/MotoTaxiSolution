import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
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
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { isGuestMode, getAccessToken } from '../../utils/storage';
import { fetchMyRides } from '../../redux/features/rides/ridesSlice';

/**
 * Format ISO datetime string to user-friendly label
 */
const formatRideDate = (dateString, t, language = 'en') => {
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
    const timeStr = date.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `${t ? t('common.today', 'Today') : 'Today'}, ${timeStr}`;
    if (isYesterday) return `${t ? t('common.yesterday', 'Yesterday') : 'Yesterday'}, ${timeStr}`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString(currentLocale, { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}, ${timeStr}`;
  } catch {
    return dateString;
  }
};

/**
 * Map vehicle_type code to display name and icon
 */
const getRideTypeInfo = (vehicleType, t) => {
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
 * Map status to StatusBadge config
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
        label: t ? t('rider.statusDriverArrived', 'Driver Arrived') : 'Driver Arrived',
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
  if (m === 'ONLINE' || m === 'CARD' || m === 'UPI') return t ? t('rider.payOnline', 'Online') : 'Online';
  if (m === 'WALLET') return t ? t('rider.payWallet', 'Wallet') : 'Wallet';
  return method || 'Cash';
};

/**
 * Format payment status for display
 */
const formatPaymentStatus = (status, t) => {
  const s = (status || '').toUpperCase();
  if (s === 'PAID' || s === 'COMPLETED') return t ? t('rider.statusCompleted', 'Paid') : 'Paid';
  if (s === 'PENDING') return t ? t('rider.statusPending', 'Pending') : 'Pending';
  if (s === 'FAILED') return t ? t('rider.statusCancelled', 'Failed') : 'Failed';
  return status || '';
};

export const ActivityScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language || 'en';
  const dispatch = useDispatch();
  const { isFoldableOrTablet, insets } = useResponsive();

  const [activeTab, setActiveTab] = useState('past'); // 'past' (All Trips) | 'upcoming' (Active/Scheduled)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Redux rides state
  const {
    myRides = [],
    myRidesCount = 0,
    myRidesNext = null,
    myRidesCurrentPage = 1,
    isLoadingMyRides = false,
    isLoadingMoreMyRides = false,
    myRidesError = null,
  } = useSelector((state) => state.rides);

  // Fetch initial rides whenever screen gains focus (only when authenticated)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const checkAuthAndFetch = async () => {
        try {
          const guest = await isGuestMode();
          const token = await getAccessToken();
          const unauthenticated = guest || !token;

          if (!isMounted) return;
          setIsGuest(unauthenticated);
          setIsAuthChecking(false);

          if (!unauthenticated) {
            dispatch(fetchMyRides({ page: 1, page_size: 10 }));
          }
        } catch (e) {
          if (isMounted) {
            setIsGuest(true);
            setIsAuthChecking(false);
          }
        }
      };

      checkAuthAndFetch();

      return () => {
        isMounted = false;
      };
    }, [dispatch])
  );

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (isGuest) return;
    setIsRefreshing(true);
    await dispatch(fetchMyRides({ page: 1, page_size: 10 }));
    setIsRefreshing(false);
  }, [dispatch, isGuest]);

  // Infinite scroll: load next page
  const handleLoadMore = () => {
    if (isGuest) return;
    if (!isLoadingMyRides && !isLoadingMoreMyRides && myRidesNext) {
      dispatch(fetchMyRides({ page: myRidesCurrentPage + 1, page_size: 10 }));
    }
  };

  // Filter rides based on active tab
  const displayedRides = React.useMemo(() => {
    if (activeTab === 'upcoming') {
      return myRides.filter((r) => {
        const s = (r.status || '').toUpperCase();
        return s === 'PENDING' || s === 'ACCEPTED' || s === 'ARRIVED' || s === 'IN_PROGRESS';
      });
    }
    return myRides;
  }, [myRides, activeTab]);

  // Render ride card item
  const renderRideItem = ({ item }) => {
    const typeInfo = getRideTypeInfo(item.vehicle_type, t);
    const statusInfo = getStatusInfo(item.status, t);
    const fare = item.final_fare || item.estimated_fare || '0';
    const isCancelled = (item.status || '').toUpperCase() === 'CANCELLED';

    return (
      <View style={[styles.historyCard, isFoldableOrTablet && { flex: 1 }]}>
        {/* Header Row */}
        <View style={styles.cardTopRow}>
          <View style={styles.topLeftCol}>
            <View style={styles.rideIdRow}>
              <View style={styles.vehicleIconBadge}>
                <Icon name={typeInfo.icon} size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.rideIdText}>
                {t('rider.rideNumber', 'Ride #{{id}}', { id: item.id })}
              </Text>
            </View>
            <Text style={styles.rideDate}>
              {formatRideDate(item.created_at, t, currentLanguage)}
            </Text>
            <Text style={styles.rideType}>{typeInfo.label}</Text>
          </View>

          <View style={styles.topRightCol}>
            <Text style={[styles.ridePrice, isCancelled && styles.cancelledPrice]}>
              {formatCurrency(fare)}
            </Text>
            <StatusBadge
              status={statusInfo.status}
              label={statusInfo.label}
              size="small"
            />
          </View>
        </View>

        {/* Locations Block */}
        <View style={styles.locationsBlock}>
          <View style={styles.locationRow}>
            <View style={styles.dotPickup} />
            <Text numberOfLines={1} style={styles.locationText}>
              {item.pickup_address || t('rider.pickupLocation', 'Pickup Location')}
            </Text>
          </View>
          <View style={styles.connector} />
          <View style={styles.locationRow}>
            <View style={styles.squareDest} />
            <Text numberOfLines={1} style={styles.locationText}>
              {item.drop_address || t('rider.dropoffLocation', 'Drop Location')}
            </Text>
          </View>
        </View>

        {/* Meta badges: Distance, Payment, OTP */}
        <View style={styles.metaRow}>
          {item.distance_km ? (
            <View style={styles.metaPill}>
              <Icon name="navigation" size={11} color={COLORS.textLight} />
              <Text style={styles.metaText}>{item.distance_km} km</Text>
            </View>
          ) : null}

          {item.payment_method ? (
            <View style={styles.metaPill}>
              <Icon name="cash" size={11} color={COLORS.textLight} />
              <Text style={styles.metaText}>
                {formatPaymentMethod(item.payment_method, t)}
                {item.payment_status ? ` • ${formatPaymentStatus(item.payment_status, t)}` : ''}
              </Text>
            </View>
          ) : null}

          {item.otp && !isCancelled && item.status !== 'COMPLETED' ? (
            <View style={[styles.metaPill, styles.otpPill]}>
              <Text style={styles.otpText}>
                {t('rider.otpLabel', 'OTP: {{otp}}', { otp: item.otp })}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Cancellation Notice */}
        {isCancelled && item.cancel_reason ? (
          <View style={styles.cancelNoticeRow}>
            <Icon name="alert-circle" size={12} color={COLORS.danger} />
            <Text numberOfLines={1} style={styles.cancelReasonText}>
              {item.cancel_reason}
            </Text>
          </View>
        ) : null}

        {/* Footer Row */}
        <View style={styles.cardFooter}>
          <View style={styles.driverCol}>
            <Text style={styles.driverLabel}>
              {item.driver
                ? t('rider.driverAssignedWithId', 'Driver: #{{id}}', { id: item.driver })
                : t('rider.noDriverAssigned', 'No driver assigned')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render footer spinner for load more
  const renderFooter = () => {
    if (!isLoadingMoreMyRides) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerLoaderText}>
          {t('rider.loadingMoreRides', 'Loading more rides...')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={880} style={{ flex: 1 }}>
        <Header
          title={t('rider.activity', 'Activity')}
          showBack={false}
        />

        {/* Tabs - only show when user is logged in */}
        {!isGuest && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab('past')}
              style={[styles.tabItem, activeTab === 'past' && styles.activeTabItem]}
            >
              <Text
                style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}
              >
                {t('rider.allTrips', 'All Trips')}
                {myRidesCount > 0 ? ` (${myRidesCount})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('upcoming')}
              style={[
                styles.tabItem,
                activeTab === 'upcoming' && styles.activeTabItem,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'upcoming' && styles.activeTabText,
                ]}
              >
                {t('rider.upcomingTrips', 'Upcoming')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Banner - only show when authenticated and error occurs */}
        {!isGuest && myRidesError && myRides.length === 0 ? (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{String(myRidesError)}</Text>
            <TouchableOpacity
              onPress={() => dispatch(fetchMyRides({ page: 1, page_size: 10 }))}
              style={styles.retryBtn}
            >
              <Text style={styles.retryBtnText}>{t('common.retry', 'Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Content */}
        {isAuthChecking ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
          </View>
        ) : isGuest ? (
          <ScrollView
            contentContainerStyle={[
              styles.guestScrollContent,
              { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.guestCard}>
              {/* Icon Circle */}
              <View style={styles.guestIconCircle}>
                <Icon name="lock" size={32} color={COLORS.primary} />
              </View>

              {/* Guest Pill */}
              <View style={styles.guestPill}>
                <Text style={styles.guestPillText}>
                  {t('auth.guestMode', 'GUEST MODE')}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.guestTitle}>
                {t('rider.loginRequiredTitle', 'Login First to See Your Rides')}
              </Text>

              {/* Description */}
              <Text style={styles.guestDesc}>
                {t(
                  'rider.loginRequiredDesc',
                  'Please log in first to view your ride activity, receipts, track ongoing trips, and book rides seamlessly.'
                )}
              </Text>

              {/* Feature Highlights */}
              <View style={styles.guestFeaturesList}>
                <View style={styles.guestFeatureItem}>
                  <View style={styles.guestFeatureIconBox}>
                    <Icon name="time" size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.guestFeatureTextBox}>
                    <Text style={styles.guestFeatureItemTitle}>
                      {t('rider.tripHistory', 'Trip History & Receipts')}
                    </Text>
                    <Text style={styles.guestFeatureItemDesc}>
                      {t(
                        'rider.tripHistoryDesc',
                        'View complete route details, fare receipts, and dates.'
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.guestFeatureItem}>
                  <View style={styles.guestFeatureIconBox}>
                    <Icon name="navigation" size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.guestFeatureTextBox}>
                    <Text style={styles.guestFeatureItemTitle}>
                      {t('rider.activeRides', 'Active & Upcoming Rides')}
                    </Text>
                    <Text style={styles.guestFeatureItemDesc}>
                      {t(
                        'rider.activeRidesDesc',
                        'Track driver arrival in real-time with OTP verification.'
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.guestFeatureItem}>
                  <View style={styles.guestFeatureIconBox}>
                    <Icon name="refresh" size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.guestFeatureTextBox}>
                    <Text style={styles.guestFeatureItemTitle}>
                      {t('rider.oneTapRebook', '1-Tap Easy Rebooking')}
                    </Text>
                    <Text style={styles.guestFeatureItemDesc}>
                      {t(
                        'rider.oneTapRebookDesc',
                        'Quickly rebook frequent destinations and saved places.'
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.guestButtonsCol}>
                <CustomButton
                  title={t('auth.login', 'Log In / Sign In')}
                  onPress={() => navigation.navigate('Login')}
                  variant="primary"
                  size="large"
                  icon="log-in"
                  style={styles.guestPrimaryBtn}
                />

                <CustomButton
                  title={t('rider.bookRideNow', 'Book a Ride Now')}
                  onPress={() => navigation.navigate('RiderHome')}
                  variant="outline"
                  size="large"
                  icon="bike"
                  style={styles.guestSecondaryBtn}
                />
              </View>
            </View>
          </ScrollView>
        ) : isLoadingMyRides && myRides.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {t('rider.loadingYourRides', 'Loading your rides...')}
            </Text>
          </View>
        ) : displayedRides.length > 0 ? (
          <FlatList
            key={isFoldableOrTablet ? 'grid-2' : 'list-1'}
            data={displayedRides}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderRideItem}
            numColumns={isFoldableOrTablet ? 2 : 1}
            columnWrapperStyle={isFoldableOrTablet ? { gap: SPACING.md } : undefined}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
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
            icon={activeTab === 'upcoming' ? 'clock' : 'navigation'}
            title={
              activeTab === 'upcoming'
                ? t('rider.noScheduledRidesTitle', 'No Scheduled Rides')
                : t('rider.noTripsYet', 'No trips yet')
            }
            description={
              activeTab === 'upcoming'
                ? t(
                    'rider.noScheduledRidesDesc',
                    "You don't have any ongoing or scheduled rides right now. Book a ride on demand anytime."
                  )
                : t(
                    'rider.noTripsYetDesc',
                    "You haven't taken any rides yet. Book your first ride and get moving!"
                  )
            }
            buttonTitle={t('rider.bookRideNow', 'Book a Ride Now')}
            onButtonPress={() => navigation.navigate('RiderHome')}
            style={styles.emptyContainer}
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.text,
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
  historyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  topLeftCol: {
    flex: 1,
  },
  rideIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  vehicleIconBadge: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideIdText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  rideDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  rideType: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  topRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ridePrice: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  cancelledPrice: {
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  locationsBlock: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  locationRow: {
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
  connector: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  locationText: {
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
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
  },
  otpPill: {
    backgroundColor: COLORS.secondPrimaryLight,
  },
  otpText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondPrimaryDark,
    fontWeight: '700',
    fontSize: responsiveFont(11),
  },
  cancelNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  cancelReasonText: {
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
  },
  driverCol: {
    flex: 1,
  },
  driverLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  emptyContainer: {
    flex: 1,
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
  guestScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  guestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  guestIconCircle: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  guestPill: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guestPillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.5,
    fontSize: responsiveFont(10),
  },
  guestTitle: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  guestDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  guestFeaturesList: {
    width: '100%',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guestFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  guestFeatureIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  guestFeatureTextBox: {
    flex: 1,
  },
  guestFeatureItemTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  guestFeatureItemDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
    marginTop: 1,
  },
  guestButtonsCol: {
    width: '100%',
    gap: SPACING.sm,
  },
  guestPrimaryBtn: {
    width: '100%',
  },
  guestSecondaryBtn: {
    width: '100%',
  },
});

export default ActivityScreen;
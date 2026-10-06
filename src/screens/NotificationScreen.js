import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/ThemeContext";
import CustomFooter from "../components/CustomFooter";
import {
  responsiveHeight,
  responsiveFont,
  moderateScale,
} from "../utils/responsive";
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationApi";

// Helper to format ISO timestamp into readable relative date
const formatNotificationDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
};

export default function NotificationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    themeColor = "#000",
    bgColor = "#fff",
    textColor = "#111",
    borderColor = "#eee",
    iconColor = "#111",
    subTextColor = "#666",
  } = useTheme ? useTheme() : {};

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 1. Fetch notifications from API
  const loadNotifications = async (pageNumber = 1, isRefresh = false) => {
    try {
      const res = await listNotifications(pageNumber);
      if (res.success) {
        if (isRefresh || pageNumber === 1) {
          setNotifications(res.items);
        } else {
          setNotifications((prev) => [...prev, ...res.items]);
        }
        setHasMore(res.hasMore);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadNotifications(1);
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(1, true);
  }, []);

  // Load more on scroll end
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadNotifications(page + 1);
    }
  };

  // 2. Mark single notification as read & navigate
  const handleNotificationPress = async (item) => {
    // Optimistic UI update
    if (!item.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      markNotificationAsRead(item.id);
    }

    if (item.property_id) {
      navigation.navigate("PropertyDetails", {
        propertyId: item.property_id,
      });
    } else if (item.conversation_id) {
      navigation.navigate("ChatScreen", {
        conversationId: item.conversation_id,
        actor: item.actor,
      });
    }
  };

  // 3. Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead();
  };

  // Render individual notification row
  const renderItem = ({ item }) => {
    const isProperty = item.type === "property";
    const isMessage = item.type === "message";
    const isUnread = !item.is_read;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.notificationRow,
          { borderBottomColor: borderColor },
          isUnread && { backgroundColor: themeColor + "0D" },
        ]}
      >
        {/* Actor Avatar or Type Icon */}
        <View style={[styles.iconCircle, { backgroundColor: themeColor }]}>
          {item.actor?.profile_image_url ? (
            <Image
              source={{ uri: item.actor.profile_image_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons
              name={
                isProperty
                  ? "heart"
                  : isMessage
                  ? "chatbubble-ellipses"
                  : "notifications"
              }
              size={moderateScale(20)}
              color="#fff"
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.messageText,
              { color: textColor },
              isUnread && styles.unreadText,
            ]}
          >
            {item.message}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.dateText, { color: subTextColor }]}>
              {formatNotificationDate(item.created_at)}
            </Text>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: themeColor }]} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back"
            size={moderateScale(22)}
            color={iconColor}
          />
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t('notifications.title')}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Mark All Read Button */}
          {notifications.some((n) => !n.is_read) ? (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
              <Text style={[styles.markAllText, { color: themeColor }]}>
                {t('notifications.markAllRead')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Feather name="search" size={moderateScale(18)} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColor} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColor}
              colors={[themeColor]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={themeColor}
                style={styles.footerLoader}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={moderateScale(48)}
                color={subTextColor}
              />
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                {t('notifications.noNotifications')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
                When you get likes on properties or messages, they will appear here.
              </Text>
            </View>
          }
        />
      )}

      {CustomFooter ? <CustomFooter role="default" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(15),
    paddingVertical: responsiveHeight(15),
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: responsiveFont(20),
    fontWeight: "bold",
    marginLeft: moderateScale(5),
  },
  markAllBtn: {
    paddingVertical: responsiveHeight(4),
    paddingHorizontal: moderateScale(8),
  },
  markAllText: {
    fontSize: responsiveFont(13),
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: moderateScale(15),
    paddingTop: responsiveHeight(10),
    paddingBottom: responsiveHeight(120),
    flexGrow: 1,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(14),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(8),
    borderBottomWidth: 0.5,
  },
  iconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(15),
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  messageText: {
    fontSize: responsiveFont(14),
    fontWeight: "400",
    lineHeight: responsiveFont(19),
  },
  unreadText: {
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: responsiveHeight(4),
  },
  dateText: {
    fontSize: responsiveFont(11),
  },
  unreadDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginLeft: moderateScale(8),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: responsiveHeight(100),
    paddingHorizontal: moderateScale(24),
  },
  emptyTitle: {
    fontSize: responsiveFont(16),
    fontWeight: "600",
    marginTop: responsiveHeight(12),
  },
  emptySubtitle: {
    fontSize: responsiveFont(13),
    textAlign: "center",
    marginTop: responsiveHeight(6),
    lineHeight: responsiveFont(18),
  },
  footerLoader: {
    paddingVertical: responsiveHeight(16),
  },
});

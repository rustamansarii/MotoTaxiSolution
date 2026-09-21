import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import RatingStars from '../../components/RatingStars';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import ProfileAvatar from '../../components/ProfileAvatar';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive } from '../../utils/responsive';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';

const COMPLIMENTS = [
  'Smooth driving',
  'Spotless clean car',
  'Great conversation',
  'Polite & helpful',
  'Perfect route',
  'Safe driver',
];

const TIP_OPTIONS = [0, 1, 3, 5];

export const RatingScreen = ({ navigation, route }) => {
  const { insets } = useResponsive();
  const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;

  const [rating, setRating] = useState(5);
  const [selectedTip, setSelectedTip] = useState(3);
  const [selectedCompliments, setSelectedCompliments] = useState(['Smooth driving', 'Spotless clean car']);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleCompliment = (comp) => {
    if (selectedCompliments.includes(comp)) {
      setSelectedCompliments(selectedCompliments.filter((c) => c !== comp));
    } else {
      setSelectedCompliments([...selectedCompliments, comp]);
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('RiderHome');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={540} style={{ flex: 1 }}>
        <Header
          title="Rate Your Trip"
          showBack={false}
          rightIcon="close"
          onRightPress={() => navigation.navigate('RiderHome')}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
        {/* Driver Profile */}
        <View style={styles.driverSection}>
          <ProfileAvatar name={driver.name} size={72} />
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.carInfo}>
            {driver.car?.model} • {driver.car?.plateNumber}
          </Text>
        </View>

        {/* Star Rating Section */}
        <View style={styles.starsCard}>
          <Text style={styles.rateQuestion}>How was your ride?</Text>
          <RatingStars
            rating={rating}
            size={36}
            interactive={true}
            onRatingChange={setRating}
            style={styles.starsRow}
          />
          <Text style={styles.ratingDescriptor}>
            {rating === 5
              ? 'Excellent experience!'
              : rating >= 4
              ? 'Very good ride'
              : rating >= 3
              ? 'Average trip'
              : 'Could be better'}
          </Text>
        </View>

        {/* Tip Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Add a Tip for {driver.name}</Text>
          <Text style={styles.sectionSubtitle}>
            100% of your tip goes directly to your driver.
          </Text>

          <View style={styles.tipRow}>
            {TIP_OPTIONS.map((tip) => (
              <TouchableOpacity
                key={tip}
                activeOpacity={0.7}
                onPress={() => setSelectedTip(tip)}
                style={[
                  styles.tipPill,
                  selectedTip === tip && styles.activeTipPill,
                ]}
              >
                <Text
                  style={[
                    styles.tipText,
                    selectedTip === tip && styles.activeTipText,
                  ]}
                >
                  {tip === 0 ? 'No tip' : `$${tip}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Compliment Tags */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Give Compliments</Text>
          <View style={styles.complimentsGrid}>
            {COMPLIMENTS.map((comp) => {
              const isSelected = selectedCompliments.includes(comp);
              return (
                <TouchableOpacity
                  key={comp}
                  activeOpacity={0.7}
                  onPress={() => toggleCompliment(comp)}
                  style={[
                    styles.complimentPill,
                    isSelected && styles.activeComplimentPill,
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon
                      name={isSelected ? 'check' : 'plus'}
                      size={12}
                      color={isSelected ? COLORS.primary : COLORS.textLight}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.complimentText,
                        isSelected && styles.activeComplimentText,
                      ]}
                    >
                      {comp}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Feedback Input */}
        <CustomInput
          label="Additional Comments (Optional)"
          value={comment}
          onChangeText={setComment}
          placeholder="Leave feedback for driver or support"
          multiline={true}
          containerStyle={styles.commentInput}
        />

        {/* Submit Button */}
        <CustomButton
          title="Submit Rating & Tip"
          onPress={handleSubmit}
          loading={loading}
          variant="primary"
          style={styles.submitBtn}
        />
      </ScrollView>
    </ResponsiveContainer>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  driverSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  driverName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  carInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  starsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  rateQuestion: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  starsRow: {
    marginVertical: SPACING.md,
  },
  ratingDescriptor: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.secondPrimary,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  tipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tipPill: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTipPill: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tipText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeTipText: {
    color: COLORS.backgroundglass,
  },
  complimentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  complimentPill: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeComplimentPill: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  complimentText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeComplimentText: {
    color: COLORS.backgroundglass,
  },
  commentInput: {
    marginTop: SPACING.xs,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});

export default RatingScreen;

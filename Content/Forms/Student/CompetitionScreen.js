import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const CompetitionScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = [
    useRef(new Animated.Value(20)).current,
    useRef(new Animated.Value(20)).current,
  ];
  const [pressScale] = useState([new Animated.Value(1), new Animated.Value(1)]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.stagger(150, [
        Animated.timing(slideAnims[0], {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[1], {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const onPressIn = idx => {
    Animated.spring(pressScale[idx], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = idx => {
    Animated.spring(pressScale[idx], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPress = screenName => {
    navigation.navigate(screenName);
  };

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
      <Text style={styles.header}>🏆 Competitions</Text>
      <View style={styles.cardRow}>
        {['EnrolledCompetitions', 'UnenrolledCompetitions'].map((screen, i) => (
          <TouchableWithoutFeedback
            key={i}
            onPressIn={() => onPressIn(i)}
            onPressOut={() => onPressOut(i)}
            onPress={() => handleCardPress(screen)}>
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [
                    {translateY: slideAnims[i]},
                    {scale: pressScale[i]},
                  ],
                },
              ]}>
              <Text style={styles.cardTitle}>
                {i === 0 ? 'Enrolled' : 'Upcoming'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {i === 0
                  ? 'Your registered competitions'
                  : 'Competitions you can join'}
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        ))}
      </View>
    </Animated.View>
  );
};

export default CompetitionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    alignSelf: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
    textAlign: 'center',
  },
});

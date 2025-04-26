import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../Settings/Config';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const UnenrolledCompetitionsScreen = () => {
  const navigation = useNavigation();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
    ]).start();

    const fetchUserId = async () => {
      const user = await AsyncStorage.getItem('userId');
      setUserId(user);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCompetitions();
    }
  }, [userId]);

  const fetchCompetitions = () => {
    setLoading(true);
    fetch(
      `${Config.BASE_URL}/api/Competition/GetUnregisterdCompetition/${userId}`,
    )
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch competitions');
        return response.json();
      })
      .then(data => {
        setCompetitions(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError('Failed to load competitions');
        setLoading(false);
      });
  };

  const renderItem = ({item, index}) => {
    const cardScale = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}, {scale: cardScale}],
          },
        ]}>
        <View style={styles.cardHeader}>
          <Icon name="emoji-events" size={24} color="#FFD700" />
          <Text style={styles.title}>{item.title}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="calendar-today" size={16} color="#FFD700" />
          <Text style={styles.detail}>Year: {item.year}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="bar-chart" size={16} color="#FFD700" />
          <Text style={styles.detail}>
            Level: {item.minLevel} - {item.maxLevel}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() =>
            navigation.navigate('RegisterTeam', {
              competitionId: item.competitionId,
            })
          }
          activeOpacity={0.7}>
          <Text style={styles.buttonText}>
            <Icon name="how-to-reg" size={16} /> Enroll Now
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.headerContainer,
          {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
        ]}>
        <Icon name="list-alt" size={28} color="#FFD700" />
        <Text style={styles.header}> 🏆Available Competitions</Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : error ? (
        <Text style={styles.error}>
          <Icon name="error" size={16} /> {error}
        </Text>
      ) : competitions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="info" size={40} color="#FFD700" />
          <Text style={styles.emptyText}>No available competitions found</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchCompetitions}>
            <Text style={styles.refreshText}>
              <Icon name="refresh" size={16} /> Refresh
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={competitions}
          keyExtractor={item => item.competitionId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD70033',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  detail: {
    fontSize: 14,
    color: '#FFD700AA',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#FF5555',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFD700',
    fontSize: 18,
    marginTop: 15,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFD70022',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD70055',
  },
  refreshText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default UnenrolledCompetitionsScreen;

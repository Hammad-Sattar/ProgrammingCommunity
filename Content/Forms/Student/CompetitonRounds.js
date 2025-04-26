import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Config from '../../Settings/Config';
import {useRoute, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RoundsScreen = () => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  const route = useRoute();
  const navigation = useNavigation();
  const {competitionId} = route.params;

  const typeMap = {
    1: {
      title: 'MCQ Round',
      description: 'Multiple-choice questions',
      icon: 'format-list-bulleted',
    },
    2: {
      title: 'Speed Round',
      description: 'Fast-paced question answering',
      icon: 'speedometer',
    },
    3: {
      title: 'Shuffle Code',
      description: 'Code arrangement challenge',
      icon: 'shuffle-variant',
    },
    4: {
      title: 'Buzzer Round',
      description: 'Quick-response buzzer challenge',
      icon: 'alarm-light',
    },
  };

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('competitionId', competitionId.toString());
        const res = await fetch(
          `${Config.BASE_URL}/api/CompetitionRound/GetAllRoundsByCompetitionId/${competitionId}`,
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRounds(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [competitionId]);

  const handleStartRound = (roundType, roundId) => {
    switch (roundType) {
      case 1:
        navigation.navigate('MCQScreen', {roundId});
        break;
      case 2:
        navigation.navigate('SpeedProgrammingScreen', {roundId});
        break;
      case 3:
        navigation.navigate('ShuffleScreen', {roundId});
        break;
      case 4:
        navigation.navigate('BuzzerScreen', {roundId});
        break;
      default:
        console.warn('Unknown round type');
    }
  };

  const renderItem = ({item}) => {
    const info = typeMap[item.roundType] || {
      title: `Round ${item.roundNumber}`,
      description: 'No description',
      icon: 'help-circle',
    };
    const isActive = item.date === today;

    return (
      <View style={[styles.card]}>
        <Text style={styles.roundNumber}>Round {item.roundNumber}</Text>
        <View style={styles.header}>
          <Icon
            name={info.icon}
            size={28}
            color={isActive ? '#FFD700' : '#888'}
          />
          <Text style={[styles.title]}>{info.title}</Text>
        </View>
        <Text style={[styles.description]}>{info.description}</Text>
        <Text style={[styles.date]}>📅 {item.date}</Text>
        {!isActive && (
          <Icon name="lock" size={20} color="#888" style={styles.lockIcon} />
        )}

        {true && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleStartRound(item.roundType, item.id)}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <FlatList
      data={rounds}
      keyExtractor={item => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
};

export default RoundsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
  },
  loading: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderLeftWidth: 5,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#181818',
    borderLeftColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  roundNumber: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  lockIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

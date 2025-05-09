import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../Settings/Config';
import {useNavigation} from '@react-navigation/native';

const StudentLeadearBoard = () => {
  const navigation = useNavigation();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [teamId, setTeamId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const user = await AsyncStorage.getItem('userId');
      setUserId(user);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCompetitions();
      fetchTeamId(userId);
    }
  }, [userId]);

  const fetchCompetitions = () => {
    fetch(
      `${Config.BASE_URL}/api/Competition/GetRegisteredCompetitions/${userId}`,
    )
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch competitions');
        return response.json();
      })
      .then(data => {
        setCompetitions(data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Error loading competitions');
        setLoading(false);
      });
  };

  const fetchTeamId = async userId => {
    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/Team/GetTeamIdByUserId/${userId}`,
      );
      if (!response.ok) throw new Error('Failed to fetch team ID');

      const data = await response.json();
      if (data && typeof data.teamId !== 'undefined' && data.teamId !== null) {
        const teamId = data.teamId;
        await AsyncStorage.setItem('teamId', teamId.toString());
      }
    } catch (err) {
      console.error('Error fetching/saving team ID:', err);
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.statusIndicator} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>📅 Year</Text>
          <Text style={styles.detailValue}>{item.year}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>🎚️ Level Range</Text>
          <Text style={styles.detailValue}>
            {item.minLevel} - {item.maxLevel}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('StudentLeaderboardRound', {
            competitionId: item.competitionId,
          })
        }>
        <Text style={styles.buttonText}>View Detailed Results</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Competition Leaderboard</Text>
        <View style={styles.headerUnderline} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="yellow" />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : competitions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No Enrolled Competitions</Text>
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

export default StudentLeadearBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 24,
    paddingVertical: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: 'yellow',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  headerUnderline: {
    height: 3,
    backgroundColor: 'yellow',
    width: '40%',
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(255, 255, 0, 0.2)',
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'yellow',
    marginLeft: 10,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    color: '#BBB',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: 'yellow',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'yellow',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 24,
  },
});

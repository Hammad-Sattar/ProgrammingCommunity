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

const EnrolledCompetitionsScreen = () => {
  const navigation = useNavigation();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [teamId, setTeamId] = useState(null); // State to hold teamId

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
      console.log('Team ID response:', data);

      if (data && typeof data.teamId !== 'undefined' && data.teamId !== null) {
        const teamId = data.teamId;

        await AsyncStorage.setItem('teamId', teamId.toString());
        console.log('teamId saved:', teamId);
      } else {
        console.log('Invalid teamId in response:', data);
      }
    } catch (err) {
      console.error('Error fetching/saving team ID:', err);
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.detail}>Year: {item.year}</Text>
      <Text style={styles.detail}>
        Level: {item.minLevel} - {item.maxLevel}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('RoundsScreen', {
            competitionId: item.competitionId,
          })
        }>
        <Text style={styles.buttonText}>See details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>✅ Enrolled Competitions</Text>

      {loading ? (
        <ActivityIndicator size="large" color="yellow" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : competitions.length === 0 ? (
        <Text style={styles.error}>No enrolled competitions found.</Text>
      ) : (
        <FlatList
          data={competitions}
          keyExtractor={item => item.competitionId.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default EnrolledCompetitionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'yellow',
    alignSelf: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  detail: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  error: {
    color: 'red',
    alignSelf: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  button: {
    backgroundColor: 'yellow', // updated
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'black', // updated
    fontWeight: 'bold',
    fontSize: 16,
  },
});

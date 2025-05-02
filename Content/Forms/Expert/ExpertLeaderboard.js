import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button, // Import Button component
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const EnrolledCompetitionsScreen = () => {
  const navigation = useNavigation();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const userId = parseInt(storedUserId, 10);
        if (!isNaN(userId)) {
          fetchCompetitions(userId);
        } else {
          setError('Invalid user ID');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching userId:', err);
        setError('Error reading user ID');
        setLoading(false);
      }
    };

    fetchUserId();
  }, []);

  const fetchCompetitions = userId => {
    fetch(`${Config.BASE_URL}/api/Competition/GetCompetitionsByExpert/${3}`)
      .then(async response => {
        if (!response.ok) {
          const errorText = await response.text();
          if (
            response.status === 404 &&
            errorText.includes('No competitions found for this expert')
          ) {
            setCompetitions([]);
            setError('No competitions found for this expert.');
          } else {
            throw new Error('Failed to fetch competitions');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setCompetitions(data);
        setError('');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Error loading competitions');
        setLoading(false);
      });
  };

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.detail}>Year: {item.year}</Text>
      <Text style={styles.detail}>
        Level: {item.minLevel} - {item.maxLevel}
      </Text>

      {/* Button to See Results */}
      <Button
        title="See Results"
        color="yellow"
        onPress={() => handleSeeResults(item.competitionId)}
      />
    </View>
  );

  const handleSeeResults = competitionId => {
    navigation.navigate('ExpertLeaderboardRound', {
      competitionId: competitionId,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>✅ Expert's Competitions</Text>

      {loading ? (
        <ActivityIndicator size="large" color="yellow" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
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
});

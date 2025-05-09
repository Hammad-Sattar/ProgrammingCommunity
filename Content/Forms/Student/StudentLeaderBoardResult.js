import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Config from '../../Settings/Config';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useRoute} from '@react-navigation/native';

const StudentLeaderboardResultScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const route = useRoute();
  const roundId = route.params?.roundId || 0;

  const getLeaderboardResults = async () => {
    try {
      setFetchError(null);
      setIsLoading(true);

      const response = await fetch(
        `${Config.BASE_URL}/api/RoundResult/GetRoundResults/${roundId}`,
      );

      if (response.status === 404) {
        const message = await response.text();
        setFetchError(message);
        setLeaderboardData([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load leaderboard data');
      }

      const data = await response.json();
      console.log('Leaderboard Data:', data); // Log the fetched data
      const sortedData = data.sort((a, b) => b.score - a.score);
      setLeaderboardData(sortedData);
    } catch (error) {
      setFetchError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLeaderboardResults();
  }, [roundId]);

  const renderTeamItem = ({item, index}) => {
    return (
      <View style={styles.row}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, index < 3 && styles.topRank]}>
            {index + 1}
          </Text>
        </View>
        <Text style={styles.name}>{item.teamName}</Text>
        <Text style={styles.score}>{item.score}</Text>
        <TouchableOpacity>
          <Text style={{fontSize: 18}}>{item.isQualified ? '✅' : '❌'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={styles.headerText}>Rank</Text>
      <Text style={styles.headerText}>Team</Text>
      <Text style={styles.headerText}>Score</Text>
      <Text style={styles.headerText}>Status</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <MaterialCommunityIcons name="trophy-award" size={32} color="#FFD700" />
        <Text style={styles.title}>Expert Leaderboard</Text>
      </View>

      {fetchError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : (
        <FlatList
          data={leaderboardData}
          ListHeaderComponent={renderHeader}
          keyExtractor={item => item.teamId.toString()}
          renderItem={renderTeamItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#00008b',
    borderRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
    color: '#FFD700',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 18,
    marginVertical: 6,
    backgroundColor: '#00008b',
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  topRank: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  name: {
    flex: 2,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    paddingLeft: 10,
  },
  score: {
    flex: 1,
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    marginBottom: 20,
  },
});

export default StudentLeaderboardResultScreen;

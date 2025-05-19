import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ViewSpeedProgrammingScreenQuestionsScreen = ({route}) => {
  const {roundId} = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState(null);

  const fetchAttemptedQuestions = async () => {
    try {
      const storedTeamId = await AsyncStorage.getItem('teamId');
      console.log('Stored Team ID:', storedTeamId);

      setTeamId(storedTeamId);

      const response = await fetch(
        `${
          Config.BASE_URL
        }/api/CompetitionAttemptedQuestion/GetAttemptedQuestionsByRound/${roundId}${
          storedTeamId ? `?teamId=${storedTeamId}` : ''
        }`,
      );

      const json = await response.json();
      console.log('Attempted Questions:', json);
      setData(json);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttemptedQuestions();
  }, [roundId]);

  const handleChallengeQuestion = async attemptedQuestionId => {
    console.log('Button CLicked');
  };

  const renderItem = ({item}) => {
    const isLowScore =
      item.score !== null &&
      item.marks !== null &&
      item.score < item.marks * 0.5;
    const isCurrentTeam = teamId && item.teamId === parseInt(teamId);

    return (
      <View style={styles.card}>
        <Text style={styles.question}>{item.questionText}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Team:</Text>
          <Text style={styles.value}>{item.teamName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Answer:</Text>
          <Text style={styles.value}>{item.answer}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>
            {new Date(item.submissionTime).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Score:</Text>
          <Text style={styles.value}>{item.score ?? 'Not scored yet'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Total Marks:</Text>
          <Text style={styles.value}>{item.marks}</Text>
        </View>

        {isLowScore && (
          <TouchableOpacity
            style={[styles.button, styles.challengeButton]}
            onPress={() => handleChallengeQuestion(item.id)}>
            <Text style={styles.buttonText}>Challenge Question</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No attempted questions found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  question: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    color: '#FFD700',
    fontWeight: '600',
    width: 80,
  },
  value: {
    color: '#FFF',
    flex: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  scoreInput: {
    height: 40,
    width: 80,
    backgroundColor: '#333',
    color: '#FFF',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  challengeButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  challengeText: {
    color: '#FF5722',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default ViewSpeedProgrammingScreenQuestionsScreen;

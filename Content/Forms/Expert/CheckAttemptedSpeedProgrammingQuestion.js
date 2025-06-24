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

const AttemptedSpeedProgrammingScreenQuestionsScreen = ({route}) => {
  const {roundId} = route.params; // Get roundId from navigation params
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});

  const fetchAttemptedQuestions = async () => {
    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionAttemptedQuestion/GetAttemptedQuestionsByRound/${roundId}`,
      );
      const json = await response.json();
      setData(json);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttemptedQuestions();
  }, [roundId]); // Add roundId to dependency array

  const handleScoreChange = (id, value) => {
    setScores(prev => ({...prev, [id]: value}));
  };

  const updateScore = async id => {
    const score = parseInt(scores[id]);
    if (isNaN(score)) {
      Alert.alert('Invalid Score', 'Please enter a valid number');
      return;
    }

    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionAttemptedQuestion/UpdateScore?id=${id}&score=${score}`,
        {method: 'PUT'},
      );

      if (response.ok) {
        Alert.alert('Success', 'Score updated');
        fetchAttemptedQuestions();
      } else {
        throw new Error('Failed to update score');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    const roundResultRes = await fetch(
      `${Config.BASE_URL}/api/RoundResult/insertroundresults`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      },
    );

    if (roundResultRes.ok) {
      console.log('Round results inserted successfully.');
    } else {
      console.error('Failed to insert round results');
    }
  };

  const renderItem = ({item}) => (
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
        <Text style={styles.label}>Total Makrs:</Text>
        <Text style={styles.value}>{item.marks}</Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.label}>Score:</Text>
        <TextInput
          style={styles.scoreInput}
          keyboardType="numeric"
          defaultValue={item.score?.toString()}
          onChangeText={text => handleScoreChange(item.id, text)}
          placeholder="0"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => updateScore(item.id)}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
    marginLeft: 12,
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default AttemptedSpeedProgrammingScreenQuestionsScreen;

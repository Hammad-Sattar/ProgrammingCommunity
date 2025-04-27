import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Config from '../../Settings/Config';
import {useRoute} from '@react-navigation/native';

const SubmittedTaskScreen = () => {
  const [submittedTask, setSubmittedTask] = useState([]);
  const [questionTexts, setQuestionTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const route = useRoute();
  const taskId = route.params?.taskId || 1;

  useEffect(() => {
    fetchSubmittedTask();
  }, []);

  useEffect(() => {
    const initialScores = {};
    submittedTask.forEach(task => {
      initialScores[task.id] = task.score?.toString() || '';
    });
    setScores(initialScores);
  }, [submittedTask]);

  const fetchSubmittedTask = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${Config.BASE_URL}/api/SubmittedTask/GetSubmittedTask?taskId=${taskId}`,
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.text();
      console.log('Fetched raw data:', data);

      if (data.trim().toLowerCase() === 'no submitted tasks found.') {
        setSubmittedTask([]);
        setError('No submitted tasks found by student ');
        return;
      }

      try {
        const jsonData = JSON.parse(data); // Parse the response manually if it's a JSON string
        if (Array.isArray(jsonData)) {
          setSubmittedTask(jsonData);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (jsonError) {
        throw new Error('Error parsing JSON: ' + jsonError.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchQuestionById = async questionId => {
    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/Questions/GetQuestionById/${questionId}`,
      );
      if (!response.ok) throw new Error('Question fetch failed');
      return await response.json();
    } catch (err) {
      console.error('Question error:', err);
      return {text: 'Question unavailable'};
    }
  };

  useEffect(() => {
    const loadQuestions = async () => {
      const texts = {};
      for (const task of submittedTask) {
        const question = await fetchQuestionById(task.questionId);
        texts[task.questionId] = question.text;
      }
      setQuestionTexts(texts);
    };

    if (submittedTask.length > 0) {
      loadQuestions();
    }
  }, [submittedTask]);

  const handleScoreChange = (id, value) => {
    setScores(prev => ({
      ...prev,
      [id]: value.replace(/[^0-9]/g, ''),
    }));
  };

  const handleEvaluate = async submissionId => {
    try {
      setUpdatingId(submissionId);
      const score = scores[submissionId];

      if (!score || isNaN(score)) {
        Alert.alert('Error', 'Please enter a valid score');
        return;
      }

      const response = await fetch(
        `${Config.BASE_URL}/api/SubmittedTask/UpdateSubmittedTaskScore?id=${submissionId}&score=${score}`,
        {method: 'PUT'},
      );

      if (!response.ok) throw new Error('Update failed');

      setSubmittedTask(prev =>
        prev.map(task =>
          task.id === submissionId ? {...task, score: Number(score)} : task,
        ),
      );

      Alert.alert('Success', 'Score updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update score');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderSubmissionCard = (task, index) => (
    <View key={task.id?.toString() || index} style={styles.card}>
      <Text style={styles.title}>Submission #{index + 1}</Text>

      <Text style={styles.label}>User ID:</Text>
      <Text style={styles.value}>{task.userId || 'Anonymous'}</Text>

      <Text style={styles.label}>Question:</Text>
      <Text style={styles.value}>
        {questionTexts[task.questionId] || 'Loading question...'}
      </Text>

      <Text style={styles.label}>Answer:</Text>
      <Text style={styles.value}>{task.answer || 'No answer provided'}</Text>

      <Text style={styles.label}>Submitted On:</Text>
      <Text style={styles.value}>
        {task.submissionDate?.split('T')[0] || 'Unknown date'} at{' '}
        {task.submissionTime?.split('.')[0] || 'Unknown time'}
      </Text>

      <View style={styles.scoreContainer}>
        <TextInput
          style={styles.scoreInput}
          value={scores[task.id] || ''}
          onChangeText={text => handleScoreChange(task.id, text)}
          keyboardType="numeric"
          placeholder="Enter score"
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={styles.evaluateButton}
          onPress={() => handleEvaluate(task.id)}
          disabled={updatingId === task.id}>
          <Text style={styles.evaluateButtonText}>
            {updatingId === task.id ? 'Updating...' : 'Evaluate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}> {error}</Text>
          <Text style={styles.helperText}>Pull down to try again</Text>
        </View>
      );
    }

    if (!loading && submittedTask.length === 0) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No submissions by students</Text>
          <Text style={styles.helperText}>Check back later</Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.pageTitle}>Submitted Tasks</Text>
        {submittedTask.map(renderSubmissionCard)}
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading Submissions...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchSubmittedTask}
          colors={['#FFD700']}
          tintColor="#FFD700"
        />
      }>
      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  scoreInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  evaluateButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  evaluateButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFD700',
    fontSize: 16,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#EF5350',
    textAlign: 'center',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default SubmittedTaskScreen;

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Config from '../../Settings/Config';

const SubmittedTaskScreen = () => {
  const [submittedTask, setSubmittedTask] = useState([]);
  const [questionTexts, setQuestionTexts] = useState({}); // Store question texts here
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubmittedTask = async () => {
    try {
      const taskId = 1;
      const response = await fetch(
        `${Config.BASE_URL}/api/SubmittedTask/GetSubmittedTask?taskId=${taskId}`,
      );
      if (!response.ok) throw new Error('Failed to fetch submitted task');
      const data = await response.json();
      setSubmittedTask(data);
    } catch (error) {
      console.error('Error fetching submitted task:', error.message);
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
      if (!response.ok) throw new Error('Failed to fetch question');
      const question = await response.json();
      return question.text; // Return the question text
    } catch (error) {
      console.error('Error fetching question:', error.message);
      return 'Error loading question';
    }
  };

  useEffect(() => {
    fetchSubmittedTask();
  }, []);

  useEffect(() => {
    const loadQuestionTexts = async () => {
      const newQuestionTexts = {};
      for (const task of submittedTask) {
        const questionText = await fetchQuestionById(task.questionId);
        newQuestionTexts[task.questionId] = questionText; // Save question text in the state
      }
      setQuestionTexts(newQuestionTexts); // Update the state with all question texts
    };

    if (submittedTask.length > 0) {
      loadQuestionTexts(); // Fetch question texts only if we have submitted tasks
    }
  }, [submittedTask]); // Trigger this effect when the submitted tasks are updated

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubmittedTask();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading submission...</Text>
      </View>
    );
  }

  if (!submittedTask || submittedTask.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No submission found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FFD700']}
        />
      }>
      <Text style={styles.pageTitle}>Submitted Task List</Text>
      {submittedTask.map((task, index) => (
        <View key={task.id} style={styles.card}>
          <Text style={styles.title}>Submission #{index + 1}</Text>

          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{task.userId}</Text>

          <Text style={styles.label}>Question:</Text>
          <Text style={styles.value}>
            {questionTexts[task.questionId] || 'Loading question...'}
          </Text>

          <Text style={styles.label}>Answer:</Text>
          <Text style={styles.value}>{task.answer}</Text>

          <Text style={styles.label}>Submitted On:</Text>
          <Text style={styles.value}>
            {task.submissionDate} at {task.submissionTime}
          </Text>

          <Text style={styles.label}>Score:</Text>
          <Text style={styles.value}>{task.score}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAAAAA',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 10,
  },
});

export default SubmittedTaskScreen;

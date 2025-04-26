import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute} from '@react-navigation/native';

const SpeedProgrammingScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(60);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef(null);
  const route = useRoute();
  const {roundId} = route.params || {};
  const competitionRoundId = roundId || 1;

  useEffect(() => {
    const fetchQuestions = async () => {
      const storedCompetitionId = await AsyncStorage.getItem('competitionId');
      if (!storedCompetitionId) {
        Alert.alert('Error', 'Competition ID not found in storage.');
        return;
      }

      try {
        const res = await fetch(
          `${Config.BASE_URL}/api/CompetitionRoundQuestion/GetCompetitionRoundQuestion?competitionRoundId=${competitionRoundId}`,
        );
        const questionList = await res.json();

        const fetchedQuestions = await Promise.all(
          questionList.map(async q => {
            const qRes = await fetch(
              `${Config.BASE_URL}/api/Questions/GetQuestionById/${q.questionId}`,
            );
            const qData = await qRes.json();

            if (qData.type === 2) {
              const optRes = await fetch(
                `${Config.BASE_URL}/api/QuestionOption/GetOptionsByQuestionId?questionId=${q.questionId}`,
              );
              const options = await optRes.json();
              return {...qData, options};
            } else {
              return qData;
            }
          }),
        );

        setQuestions(fetchedQuestions.filter(q => q != null));
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [competitionRoundId]);

  useEffect(() => {
    setTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSkip(); // auto-skip
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex]);

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers(prev => ({...prev, [questionId]: optionId}));
  };

  const handleInputChange = (questionId, text) => {
    setAnswers(prev => ({...prev, [questionId]: text}));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentQuestion.id];

    if (
      currentQuestion.type === 1 &&
      (!currentAnswer || currentAnswer.trim() === '')
    ) {
      Alert.alert('Answer Required', 'Please type an answer or use "Skip".');
      return;
    }

    goToNextQuestion();
  };

  const handleSkip = () => {
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowReview(true); // review before submit
    }
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    const competitionId = await AsyncStorage.getItem('competitionId');
    const attemptedQuestions = [];

    for (const q of questions) {
      const answer = answers[q.id];
      attemptedQuestions.push({
        competitionId,
        competitionRoundId,
        questionId: q.id,
        teamId: 1,
        answer: answer?.toString() || '',
        score: 0,
        submissionTime: new Date().toISOString(),
      });
    }
    console.log('Attempted Questions:', attemptedQuestions);

    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionAttemptedQuestion/AddCompetitionAttemptedQuestion`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(attemptedQuestions),
        },
      );

      if (response.ok) {
        Alert.alert('Submitted', 'Your answers have been submitted!');
        setShowReview(false);
      } else {
        Alert.alert('Error', 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Submission error');
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selected = answers[currentQuestion.id];

  if (showReview) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>📝 Review Your Answers</Text>
        {questions.map((q, index) => (
          <TouchableOpacity
            key={q.id}
            onPress={() => {
              setCurrentIndex(index);
              setShowReview(false);
            }}
            style={styles.reviewBox}>
            <Text style={{color: '#FFD700', fontWeight: 'bold'}}>
              Q{index + 1}: {q.text}
            </Text>
            <Text style={{color: '#fff'}}>
              ➤ {answers[q.id] ? answers[q.id] : 'Skipped'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit All</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Speed Programming</Text>
        <Text style={styles.headerSubtitle}>
          Time Left: {timer}s | Question {currentIndex + 1}/{questions.length}
        </Text>
      </View>

      <Text style={styles.questionText}>{currentQuestion.text}</Text>

      {currentQuestion.type === 2 ? (
        <FlatList
          data={currentQuestion.options}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.option,
                selected === item.id && styles.selectedOption,
              ]}
              onPress={() => handleOptionSelect(currentQuestion.id, item.id)}>
              <Text style={styles.optionText}>{item.option}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <TextInput
          placeholder="Type your answer..."
          placeholderTextColor="#ccc"
          style={styles.input}
          value={selected || ''}
          onChangeText={text => handleInputChange(currentQuestion.id, text)}
        />
      )}

      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <TouchableOpacity
          style={[styles.button, {flex: 1, marginRight: 5}]}
          onPress={handleSkip}>
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, {flex: 1, marginLeft: 5}]}
          onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex < questions.length - 1 ? 'Next' : 'Review'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SpeedProgrammingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  questionText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  option: {
    padding: 12,
    backgroundColor: '#1f1f1f',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2a2a',
  },
  optionText: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewBox: {
    backgroundColor: '#1f1f1f',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
  },
});

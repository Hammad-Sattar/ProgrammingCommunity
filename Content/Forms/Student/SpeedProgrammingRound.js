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
  UIManager,
  Platform,
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute, useNavigation} from '@react-navigation/native';

const SpeedProgrammingScreen = () => {
  const navigation = useNavigation();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(60);
  const [showReview, setShowReview] = useState(false);
  const [isQualified, setIsQualified] = useState(null);
  const timerRef = useRef(null);
  const route = useRoute();
  const {roundId} = route.params || {};
  const competitionRoundId = roundId || 1;
  const [teamId, setTeamId] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedTeamId = await AsyncStorage.getItem('teamId');
        console.log('Stored Team ID:', storedTeamId);
        if (!storedTeamId) {
          Alert.alert('Error', 'Team ID not found.');
          return;
        }
        setTeamId(parseInt(storedTeamId, 10));
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to retrieve team ID.');
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (teamId !== null) {
      if (competitionRoundId <= 1) {
        setIsQualified(true);
        fetchQuestions();
      } else {
        checkQualificationStatus(); // Call only after teamId is set
      }
    }
  }, [teamId, competitionRoundId]);

  const checkQualificationStatus = async () => {
    if (competitionRoundId <= 1) {
      setIsQualified(true);
      fetchQuestions();
    } else {
      console.log(
        'Checking url status...',
        `${
          Config.BASE_URL
        }/api/RoundResult/CheckQualificationStatus/${teamId}/${
          competitionRoundId - 1
        }`,
      );
      const url = `${
        Config.BASE_URL
      }/api/RoundResult/CheckQualificationStatus/${teamId}/${
        competitionRoundId - 1
      }`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.isQualified) {
          setIsQualified(true);
          fetchQuestions();
        } else {
          setIsQualified(false);
          Alert.alert(
            'Qualification Status',
            'Sorry, you did not qualify for the previous round.',
            [{text: 'OK', onPress: () => navigation.goBack()}],
          );
        }
      } catch (error) {
        console.error('Error checking qualification status:', error);
        Alert.alert('Error', 'Failed to check qualification status.');
      }
    }
  };

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
      setShowReview(true);
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
        teamId,
        answer: answer?.toString() || '',
        score: 0,
        submissionTime: new Date().toISOString(),
      });
    }

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
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
  },
  reviewBox: {
    padding: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#444',
    borderWidth: 1,
  },
});

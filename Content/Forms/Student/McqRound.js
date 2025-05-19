import React, {useEffect, useState} from 'react';
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
import {useRoute, useNavigation} from '@react-navigation/native';

const MCQScreen = () => {
  const navigation = useNavigation();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qualificationStatus, setQualificationStatus] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const route = useRoute();
  const {roundId} = route.params || {};
  const competitionRoundId = roundId || 1;

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedTeamId = await AsyncStorage.getItem('teamId');
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
    const checkQualificationStatus = async () => {
      if (competitionRoundId <= 1) {
        fetchQuestions();
        return;
      }
      const response = await fetch(
        `${
          Config.BASE_URL
        }/api/RoundResult/CheckQualificationStatus/${teamId}/${
          competitionRoundId - 1
        }`,
      );
      const data = await response.json();
      if (data.isQualified) {
        fetchQuestions();
      } else {
        Alert.alert(
          'Qualification Status',
          'Sorry, you did not qualify for the previous round.',
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
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
        const fetched = await Promise.all(
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
            }
            return qData;
          }),
        );
        setQuestions(fetched.filter(q => q != null));
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    checkQualificationStatus();
  }, [competitionRoundId]);

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers(prev => ({...prev, [questionId]: optionId}));
  };

  const handleInputChange = (questionId, text) => {
    setAnswers(prev => ({...prev, [questionId]: text}));
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowReview(true);
    }
  };

  const handleNext = () => {
    const q = questions[currentIndex];
    const ans = answers[q.id];
    if (q.type === 1 && (!ans || ans.trim() === '')) {
      Alert.alert(
        'Answer Required',
        'Please type an answer before proceeding.',
      );
      return;
    }
    goToNextQuestion();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = async () => {
    const competitionId = await AsyncStorage.getItem('competitionId');
    const payload = questions.map(q => {
      const ans = answers[q.id];
      if (q.type === 2) {
        const sel = q.options.find(o => o.id === ans);
        return {
          competitionId,
          competitionRoundId,
          questionId: q.id,
          teamId,
          answer: sel?.option || 'Skipped',
          score: sel?.isCorrect ? q.marks : 0,
          submissionTime: new Date().toISOString(),
        };
      } else {
        return {
          competitionId,
          competitionRoundId,
          questionId: q.id,
          teamId,
          answer: ans && ans.trim() !== '' ? ans : 'Skipped',
          score: 0,
          submissionTime: new Date().toISOString(),
        };
      }
    });

    try {
      const res = await fetch(
        `${Config.BASE_URL}/api/CompetitionAttemptedQuestion/AddCompetitionAttemptedQuestion`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        setSubmitted(true);
        setShowReview(true);
        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        const obtainedMarks = payload.reduce((sum, ans) => sum + ans.score, 0);
        const qualified = obtainedMarks >= totalMarks * 0.5; // Example qualification criteria (60%)
        setQualificationStatus(qualified ? 'Qualified' : 'Not Qualified');
        Alert.alert('Submitted', 'Your answers have been submitted!');

        const roundResultPayload = {
          competitionRoundId,
          teamId,
          totalScore: obtainedMarks,
        };

        const roundResultRes = await fetch(
          `${Config.BASE_URL}/api/RoundResult/insertroundresults`,
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(roundResultPayload),
          },
        );

        if (roundResultRes.ok) {
          console.log('Round results inserted successfully.');
        } else {
          console.error('Failed to insert round results');
        }
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
        <Text style={styles.headerTitle}>
          {submitted ? '📝 Results' : '📝 Review Your Answers'}
        </Text>

        {questions.map((q, i) => {
          const yourAnswer =
            q.type === 2
              ? q.options.find(o => o.id === answers[q.id])?.option || 'Skipped'
              : answers[q.id] || 'Skipped';

          const correctAnswer =
            q.type === 2
              ? q.options
                  .filter(o => o.isCorrect)
                  .map(o => o.option)
                  .join(', ')
              : 'N/A';

          let isCorrect = false;
          let obtainedMarks = 0;
          if (q.type === 2) {
            const selectedOption = q.options.find(o => o.id === answers[q.id]);
            isCorrect = selectedOption?.isCorrect || false;
            obtainedMarks = isCorrect ? q.marks : 0;
          }

          return (
            <View key={q.id} style={styles.reviewBox}>
              <Text style={styles.questionText}>
                Q{i + 1} ({q.marks} marks): {q.text}
              </Text>

              <View style={styles.answerContainer}>
                <Text
                  style={[
                    styles.reviewText,
                    submitted && isCorrect && styles.correctAnswer,
                    submitted && !isCorrect && styles.wrongAnswer,
                  ]}>
                  Your Answer: {yourAnswer}
                  {submitted && (isCorrect ? ' ✓' : ' ✗')}
                </Text>

                {submitted && (
                  <>
                    <Text style={styles.reviewText}>
                      Correct Answer: {correctAnswer}
                    </Text>
                    <Text style={styles.marksText}>
                      Marks: {obtainedMarks}/{q.marks}
                    </Text>
                  </>
                )}

                {submitted && !isCorrect && (
                  <TouchableOpacity style={styles.challengeButton}>
                    <Text style={styles.challengeButtonText}>
                      Challenge Answer
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {qualificationStatus && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              Total Obtained:{' '}
              {questions.reduce((total, q) => {
                if (q.type === 2) {
                  const selectedOption = q.options.find(
                    o => o.id === answers[q.id],
                  );
                  return total + (selectedOption?.isCorrect ? q.marks : 0);
                }
                return total;
              }, 0)}
              /{questions.reduce((total, q) => total + q.marks, 0)}
            </Text>
            <Text style={styles.qualificationStatus}>
              Qualification Status: {qualificationStatus}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MCQ Quiz</Text>
        <Text style={styles.headerSubtitle}>
          Question {currentIndex + 1}/{questions.length}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {width: `${((currentIndex + 1) / questions.length) * 100}%`},
          ]}
        />
      </View>
      <Text style={styles.questionText}>
        Question {currentIndex + 1} ({currentQuestion.marks} marks){' '}
      </Text>
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
          placeholderTextColor="#777"
          style={styles.input}
          value={selected || ''}
          onChangeText={text => handleInputChange(currentQuestion.id, text)}
        />
      )}
      <View style={styles.navRow}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navText}>Previous</Text>
          </TouchableOpacity>
        )}
        {currentIndex < questions.length - 1 ? (
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={handleSubmit}>
            <Text style={styles.navText}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default MCQScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },

  reviewBox: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 5,
    marginBottom: 12,
  },
  answerContainer: {
    marginTop: 8,
  },
  correctAnswer: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  wrongAnswer: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  marksText: {
    color: '#FFD700',
    marginTop: 4,
  },
  scoreContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  qualificationStatus: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  challengeButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  challengeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  option: {
    backgroundColor: '#333',
    padding: 12,
    marginVertical: 5,
    borderRadius: 5,
  },
  selectedOption: {
    backgroundColor: '#FFD700',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 5,
    color: '#fff',
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 5,
  },
  navText: {
    color: '#000',
    fontWeight: 'bold',
  },
  reviewBox: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 5,
    marginBottom: 12,
  },
  reviewText: {
    color: '#ccc',
    marginTop: 4,
  },
  qualificationStatus: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});

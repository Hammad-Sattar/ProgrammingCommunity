import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Config from '../../Settings/Config';
import {useRoute, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TaskAnswerScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const taskId = route.params?.taskId || 1;

  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [userId, setUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionsData, setQuestionsData] = useState([]);

  useEffect(() => {
    (async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId ? parseInt(storedUserId, 10) : null);

      const countRes = await fetch(
        `${Config.BASE_URL}/api/Task/GetTaskQuestionCount/${taskId}`,
      );
      const {questionCount} = await countRes.json();
      setTotalQuestions(questionCount);

      await loadQuestion(1);
      setLoading(false);
    })();
  }, [taskId]);

  const loadQuestion = async num => {
    setLoading(true);
    setAnswer('');
    setSelectedOption(null);

    const tqRes = await fetch(
      `${Config.BASE_URL}/api/TaskQuestion/GetTaskQuestion?taskId=${taskId}`,
    );
    const tq = await tqRes.json();
    const sorted = tq.sort((a, b) => a.id - b.id);
    const det = sorted[num - 1];

    const qRes = await fetch(
      `${Config.BASE_URL}/api/Questions/GetQuestionById/${det.questionId}`,
    );
    const qd = await qRes.json();
    setQuestion(qd);

    if (qd.type === 2) {
      const oRes = await fetch(
        `${Config.BASE_URL}/api/QuestionOption/GetOptionsByQuestionId?questionId=${qd.id}`,
      );
      const fetchedOptions = await oRes.json();
      setOptions(fetchedOptions);

      const prev = submittedAnswers.find(a => a.questionId === qd.id);
      if (prev) {
        const opt = fetchedOptions.find(o => o.option === prev.answer);
        setSelectedOption(opt?.id ?? null);
      }
    } else {
      setOptions([]);
      const prev = submittedAnswers.find(a => a.questionId === qd.id);
      if (prev) {
        setAnswer(prev.answer);
      }
    }

    setLoading(false);
  };

  const saveAnswer = () => {
    if (!question) return false;
    if (question.type === 2 && !selectedOption) {
      Alert.alert('Error', 'Please select an option');
      return false;
    }
    if (question.type === 1 && !answer.trim()) {
      Alert.alert('Error', 'Please enter your answer');
      return false;
    }

    const answerValue =
      question.type === 2
        ? options.find(o => o.id === selectedOption)?.option || ''
        : answer.trim();

    const next = submittedAnswers.filter(a => a.questionId !== question.id);
    next.push({
      id: 0,
      taskId,
      questionId: question.id,
      userId,
      answer: answerValue,
      submissionDate: new Date().toISOString().split('T')[0],
      submissionTime: new Date().toTimeString().split(' ')[0] + '.0000000',
      score: 0,
    });
    setSubmittedAnswers(next);
    return true;
  };

  const handleNext = async () => {
    if (!saveAnswer()) return;
    if (questionNumber < totalQuestions) {
      await loadQuestion(questionNumber + 1);
      setQuestionNumber(q => q + 1);
    } else {
      Alert.alert('Completed', 'You have reached the last question.');
    }
  };

  const handleBack = async () => {
    if (questionNumber > 1 && saveAnswer()) {
      await loadQuestion(questionNumber - 1);
      setQuestionNumber(q => q - 1);
    }
  };

  const calculateScore = async answers => {
    try {
      let correctCount = 0;
      const questionsWithAnswers = [];

      for (const answer of answers) {
        const questionRes = await fetch(
          `${Config.BASE_URL}/api/Questions/GetQuestionById/${answer.questionId}`,
        );
        const questionData = await questionRes.json();

        let isCorrect = false;
        let correctAnswerText = '';

        if (questionData.type === 2) {
          const optionsRes = await fetch(
            `${Config.BASE_URL}/api/QuestionOption/GetOptionsByQuestionId?questionId=${answer.questionId}`,
          );
          const options = await optionsRes.json();
          const correctOption = options.find(opt => opt.isCorrect);
          correctAnswerText = correctOption?.option || '';

          if (correctOption && answer.answer === correctOption.option) {
            correctCount++;
            isCorrect = true;
          }
        } else {
          correctAnswerText = questionData.correctAnswer || '';
          if (
            answer.answer.trim().toLowerCase() ===
            correctAnswerText.trim().toLowerCase()
          ) {
            correctCount++;
            isCorrect = true;
          }
        }

        questionsWithAnswers.push({
          ...questionData,
          userAnswer: answer.answer,
          isCorrect,
          correctAnswer: correctAnswerText,
        });
      }

      const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
      setCorrectAnswers(correctCount);
      setScore(calculatedScore);
      setQuestionsData(questionsWithAnswers);

      return calculatedScore;
    } catch (error) {
      console.error('Error calculating score:', error);
      return 0;
    }
  };

  const handleFinalSubmit = async () => {
    if (!question) return;

    const answerValue =
      question.type === 2
        ? options.find(o => o.id === selectedOption)?.option || ''
        : answer.trim();

    if (question.type === 2 && !selectedOption) {
      Alert.alert('Error', 'Please select an option');
      return;
    }

    if (question.type === 1 && !answerValue) {
      Alert.alert('Error', 'Please enter your answer');
      return;
    }

    const tempAnswers = submittedAnswers.filter(
      a => a.questionId !== question.id,
    );

    tempAnswers.push({
      id: 0,
      taskId,
      questionId: question.id,
      userId,
      answer: answerValue,
      submissionDate: new Date().toISOString().split('T')[0],
      submissionTime: new Date().toTimeString().split(' ')[0] + '.0000000',
      score: 0,
    });

    if (tempAnswers.length < totalQuestions) {
      Alert.alert('Error', 'Please answer all questions');
      return;
    }

    setSubmitting(true);

    await fetch(`${Config.BASE_URL}/api/SubmittedTask/AddSubmittedTask`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(tempAnswers),
    });

    await fetch(`${Config.BASE_URL}/api/Task/Attempt/${taskId}`, {
      method: 'PUT',
    });

    const userScore = await calculateScore(tempAnswers);

    setSubmitting(false);
    setShowReview(true);

    let levelMessage = '';
    if (userScore >= 50 && userScore < 70) {
      levelMessage = 'Good job! You reached Level 1.';
    } else if (userScore >= 70 && userScore < 100) {
      levelMessage = 'Excellent! You reached Level 2.';
    } else if (userScore === 100) {
      levelMessage = 'Perfect! You reached the highest Level 3!';
    }

    if (levelMessage) {
      Alert.alert('Level Up!', `${levelMessage} You scored ${userScore}%!`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const renderScoreProgress = () => {
    const progressWidth = `${score}%`;

    let progressColor = '#FF5555';
    if (score >= 50 && score < 70) {
      progressColor = '#FFD700';
    } else if (score >= 70 && score < 100) {
      progressColor = '#55FF55';
    } else if (score === 100) {
      progressColor = '#00AA00';
    }

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {width: progressWidth, backgroundColor: progressColor},
            ]}
          />
        </View>
        <View style={styles.milestoneContainer}>
          <View style={[styles.milestone, {left: '50%'}]} />
          <View style={[styles.milestone, {left: '70%'}]} />
          <View style={[styles.milestone, {left: '100%'}]} />
        </View>
        <View style={styles.milestoneLabels}>
          <Text style={styles.milestoneLabel}>L1</Text>
          <Text style={styles.milestoneLabel}>L2</Text>
          <Text style={styles.milestoneLabel}>L3</Text>
        </View>
      </View>
    );
  };

  const renderReviewModal = () => (
    <Modal
      visible={showReview}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowReview(false)}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Quiz Results</Text>

        {renderScoreProgress()}

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Your Score: {score}%</Text>
          <Text style={styles.detailText}>
            Correct Answers: {correctAnswers}/{totalQuestions}
          </Text>
          {score >= 50 && (
            <Text style={styles.levelText}>
              {score >= 50 && score < 70 && 'Level 1 Achieved!'}
              {score >= 70 && score < 100 && 'Level 2 Achieved!'}
              {score === 100 && 'Level 3 Achieved - Perfect Score!'}
            </Text>
          )}
        </View>

        <ScrollView style={styles.answersContainer}>
          {questionsData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.answerItem,
                item.isCorrect ? styles.correctAnswer : styles.wrongAnswer,
              ]}>
              <Text style={styles.questionText}>
                Q{index + 1}: {item.text}
              </Text>
              <Text style={styles.answerText}>
                Your Answer: {item.userAnswer}
              </Text>
              {!item.isCorrect && (
                <Text style={styles.correctAnswerText}>
                  Correct Answer: {item.correctAnswer}
                </Text>
              )}
              <View style={styles.answerStatus}>
                <Text style={styles.answerStatusText}>
                  {item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            setShowReview(false);
            navigation.goBack();
          }}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.quizTitle}>C++ Quiz</Text>
        <Text style={styles.subtitle}>Biit Programming Society</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Quiz No {questionNumber}</Text>
        <Text style={styles.infoText}>TOTAL QUESTIONS {totalQuestions}</Text>
        <Text
          style={styles.infoText}>{`${questionNumber}/${totalQuestions}`}</Text>
      </View>

      <Text style={styles.questionLabel}>
        Q{questionNumber}. {question.text}
      </Text>

      {question.type === 2 ? (
        options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.option,
              selectedOption === opt.id && styles.selectedOption,
            ]}
            onPress={() => setSelectedOption(opt.id)}>
            <Text style={styles.optionText}>{opt.option}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <TextInput
          style={styles.input}
          multiline
          value={answer}
          onChangeText={setAnswer}
          placeholder="Type answer..."
          placeholderTextColor="#777"
        />
      )}

      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={questionNumber === 1}
          style={styles.navBtn}>
          <Text>Back</Text>
        </TouchableOpacity>
        {questionNumber < totalQuestions ? (
          <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
            <Text>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleFinalSubmit}
            style={styles.navBtn}
            disabled={submitting}>
            <Text>{submitting ? '...' : 'Submit All'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderReviewModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, backgroundColor: '#000'},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {alignItems: 'center', marginBottom: 16},
  quizTitle: {fontSize: 24, fontWeight: 'bold', color: '#FFD700'},
  subtitle: {fontSize: 16, color: '#FFD700', marginTop: 4},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
    paddingBottom: 10,
  },
  infoText: {color: '#FFD700', fontSize: 14, fontWeight: '600'},
  questionLabel: {color: '#FFD700', fontSize: 18, marginVertical: 12},
  option: {
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 6,
    marginVertical: 6,
  },
  selectedOption: {backgroundColor: '#FFD700'},
  optionText: {color: '#fff'},
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 6,
    height: 100,
    textAlignVertical: 'top',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navBtn: {padding: 12, backgroundColor: '#FFD700', borderRadius: 6},
  modalContainer: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  milestoneContainer: {
    width: '100%',
    height: 20,
    position: 'relative',
  },
  milestone: {
    position: 'absolute',
    top: -25,
    width: 2,
    height: 25,
    backgroundColor: '#FFF',
  },
  milestoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  milestoneLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreContainer: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#FFF',
  },
  levelText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  answersContainer: {
    flex: 1,
    marginBottom: 20,
  },
  answerItem: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  correctAnswer: {
    backgroundColor: '#1a2e1a',
    borderLeftWidth: 5,
    borderLeftColor: '#55FF55',
  },
  wrongAnswer: {
    backgroundColor: '#2e1a1a',
    borderLeftWidth: 5,
    borderLeftColor: '#FF5555',
  },
  questionText: {
    color: '#FFD700',
    fontSize: 16,
    marginBottom: 5,
  },
  answerText: {
    color: '#FFF',
    fontSize: 14,
  },
  correctAnswerText: {
    color: '#55FF55',
    fontSize: 14,
    marginTop: 5,
  },
  answerStatus: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  answerStatusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TaskAnswerScreen;

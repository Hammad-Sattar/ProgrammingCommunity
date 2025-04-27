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

    setSubmitting(false);
    Alert.alert('Success', 'All answers submitted!');
    navigation.goBack();
  };

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
});

export default TaskAnswerScreen;

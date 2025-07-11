import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import Config from '../Settings/Config';

export default function BuzzerScreenApi({route}) {
  const teamId = 1;
  const teamName = 'Team A';
  const competitionRoundId = 9;

  const [firstPressedTeam, setFirstPressedTeam] = useState(null);
  const [question, setQuestion] = useState(null);
  const [status, setStatus] = useState('Connecting...');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  // Track previous waiting state
  const prevIsOtherTeamPressed = useRef(false);
  const timerRef = useRef(null);

  // Timer countdown effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      handleTimeout();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, timeLeft]);

  const startTimer = () => {
    setTimeLeft(30);
    setTimerActive(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleTimeout = async () => {
    stopTimer();

    // Add timeout entry to user answers
    setUserAnswers(prev => [
      ...prev,
      {
        teamId: teamId,
        teamName: teamName,
        questionId: question.id,
        questionText: question.text,
        answer: 'Timeout',
        isCorrect: false,
        isTimeout: true,
      },
    ]);

    Alert.alert('Timeout', 'You ran out of time for this question');
    await resetBuzzer();
    moveToNextQuestion();
  };

  // Fetch all questions for the competition round
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionRoundQuestion/GetCompetitionRoundQuestion?competitionRoundId=${competitionRoundId}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const questionList = await response.json();
      setQuestions(questionList);

      // Load the first question if available
      if (questionList.length > 0) {
        await loadQuestionDetails(questionList[0].questionId);
      }

      setStatus('Connected');
    } catch (error) {
      console.error('Error fetching questions:', error);
      setStatus('Connection Error');
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [competitionRoundId]);

  // Load details for a specific question
  const loadQuestionDetails = useCallback(async questionId => {
    try {
      setLoading(true);

      // Fetch question details
      const questionResponse = await fetch(
        `${Config.BASE_URL}/api/Questions/GetQuestionById/${questionId}`,
      );

      if (!questionResponse.ok) {
        throw new Error('Failed to fetch question details');
      }

      const questionData = await questionResponse.json();

      // If it's a multiple choice question, fetch options
      if (questionData.type === 2) {
        const optionsResponse = await fetch(
          `${Config.BASE_URL}/api/QuestionOption/GetOptionsByQuestionId?questionId=${questionId}`,
        );

        if (optionsResponse.ok) {
          const options = await optionsResponse.json();
          setQuestion({...questionData, options});
        } else {
          setQuestion(questionData);
        }
      } else {
        setQuestion(questionData);
      }
    } catch (error) {
      console.error('Error loading question details:', error);
      Alert.alert('Error', 'Failed to load question details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check current buzzer status
  const checkBuzzerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/api/buzzer/status`);

      if (response.status === 404) {
        setFirstPressedTeam(null);
      } else if (response.ok) {
        const data = await response.json();
        if (data) {
          setFirstPressedTeam({
            id: data.teamId,
            name: data.teamName,
            pressTime: new Date(data.pressTime),
          });
        } else {
          setFirstPressedTeam(null);
        }
      } else {
        console.warn(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      console.error('Error checking buzzer status:', error);
    }
  }, [competitionRoundId]);

  // Reset buzzer
  const resetBuzzer = async () => {
    try {
      await fetch(`${Config.BASE_URL}/api/buzzer/reset`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({competitionRoundId}),
      });

      setFirstPressedTeam(null);
      setAnswerText('');
      setSelectedOption(null);
      stopTimer();
    } catch (error) {
      console.error('Error resetting buzzer:', error);
    }
  };

  // Handle waiting team question advancement
  useEffect(() => {
    const isOtherTeamPressed =
      firstPressedTeam && firstPressedTeam.id !== teamId;

    // When buzzer resets after another team pressed
    if (firstPressedTeam === null && prevIsOtherTeamPressed.current) {
      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        setShowReviewModal(true);
      }
    }

    // Update previous state
    prevIsOtherTeamPressed.current = isOtherTeamPressed;
  }, [firstPressedTeam]);

  // Load new question when index changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      loadQuestionDetails(questions[currentQuestionIndex].questionId);
      resetBuzzer(); // Reset buzzer for new question
    }
  }, [currentQuestionIndex]);

  // Handle buzzer press
  const pressBuzzer = useCallback(async () => {
    try {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) {
        Alert.alert('Error', 'No question available');
        return;
      }

      const response = await fetch(`${Config.BASE_URL}/api/buzzer/press`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          teamName,
          questionId: currentQuestion.questionId,
          competitionRoundId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setFirstPressedTeam({
          id: teamId,
          name: teamName,
          pressTime: new Date(result.pressTime),
        });
        startTimer(); // Start timer when user presses first
      } else {
        Alert.alert(
          'Buzzer Taken',
          `${result.firstPressTeamName} pressed first at ${new Date(
            result.pressTime,
          ).toLocaleTimeString()}`,
        );
      }
    } catch (error) {
      Alert.alert('Error', error.toString());
    }
  }, [competitionRoundId, currentQuestionIndex, questions, teamId, teamName]);

  const moveToNextQuestion = useCallback(() => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      setShowReviewModal(true);
    }
  }, [currentQuestionIndex, questions]);

  // Submit answer
  const submitAnswer = async () => {
    if (!question) return;

    try {
      setIsSubmitting(true);
      stopTimer(); // Stop timer when submitting answer

      // Prepare the answer data
      const answerValue =
        question.type === 1
          ? answerText.trim()
          : question.options?.find(opt => opt.id === selectedOption)?.option ||
            'Skipped';

      const isCorrect =
        question.type === 2
          ? question.options?.find(opt => opt.id === selectedOption)?.isCorrect
          : false;

      // Store answer locally
      setUserAnswers(prev => [
        ...prev,
        {
          teamId: teamId,
          teamName: teamName,
          questionId: question.id,
          questionText: question.text,
          answer: answerValue,
          isCorrect: isCorrect,
          isTimeout: false,
        },
      ]);

      // Prepare payload
      const competitionId = 1;

      const payload = [
        {
          competitionId: parseInt(competitionId),
          competitionRoundId: parseInt(competitionRoundId),
          questionId: question.id,
          teamId: parseInt(teamId),
          answer: answerValue,
          score: isCorrect ? question.marks : 0,
          submissionTime: new Date().toISOString(),
        },
      ];

      console.log('Submitting answer:', JSON.stringify(payload, null, 2));

      // Submit to competition API
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionAttemptedQuestion/AddCompetitionAttemptedQuestion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('API Error Details:', errorResponse);
        throw new Error('Submission failed');
      }

      const responseData = await response.json();
      console.log('Submission successful:', responseData);

      Alert.alert('Success', 'Answer submitted successfully!');

      // Submit round results
      const roundResultPayload = {
        competitionRoundId: parseInt(competitionRoundId),
        teamId: parseInt(teamId),
        totalScore: isCorrect ? question.marks : 0,
      };

      const roundResultRes = await fetch(
        `${Config.BASE_URL}/api/RoundResult/insertroundresults`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(roundResultPayload),
        },
      );

      if (!roundResultRes.ok) {
        console.error('Failed to update round results');
      }

      // Reset buzzer and move to next question
      await resetBuzzer();
      moveToNextQuestion();
      setAnswerText('');
      setSelectedOption(null);
    } catch (err) {
      console.error('Submission error:', err);
      Alert.alert('Error', err.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Set up polling for buzzer status
  useEffect(() => {
    const interval = setInterval(checkBuzzerStatus, 1000);
    return () => clearInterval(interval);
  }, [checkBuzzerStatus]);

  // Render the answer review modal
  const renderReviewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showReviewModal}
      onRequestClose={() => setShowReviewModal(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Your Answers</Text>
          <ScrollView>
            {userAnswers.map((answer, index) => (
              <View
                key={index}
                style={[
                  styles.answerItem,
                  answer.isTimeout && styles.timeoutItem,
                ]}>
                <Text style={styles.questionText}>
                  Q{index + 1}: {answer.questionText}
                </Text>
                <Text
                  style={[
                    styles.answerText,
                    answer.isTimeout && styles.timeoutText,
                  ]}>
                  {answer.isTimeout
                    ? 'Timeout - No answer submitted'
                    : `Your answer: ${answer.answer}`}
                </Text>
                {!answer.isTimeout && (
                  <Text
                    style={[
                      styles.correctnessText,
                      answer.isCorrect
                        ? styles.correctText
                        : styles.incorrectText,
                    ]}>
                    {answer.isCorrect ? 'Correct!' : 'Incorrect'}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowReviewModal(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const isFirstPress = firstPressedTeam?.id === teamId;
  const isOtherTeamPressed = firstPressedTeam && !isFirstPress;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Status: {status}</Text>
        <Text style={styles.headerText}>
          Question: {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.teamHeader}>
          {teamName} (Team {teamId})
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : question ? (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.text}</Text>
        </View>
      ) : (
        <Text style={styles.noQuestionText}>No question available</Text>
      )}

      <View style={styles.content}>
        {!question ? null : firstPressedTeam === null ? (
          <View style={styles.buzzerContainer}>
            <Text style={styles.instructionText}>
              Press the buzzer when you know the answer!
            </Text>
            <TouchableOpacity
              onPress={pressBuzzer}
              style={styles.buzzerButton}
              disabled={loading}>
              <Text style={styles.buttonText}>PRESS BUZZER</Text>
            </TouchableOpacity>
          </View>
        ) : isFirstPress ? (
          <View style={styles.answerContainer}>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>Time left: {timeLeft}s</Text>
            </View>
            <Text style={styles.successText}>You pressed first!</Text>

            {question.type === 2 ? (
              <View style={styles.optionsContainer}>
                {question.options?.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionButton,
                      selectedOption === opt.id && styles.selectedOption,
                    ]}
                    onPress={() => setSelectedOption(opt.id)}>
                    <Text style={styles.optionText}>{opt.option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Type your answer..."
                value={answerText}
                onChangeText={setAnswerText}
                multiline
              />
            )}

            <TouchableOpacity
              onPress={submitAnswer}
              style={styles.submitButton}
              disabled={
                isSubmitting ||
                (question.type === 2 && !selectedOption) ||
                (question.type === 1 && !answerText.trim())
              }>
              {isSubmitting ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.submitText}>SUBMIT ANSWER</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.infoText}>
              {firstPressedTeam.name} pressed first!
            </Text>
            <Text style={styles.waitingText}>
              Please wait for the next question...
            </Text>
          </View>
        )}
      </View>

      {renderReviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    color: '#FFD700',
    fontSize: 16,
  },
  teamHeader: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  questionContainer: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  questionText: {
    color: '#FFF',
    fontSize: 18,
  },
  noQuestionText: {
    color: '#FF5555',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  buzzerContainer: {
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  buzzerButton: {
    backgroundColor: '#FFD700',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 18,
  },
  answerContainer: {
    padding: 16,
  },
  timerContainer: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  timerText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    marginVertical: 10,
  },
  optionButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#555',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 18,
  },
  waitingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  infoText: {
    color: '#FF5722',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  waitingText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: '#222',
    width: '90%',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  answerItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  timeoutItem: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF5722',
  },
  questionText: {
    color: '#FFD700',
    fontSize: 16,
  },
  answerText: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 5,
  },
  timeoutText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  correctnessText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  correctText: {
    color: '#4CAF50',
  },
  incorrectText: {
    color: '#FF5722',
  },
  closeButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

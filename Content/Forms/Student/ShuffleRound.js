import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  ToastAndroid,
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute, useNavigation} from '@react-navigation/native';

const ShuffleRoundScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [correct, setCorrect] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [isQualified, setIsQualified] = useState(null);
  const [teamId, setTeamId] = useState(null); // Added state for teamId
  const route = useRoute();
  const navigation = useNavigation();
  const competitionRoundId = route.params?.roundId ?? 1;

  useEffect(() => {
    const fetchTeamId = async () => {
      const savedTeamId = await AsyncStorage.getItem('teamId');
      if (savedTeamId) {
        setTeamId(savedTeamId); // Store teamId in the state
      } else {
        Alert.alert('Error', 'Team ID not found.');
      }
    };

    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    fetchTeamId();
  }, []);

  useEffect(() => {
    if (teamId && competitionRoundId) {
      loadQualificationStatus();
    }
  }, [teamId, competitionRoundId]);

  const loadQualificationStatus = async () => {
    if (competitionRoundId <= 1) {
      setIsQualified(true); // No previous round to check
      loadQuestions();
      return;
    }
    const response = await fetch(
      `${Config.BASE_URL}/api/RoundResult/CheckQualificationStatus/${teamId}/${
        competitionRoundId - 1
      }`,
    );
    const data = await response.json();
    if (data.isQualified) {
      setIsQualified(true);
      loadQuestions();
    } else {
      setIsQualified(false);
      Alert.alert(
        'Qualification Status',
        'Sorry, you did not qualify for the previous round.',
        [{text: 'OK'}],
      );
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    const compId = await AsyncStorage.getItem('competitionId');
    if (!compId) {
      Alert.alert('Error', 'Competition ID not found.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${Config.BASE_URL}/api/CompetitionRoundQuestion/GetCompetitionRoundQuestion?competitionRoundId=${competitionRoundId}`,
      );
      const list = await res.json();
      const loaded = await Promise.all(
        list.map(async q => {
          const qr = await fetch(
            `${Config.BASE_URL}/api/Questions/GetQuestionById/${q.questionId}`,
          );
          const qd = await qr.json();
          return qd.type === 3 ? qd : null;
        }),
      );
      const valid = loaded.filter(x => x);
      setQuestions(valid);
      if (valid.length) prepare(valid[0].text);
    } catch {
      Alert.alert('Error', 'Failed to fetch questions.');
    } finally {
      setLoading(false);
    }
  };

  const prepare = text => {
    const parts = text
      .split('//n')
      .map((ln, i) => ({key: String(i), text: ln.trim()}))
      .filter(p => p.text.length > 0);
    setCorrect(parts);
    setTiles([...parts].sort(() => Math.random() - 0.5));
  };

  const move = (idx, dir) => {
    const arr = [...tiles];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setTiles(arr);
  };

  const saveCurrent = () => {
    const q = questions[currentIndex];
    const answerText = tiles.map(t => t.text).join('\n');
    const correctText = correct.map(t => t.text).join('\n');
    const isCorrect = answerText === correctText;
    const newAnswer = {questionId: q.id, answer: answerText, isCorrect};
    setAnswers(prev => [...prev.filter(a => a.questionId !== q.id), newAnswer]);

    return newAnswer;
  };

  const onNext = () => {
    saveCurrent();
    const ni = currentIndex + 1;
    if (ni < questions.length) {
      setCurrentIndex(ni);
      prepare(questions[ni].text);
      setShowSubmit(ni === questions.length - 1);
    }
  };

  const onPrev = () => {
    saveCurrent();
    const pi = currentIndex - 1;
    if (pi >= 0) {
      setCurrentIndex(pi);
      prepare(questions[pi].text);
      setShowSubmit(pi === questions.length - 1);
    }
  };

  const onFinalSubmit = () => {
    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to submit your answers?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Submit',
          onPress: async () => {
            const last = saveCurrent();
            const updated = [
              ...answers.filter(a => a.questionId !== last.questionId),
              last,
            ];
            const compId = await AsyncStorage.getItem('competitionId');
            const payload = updated.map(a => ({
              competitionId: compId,
              competitionRoundId,
              questionId: a.questionId,
              teamId: teamId,
              answer: a.answer,
              score: a.isCorrect ? 10 : 0,
              submissionTime: new Date().toISOString(),
            }));

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
                setReviewMode(true);

                const roundResultPayload = {
                  competitionRoundId,
                  teamId,
                  totalScore: payload.reduce(
                    (total, answer) => total + answer.score,
                    0,
                  ),
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
            } catch {
              Alert.alert('Error', 'Failed to submit');
            }
          },
        },
      ],
    );
    navigation.goBack();
  };

  if (loading || isQualified === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!isQualified) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>
          You did not qualify for the previous round.
        </Text>
      </View>
    );
  }

  if (reviewMode) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Review Your Answers</Text>
        {answers.map(a => {
          const q = questions.find(x => x.id === a.questionId);
          const codeLines = q.text.split('//n').filter(l => l.trim());
          return (
            <View key={q.id} style={styles.reviewBox}>
              <Text style={styles.questionLabel}>Original:</Text>
              {codeLines.map((l, i) => (
                <Text key={i} style={styles.codeLine}>
                  {l.trim()}
                </Text>
              ))}
              <Text style={styles.questionLabel}>Your Order:</Text>
              {a.answer.split('\n').map((l, i) => (
                <Text key={i} style={styles.codeLine}>
                  {l}
                </Text>
              ))}
              <Text style={styles.answerLabel}>
                {a.isCorrect ? '✔ Correct' : '✘ Incorrect'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  const q = questions[currentIndex];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        Shuffle Round — Q{currentIndex + 1}/{questions.length}
      </Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {width: `${((currentIndex + 1) / questions.length) * 100}%`},
          ]}
        />
      </View>
      <Text style={styles.instruction}>Tap ▲ or ▼ to reorder lines</Text>
      {tiles.map((tile, idx) => (
        <View key={tile.key} style={styles.tileRow}>
          <View style={styles.tile}>
            <Text style={styles.tileText}>{tile.text}</Text>
          </View>
          <View style={styles.arrows}>
            <TouchableOpacity
              onPress={() => move(idx, -1)}
              style={styles.arrowBtn}>
              <Text style={styles.arrow}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => move(idx, +1)}
              style={styles.arrowBtn}>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <View style={styles.footer}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.btn} onPress={onPrev}>
            <Text style={styles.btnText}>Prev</Text>
          </TouchableOpacity>
        )}
        {showSubmit ? (
          <TouchableOpacity style={styles.btn} onPress={onFinalSubmit}>
            <Text style={styles.btnText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={onNext}>
            <Text style={styles.btnText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

export default ShuffleRoundScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212', padding: 16},
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#FFD700',
  },
  instruction: {color: '#fff', marginBottom: 12},
  tileRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  tile: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
  },
  tileText: {color: '#fff'},
  arrows: {marginLeft: 8},
  arrowBtn: {
    backgroundColor: '#333',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginVertical: 2,
  },
  arrow: {color: '#fff'},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  btn: {
    flex: 1,
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  btnText: {color: '#121212', textAlign: 'center', fontSize: 16},
  reviewBox: {
    backgroundColor: '#222',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  codeLine: {
    fontFamily: 'Courier New',
    color: '#fff',
  },
  answerLabel: {
    marginTop: 8,
    color: '#FFD700',
  },
});

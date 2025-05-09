import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const StudentHome = ({navigation}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Menu</Text>
        <Text style={styles.headerText}>Profile</Text>
      </View>

      <Text style={styles.sectionTitle}>Upcoming Competitions</Text>
      <Card
        title="C++ Development"
        subtitle="Programming"
        onPress={() => navigation.navigate('CompetitionScreen')}
      />
      <Card
        title="Student Leaderboard"
        subtitle=""
        isLeaderboard
        onPress={() => navigation.navigate('StudentLeadearBoard')}
      />

      <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
      <Card
        title="Tasks"
        subtitle="Programming"
        onPress={() => navigation.navigate('AttempTask')}
      />
    </ScrollView>
  );
};

const Card = ({title, subtitle, isLeaderboard, onPress}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconPlaceholder}>
        <Text style={styles.iconText}>{isLeaderboard ? '🏆' : '📚'}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        {isLeaderboard ? (
          <Text style={styles.leaderboardText}>▲ Leaderboard</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000000'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  headerText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 24,
    marginLeft: 24,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginHorizontal: 24,
    marginVertical: 12,
    alignItems: 'center',
    padding: 20,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  iconPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#000000',
  },
  iconText: {fontSize: 28},
  cardContent: {flex: 1, marginLeft: 20},
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 8,
    fontWeight: '500',
  },
  leaderboardText: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 8,
    fontWeight: '700',
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 4,
  },
});

export default StudentHome;

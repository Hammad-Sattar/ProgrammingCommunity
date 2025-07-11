/**
 * @format
 */

import {AppRegistry} from 'react-native';

import {name as appName} from './app.json';
import Navigation from './Content/Settings/NavigationConfig';
import AllCompetitionScreen from './Content/Forms/Expert/AllCompetition';
import AddQuestions from './Content/Forms/Expert/AddQuestion';
import LoginScreen from './Content/Forms/Auhtentication/LoginPage';
import ExpertHome from './Content/Forms/Expert/ExpertHomeScreen';
import RegistrationScreen from './Content/Forms/Auhtentication/RegistrationScreen';
import QuizScreen from './Content/Forms/Expert/CreateTask';
import ExpertSubjectScreen from './Content/Forms/Expert/ExpertSubject';
import CompetitionRoundScreen from './Content/Forms/Expert/AddCompetitonRound';
import TaskScreen from './Content/Forms/Expert/CreateTask';
import TaskAttempScreen from './Content/Forms/Student/AttempTask';
import TaskAnswerScreen from './Content/Forms/Student/TaskQuestions';
import CompetitionScreen from './Content/Forms/Student/CompetitionScreen';

import RegisterTeamScreen from './Content/Forms/Student/MakeTeam';
import UnenrolledCompetitionsScreen from './Content/Forms/Student/UnenrolledCompetitions';
import EnrolledCompetitionsScreen from './Content/Forms/Student/EnrolledCompetitions';
import RoundsScreen from './Content/Forms/Student/CompetitonRounds';
import MCQScreen from './Content/Forms/Student/McqRound';
import CheckTaskscreen from './Content/Forms/Expert/CheckTask';
import SubmittedTaskScreen from './Content/Forms/Expert/CheckAttemptedTaskQuestion';
import ExpertLeadearBoard from './Content/Forms/Expert/ExpertLeaderboard';
import ExpertLeadearBoardRoundScreen from './Content/Forms/Expert/ExpertLeaderBoardRounds';
import ExpertLeaderboardResultScreen from './Content/Forms/Expert/ExpertLeadearBoardResult';
import AttemptedSpeedProgrammingScreenQuestionsScreen from './Content/Forms/Expert/CheckAttemptedSpeedProgrammingQuestion';
import BuzzerRoundScreen from './Content/Test/Buzzerscreen';
import BuzzerScreenApi from './Content/Test/buzzer_api';
import Buzzer from './Content/Test/Buzzerscreen';

AppRegistry.registerComponent(appName, () => BuzzerScreenApi);

const Config = {
  BASE_URL: 'http://192.168.1.16:8080',
  ENDPOINTS: {
    getAllSubjects: '/api/Subject/GetAllSubjects',
    postExpertSubject: '/api/ExpertSubject/AddExpertSubject',
    getTopicsBySubjectCode: '/api/Topic/GetTopicsBySubject/',
    getQuestionsWithOptions: '/api/Questions/GetAllQuestionsWithOption',
    postQuestion: '/api/Questions/PostQuestion',
    postQuestionOption: '/api/QuestionOptions/PostQuestionOption',
    getAllQuestionsWithOptions: '/api/Questions/GetAllQuestionsWithOption',
    getExpertSubject: '/api/ExpertSubject/GetExpertSubject',
  },
};

export default Config;

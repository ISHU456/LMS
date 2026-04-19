import React from 'react';
import { useParams } from 'react-router-dom';
import QuizArena from '../../components/student/QuizArena';

const QuizArenaDetail = () => {
    const { quizId } = useParams();
    return (
        <div className="min-h-full bg-transparent">
            <QuizArena quizId={quizId} />
        </div>
    );
};

export default QuizArenaDetail;

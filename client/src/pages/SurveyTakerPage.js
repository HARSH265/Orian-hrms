import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Spin, Alert } from 'antd';
import { fetchSurveyById } from '../features/survey/surveyThunks';
import SurveyTaker from '../components/survey/SurveyTaker';
import { clearCurrentSurvey } from '../features/survey/surveySlice';

const SurveyTakerPage = () => {
    const { surveyId } = useParams();
    const dispatch = useDispatch();
    const { currentSurvey, status, error } = useSelector(state => state.survey);

    useEffect(() => {
        if (surveyId) {
            dispatch(fetchSurveyById(surveyId));
        }
        // Cleanup function to clear the survey from state when the component unmounts
        return () => {
            dispatch(clearCurrentSurvey());
        }
    }, [surveyId, dispatch]);

    if (status === 'loading' || !currentSurvey) {
        return <Spin />;
    }

    if (status === 'failed') {
        return <Alert message="Error" description={error} type="error" />;
    }

    return <SurveyTaker survey={currentSurvey} />;
};

export default SurveyTakerPage;
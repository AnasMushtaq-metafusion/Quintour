import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext<any | null>(null);

export const GlobalProvider = ({ children }: any) => {
  const [isScore, setIsScore] = useState(0);
  const [countLocation, setCountLocation] = useState(0);
  const [totalLocation, setTotalLocation] = useState(0);
  const [targetLocation, setTargetLocation] = useState('');
  const [targetID, setCurrentTargetID] = useState(0);
  const [helpReset, setHelpReset] = useState(0);
  const [tourRunID, setTourRunID] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [startAudio, setStartAudio] = useState(false);
  const [toolBarCameraIcon, setToolBarCameraIcon] = useState(false);
  const [picturesMetaData, setPicturesMetaData] = useState([]);
  const [analyzePicturesArray, setAnalyzePicturesArray] = useState([]);
  const [showToolbar, setShowToolbar] = useState(false);
  const [durationCountdown, setDurationCountdown] = useState('');

  const subScore = (e: any) => {
    setIsScore(isScore - e);
  };

  const addScore = (e: any) => {
    setIsScore(isScore + e);
  };

  const setScore = (e: any) => {
    setIsScore(e);
  };

  const addLocation = (e: any) => {
    setCountLocation(countLocation + e);
  };

  const getCountLocation = (e: any) => {
    setCountLocation(e);
  };

  const getLocations = (e: any) => {
    setTotalLocation(e);
  };

  const getTargetLocation = (e: any) => {
    setTargetLocation(e);
  };

  const getTargetID = (e: any) => {
    setCurrentTargetID(e);
  };

  const isHelpReset = (e: any) => {
    setHelpReset(e);
  };

  const getTourRunID = (e: any) => {
    setTourRunID(e);
  };

  const getRefreshing = (e: any) => {
    setRefreshing(e);
  };

  const getStartAudio = (e: any) => {
    setStartAudio(e);
  };

  return (
    <GlobalContext.Provider
      value={{
        isScore,
        subScore,
        addScore,
        totalLocation,
        getLocations,
        countLocation,
        addLocation,
        targetLocation,
        getTargetLocation,
        getTargetID,
        targetID,
        isHelpReset,
        helpReset,
        tourRunID,
        getTourRunID,
        currentPosition,
        setCurrentPosition,
        getCountLocation,
        setScore,
        getRefreshing,
        refreshing,
        startAudio,
        getStartAudio,
        toolBarCameraIcon,
        setToolBarCameraIcon,
        picturesMetaData,
        setPicturesMetaData,
        analyzePicturesArray,
        setAnalyzePicturesArray,
        showToolbar,
        setShowToolbar,
        durationCountdown,
        setDurationCountdown,
      }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useScore = () => useContext(GlobalContext);
export const useLocation = () => useContext(GlobalContext);
export const useTargetID = () => useContext(GlobalContext);
export const useHelp = () => useContext(GlobalContext);
export const useTourRunID = () => useContext(GlobalContext);
export const useCurrentLocation = () => useContext(GlobalContext);
export const useRefreshing = () => useContext(GlobalContext);
export const useAudio = () => useContext(GlobalContext);
export const useGlobal = () => useContext(GlobalContext);

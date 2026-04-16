import AsyncStorage from '@react-native-async-storage/async-storage';

export const _storeData = async (setName: any, setItem: any) => {
  try {
    await AsyncStorage.setItem(`@QT${setName}:key`, JSON.stringify(setItem));
  } catch (error) {
    // Error saving data
    console.log('_storeData Error', error);
  }
};

export const _retrieveData = async (setName: any) => {
  try {
    const value = await AsyncStorage.getItem(`@QT${setName}:key`);
    if (value !== null) {
      // We have data!!
      const currentValue = JSON.parse(value);
      // console.log(currentValue);
      return currentValue;
    }
  } catch (error) {
    // Error retrieving data
    console.log('_retrieveData Error', error);
  }
};

export const _storeMultipleData = async ({ firstData, secondData }: any) => {
  try {
    await AsyncStorage.multiSet([firstData, secondData]);
  } catch (error) {
    // Error Multiple data
    console.log('_storeMultipleData Error', error);
  }
};

export const _removeData = async (setName: any) => {
  try {
    await AsyncStorage.removeItem(`@QT${setName}:key`);
  } catch (error) {
    // Error removing data
    console.log('_removeData Error', error);
  }
};

export const _isTourStarted = async (value: boolean) => {
  try {
    await AsyncStorage.setItem('tourStarted', JSON.stringify(value));
  } catch (error) {
    // Error saving data
    console.log('_storeData Error', error);
  }
};

export const _getIsTourStarted = async () => {
  try {
    const value = await AsyncStorage.getItem('tourStarted');
    return value;
  } catch (error) {
    // Error retrieving data
    console.log('_retrieveData Error', error);
  }
};

export const _storeTourItemDetails = async (values: object) => {
  try {
    await AsyncStorage.setItem('itemDetails', JSON.stringify(values));
  } catch (error) {
    // Error saving data
    console.log('_storeData Error', error);
  }
};

export const _getTourItemDetails = async () => {
  try {
    const value = await AsyncStorage.getItem('itemDetails');
    if (value !== null) {
      // We have data!!
      const currentValue = JSON.parse(value);
      // console.log(currentValue);
      return currentValue;
    }
  } catch (error) {
    // Error retrieving data
    console.log('_retrieveData Error', error);
  }
};

export const _removeTourStarted = async () => {
  try {
    await AsyncStorage.removeItem('tourStarted');
  } catch (error) {
    // Error removing data
    console.log('_removeData Error', error);
  }
};

export const _removeTourItemDetails = async () => {
  try {
    await AsyncStorage.removeItem('itemDetails');
  } catch (error) {
    // Error removing data
    console.log('_removeData Error', error);
  }
};

export const _storeTourTargetNode = async (values: object) => {
  try {
    await AsyncStorage.setItem('targetNode', JSON.stringify(values));
  } catch (error) {
    // Error saving data
    console.log('_storeData Error', error);
  }
};

export const _storeTourPreviousNode = async (values: object) => {
  try {
    await AsyncStorage.setItem('previousNode', JSON.stringify(values));
  } catch (error) {
    // Error saving data
    console.log('_storeData Error', error);
  }
};

export const _getTourTargetNode = async () => {
  try {
    const value = await AsyncStorage.getItem('targetNode');
    if (value !== null) {
      // We have data!!
      const currentValue = JSON.parse(value);
      // console.log(currentValue);
      return currentValue;
    }
  } catch (error) {
    // Error retrieving data
    console.log('_retrieveData Error', error);
  }
};

export const _removeTourTargetNode = async () => {
  try {
    await AsyncStorage.removeItem('targetNode');
  } catch (error) {
    // Error removing data
    console.log('_removeData Error', error);
  }
};

export const _getTourPreviousNode = async () => {
  try {
    const value = await AsyncStorage.getItem('previousNode');
    if (value !== null) {
      // We have data!!
      const currentValue = JSON.parse(value);
      // console.log(currentValue);
      return currentValue;
    }
  } catch (error) {
    // Error retrieving data
    console.log('_retrieveData Error', error);
  }
};
export const _removeTourPreviousNode = async () => {
  try {
    await AsyncStorage.removeItem('previousNode');
  } catch (error) {
    // Error removing data
    console.log('_removeData Error', error);
  }
};

export const _isLockScreen = async (value: boolean) => {
  try {
    await AsyncStorage.setItem('lockScreen', JSON.stringify(value));
  } catch (error) {
    // Error saving data
    console.log('_storeData Error', error);
  }
};

export const _getIsLockScreen = async () => {
  try {
    const value = await AsyncStorage.getItem('lockScreen');
    return value;
  } catch (error) {
    // Error retrieving data
    console.log('_retrieveData Error', error);
  }
};

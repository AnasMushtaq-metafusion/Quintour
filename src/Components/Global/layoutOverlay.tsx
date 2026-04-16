//import liraries
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import Overlap from '../../Snipets/overlay';

// create a component
const LayoutOverlay = ({
  children,
  data,
  itemDuration,
  itemMode,
  setTestMode,
  setIsReset,
  isReset,
  layoutImage,
  itemId,
  handleEndTour,
}: any) => {
  // console.log('LayoutOverlay', itemDuration);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {children}
        <Overlap
          data={data}
          itemDuration={itemDuration}
          itemMode={itemMode}
          setTestMode={setTestMode}
          setIsReset={setIsReset}
          isReset={isReset}
          layoutImage={layoutImage}
          itemId={itemId}
          handleEndTour={handleEndTour}
        />
      </View>
    </SafeAreaView>
  );
};

//make this component available to the app
export default LayoutOverlay;

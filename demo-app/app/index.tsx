// import { Button } from '@/components/Button';
// import { getData, removeData } from '@/utils/asyncStorage';
// import { router } from 'expo-router';
// import { useEffect } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenOnboarding");
        const storedUser = await AsyncStorage.getItem("userName");
        const token = await AsyncStorage.getItem("authToken");
        setIsFirstLaunch(hasSeen === null);
        setHasUser(!!token && !!storedUser);
      } catch (error) {
        console.error("Error checking onboarding:", error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isFirstLaunch) {
    return <Redirect href="/onboarding" />;
  }

  if (!hasUser) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/home" />;
}


// useEffect(() => {
//   checkFirstTimeOpen();
// }, []);
// const checkFirstTimeOpen = async () => {
//   let onboarded = await getData('onboarded');
//   if (onboarded !== '1') {
//     router.replace('/onboarding');
//   }
// };
// return (
//   <View className="flex-1 justify-center items-center">
//     <Text className="m-6 uppercase font-bold text-3xl text-center">This is the homepage</Text>
//     <Button title="View Onboarding Again" onPress={() => router.replace('/onboarding')} />
//     <Button title="View Tab layout" onPress={() => router.push('/nav/login')} />
//     <Button title="Clear Storage" variant="danger" onPress={() => removeData('onboarded')} />
//   </View>
// );
// export default function OnboardingScreen() {
// const backToHome = () => {
//   storeData('onboarded', '1');
//   router.replace('/');
// };
// return (
//   <View className="flex-1 justify-center items-center">
//     <Onboarding
//       onDone={backToHome}
//       onSkip={backToHome}
//       pages={[
//         {
//           backgroundColor: '#000',
//           image: <Image source={require('../../assets/images/react-logo.png')} />,
//           title: 'Onboarding',
//           subtitle: 'Welcome',
//         },
//         {
//           backgroundColor: '#000',
//           image: <Image source={require('../../assets/images/react-logo.png')} />,
//           title: 'Onboarding',
//           subtitle: 'This is the onboarding screen',
//         },
//         {
//           backgroundColor: '#000',
//           image: <Image source={require('../../assets/images/react-logo.png')} />,
//           title: 'Onboarding',
//           subtitle: 'Done with React Native Onboarding Swiper',
//         },
//       ]}
//     />
//   </View>
// );
// }

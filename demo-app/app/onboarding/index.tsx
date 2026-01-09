import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Gift, Heart, Leaf, Users } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";

import {
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

type Slide = {
  icon: typeof Gift;
  title: string;
  subtitle: string;
  description: string;
  tone: "mint" | "pink" | "yellow";
};

const SLIDES: Slide[] = [
  {
    icon: Gift,
    title: "Đồ cũ người bỏ",
    subtitle: "Đồ mới người cần",
    description: "Kết nối cộng đồng, lan tỏa giá trị",
    tone: "mint",
  },
  {
    icon: Users,
    title: "Kết nối cộng đồng",
    subtitle: "Gần bạn",
    description:
      "Trao đổi đồ cũ dễ dàng với sinh viên cùng trường, khu trọ",
    tone: "pink",
  },
  {
    icon: Leaf,
    title: "Sống xanh",
    subtitle: "Sống bền vững",
    description:
      "Giảm thiểu rác thải, tái sử dụng đồ cũ, bảo vệ môi trường",
    tone: "yellow",
  },
  {
    icon: Heart,
    title: "Cho đi & Nhận lại",
    subtitle: "Niềm tin",
    description: "Xây dựng cộng đồng chia sẻ dựa trên sự tin tưởng",
    tone: "mint",
  },
];

const toneBg: Record<Slide["tone"], string> = {
  mint: "#A8E6E2",
  pink: "#FFD4DC",
  yellow: "#FFE8B3",
};

const toneIcon: Record<Slide["tone"], string> = {
  mint: "#5CBFB8",
  pink: "#FF9BAA",
  yellow: "#FFC94D",
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const screenWidth = useMemo(() => Dimensions.get("window").width, []);

  const handleComplete = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/auth");
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      scrollRef.current?.scrollTo({ x: next * screenWidth, animated: true });
      setIndex(next);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => handleComplete();

  const onScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const current = Math.round(offsetX / screenWidth);
    setIndex(current);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Skip */}
      <View className="pt-14 px-6">
        <View className="items-end">
          <Pressable hitSlop={12} onPress={handleSkip}>
            <Text className="text-sm text-gray-500">Bỏ qua</Text>
          </Pressable>
        </View>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, idx) => {
          const Icon = slide.icon;
          return (
            <View
              key={slide.title}
              style={{ width: screenWidth }}
              className="px-6 flex-1"
            >
              <View className="flex-1 items-center justify-between pb-10 pt-2">
                {/* Logo */}
                <Image
                  source={require("../../assets/images/logo.png")}
                  resizeMode="contain"
                  className="w-24 h-24"
                />

                <View className="w-full items-center flex-1 justify-center">
                  <View
                    className="w-32 h-32 rounded-full items-center justify-center mb-8"
                    style={{ backgroundColor: toneBg[slide.tone] }}
                  >
                    <Icon size={64} color={toneIcon[slide.tone]} />
                  </View>

                  <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    {slide.title}
                  </Text>
                  <Text className="text-xl font-semibold text-[#7DD3CE] mb-3 text-center">
                    {slide.subtitle}
                  </Text>
                  <Text className="text-base text-gray-600 px-6 text-center">
                    {slide.description}
                  </Text>
                </View>

                {/* Dots */}
                <View className="flex-row gap-2 mb-4">
                  {SLIDES.map((_, dotIdx) => (
                    <View
                      key={`${slide.title}-dot-${dotIdx}`}
                      className="h-2 rounded-full"
                      style={{
                        width: dotIdx === index ? 32 : 8,
                        backgroundColor:
                          dotIdx === index ? "#7DD3CE" : "#D1D5DB",
                      }}
                    />
                  ))}
                </View>

                {/* Next */}
                <Pressable
                  onPress={handleNext}
                  className="w-full h-14 bg-[#7DD3CE] rounded-full items-center justify-center"
                >
                  <Text className="text-white text-base font-semibold">
                    {idx < SLIDES.length - 1 ? "Tiếp theo" : "Bắt đầu"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

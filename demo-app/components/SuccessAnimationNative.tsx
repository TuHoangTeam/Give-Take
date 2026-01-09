import { Check, Leaf, Star } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Modal, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface SuccessAnimationNativeProps {
  isVisible: boolean;
  onClose: () => void;
  type: "give" | "receive";
  co2Saved: number;
  pointsEarned?: number;
}

export function SuccessAnimationNative({
  isVisible,
  onClose,
  type,
  co2Saved,
  pointsEarned,
}: SuccessAnimationNativeProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Animate scale
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [isVisible, onClose, scaleAnim]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
        >
          {/* Header with gradient */}
          <LinearGradient
            colors={["#7DD3CE", "#FFB6C1", "#FFD97D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 32 }}
          >
            <View className="w-20 h-20 mx-auto bg-white rounded-full items-center justify-center mb-4 shadow-lg">
              <Check size={40} color="#22C55E" strokeWidth={3} />
            </View>

            <Text className="text-2xl font-bold text-white text-center">
              Thành công! ✨
            </Text>
          </LinearGradient>

          {/* Content */}
          <View className="p-6" style={{ gap: 16 }}>
            <Text className="text-xl font-bold text-center">
              {type === "receive" 
                ? "Bạn đã nhận được món đồ!"
                : "Bạn đã trao món đồ thành công!"}
            </Text>
            
            <Text className="text-sm text-gray-600 text-center">
              Cảm ơn vì đã đóng góp cho cộng đồng và môi trường
            </Text>

            {/* Environmental Impact */}
            <LinearGradient
              colors={["rgba(168, 230, 226, 0.2)", "rgba(125, 211, 206, 0.2)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center">
                  <Leaf size={20} color="#fff" />
                </View>
                <Text className="font-semibold text-green-700">
                  Tác động môi trường
                </Text>
              </View>
              <Text className="text-green-700 mb-1">
                Bạn vừa giúp Trái Đất!
              </Text>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-3xl font-bold text-green-700">
                    {co2Saved}
                  </Text>
                  <Text className="text-sm text-green-700">kg CO₂ giảm</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl">🌳</Text>
                  <Text className="text-sm text-green-700">
                    = {(co2Saved / 7.5).toFixed(2)} cây
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Points earned (if applicable) */}
            {pointsEarned && pointsEarned > 0 && (
              <LinearGradient
                colors={["rgba(255, 217, 125, 0.2)", "rgba(255, 201, 77, 0.2)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-10 h-10 bg-yellow-500 rounded-full items-center justify-center">
                      <Star size={20} color="#fff" fill="#fff" />
                    </View>
                    <Text className="font-semibold">Điểm thưởng</Text>
                  </View>
                  <Text className="text-2xl font-bold text-yellow-600">
                    +{pointsEarned}
                  </Text>
                </View>
              </LinearGradient>
            )}

            <Text className="text-sm text-center text-gray-600 pt-2">
              Đừng quên để lại đánh giá cho người cho bạn nhé! ⭐
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
